"use client";

import { useState } from "react";
import Image from "next/image";

/* Photo, an image with a clean, on-brand fallback. If `src` is missing or
   broken it shows the brand gradient rather than a broken image. Place inside
   a `relative overflow-hidden` parent.

   Two paths, because the two kinds of source want opposite handling:

   · Local files (/images/...) go through next/image, which is the only way
     they get resized and served as avif/webp. Without it a full-resolution
     PNG or JPEG ships as-is to every visitor.
   · Unsplash URLs stay on a plain <img> with a srcSet built by rewriting the
     `w=` query param. They are already optimised and CDN-served at whatever
     width is asked for, so routing them through the optimiser would add a
     proxy hop to gain nothing. */

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
  /** CSS `sizes`. Always pass the real rendered width, without it the browser
   *  assumes 100vw and downloads the largest candidate for a 300px card. */
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  // A root-relative path is a file in /public, the case next/image handles.
  // Anything else is remote and stays on the <img> path below.
  const isLocal = src.startsWith("/");

  // The Unsplash ladder starts low (320) so small cards and phones fetch
  // small files rather than the 1600w candidate.
  const isUnsplash = src.includes("images.unsplash.com") && /[?&]w=\d+/.test(src);
  const srcSet = isUnsplash
    ? [320, 480, 640, 960, 1280, 1600]
        .map((w) => `${src.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`)
        .join(", ")
    : undefined;

  return (
    <span
      className={`absolute inset-0 block ${className}`}
      style={{ background: fallback }}
      aria-hidden={alt === "" ? true : undefined}
    >
      {failed ? null : isLocal ? (
        // `fill` rather than fixed dimensions: this span is the sizing box and
        // it is already positioned, which is what fill needs.
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
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
