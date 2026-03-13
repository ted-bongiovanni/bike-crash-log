import StatsCharts from "@/components/StatsCharts";

export default function StatsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          CRASH <span className="text-mta-yellow">STATS</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Patterns from logged crashes. Data that doesn&apos;t exist in official reports.
        </p>
      </div>
      <StatsCharts />
    </div>
  );
}
