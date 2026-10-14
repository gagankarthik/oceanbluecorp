"use client";

import { useAuth } from "@/lib/auth";
import { landingRouteFor } from "@/lib/auth/config";
import Icon, { type IconName } from "../icons";
import { Button } from "./Button";

type Action = { label: string; onClick?: () => void; href?: string; icon?: IconName };

const card = "rounded-xl bg-mist-0 ring-1 ring-mist-200";

/**
 * Nothing to show. Pick the variant by why it is empty:
 * - `first-use`: nothing exists yet; say what goes here and offer the create action
 * - `no-results`: filters hid everything; `onClearFilters` adds a Clear filters button
 * - `plain` (default): neutral, e.g. inside a panel
 * `framed` draws its own card when it stands alone on the page.
 */
export function EmptyState({
  icon,
  title,
  body,
  action,
  primary,
  secondary,
  variant = "plain",
  onClearFilters,
  framed = false,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  body?: React.ReactNode;
  /** Free-form action slot (kept for existing callers); prefer primary/secondary */
  action?: React.ReactNode;
  primary?: Action;
  secondary?: Action;
  variant?: "plain" | "first-use" | "no-results";
  onClearFilters?: () => void;
  framed?: boolean;
  /** Tighter padding for panels and drawers */
  compact?: boolean;
}) {
  const glyph = icon ?? (variant === "no-results" ? "filter" : variant === "first-use" ? "plus" : "search");
  const chip = variant === "first-use" ? "bg-ocean-50 text-ocean-700" : "bg-mist-100 text-mist-600";
  const hasButtons = primary || secondary || (variant === "no-results" && onClearFilters);
  return (
    <div className={`flex flex-col items-center px-6 text-center ${compact ? "py-10" : "py-16"} ${framed ? card : ""}`}>
      <span className={`grid size-12 place-items-center rounded-full ${chip}`}>
        <Icon name={glyph} className="size-6" />
      </span>
      <p className="mt-4 text-adm-md font-semibold text-navy-900">{title}</p>
      {body && <p className="mt-1 max-w-[48ch] text-adm-base text-mist-600">{body}</p>}
      {hasButtons && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {variant === "no-results" && onClearFilters && (
            <Button variant="secondary" icon="x" onClick={onClearFilters}>
              Clear filters
            </Button>
          )}
          {primary && (
            <Button icon={primary.icon} href={primary.href} onClick={primary.onClick}>
              {primary.label}
            </Button>
          )}
          {secondary && (
            <Button variant="ghost" icon={secondary.icon} href={secondary.href} onClick={secondary.onClick}>
              {secondary.label}
            </Button>
          )}
        </div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** A failed load: what happened, Try again, and where to get help. Announced as an alert. */
export function ErrorState({
  title,
  message,
  onRetry,
  retrying,
  framed = true,
}: {
  title: string;
  message?: React.ReactNode;
  onRetry?: () => void;
  /** Spinner on Try again while the reload runs */
  retrying?: boolean;
  framed?: boolean;
}) {
  return (
    <div role="alert" className={`flex flex-col items-center px-6 py-16 text-center ${framed ? card : ""}`}>
      <span className="grid size-12 place-items-center rounded-full bg-status-danger-soft text-status-danger">
        <Icon name="alert" className="size-6" />
      </span>
      <p className="mt-4 text-adm-md font-semibold text-navy-900">{title}</p>
      <p className="mt-1 max-w-[48ch] text-adm-base text-mist-600">{message || "Check your connection and try again."}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button icon="refresh" onClick={onRetry} loading={retrying}>
            Try again
          </Button>
        )}
        <Button variant="ghost" icon="help" href="/portal/help">
          Get help
        </Button>
      </div>
    </div>
  );
}

/** The signed-in role can't open this section; offers the way home. */
export function NoAccess({ section }: { section: string }) {
  const { user } = useAuth();
  const home = landingRouteFor(user?.role);
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        icon="shield"
        title={`You don't have access to ${section}`}
        body="Your role doesn't include this section. Ask an administrator if you need it."
        action={
          <Button href={home} variant="secondary" icon="dashboard">
            {home === "/portal" ? "Go to dashboard" : "Go to your workspace"}
          </Button>
        }
      />
    </div>
  );
}
