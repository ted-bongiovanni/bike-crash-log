import CrashForm from "@/components/CrashForm";

export default function ReportPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight uppercase">
          LOG A <span className="text-mta-yellow">CRASH</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          Click the map to set the location. All fields except cross street are required.
        </p>
      </div>
      <CrashForm />
    </div>
  );
}
