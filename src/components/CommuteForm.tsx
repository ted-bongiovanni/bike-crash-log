"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const SCORE_LABELS: Record<number, string> = {
  1: "AWFUL",
  2: "BAD",
  3: "MEH",
  4: "GOOD",
  5: "GREAT",
};

function ScoreSelector({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-bold tracking-widest text-muted uppercase">{label}</span>
        <span className="text-[10px] tracking-wider text-muted uppercase">{hint}</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`
              flex-1 py-3 rounded text-sm font-bold transition-all
              ${value === n
                ? n <= 2
                  ? "bg-severity-severe text-white"
                  : n === 3
                    ? "bg-mta-orange text-background"
                    : "bg-mta-green text-white"
                : "bg-surface border border-border text-muted hover:border-mta-yellow/50"
              }
            `}
          >
            {n}
            <div className="text-[8px] mt-0.5 tracking-wider">{SCORE_LABELS[n]}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface Bike {
  id: number;
  name: string;
  power_type: string;
  home_zip: string | null;
}

interface WeatherData {
  temp_f: number;
  wind_mph: number;
  precip_in: number;
  condition: string;
  suggested_score: number;
}

export default function CommuteForm() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState(3);
  const [safety, setSafety] = useState(3);
  const [legs, setLegs] = useState(3);
  const [soul, setSoul] = useState(3);
  const [notes, setNotes] = useState("");
  const [distanceEstimate, setDistanceEstimate] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [rushHour, setRushHour] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<"am" | "pm">(new Date().getHours() < 12 ? "am" : "pm");
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [selectedBikeId, setSelectedBikeId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Weather state
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherApplied, setWeatherApplied] = useState(false);

  useEffect(() => {
    fetch("/api/bicycles")
      .then((r) => r.json())
      .then((data) => setBikes(data))
      .catch(() => {});
  }, []);

  // Fetch weather when bike, date, or time of day changes
  const fetchWeather = useCallback(async (zip: string, d: string, tod: string) => {
    setWeatherLoading(true);
    setWeatherData(null);
    try {
      const res = await fetch(`/api/weather?zip=${zip}&date=${d}&time_of_day=${tod}`);
      if (res.ok) {
        const data = await res.json();
        setWeatherData(data);
        // Auto-suggest score only if user hasn't manually changed it
        if (!weatherApplied) {
          setWeather(data.suggested_score);
          setWeatherApplied(true);
        }
      }
    } catch {
      // Weather fetch is best-effort
    } finally {
      setWeatherLoading(false);
    }
  }, [weatherApplied]);

  useEffect(() => {
    const bike = bikes.find((b) => b.id === Number(selectedBikeId));
    if (bike?.home_zip) {
      fetchWeather(bike.home_zip, date, timeOfDay);
    } else {
      setWeatherData(null);
    }
  }, [selectedBikeId, date, timeOfDay, bikes, fetchWeather]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, weather, safety, legs, soul, notes,
          distance_miles: distanceEstimate ? parseFloat(distanceEstimate) : undefined,
          duration_minutes: timeEstimate ? parseInt(timeEstimate, 10) : undefined,
          rush_hour: rushHour,
          time_of_day: timeOfDay,
          bicycle_id: selectedBikeId ? parseInt(selectedBikeId, 10) : undefined,
          temp_f: weatherData?.temp_f,
          wind_mph: weatherData?.wind_mph,
          weather_condition: weatherData?.condition,
          precip_in: weatherData?.precip_in,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const total = weather + safety + legs + soul;
  const mood = total <= 8 ? "ROUGH DAY" : total <= 12 ? "SURVIVED" : total <= 16 ? "DECENT RIDE" : "GLORIOUS";
  const moodColor = total <= 8 ? "text-severity-severe" : total <= 12 ? "text-mta-orange" : total <= 16 ? "text-mta-yellow" : "text-mta-green";

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Date & AM/PM */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
            DATE
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setWeatherApplied(false); }}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow"
          />
        </div>
        <div>
          <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
            RIDE
          </label>
          <div className="flex rounded overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => { setTimeOfDay("am"); setWeatherApplied(false); }}
              className={`px-4 py-2 text-sm font-bold tracking-widest transition-all ${
                timeOfDay === "am"
                  ? "bg-mta-yellow text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => { setTimeOfDay("pm"); setWeatherApplied(false); }}
              className={`px-4 py-2 text-sm font-bold tracking-widest transition-all ${
                timeOfDay === "pm"
                  ? "bg-mta-yellow text-background"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              PM
            </button>
          </div>
        </div>
      </div>

      {/* Bike selector */}
      {bikes.length > 0 && (
        <div>
          <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
            BIKE
          </label>
          <select
            value={selectedBikeId}
            onChange={(e) => { setSelectedBikeId(e.target.value); setWeatherApplied(false); }}
            className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow appearance-none"
          >
            <option value="">— no bike selected —</option>
            {bikes.map((bike) => (
              <option key={bike.id} value={bike.id}>
                {bike.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Weather banner */}
      {weatherLoading && (
        <div className="bg-surface border border-border rounded p-3 text-center">
          <span className="text-xs tracking-widest text-muted uppercase">Fetching weather...</span>
        </div>
      )}
      {weatherData && !weatherLoading && (
        <div className="bg-surface border border-mta-blue/30 rounded p-3">
          <div className="text-[10px] tracking-widest text-mta-blue uppercase mb-2 font-bold">ACTUAL WEATHER</div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm">
              <span className="font-bold text-foreground">{weatherData.temp_f}°F</span>
              <span className="text-muted">{weatherData.condition}</span>
            </div>
            <div className="flex gap-3 text-xs text-muted">
              <span>Wind {weatherData.wind_mph} mph</span>
              {weatherData.precip_in > 0 && (
                <span>Precip {weatherData.precip_in}&quot;</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scores */}
      <ScoreSelector label="WEATHER" hint={weatherData ? `suggested: ${weatherData.suggested_score}` : "sky conditions"} value={weather} onChange={setWeather} />
      <ScoreSelector label="SAFETY" hint="how threatened did you feel" value={safety} onChange={setSafety} />
      <ScoreSelector label="LEGS" hint="physical power" value={legs} onChange={setLegs} />
      <ScoreSelector label="SOUL" hint="mental state" value={soul} onChange={setSoul} />

      {/* Overall vibe */}
      <div className="bg-surface border border-border rounded p-4 text-center">
        <div className="text-[10px] tracking-widest text-muted uppercase mb-1">TODAY&apos;S VERDICT</div>
        <div className={`text-2xl font-bold font-mono ${moodColor}`}>{total}/20</div>
        <div className={`text-xs font-bold tracking-widest ${moodColor}`}>{mood}</div>
      </div>

      {/* Ride details */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
              DISTANCE — <span className="text-mta-yellow">miles</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={distanceEstimate}
              onChange={(e) => setDistanceEstimate(e.target.value)}
              placeholder="0.0"
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
              DURATION — <span className="text-mta-yellow">minutes</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={timeEstimate}
              onChange={(e) => setTimeEstimate(e.target.value)}
              placeholder="0"
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRushHour(!rushHour)}
          className={`w-full py-2 rounded text-xs font-bold tracking-widest uppercase transition-all ${
            rushHour
              ? "bg-severity-severe text-white"
              : "bg-surface border border-border text-muted hover:border-severity-severe/50"
          }`}
        >
          {rushHour ? "RUSH HOUR — YES" : "RUSH HOUR?"}
        </button>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          NOTES — <span className="text-mta-yellow">joys, grievances, whatever</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tailwind on the bridge. Coffee was hot. Glass in the bike lane again. That one intersection..."
          rows={4}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-mta-yellow placeholder:text-muted/50 resize-none"
        />
      </div>

      {error && (
        <div className="text-severity-severe text-sm bg-severity-severe/10 border border-severity-severe/30 rounded p-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase py-3 rounded hover:brightness-110 transition-all disabled:opacity-50"
      >
        {submitting ? "LOGGING..." : "LOG THIS COMMUTE"}
      </button>
    </form>
  );
}
