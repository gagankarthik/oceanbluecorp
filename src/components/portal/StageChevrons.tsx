"use client";

import { useEffect, useRef } from "react";
import { stageColors, stageDotStyle } from "@/components/portal/recruiting/model";
import Icon from "@/components/portal/icons";

const NOTCH = 10;
const chevron = (first: boolean) =>
  `polygon(0 0, calc(100% - ${NOTCH}px) 0, 100% 50%, calc(100% - ${NOTCH}px) 100%, 0 100%${first ? "" : `, ${NOTCH}px 50%`})`;
// A clipped shape takes no border; four 1px shadows on its parent trace one (the hollow New stage).
const outline = (c: string) => `drop-shadow(1px 0 0 ${c}) drop-shadow(-1px 0 0 ${c}) drop-shadow(0 1px 0 ${c}) drop-shadow(0 -1px 0 ${c})`;

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
          const c = stageColors(s.key);
          const bg = on ? c.fill : past ? `color-mix(in srgb, ${c.edge} 16%, var(--color-mist-0))` : undefined;
          const ink = on ? c.onFill : past ? "var(--color-navy-900)" : undefined;
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
                style={on && s.key === "pending" ? { filter: outline(c.edge) } : undefined}
                className={`group relative block h-9 w-full rounded-sm focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600 disabled:cursor-default ${
                  on ? "z-[1] cursor-default" : ""
                }`}
              >
                <span
                  style={{ clipPath: chevron(i === 0), background: bg, color: ink }}
                  className={`flex h-full items-center justify-center gap-1.5 whitespace-nowrap text-adm-base transition-[filter,background-color] ${i ? "pl-5 pr-4" : "pl-3.5 pr-4"} ${
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
                    !on && <span aria-hidden className="size-2 shrink-0 rounded-full" style={stageDotStyle(s.key)} />
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
