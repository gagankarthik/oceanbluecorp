"use client";

import { useId, useState } from "react";
import type { ArticleKind } from "@/lib/aws/dynamodb";
import { editorialGuide } from "@/lib/editorial";
import { ARTICLE_KIND_CONFIG } from "@/lib/articles";
import Icon from "@/components/portal/icons";
import { Button } from "@/components/portal/kit";

/** House style for the kind, collapsed by default beside the editor. */
export function EditorialGuide({
  kind,
  onInsertTemplate,
  bodyIsEmpty,
}: {
  kind: ArticleKind;
  /** Drops the skeleton into the body field. */
  onInsertTemplate: () => void;
  /** Only offered on an empty body, so it never overwrites a draft. */
  bodyIsEmpty: boolean;
}) {
  const guide = editorialGuide(kind);
  const config = ARTICLE_KIND_CONFIG[kind];
  const [open, setOpen] = useState(false);
  const bodyId = useId();

  return (
    <section className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex min-h-14 w-full items-center gap-3 rounded-xl px-5 py-3 text-left hover:bg-mist-50"
      >
        <Icon name="help" className="size-[18px] shrink-0 text-mist-500" />
        <span className="min-w-0 flex-1">
          <span className="block text-adm-base font-semibold text-navy-900">How we write a {config.noun}</span>
          <span className="block truncate text-adm-xs text-mist-600">{guide.length}</span>
        </span>
        <Icon name="chevronDown" className={`size-4 shrink-0 text-mist-500 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={bodyId} className="grid gap-5 border-t border-mist-200 p-5">
          <p className="text-adm-base leading-relaxed text-mist-700">{guide.premise}</p>

          <div className="grid gap-2">
            <p className="text-adm-xs font-semibold text-mist-600">Headline</p>
            <p className="flex gap-2 rounded-lg bg-[#ecfdf3] px-3 py-2 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-[#abefc6]">
              <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-[#067647]" />
              {guide.headline.good}
            </p>
            <p className="flex gap-2 rounded-lg bg-mist-50 px-3 py-2 text-adm-base text-mist-600 ring-1 ring-inset ring-mist-200">
              <Icon name="x" className="mt-0.5 size-3.5 shrink-0 text-[#b42318]" />
              <span className="line-through decoration-[#b42318]/40">{guide.headline.bad}</span>
            </p>
            <p className="text-adm-xs leading-relaxed text-mist-600">{guide.headline.why}</p>
          </div>

          <div className="grid gap-3">
            <p className="text-adm-xs font-semibold text-mist-600">The shape of a finished one</p>
            <ol className="grid gap-3">
              {guide.structure.map((step, i) => (
                <li key={step.name} className="flex gap-3">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-mist-100 text-adm-xs font-semibold tabular-nums text-mist-600">{i + 1}</span>
                  <span className="min-w-0 text-adm-base leading-relaxed">
                    <span className="block font-semibold text-navy-900">{step.name}</span>
                    <span className="block text-mist-700">{step.purpose}</span>
                    {step.rule && <span className="mt-0.5 block text-mist-500">{step.rule}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-2">
            <p className="text-adm-xs font-semibold text-mist-600">House rules</p>
            <ul className="grid gap-1.5">
              {guide.rules.map((rule) => (
                <li key={rule} className="flex gap-2 text-adm-base leading-relaxed text-mist-700">
                  <Icon name="check" className="mt-1 size-3.5 shrink-0 text-mist-400" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-lg bg-mist-50 p-3 text-adm-base leading-relaxed text-mist-700 ring-1 ring-inset ring-mist-200">
            <strong className="font-semibold text-navy-900">Sign-off. </strong>
            {guide.signoff}
          </p>

          <div>
            <Button variant="secondary" icon="layers" onClick={onInsertTemplate} disabled={!bodyIsEmpty} className="w-full">
              Start from this structure
            </Button>
            {!bodyIsEmpty && <p className="mt-1.5 text-center text-adm-xs text-mist-500">The body already has text. Clear it to use the template.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
