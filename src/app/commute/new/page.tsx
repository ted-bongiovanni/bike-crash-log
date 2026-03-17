import CommuteForm from "@/components/CommuteForm";

export default function NewCommutePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          LOG <span className="text-mta-yellow">RIDE</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          How was the commute? Score the vibes. File your grievances.
        </p>
      </div>
      <CommuteForm />
    </div>
  );
}
