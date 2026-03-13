"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#00933C",
  moderate: "#FF6319",
  severe: "#EE352E",
};

const TYPE_COLORS: Record<string, string> = {
  vehicle: "#EE352E",
  bicycle: "#00933C",
  ebike: "#6CBE45",
  pedestrian: "#B933AD",
  road_hazard: "#FF6319",
  dooring: "#FCCC0A",
  solo: "#0039A6",
  other: "#a0a0a0",
};

const TYPE_LABELS: Record<string, string> = {
  vehicle: "Vehicle",
  bicycle: "Bicycle",
  ebike: "E-bike",
  pedestrian: "Pedestrian",
  road_hazard: "Road hazard",
  dooring: "Dooring",
  solo: "Solo",
  other: "Other",
};

interface Stats {
  byMonth: { month: string; count: number }[];
  byType: { crash_type: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
  total: number;
  reportedRate: { reported: number; total: number };
}

export default function StatsCharts() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/crashes/stats")
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
        <p className="text-muted text-sm">Be the first to log a crash.</p>
      </div>
    );
  }

  const unreportedPct = stats.reportedRate.total > 0
    ? Math.round(((stats.reportedRate.total - stats.reportedRate.reported) / stats.reportedRate.total) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="TOTAL CRASHES" value={stats.total.toString()} color="text-mta-yellow" />
        <StatCard label="UNREPORTED" value={`${unreportedPct}%`} color="text-severity-severe" />
        <StatCard
          label="MOST COMMON"
          value={TYPE_LABELS[stats.byType[0]?.crash_type] || "—"}
          color="text-mta-orange"
        />
        <StatCard
          label="THIS MONTH"
          value={
            (stats.byMonth.find(
              (m) => m.month === new Date().toISOString().slice(0, 7)
            )?.count || 0).toString()
          }
          color="text-mta-blue"
        />
      </div>

      {/* Crashes over time */}
      <div className="bg-surface border border-border rounded p-6">
        <h2 className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
          CRASHES OVER TIME
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.byMonth}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#a0a0a0", fontSize: 10 }}
              axisLine={{ stroke: "#3a3a4e" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#a0a0a0", fontSize: 10 }}
              axisLine={{ stroke: "#3a3a4e" }}
              tickLine={false}
              allowDecimals={false}
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
            <Bar dataKey="count" fill="#FCCC0A" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Type + Severity side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* By type */}
        <div className="bg-surface border border-border rounded p-6">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
            BY TYPE
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.byType.map((d) => ({
                  name: TYPE_LABELS[d.crash_type] || d.crash_type,
                  value: d.count,
                  fill: TYPE_COLORS[d.crash_type] || "#a0a0a0",
                }))}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {stats.byType.map((d) => (
                  <Cell key={d.crash_type} fill={TYPE_COLORS[d.crash_type] || "#a0a0a0"} />
                ))}
              </Pie>
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: "#a0a0a0", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {value}
                  </span>
                )}
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
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* By severity */}
        <div className="bg-surface border border-border rounded p-6">
          <h2 className="text-xs font-bold tracking-widest text-muted uppercase mb-4">
            BY SEVERITY
          </h2>
          <div className="space-y-4 mt-6">
            {stats.bySeverity.map((s) => {
              const pct = Math.round((s.count / stats.total) * 100);
              return (
                <div key={s.severity}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold tracking-wider uppercase">{s.severity}</span>
                    <span className="text-xs font-mono text-muted">{s.count} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: SEVERITY_COLORS[s.severity] || "#a0a0a0",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
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
