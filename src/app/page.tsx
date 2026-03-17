import CommuteList from "@/components/CommuteList";
import Link from "next/link";

export default function Home() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            DAILY <span className="text-mta-yellow">RIDES</span>
          </h1>
          <p className="text-muted text-sm mt-1">
            The cranky commuter&apos;s daily log.
          </p>
        </div>
        <Link
          href="/commute/new"
          className="bg-mta-yellow text-background font-bold text-xs tracking-widest uppercase px-4 py-2 rounded hover:brightness-110 transition-all"
        >
          + LOG
        </Link>
      </div>
      <CommuteList />
    </div>
  );
}
