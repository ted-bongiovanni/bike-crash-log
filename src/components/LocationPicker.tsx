"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  onSelect: (lat: number, lng: number) => void;
  lat: number | null;
  lng: number | null;
}

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function LocationPicker({ onSelect, lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Geocode search using Nominatim
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=us`
      );
      const data: GeoResult[] = await res.json();
      setResults(data);
      setShowResults(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced input handler
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 400);
  };

  // Select a geocode result
  const selectResult = (result: GeoResult) => {
    const newLat = parseFloat(result.lat);
    const newLng = parseFloat(result.lon);
    onSelect(newLat, newLng);
    setQuery(result.display_name.split(",").slice(0, 2).join(","));
    setShowResults(false);

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([newLat, newLng], 16, { animate: true });
    }
  };

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [40.7128, -74.006],
      zoom: 12,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onSelect(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [onSelect]);

  // Update marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
    }

    if (lat !== null && lng !== null) {
      markerRef.current = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: "#FCCC0A",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 3,
      }).addTo(map);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full">
      {/* Search bar */}
      <div className="absolute top-2 left-2 right-2 z-[1000]">
        <div className="relative">
          <div className="flex items-center bg-surface border border-border rounded overflow-hidden">
            <svg
              className="w-4 h-4 text-muted ml-2.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="Search address or intersection..."
              className="w-full bg-transparent px-2 py-2 text-sm text-foreground placeholder-muted/50 focus:outline-none"
            />
            {searching && (
              <div className="w-4 h-4 border-2 border-mta-yellow border-t-transparent rounded-full animate-spin mr-2.5 shrink-0" />
            )}
          </div>

          {/* Results dropdown */}
          {showResults && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded shadow-lg max-h-48 overflow-y-auto">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => selectResult(r)}
                    className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-border transition-colors border-b border-border/50 last:border-b-0"
                  >
                    <span className="text-mta-yellow mr-1.5">●</span>
                    {r.display_name.length > 80
                      ? r.display_name.slice(0, 80) + "..."
                      : r.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-surface/80 rounded px-2 py-1 text-[10px] text-muted tracking-wide">
        or click the map
      </div>

      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
