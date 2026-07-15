"use client";

import { useState } from "react";

/* ============================================================
   Photo — a local image with a clean, on-brand fallback.
   If the file at `src` is missing/broken, it hides the <img>
   and shows the brand gradient instead (never a broken/odd
   image). Place inside a `relative overflow-hidden` parent.
   Drop real photos into /public/images to replace the fallback.
   ============================================================ */

export default function Photo({
  src,
  alt = "",
  className = "",
  fallback = "linear-gradient(135deg, #dbe6fe 0%, #eef2fb 100%)",
  sizes = "100vw",
  priority = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // Build a responsive srcSet for Unsplash-hosted images by swapping the
  // `w=` query param. Non-Unsplash / local images fall back to plain src.
  const isUnsplash = src.includes("images.unsplash.com") && /[?&]w=\d+/.test(src);
  const srcSet = isUnsplash
    ? [640, 960, 1280, 1600].map((w) => `${src.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(", ")
    : undefined;

  return (
    <span
      className={`absolute inset-0 block ${className}`}
      style={{ background: fallback }}
      aria-hidden={alt === "" ? true : undefined}
    >
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={1600}
          height={1067}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}
