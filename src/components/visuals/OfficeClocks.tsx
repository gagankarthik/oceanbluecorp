"use client";

import { useEffect, useState } from "react";
import { offices } from "@/lib/site-content";

function timeIn(tz: string, now: Date) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(now);
}

function hourIn(tz: string, now: Date) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: tz }).format(now));
}

/** Live local time at each location, and whether that team is in working hours */
export default function OfficeClocks() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {offices.map((o, i) => {
        const hour = now ? hourIn(o.tz, now) : 12;
        const working = hour >= 8 && hour < 18;
        return (
          <li key={o.place} className="bg-navy-800 p-6 md:p-8" data-reveal style={{ "--d": i } as React.CSSProperties}>
            <p className="font-medium">{o.place}</p>
            <p className="display mt-10 text-head tabular-nums" suppressHydrationWarning>
              {now ? timeIn(o.tz, now) : " "}
            </p>
            <p className="mt-3 flex items-center gap-2 text-tide-300">
              <span aria-hidden className={`size-2 rounded-full ${working ? "bg-cyan-400" : "bg-navy-600"}`} />
              {working ? "In working hours" : "Out of hours"}. {o.role}, since {o.since}.
            </p>
          </li>
        );
      })}
    </ul>
  );
}
