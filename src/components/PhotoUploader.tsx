"use client";

import { useState, useRef } from "react";
/* eslint-disable @next/next/no-img-element */

const MAX_PHOTOS = 3;

interface PhotoPreview {
  file: File;
  preview: string;
  label: string;
}

interface Props {
  photos: PhotoPreview[];
  onChange: (photos: PhotoPreview[]) => void;
}

export default function PhotoUploader({ photos, onChange }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | null) {
    if (!files) return;

    const remaining = MAX_PHOTOS - photos.length;
    const newPhotos: PhotoPreview[] = [];

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
        label: "",
      });
    }

    onChange([...photos, ...newPhotos]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photos[index].preview);
    onChange(photos.filter((_, i) => i !== index));
  }

  function updateLabel(index: number, label: string) {
    const updated = [...photos];
    updated[index] = { ...updated[index], label };
    onChange(updated);
  }

  const labelOptions = ["Scene", "Bike damage", "Injury", "Road condition"];

  return (
    <div>
      <label className="block text-xs font-bold tracking-widest text-muted uppercase mb-2">
        PHOTOS <span className="font-normal text-muted/60">({photos.length}/{MAX_PHOTOS})</span>
      </label>

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group">
              <div className="aspect-square rounded border border-border overflow-hidden bg-surface">
                <img
                  src={photo.preview}
                  alt={photo.label || `Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-severity-severe rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                X
              </button>
              {/* Label selector */}
              <select
                value={photo.label}
                onChange={(e) => updateLabel(i, e.target.value)}
                className="mt-1.5 w-full bg-surface border border-border rounded px-1.5 py-1 text-[11px] text-foreground focus:outline-none focus:border-mta-yellow"
              >
                <option value="">Label...</option>
                {labelOptions.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {photos.length < MAX_PHOTOS && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${dragOver
              ? "border-mta-yellow bg-mta-yellow/10"
              : "border-border hover:border-muted/50"
            }
          `}
        >
          <svg
            className="w-8 h-8 mx-auto mb-2 text-muted/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
          <p className="text-xs text-muted">
            {photos.length === 0
              ? "Drop photos here or tap to upload"
              : `Add ${MAX_PHOTOS - photos.length} more`
            }
          </p>
          <p className="text-[10px] text-muted/50 mt-1">
            JPG, PNG, WebP up to 5MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => addFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export type { PhotoPreview };
