// 📍 /apps/web/src/components/sell/image-uploader.tsx
//
// Drag & drop zone + thumbnail grid.
// Native HTML5 drag-drop — no external libraries.

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useTranslations } from "next-intl";
import type { PropertyImagePublic } from "@property-marketplace/shared-types";
import { ApiError } from "@/lib/api-error";
import {
  deleteImage,
  listImages,
  reorderImages,
  setCover,
  uploadImages,
} from "@/lib/api/images";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 20;
const MAX_FILE_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  propertyId: string;
}

export function ImageUploader({ propertyId }: ImageUploaderProps) {
  const t = useTranslations("Images");
  const [images, setImages] = useState<PropertyImagePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Load existing images ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listImages(propertyId);
        if (!cancelled) setImages(list);
      } catch {
        if (!cancelled) setError(t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId, t]);

  // ─── Upload files ─────────────────────────────────────
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const arr = Array.from(files);

      // Client-side pre-checks
      const invalid: string[] = [];
      const oversized: string[] = [];
      for (const f of arr) {
        if (!ACCEPTED.includes(f.type)) invalid.push(f.name);
        if (f.size > MAX_FILE_MB * 1024 * 1024) oversized.push(f.name);
      }
      if (invalid.length > 0) {
        setError(t("invalidType", { files: invalid.join(", ") }));
        return;
      }
      if (oversized.length > 0) {
        setError(t("tooLarge", { files: oversized.join(", "), mb: MAX_FILE_MB }));
        return;
      }
      if (images.length + arr.length > MAX_IMAGES) {
        setError(t("maxReached", { max: MAX_IMAGES }));
        return;
      }

      setUploading(true);
      setProgress(0);
      try {
        const uploaded = await uploadImages(propertyId, arr, setProgress);
        setImages((prev) => [...prev, ...uploaded]);
      } catch (err) {
        if (err instanceof ApiError) setError(err.message);
        else setError(t("uploadError"));
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [images.length, propertyId, t],
  );

  // ─── Drag & drop handlers ─────────────────────────────
  function onDragOver(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    if (!uploading) setDragActive(true);
  }
  function onDragLeave(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragActive(false);
  }
  function onDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragActive(false);
    if (uploading) return;
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  }

  // ─── Image actions ────────────────────────────────────
  async function handleSetCover(id: string): Promise<void> {
    setError(null);
    try {
      await setCover(propertyId, id);
      setImages((prev) => prev.map((img) => ({ ...img, isCover: img.id === id })));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleDelete(id: string): Promise<void> {
    if (!window.confirm(t("confirmDelete"))) return;
    setError(null);
    try {
      await deleteImage(propertyId, id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  async function handleMove(id: string, direction: "up" | "down"): Promise<void> {
    const idx = images.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[idx], next[target]] = [next[target]!, next[idx]!];
    setImages(next);

    try {
      await reorderImages(
        propertyId,
        next.map((i) => i.id),
      );
    } catch (err) {
      // Roll back on failure
      setImages(images);
      if (err instanceof ApiError) setError(err.message);
    }
  }

  // ─── Render ───────────────────────────────────────────
  if (loading) {
    return <p className="text-sm text-ink-muted">{t("loading")}</p>;
  }

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-md border-2 border-dashed p-8 text-center transition-colors",
          dragActive
            ? "border-brand bg-brand-light"
            : "border-line-strong hover:border-brand/60 hover:bg-surface",
          uploading && "cursor-wait opacity-70",
        )}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={uploading}
        />
        <p className="text-sm font-medium text-ink">
          {dragActive ? t("dropNow") : t("dropTitle")}
        </p>
        <p className="mt-1 text-xs text-ink-muted">{t("dropSubtitle")}</p>
        <p className="mt-3 text-xs text-ink-muted">
          {t("counter", { current: images.length, max: MAX_IMAGES })}
        </p>
      </div>

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span>{t("uploading")}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-line">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-accent/40 bg-accent/5 px-3 py-2 text-sm text-accent">
          {error}
        </div>
      )}

      {/* Grid */}
      {images.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img, idx) => (
            <li
              key={img.id}
              className="group relative overflow-hidden rounded-md border border-line bg-surface"
            >
              {/* Image */}
              <div className="aspect-[4/3] w-full overflow-hidden bg-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbnailUrl}
                  alt={img.alt ?? `Image ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Cover badge */}
              {img.isCover && (
                <span className="absolute left-2 top-2 rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {t("cover")}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-1 border-t border-line bg-card px-2 py-1.5 text-xs">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => void handleMove(img.id, "up")}
                    disabled={idx === 0}
                    className="rounded-sm px-1.5 py-0.5 text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-30"
                    aria-label={t("moveUp")}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleMove(img.id, "down")}
                    disabled={idx === images.length - 1}
                    className="rounded-sm px-1.5 py-0.5 text-ink-muted hover:bg-surface hover:text-ink disabled:opacity-30"
                    aria-label={t("moveDown")}
                  >
                    →
                  </button>
                </div>
                <div className="flex gap-1">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => void handleSetCover(img.id)}
                      className="rounded-sm px-1.5 py-0.5 text-[11px] text-brand hover:bg-brand-light"
                    >
                      {t("setCover")}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleDelete(img.id)}
                    className="rounded-sm px-1.5 py-0.5 text-ink-muted hover:bg-accent/10 hover:text-accent"
                    aria-label={t("delete")}
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}