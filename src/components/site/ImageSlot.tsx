type ImageSlotProps = {
  /** What image belongs here, shown to whoever supplies the asset */
  label: string;
  /** Recommended export size */
  size?: string;
  /** Tailwind aspect class, e.g. "aspect-[4/3]" */
  aspect?: string;
  /** Plate colour: pick one a step away from the field it sits on */
  tone?: "light" | "dark" | "brand";
  className?: string;
};

const tones = {
  light: "bg-tide-300 text-navy-950",
  dark: "bg-navy-700 text-tide-200",
  brand: "bg-ocean-800 text-white",
};

/**
 * Placeholder for a photograph that still needs to be supplied: a flat plate
 * with a caption. Replace with next/image once the asset exists.
 */
export default function ImageSlot({ label, size, aspect = "aspect-[4/3]", tone = "light", className = "" }: ImageSlotProps) {
  return (
    <div
      role="img"
      aria-label={`Photograph to come: ${label}`}
      className={`relative flex ${aspect} w-full items-end ${tones[tone]} ${className}`}
    >
      <p className="p-4 text-[length:var(--text-small)] leading-snug">
        <span className="font-medium">Photograph: {label}</span>
        {size && <span className="block opacity-75">{size}</span>}
      </p>
    </div>
  );
}
