import Image from "next/image";
import { photos, type PhotoKey } from "@/lib/photos";

/** An atmosphere photograph filling its box, in the shared greyscale treatment */
export default function Photo({
  name,
  className = "",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  position = "center",
  zoom = false,
}: {
  name: PhotoKey;
  className?: string;
  priority?: boolean;
  sizes?: string;
  position?: string;
  /** Scale up slightly when a parent .group is hovered */
  zoom?: boolean;
}) {
  const p = photos[name];
  return (
    <div className={`relative overflow-hidden bg-mist-200 ${className}`}>
      <Image
        src={p.src}
        alt={p.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`treated object-cover ${zoom ? "transition-transform duration-700 ease-[var(--ease-out-strong)] group-hover:scale-[1.05]" : ""}`}
        style={{ objectPosition: position }}
      />
    </div>
  );
}
