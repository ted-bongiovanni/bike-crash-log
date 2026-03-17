"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const CrashMap = dynamic(() => import("@/components/CrashMap"), { ssr: false });

export default function MapPage() {
  return (
    <div className="relative" style={{ height: "calc(100vh - 3.5rem)" }}>
      <CrashMap />

      <div className="absolute bottom-6 right-6 z-[1000] flex gap-3">
        <Link
          href="/report"
          className="bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase px-6 py-3 rounded-full hover:brightness-110 transition-all shadow-lg"
        >
          + REPORT A CRASH
        </Link>
        <Link
          href="/stats"
          className="bg-surface border border-border text-mta-yellow font-bold text-sm tracking-widest uppercase px-6 py-3 rounded-full hover:border-mta-yellow transition-all shadow-lg"
        >
          CRASH STATS
        </Link>
      </div>
    </div>
  );
}
