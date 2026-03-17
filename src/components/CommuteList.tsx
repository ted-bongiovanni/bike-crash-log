"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface CommuteLog {
  id: number;
  date: string;
  weather: number;
  safety: number;
  legs: number;
  soul: number;
  joys: string | null;
  sorrows: string | null;
  distance_miles: number | null;
  duration_minutes: number | null;
}

function ScoreDot({ value }: { value: number }) {
  const color =
    value <= 2 ? "bg-severity-severe" : value === 3 ? "bg-mta-orange" : "bg-mta-green";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`w-2 h-2 rounded-full ${n <= value ? color : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { day, month };
}

export default function CommuteList() {
  const [logs, setLogs] = useState<CommuteLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/commutes")
      .then((r) => r.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted text-sm tracking-widest uppercase">Loading rides...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl font-bold text-mta-yellow mb-2">NO RIDES YET</p>
        <p className="text-muted text-sm mb-6">Start logging your daily commute.</p>
        <Link
          href="/commute/new"
          className="inline-block bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase px-6 py-3 rounded hover:brightness-110 transition-all"
        >
          + LOG A RIDE
        </Link>
      </div>
    );
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this ride?")) return;
    const res = await fetch(`/api/commutes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const { day, month } = formatDate(log.date);
        const total = log.weather + log.safety + log.legs + log.soul;
        const moodColor =
          total <= 8
            ? "text-severity-severe"
            : total <= 12
              ? "text-mta-orange"
              : total <= 16
                ? "text-mta-yellow"
                : "text-mta-green";

        return (
          <div key={log.id} className="bg-surface border border-border rounded p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-bold tracking-wider text-muted uppercase">{day}</div>
                <div className="text-sm font-bold">{month}</div>
              </div>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleDelete(log.id)}
                  className="text-muted hover:text-severity-severe text-xs tracking-widest uppercase transition-colors"
                  title="Delete ride"
                >
                  &times;
                </button>
                <div className={`text-xl font-bold font-mono ${moodColor}`}>{total}/20</div>
              </div>
            </div>

            <div className="flex gap-4 mb-3">
              {[
                { label: "WX", value: log.weather },
                { label: "SAFE", value: log.safety },
                { label: "LEGS", value: log.legs },
                { label: "SOUL", value: log.soul },
              ].map((cat) => (
                <div key={cat.label} className="min-w-0">
                  <div className="text-[9px] font-bold tracking-widest text-muted mb-1">{cat.label}</div>
                  <ScoreDot value={cat.value} />
                </div>
              ))}
            </div>

            {(log.distance_miles || log.duration_minutes) && (
              <div className="flex gap-4 mb-3 text-xs text-muted">
                {log.distance_miles != null && (
                  <span><span className="font-bold text-foreground">{log.distance_miles}</span> mi</span>
                )}
                {log.duration_minutes != null && (
                  <span><span className="font-bold text-foreground">{log.duration_minutes}</span> min</span>
                )}
              </div>
            )}

            {(log.joys || log.sorrows) && (
              <div className="border-t border-border pt-3 space-y-2">
                {log.joys && (
                  <div className="text-xs">
                    <span className="text-mta-green font-bold tracking-wider">+</span>{" "}
                    <span className="text-muted">{log.joys}</span>
                  </div>
                )}
                {log.sorrows && (
                  <div className="text-xs">
                    <span className="text-severity-severe font-bold tracking-wider">&minus;</span>{" "}
                    <span className="text-muted">{log.sorrows}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
