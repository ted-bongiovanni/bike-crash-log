"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  weather: "#0039A6",
  safety: "#EE352E",
  legs: "#FF6319",
  soul: "#B933AD",
};

interface CommuteStatsData {
  total: number;
  averages: {
    avg_weather: number;
    avg_safety: number;
    avg_legs: number;
    avg_soul: number;
  } | null;
  byWeek: {
    week: string;
    weather: number;
    safety: number;
    legs: number;
    soul: number;
  }[];
  recent: {
    id: number;
    date: string;
    weather: number;
    safety: number;
    legs: number;
    soul: number;
    joys: string | null;
    sorrows: string | null;
  }[];
}

function AvgBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold tracking-wider uppercase">{label}</span>
        <span className="text-xs font-mono text-muted">{value}/5</span>
      </div>
      <div className="h-3 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function CommuteStatsView() {
  const [stats, setStats] = useState<CommuteStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/commutes/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted text-sm tracking-widest uppercase">Loading stats...</div>
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-bold text-mta-yellow mb-2">NO DATA YET</p>
        <p className="text-muted text-sm">Log some commutes to see your patterns.</p>
      </div>
    );
  }

  const avg = stats.averages;
  const overallAvg = avg
    ? ((avg.avg_weather + avg.avg_safety + avg.avg_legs + avg.avg_soul) / 4).toFixed(1)
    : "—";

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="TOTAL RIDES" value={stats.total.toString()} color="text-mta-yellow" />
        <StatCard label="AVG SCORE" value={overallAvg} color="text-mta-green" />
        <StatCard
          label="WORST AVG"
          value={avg ? worstCategory(avg) : "—"}
          color="text-severity-severe"
        />
        <StatCard
          label="BEST AVG"
          value={avg ? bestCategory(avg) : "—"}
          color="text-mta-blue"
        />
      </div>

      {/* Average bars */}
      {avg && (
        <div className="bg-surface border border-border rounded p-6">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
            LIFETIME AVERAGES
          </h2>
          <div className="space-y-4">
            <AvgBar label="Weather" value={avg.avg_weather} color={CATEGORY_COLORS.weather} />
            <AvgBar label="Safety" value={avg.avg_safety} color={CATEGORY_COLORS.safety} />
            <AvgBar label="Legs" value={avg.avg_legs} color={CATEGORY_COLORS.legs} />
            <AvgBar label="Soul" value={avg.avg_soul} color={CATEGORY_COLORS.soul} />
          </div>
        </div>
      )}

      {/* Weekly trends */}
      {stats.byWeek.length > 1 && (
        <div className="bg-surface border border-border rounded p-6">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
            WEEKLY TRENDS
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.byWeek}>
              <XAxis
                dataKey="week"
                tick={{ fill: "#a0a0a0", fontSize: 10 }}
                axisLine={{ stroke: "#3a3a4e" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fill: "#a0a0a0", fontSize: 10 }}
                axisLine={{ stroke: "#3a3a4e" }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#2a2a3e",
                  border: "1px solid #3a3a4e",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#ffffff",
                }}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: "#a0a0a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {value}
                  </span>
                )}
              />
              <Bar dataKey="weather" fill={CATEGORY_COLORS.weather} radius={[2, 2, 0, 0]} />
              <Bar dataKey="safety" fill={CATEGORY_COLORS.safety} radius={[2, 2, 0, 0]} />
              <Bar dataKey="legs" fill={CATEGORY_COLORS.legs} radius={[2, 2, 0, 0]} />
              <Bar dataKey="soul" fill={CATEGORY_COLORS.soul} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-surface border border-border rounded p-4">
      <div className="text-[10px] font-bold tracking-widest text-muted uppercase mb-1">{label}</div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}

function worstCategory(avg: { avg_weather: number; avg_safety: number; avg_legs: number; avg_soul: number }): string {
  const cats = [
    { name: "WEATHER", val: avg.avg_weather },
    { name: "SAFETY", val: avg.avg_safety },
    { name: "LEGS", val: avg.avg_legs },
    { name: "SOUL", val: avg.avg_soul },
  ];
  cats.sort((a, b) => a.val - b.val);
  return cats[0].name;
}

function bestCategory(avg: { avg_weather: number; avg_safety: number; avg_legs: number; avg_soul: number }): string {
  const cats = [
    { name: "WEATHER", val: avg.avg_weather },
    { name: "SAFETY", val: avg.avg_safety },
    { name: "LEGS", val: avg.avg_legs },
    { name: "SOUL", val: avg.avg_soul },
  ];
  cats.sort((a, b) => b.val - a.val);
  return cats[0].name;
}
