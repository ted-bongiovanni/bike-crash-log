import { NextRequest, NextResponse } from "next/server";

// WMO weather code to human-readable condition
const WMO_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Heavy showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm w/ hail",
  99: "Thunderstorm w/ heavy hail",
};

function suggestWeatherScore(tempF: number, windMph: number, precipIn: number, code: number): number {
  let score = 3;

  // Temperature factor
  if (tempF >= 55 && tempF <= 78) score += 1;
  else if (tempF >= 45 && tempF <= 85) score += 0;
  else if (tempF >= 32 && tempF <= 95) score -= 1;
  else score -= 2;

  // Precipitation factor
  if (precipIn > 0.5) score -= 2;
  else if (precipIn > 0.1) score -= 1;

  // Wind factor
  if (windMph > 25) score -= 1;
  else if (windMph > 15) score -= 0.5;

  // Severe weather codes
  if (code >= 95) score -= 1; // thunderstorms
  if (code >= 66 && code <= 67) score -= 1; // freezing rain
  if (code >= 71 && code <= 77) score -= 1; // snow

  return Math.max(1, Math.min(5, Math.round(score)));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");
  const date = searchParams.get("date");
  const timeOfDay = searchParams.get("time_of_day"); // "am" or "pm"

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "Valid 5-digit zip required" }, { status: 400 });
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Valid date (YYYY-MM-DD) required" }, { status: 400 });
  }

  try {
    // Step 1: Convert zip to lat/lng via zippopotam.us (free, no key)
    const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!geoRes.ok) {
      return NextResponse.json({ error: "Could not find zip code" }, { status: 404 });
    }
    const geoData = await geoRes.json();
    const lat = parseFloat(geoData.places[0].latitude);
    const lng = parseFloat(geoData.places[0].longitude);

    // Step 2: Determine if we need historical or forecast data
    const today = new Date().toISOString().slice(0, 10);
    const isHistorical = date < today;
    const isForecast = date > today;

    let tempF: number;
    let windMph: number;
    let precipIn: number;
    let weatherCode: number;

    if (isHistorical) {
      // Historical weather API
      const weatherUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,wind_speed_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America/New_York`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        return NextResponse.json({ error: "Could not fetch historical weather" }, { status: 502 });
      }
      const weatherData = await weatherRes.json();
      const hourly = weatherData.hourly;

      // Pick representative hours based on AM/PM
      const startHour = timeOfDay === "pm" ? 15 : 8; // 8am or 3pm
      const endHour = timeOfDay === "pm" ? 19 : 11; // through 11am or 7pm

      const temps = hourly.temperature_2m.slice(startHour, endHour + 1);
      const winds = hourly.wind_speed_10m.slice(startHour, endHour + 1);
      const precips = hourly.precipitation.slice(startHour, endHour + 1);
      const codes = hourly.weather_code.slice(startHour, endHour + 1);

      tempF = Math.round(temps.reduce((a: number, b: number) => a + b, 0) / temps.length);
      windMph = Math.round(winds.reduce((a: number, b: number) => a + b, 0) / winds.length);
      precipIn = Math.round(precips.reduce((a: number, b: number) => a + b, 0) * 100) / 100;
      weatherCode = codes[Math.floor(codes.length / 2)]; // middle hour code
    } else {
      // Forecast or current day
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,wind_speed_10m,precipitation,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America/New_York&start_date=${date}&end_date=${date}`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) {
        return NextResponse.json({ error: "Could not fetch weather forecast" }, { status: 502 });
      }
      const weatherData = await weatherRes.json();
      const hourly = weatherData.hourly;

      const startHour = timeOfDay === "pm" ? 15 : 8;
      const endHour = timeOfDay === "pm" ? 19 : 11;

      const temps = hourly.temperature_2m.slice(startHour, endHour + 1);
      const winds = hourly.wind_speed_10m.slice(startHour, endHour + 1);
      const precips = hourly.precipitation.slice(startHour, endHour + 1);
      const codes = hourly.weather_code.slice(startHour, endHour + 1);

      tempF = Math.round(temps.reduce((a: number, b: number) => a + b, 0) / temps.length);
      windMph = Math.round(winds.reduce((a: number, b: number) => a + b, 0) / winds.length);
      precipIn = Math.round(precips.reduce((a: number, b: number) => a + b, 0) * 100) / 100;
      weatherCode = codes[Math.floor(codes.length / 2)];
    }

    const condition = WMO_CODES[weatherCode] || "Unknown";
    const suggestedScore = suggestWeatherScore(tempF, windMph, precipIn, weatherCode);

    return NextResponse.json({
      temp_f: tempF,
      wind_mph: windMph,
      precip_in: precipIn,
      condition,
      suggested_score: suggestedScore,
    });
  } catch (err) {
    console.error("Weather fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 });
  }
}
