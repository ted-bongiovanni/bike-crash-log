"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SCORE_LABELS: Record<number, string> = {
  1: "AWFUL",
  2: "BAD",
  3: "MEH",
  4: "GOOD",
  5: "GREAT",
};

const CATEGORIES = [
  { key: "weather", label: "WEATHER", emoji: "sky" },
  { key: "safety", label: "SAFETY", emoji: "shield" },
  { key: "legs", label: "LEGS", emoji: "power" },
  { key: "soul", label: "SOUL", emoji: "vibe" },
] as const;

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

export default function CommuteForm() {
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState(3);
  const [safety, setSafety] = useState(3);
  const [legs, setLegs] = useState(3);
  const [soul, setSoul] = useState(3);
  const [joys, setJoys] = useState("");
  const [sorrows, setSorrows] = useState("");
  const [distanceEstimate, setDistanceEstimate] = useState("");
  const [timeEstimate, setTimeEstimate] = useState("");
  const [rushHour, setRushHour] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<"am" | "pm">(new Date().getHours() < 12 ? "am" : "pm");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/commutes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date, weather, safety, legs, soul, joys, sorrows,
          distance_miles: distanceEstimate ? parseFloat(distanceEstimate) : undefined,
          duration_minutes: timeEstimate ? parseInt(timeEstimate, 10) : undefined,
          rush_hour: rushHour,
          time_of_day: timeOfDay,
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
            onChange={(e) => setDate(e.target.value)}
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
              onClick={() => setTimeOfDay("am")}
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
              onClick={() => setTimeOfDay("pm")}
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

      {/* Scores */}
      <ScoreSelector label="WEATHER" hint="sky conditions" value={weather} onChange={setWeather} />
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

      {/* Joys */}
      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          JOYS — <span className="text-mta-green">good things noticed</span>
        </label>
        <textarea
          value={joys}
          onChange={(e) => setJoys(e.target.value)}
          placeholder="Tailwind on the bridge. Coffee was hot. That one driver who actually yielded..."
          rows={3}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-mta-green placeholder:text-muted/50 resize-none"
        />
      </div>

      {/* Sorrows */}
      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          SORROWS — <span className="text-severity-severe">grievances filed</span>
        </label>
        <textarea
          value={sorrows}
          onChange={(e) => setSorrows(e.target.value)}
          placeholder="Headwind the entire way. Glass in the bike lane again. Car parked in the bike lane on 2nd Ave. That one intersection..."
          rows={3}
          className="w-full bg-surface border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-severity-severe placeholder:text-muted/50 resize-none"
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
