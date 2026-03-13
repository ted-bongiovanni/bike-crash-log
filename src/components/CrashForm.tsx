"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PhotoUploader from "./PhotoUploader";
import type { PhotoPreview } from "./PhotoUploader";

const LocationPicker = dynamic(() => import("./LocationPicker"), { ssr: false });

const SEVERITY_OPTIONS = [
  { value: "minor", label: "MINOR", color: "bg-severity-minor" },
  { value: "moderate", label: "MODERATE", color: "bg-severity-moderate" },
  { value: "severe", label: "SEVERE", color: "bg-severity-severe" },
];

const CRASH_TYPES = [
  { value: "vehicle", label: "Vehicle collision" },
  { value: "bicycle", label: "Bicycle collision" },
  { value: "ebike", label: "E-bike collision" },
  { value: "pedestrian", label: "Pedestrian collision" },
  { value: "road_hazard", label: "Road hazard (pothole, debris)" },
  { value: "dooring", label: "Dooring" },
  { value: "solo", label: "Solo crash" },
  { value: "other", label: "Other" },
];

export default function CrashForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationDescription, setLocationDescription] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("");
  const [crashType, setCrashType] = useState("");
  const [dateOfCrash, setDateOfCrash] = useState(new Date().toISOString().split("T")[0]);
  const [reportedToPolice, setReportedToPolice] = useState(false);
  const [photos, setPhotos] = useState<PhotoPreview[]>([]);

  const handleLocationSelect = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (lat === null || lng === null) {
      setError("Click the map to set the crash location.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Create the crash report
      const res = await fetch("/api/crashes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          location_description: locationDescription || undefined,
          description,
          severity,
          crash_type: crashType,
          date_of_crash: dateOfCrash,
          reported_to_police: reportedToPolice,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.errors?.join(", ") || "Something went wrong.");
        return;
      }

      const crash = await res.json();

      // 2. Upload photos if any
      for (const photo of photos) {
        const formData = new FormData();
        formData.append("photo", photo.file);
        if (photo.label) formData.append("label", photo.label);

        await fetch(`/api/crashes/${crash.id}/photos`, {
          method: "POST",
          body: formData,
        });
      }

      router.push(`/?lat=${lat}&lng=${lng}&zoom=16`);
    } catch {
      setError("Failed to submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location picker */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          CRASH LOCATION
        </label>
        <div className="h-80 rounded border border-border overflow-hidden">
          <LocationPicker onSelect={handleLocationSelect} lat={lat} lng={lng} />
        </div>
        {lat !== null && (
          <p className="text-xs text-muted mt-1 font-mono">
            {lat.toFixed(5)}, {lng!.toFixed(5)}
          </p>
        )}
      </div>

      {/* Location description */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          CROSS STREET / LANDMARK
        </label>
        <input
          type="text"
          value={locationDescription}
          onChange={(e) => setLocationDescription(e.target.value)}
          placeholder="e.g. 5th Ave & 23rd St"
          className="w-full bg-surface border border-border rounded px-3 py-2 text-foreground placeholder-muted/50 focus:outline-none focus:border-mta-yellow transition-colors"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          DATE OF CRASH
        </label>
        <input
          type="date"
          value={dateOfCrash}
          onChange={(e) => setDateOfCrash(e.target.value)}
          required
          className="w-full bg-surface border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-mta-yellow transition-colors"
        />
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          SEVERITY
        </label>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={`
                flex-1 py-2 rounded text-xs font-bold tracking-wider border-2 transition-all
                ${severity === opt.value
                  ? `${opt.color} border-transparent text-background`
                  : "bg-surface border-border text-muted hover:border-muted/50"
                }
              `}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Crash type */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          CRASH TYPE
        </label>
        <select
          value={crashType}
          onChange={(e) => setCrashType(e.target.value)}
          required
          className="w-full bg-surface border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:border-mta-yellow transition-colors"
        >
          <option value="" disabled>Select type...</option>
          {CRASH_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
          WHAT HAPPENED
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          placeholder="Describe the crash..."
          className="w-full bg-surface border border-border rounded px-3 py-2 text-foreground placeholder-muted/50 focus:outline-none focus:border-mta-yellow transition-colors resize-none"
        />
      </div>

      {/* Photos */}
      <PhotoUploader photos={photos} onChange={setPhotos} />

      {/* Reported to police */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            reportedToPolice ? "bg-mta-yellow border-mta-yellow" : "border-border group-hover:border-muted"
          }`}
          onClick={() => setReportedToPolice(!reportedToPolice)}
        >
          {reportedToPolice && (
            <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-sm text-muted">This crash was reported to police</span>
        <input
          type="checkbox"
          checked={reportedToPolice}
          onChange={(e) => setReportedToPolice(e.target.checked)}
          className="sr-only"
        />
      </label>

      {/* Error */}
      {error && (
        <div className="bg-severity-severe/20 border border-severity-severe/50 rounded px-3 py-2 text-sm text-severity-severe">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase py-3 rounded-full hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "SUBMITTING..." : "LOG CRASH"}
      </button>
    </form>
  );
}
