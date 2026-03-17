import CommuteStatsView from "@/components/CommuteStats";

export default function CommuteStatsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          COMMUTE <span className="text-mta-yellow">STATS</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Your daily cranky commuter patterns. Trends in weather, safety, legs, and soul.
        </p>
      </div>
      <CommuteStatsView />
    </div>
  );
}
