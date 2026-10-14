import Link from "next/link";

/**
 * The Oceanblue logo from /public/brand.
 * "color" is the full-colour logo for light fields; "white" and "ink" are
 * one-colour versions (the logo used as a mask) for saturated and dark fields.
 */
export default function Logo({
  variant = "color",
  className = "h-9 w-[7.6rem]",
  mark = false,
}: {
  variant?: "color" | "white" | "ink";
  className?: string;
  mark?: boolean;
}) {
  const src = mark ? "/brand/oceanblue-mark.svg" : "/brand/oceanblue-logo.svg";

  if (variant === "color") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="Oceanblue Solutions" className={`${className} object-contain object-left`} />
    );
  }

  return (
    <span
      role="img"
      aria-label="Oceanblue Solutions"
      className={`block ${className} ${variant === "white" ? "bg-white" : "bg-navy-950"}`}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "left center",
        WebkitMaskPosition: "left center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
      }}
    />
  );
}

export function HomeLink({ variant }: { variant: "color" | "white" | "ink" }) {
  return (
    <Link href="/" aria-label="Oceanblue Solutions home" className="block">
      <Logo variant={variant} />
    </Link>
  );
}
