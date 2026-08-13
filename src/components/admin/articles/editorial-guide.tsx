"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ArticleKind } from "@/lib/aws/dynamodb";
import { editorialGuide } from "@/lib/editorial";
import { ARTICLE_KIND_CONFIG } from "@/lib/articles";
import { AdminCard } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconBook } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * The house style for this kind, beside the field it applies to.
 *
 * A style guide in a shared doc is a style guide nobody opens, so the rules
 * that decide whether a piece reads as written by people who do the work sit in
 * the editor instead: the sections in order, the conventions with the failure
 * each prevents, and a headline in the right shape next to one in the wrong
 * shape. Collapsed by default, an author who knows the form should not have to
 * scroll past it every time.
 */
export function EditorialGuide({
  kind,
  onInsertTemplate,
  bodyIsEmpty,
}: {
  kind: ArticleKind;
  /** Drops the skeleton into the body field. */
  onInsertTemplate: () => void;
  /** Offering to overwrite work already done is how you lose a draft. */
  bodyIsEmpty: boolean;
}) {
  const guide = editorialGuide(kind);
  const config = ARTICLE_KIND_CONFIG[kind];
  const [open, setOpen] = useState(false);

  return (
    <AdminCard>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-6 py-4 text-left transition-colors hover:bg-[var(--adm-row-hover)]"
      >
        <IconBook className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-[var(--adm-ink)]">
            How we write a {config.noun}
          </span>
          <span className="block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">
            {guide.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 flex-none text-[var(--adm-ink-subtle)] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div className="space-y-5 border-t border-[var(--adm-line)] px-6 py-5">
          <p className="text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">{guide.premise}</p>

          {/* Headline shapes. The single most useful thing in a style guide is
              a right answer beside a wrong one, an abstract rule about
              "specificity" changes nobody's draft. */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
              Headline
            </p>
            <p className="rounded-[8px] border border-[var(--adm-success)]/30 bg-[var(--adm-success-soft)] px-3 py-2 text-[13px] font-medium text-[var(--adm-ink)]">
              {guide.headline.good}
            </p>
            <p className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3 py-2 text-[13px] text-[var(--adm-ink-subtle)] line-through decoration-[var(--adm-danger)]/50">
              {guide.headline.bad}
            </p>
            <p className="text-[12.5px] leading-relaxed text-[var(--adm-ink-subtle)]">
              {guide.headline.why}
            </p>
          </div>

          {/* Structure */}
          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
              The shape of a finished one
            </p>
            <ol className="space-y-2.5">
              {guide.structure.map((step, i) => (
                <li key={step.name} className="flex gap-2.5">
                  <span className="mt-px grid h-5 w-5 flex-none place-items-center rounded-full bg-[var(--adm-surface-2)] text-[11px] font-bold tabular-nums text-[var(--adm-ink-subtle)]">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-[var(--adm-ink)]">{step.name}</span>
                    <span className="block text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                      {step.purpose}
                    </span>
                    {step.rule && (
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-[var(--adm-ink-subtle)]">
                        {step.rule}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
              House rules
            </p>
            <ul className="space-y-1.5">
              {guide.rules.map((rule) => (
                <li key={rule} className="flex gap-2 text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--adm-ink-mute)]">
            <strong className="font-semibold text-[var(--adm-ink)]">Sign-off. </strong>
            {guide.signoff}
          </p>

          <WorkspaceButton
            onClick={onInsertTemplate}
            disabled={!bodyIsEmpty}
            title={bodyIsEmpty ? undefined : "The body already has content. Clear it first."}
            className="w-full justify-center"
          >
            Start from this structure
          </WorkspaceButton>
        </div>
      )}
    </AdminCard>
  );
}
