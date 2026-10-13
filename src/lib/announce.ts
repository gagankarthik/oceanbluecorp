/**
 * Read a short message to screen-reader users without moving focus, for
 * actions that change nothing visible but a tick, like "Copied" (WCAG 4.1.3).
 *
 * One polite live region per page, created on first use. The text is set on
 * the next tick so the region exists before its content changes, which some
 * screen readers need, and cleared first so the same message repeats.
 */
export function announce(message: string): void {
  if (typeof document === "undefined") return;
  let region = document.getElementById("sr-announcer");
  if (!region) {
    region = document.createElement("div");
    region.id = "sr-announcer";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.className = "sr-only";
    document.body.appendChild(region);
  }
  region.textContent = "";
  const target = region;
  window.setTimeout(() => {
    target.textContent = message;
  }, 50);
}
