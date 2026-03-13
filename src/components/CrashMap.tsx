"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Crash } from "@/lib/db";

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#00933C",
  moderate: "#FF6319",
  severe: "#EE352E",
};

const TYPE_LABELS: Record<string, string> = {
  vehicle: "Vehicle collision",
  bicycle: "Bicycle collision",
  ebike: "E-bike collision",
  pedestrian: "Pedestrian collision",
  road_hazard: "Road hazard",
  dooring: "Dooring",
  solo: "Solo crash",
  other: "Other",
};

interface Filters {
  severity: string;
  crash_type: string;
  date_from: string;
  date_to: string;
}

export default function CrashMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [crashes, setCrashes] = useState<Crash[]>([]);
  const [filters, setFilters] = useState<Filters>({
    severity: "",
    crash_type: "",
    date_from: "",
    date_to: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch crashes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.crash_type) params.set("crash_type", filters.crash_type);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);

    fetch(`/api/crashes?${params}`)
      .then((r) => r.json())
      .then(setCrashes)
      .catch(console.error);
  }, [filters]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const centerLat = parseFloat(urlParams.get("lat") || "40.7128");
    const centerLng = parseFloat(urlParams.get("lng") || "-74.006");
    const zoom = parseInt(urlParams.get("zoom") || "12");

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;

    group.clearLayers();

    crashes.forEach((crash) => {
      const color = SEVERITY_COLORS[crash.severity] || "#ffffff";
      const marker = L.circleMarker([crash.lat, crash.lng], {
        radius: 8,
        fillColor: color,
        fillOpacity: 0.9,
        color: "#ffffff",
        weight: 2,
      });

      const photoHtml = crash.photos && crash.photos.length > 0
        ? `<div style="display: flex; gap: 4px; margin-top: 8px; overflow-x: auto;">
            ${crash.photos.map((p: { filename: string; label: string | null }) => `
              <div style="flex-shrink: 0;">
                <img
                  src="/api/uploads/${crash.id}/${p.filename}"
                  alt="${p.label || "Crash photo"}"
                  style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; border: 1px solid #3a3a4e;"
                />
                ${p.label ? `<div style="font-size: 9px; color: #a0a0a0; text-align: center; margin-top: 2px;">${p.label}</div>` : ""}
              </div>
            `).join("")}
          </div>`
        : "";

      marker.bindPopup(`
        <div style="font-family: Inter, Helvetica, sans-serif; min-width: 200px; max-width: 300px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="
              display: inline-block; width: 10px; height: 10px; border-radius: 50%;
              background: ${color};
            "></span>
            <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px;">
              ${crash.severity}
            </strong>
          </div>
          <div style="font-size: 11px; color: #a0a0a0; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
            ${TYPE_LABELS[crash.crash_type] || crash.crash_type}
          </div>
          <p style="font-size: 13px; margin: 8px 0; line-height: 1.4;">${crash.description}</p>
          ${photoHtml}
          ${crash.location_description ? `<div style="font-size: 11px; color: #a0a0a0; margin-top: 8px;">${crash.location_description}</div>` : ""}
          <div style="font-size: 10px; color: #666; margin-top: 8px; font-family: monospace;">
            ${crash.date_of_crash}
          </div>
        </div>
      `);

      marker.addTo(group);
    });
  }, [crashes]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Filter toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="absolute top-3 right-3 z-[1000] bg-surface border border-border rounded px-3 py-1.5 text-xs font-bold tracking-wider text-mta-yellow hover:bg-border transition-colors"
      >
        FILTER {showFilters ? "▲" : "▼"}
      </button>

      {/* Filter panel */}
      {showFilters && (
        <div className="absolute top-12 right-3 z-[1000] bg-surface border border-border rounded p-4 w-64 space-y-3">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1">SEVERITY</label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
            >
              <option value="">All</option>
              <option value="minor">Minor</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1">TYPE</label>
            <select
              value={filters.crash_type}
              onChange={(e) => setFilters({ ...filters, crash_type: e.target.value })}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
            >
              <option value="">All</option>
              <option value="vehicle">Vehicle</option>
              <option value="bicycle">Bicycle</option>
              <option value="ebike">E-bike</option>
              <option value="pedestrian">Pedestrian</option>
              <option value="road_hazard">Road hazard</option>
              <option value="dooring">Dooring</option>
              <option value="solo">Solo</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1">FROM</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-muted uppercase mb-1">TO</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="w-full bg-background border border-border rounded px-2 py-1 text-sm text-foreground"
            />
          </div>
          <button
            onClick={() => setFilters({ severity: "", crash_type: "", date_from: "", date_to: "" })}
            className="w-full text-xs text-muted hover:text-foreground transition-colors py-1"
          >
            CLEAR FILTERS
          </button>
        </div>
      )}

      {/* Crash count */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-surface/90 border border-border rounded px-3 py-1.5 text-xs font-mono text-muted">
        {crashes.length} crash{crashes.length !== 1 ? "es" : ""} logged
      </div>
    </div>
  );
}
