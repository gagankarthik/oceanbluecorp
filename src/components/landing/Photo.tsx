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
}: {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
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
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </span>
  );
}
