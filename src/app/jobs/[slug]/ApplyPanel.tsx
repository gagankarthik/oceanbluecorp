"use client";

import { useEffect, useRef, useState } from "react";
import ApplyForm from "./ApplyForm";

/** The application form stays closed until asked for; #apply (the sidebar button, a shared link) opens it too. */
export default function ApplyPanel({ jobId, title }: { jobId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fromHash = () => {
      if (window.location.hash === "#apply") setOpen(true);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  // Bring the form into view with the first field ready
  useEffect(() => {
    if (!open) return;
    ref.current?.scrollIntoView({ block: "start" });
    ref.current?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true });
  }, [open]);

  return (
    <div id="apply" ref={ref} className="scroll-mt-28">
      <h2 className="display text-head-md">Apply for this role</h2>
      {open ? (
        <ApplyForm jobId={jobId} title={title} />
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-5 bg-mist-100 p-6 md:p-7">
          <p className="max-w-measure-narrow text-mist-600">Takes a few minutes. Have your resume ready as a PDF or Word file, or your LinkedIn profile.</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={false}
            aria-controls="apply"
            className="inline-flex min-h-12 items-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
          >
            Start your application
          </button>
        </div>
      )}
    </div>
  );
}
