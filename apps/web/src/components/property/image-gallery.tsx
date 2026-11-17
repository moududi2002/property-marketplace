// 📍 /apps/web/src/components/property/image-gallery.tsx
//
// Main image + thumbnail strip + full-screen lightbox.
// Keyboard-navigable (← → Esc). No autoplay, no fancy transitions.

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PropertyImagePublic } from "@property-marketplace/shared-types";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: PropertyImagePublic[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const t = useTranslations("PropertyDetail.gallery");
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const active = images[activeIdx];

  const close = useCallback(() => setLightbox(false), []);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") setActiveIdx((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setActiveIdx((i) => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox, close, images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-md border border-line bg-surface text-sm text-ink-muted">
        {t("noImages")}
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div className="overflow-hidden rounded-md border border-line bg-line">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="block aspect-[16/10] w-full cursor-zoom-in"
          aria-label={t("openLightbox")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active?.url}
            alt={active?.alt ?? title}
            className="h-full w-full object-cover"
          />
        </button>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <ul className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {images.map((img, idx) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-sm border-2 transition-colors",
                  idx === activeIdx
                    ? "border-brand"
                    : "border-transparent hover:border-line-strong",
                )}
                aria-label={t("viewImage", { n: idx + 1 })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
            aria-label={t("close")}
          >
            ✕
          </button>

          {activeIdx > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => Math.max(0, i - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl text-white hover:bg-white/25"
              aria-label={t("prev")}
            >
              ←
            </button>
          )}

          <div
            className="max-h-[85vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active?.url}
              alt={active?.alt ?? title}
              className="max-h-[85vh] max-w-[90vw] object-contain"
            />
            <p className="mt-2 text-center text-xs text-white/70">
              {activeIdx + 1} / {images.length}
            </p>
          </div>

          {activeIdx < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx((i) => Math.min(images.length - 1, i + 1));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-3 text-2xl text-white hover:bg-white/25"
              aria-label={t("next")}
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}