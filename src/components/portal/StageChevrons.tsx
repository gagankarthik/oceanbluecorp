"use client";

import { useEffect, useRef } from "react";
import { STAGE_DOT, type Stage } from "@/components/portal/recruiting/model";
import Icon from "@/components/portal/icons";

const NAVY = "#0b2e46";
const NOTCH = 10;
const chevron = (first: boolean) =>
  `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%${first ? "" : `, ${NOTCH}px 50%`})`;

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** White or navy, whichever reads better on the fill. */
export function inkOn(hex: string) {
  const l = luminance(hex);
  const navy = luminance(NAVY);
  return (1.05 / (l + 0.05) >= (l + 0.05) / (navy + 0.05) ? "#fff" : NAVY);
}

export const stageColor = (s: string) => STAGE_DOT[s as Stage] ?? "#99a2af";

/**
 * A pipeline as an overlapping chevron chain, the large form of the roles
 * table's "Pipeline by stage". Current stage solid, passed stages a tint with a
 * check, future stages grey. Scrolls inside its own box when narrow.
 */
export function StageChevrons({
  stages,
  current,
  onSelect,
  disabled,
  label = "Hiring pipeline",
}: {
  stages: { key: string; label: string }[];
  current: string;
  onSelect?: (key: string) => void;
  disabled?: boolean;
  label?: string;
}) {
  const idx = stages.findIndex((s) => s.key === current);
  const scroller = useRef<HTMLDivElement>(null);

  // Narrow screens: keep the current stage in view without moving the page.
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector<HTMLElement>("[aria-current]");
    if (!box || !el || box.scrollWidth <= box.clientWidth) return;
    box.scrollLeft = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
  }, [idx]);

  return (
    <div ref={scroller} className=" min-w-0 scroll-strip">
      <ol aria-label={label} className="flex w-max py-0.5">
        {stages.map((s, i) => {
          const on = i === idx;
          const past = idx > i;
          const c = stageColor(s.key);
          const bg = on ? c : past ? `color-mix(in srgb, ${c} 18%, #fff)` : undefined;
          const ink = on ? inkOn(c) : past ? NAVY : undefined;
          const status = on ? "current stage" : past ? "done" : "not reached";
          return (
            <li key={s.key} className={`shrink-0 ${i ? "-ml-[3px]" : ""}`}>
              <button
                type="button"
                onClick={() => !on && onSelect?.(s.key)}
                disabled={disabled || !onSelect}
                aria-current={on ? "step" : undefined}
                aria-label={`${s.label}, ${status}${on || !onSelect ? "" : `. Move to ${s.label}`}`}
                title={on ? s.label : `Move to ${s.label}`}
                className={`group relative block h-9 w-full rounded-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600 disabled:cursor-default ${
                  on ? "z-[1] cursor-default" : ""
                }`}
              >
                <span
                  style={{ clipPath: chevron(i === 0), background: bg, color: ink }}
                  className={`flex h-full items-center justify-center gap-1.5 whitespace-nowrap text-[13px] transition-[filter,background-color] ${i ? "pl-5 pr-4" : "pl-3.5 pr-4"} ${
                    on
                      ? "font-semibold"
                      : past
                        ? "font-medium group-enabled:group-hover:brightness-95"
                        : "bg-mist-100 font-medium text-mist-600 group-enabled:group-hover:bg-mist-200 group-enabled:group-hover:text-navy-900"
                  }`}
                >
                  {past ? (
                    <Icon name="check" className="size-3.5 shrink-0" />
                  ) : (
                    !on && <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: c }} />
                  )}
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
