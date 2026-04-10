"use client";

import { useEffect, useState } from "react";

interface Bicycle {
  id: number;
  name: string;
  power_type: "leg" | "pedal_assist" | "throttle";
  description: string | null;
  image_url: string | null;
  home_zip: string | null;
  created_at: string;
}

const POWER_LABELS: Record<string, string> = {
  leg: "LEG POWER",
  pedal_assist: "PEDAL ASSIST",
  throttle: "THROTTLE",
};

const POWER_COLORS: Record<string, string> = {
  leg: "bg-mta-green",
  pedal_assist: "bg-mta-blue",
  throttle: "bg-mta-purple",
};

function BikeForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial?: Bicycle;
  onSubmit: (data: { name: string; power_type: string; description: string; image_url: string; home_zip: string }) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [powerType, setPowerType] = useState<"leg" | "pedal_assist" | "throttle">(initial?.power_type ?? "leg");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [homeZip, setHomeZip] = useState(initial?.home_zip ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ name, power_type: powerType, description, image_url: imageUrl, home_zip: homeZip });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded p-4 space-y-4">
      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          BIKE NAME
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Thunder"
          required
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
        />
      </div>

      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          POWER TYPE
        </label>
        <div className="flex rounded overflow-hidden border border-border">
          {(["leg", "pedal_assist", "throttle"] as const).map((pt) => (
            <button
              key={pt}
              type="button"
              onClick={() => setPowerType(pt)}
              className={`flex-1 px-2 py-2 text-[10px] font-bold tracking-wider transition-all ${
                powerType === pt
                  ? `${POWER_COLORS[pt]} text-white`
                  : "bg-background text-muted hover:text-foreground"
              }`}
            >
              {POWER_LABELS[pt]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
          DESCRIPTION <span className="text-muted/50">optional</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. 2024 RadRunner Plus"
          className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
            IMAGE URL <span className="text-muted/50">optional</span>
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
          />
        </div>
        <div className="w-28">
          <label className="text-xs font-bold tracking-widest text-muted uppercase block mb-2">
            HOME ZIP
          </label>
          <input
            type="text"
            value={homeZip}
            onChange={(e) => setHomeZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="10001"
            inputMode="numeric"
            maxLength={5}
            className="w-full bg-background border border-border rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-mta-yellow placeholder:text-muted/50"
          />
        </div>
      </div>

      {error && (
        <div className="text-severity-severe text-sm bg-severity-severe/10 border border-severity-severe/30 rounded p-3">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="flex-1 bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase py-3 rounded hover:brightness-110 transition-all disabled:opacity-50"
        >
          {submitting ? "SAVING..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-3 bg-surface border border-border rounded text-sm font-bold tracking-widest uppercase text-muted hover:text-foreground transition-all"
        >
          CANCEL
        </button>
      </div>
    </form>
  );
}

export default function BikesPage() {
  const [bikes, setBikes] = useState<Bicycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bicycles")
      .then((r) => r.json())
      .then((data) => {
        setBikes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async (data: { name: string; power_type: string; description: string; image_url: string; home_zip: string }) => {
    const res = await fetch("/api/bicycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        power_type: data.power_type,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
        home_zip: data.home_zip || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Failed to save");
    }
    const bike = await res.json();
    setBikes((prev) => [...prev, bike].sort((a, b) => a.name.localeCompare(b.name)));
    setShowForm(false);
  };

  const handleUpdate = async (id: number, data: { name: string; power_type: string; description: string; image_url: string; home_zip: string }) => {
    const res = await fetch(`/api/bicycles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        power_type: data.power_type,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
        home_zip: data.home_zip || undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Failed to update");
    }
    const updated = await res.json();
    setBikes((prev) => prev.map((b) => (b.id === id ? updated : b)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
  };

  const handleDelete = async (id: number, bikeName: string) => {
    if (!confirm(`Delete "${bikeName}"? This cannot be undone.`)) return;
    setError("");
    const res = await fetch(`/api/bicycles/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBikes((prev) => prev.filter((b) => b.id !== id));
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete");
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="text-muted text-sm tracking-widest uppercase">Loading bikes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-20 pb-12">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">
          <span className="text-foreground">YOUR</span>{" "}
          <span className="text-mta-yellow">BIKES</span>
        </h1>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="bg-mta-yellow text-background font-bold text-xs tracking-widest uppercase px-4 py-2 rounded hover:brightness-110 transition-all"
        >
          {showForm ? "CANCEL" : "+ ADD"}
        </button>
      </div>
      <p className="text-muted text-sm mb-6">Your fleet. Known by bike, not by name.</p>

      {error && (
        <div className="text-severity-severe text-sm bg-severity-severe/10 border border-severity-severe/30 rounded p-3 mb-4">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6">
          <BikeForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            submitLabel="ADD BIKE"
          />
        </div>
      )}

      {bikes.length === 0 && !showForm ? (
        <div className="text-center py-20">
          <p className="text-2xl font-bold text-mta-yellow mb-2">NO BIKES YET</p>
          <p className="text-muted text-sm mb-6">Add your first ride.</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-block bg-mta-yellow text-background font-bold text-sm tracking-widest uppercase px-6 py-3 rounded hover:brightness-110 transition-all"
          >
            + ADD A BIKE
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bikes.map((bike) =>
            editingId === bike.id ? (
              <BikeForm
                key={bike.id}
                initial={bike}
                onSubmit={(data) => handleUpdate(bike.id, data)}
                onCancel={() => setEditingId(null)}
                submitLabel="SAVE"
              />
            ) : (
              <div key={bike.id} className="bg-surface border border-border rounded p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {bike.image_url && (
                      <img
                        src={bike.image_url}
                        alt={bike.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{bike.name}</div>
                      {bike.description && (
                        <div className="text-xs text-muted truncate">{bike.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => { setEditingId(bike.id); setShowForm(false); }}
                      className="text-muted hover:text-mta-yellow text-xs tracking-widest uppercase transition-colors"
                      title="Edit bike"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => handleDelete(bike.id, bike.name)}
                      className="text-muted hover:text-severity-severe text-xs tracking-widest uppercase transition-colors"
                      title="Delete bike"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded ${POWER_COLORS[bike.power_type]} text-white`}>
                    {POWER_LABELS[bike.power_type]}
                  </span>
                  {bike.home_zip && (
                    <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-mta-yellow/20 text-mta-yellow">
                      ZIP {bike.home_zip}
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
