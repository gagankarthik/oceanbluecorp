import Link from "next/link";
import Icon, { type IconName } from "../icons";

/** Inline busy indicator; inherits the text colour. */
export function Spinner({ className = "size-4", label }: { className?: string; /** Announced when set; decorative otherwise */ label?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-[spin_1.6s_linear_infinite] ${className}`}
    />
  );
}

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ocean-600 text-white not-disabled:hover:bg-ocean-700",
  secondary: "bg-mist-0 text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] not-disabled:hover:bg-mist-50",
  ghost: "text-navy-900 not-disabled:hover:bg-mist-100",
  danger: "bg-mist-0 text-coral-700 ring-1 ring-inset ring-coral-600 not-disabled:hover:bg-coral-50",
};

/**
 * The portal button. `href` renders a Link. `loading` disables it and swaps the
 * icon for a spinner; without an icon the spinner overlays the label, so the
 * width never changes.
 */
export function Button({
  children,
  variant = "primary",
  icon,
  href,
  onClick,
  type = "button",
  size = "md",
  className = "",
  disabled,
  label,
  loading,
  autoFocus,
  form,
}: {
  /** Submits the form with this id from outside it, e.g. a Modal footer */
  form?: string;
  /** Accessible name and tooltip; required when the button is icon-only */
  label?: string;
  /** Shows a spinner and blocks repeat clicks */
  loading?: boolean;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  icon?: IconName;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  // A busy button stays at full strength; only a truly disabled one fades.
  const cls = `relative inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors not-disabled:active:scale-[0.98] disabled:cursor-not-allowed ${
    loading ? "cursor-progress" : "disabled:opacity-[var(--opacity-disabled)]"
  } ${
    children ? (size === "sm" ? "min-h-8 px-3 text-[13px]" : "min-h-10 px-4 text-[14px]") : size === "sm" ? "size-8" : "size-10"
  } ${buttonStyles[variant]} ${className}`;
  const iconCls = size === "sm" ? "size-4" : "size-[18px]";
  // With an icon slot the spinner takes it; otherwise it overlays a hidden label.
  const overlay = loading && !icon && !!children;
  const inner = (
    <>
      {loading && !overlay ? <Spinner className={iconCls} /> : icon && <Icon name={icon} className={iconCls} />}
      {overlay ? (
        <>
          <span className="invisible inline-flex items-center gap-2">{children}</span>
          <span className="absolute inset-0 grid place-items-center">
            <Spinner className={iconCls} />
          </span>
        </>
      ) : (
        children
      )}
    </>
  );
  return href ? (
    <Link href={href} className={cls} aria-label={label} title={children ? undefined : label}>
      {inner}
    </Link>
  ) : (
    <button
      type={type}
      onClick={onClick}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={label}
      title={children ? undefined : label}
      autoFocus={autoFocus}
      form={form}
    >
      {inner}
    </button>
  );
}
