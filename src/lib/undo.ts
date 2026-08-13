import { toast } from "sonner";

/* ============================================================
   Undo for reversible mutations.

   The admin app defends destructive actions with confirm
   dialogs and nothing else. A confirm is a poor instrument: it
   interrupts EVERY invocation including the ninety-nine correct
   ones, and because it interrupts every one, people learn to
   dismiss it without reading, so the single time it mattered is
   the time it gets clicked through. It taxes the common case to
   half-protect the rare one.

   An undo inverts that. The action happens immediately, nobody
   is interrupted, and the rare mistake is recoverable for as
   long as the toast is up. That is Nielsen's "user control and
   freedom" and Shneiderman's "permit easy reversal of actions",
   and it is strictly better wherever the action CAN be undone.

   ── Where this does NOT apply ───────────────────────────────
   Anything genuinely irreversible keeps its ConfirmDialog.
   Deleting a candidate removes the row from DynamoDB; there is
   nothing to put back, so offering "Undo" there would be a lie.
   Undo is for state changes with a known inverse: a stage move,
   a bench add/remove, an ownership claim, an account
   deactivation.
   ============================================================ */

/** How long the offer stays up. Long enough to notice and react, short enough
 *  that the toast is not still there when you have moved on. */
const UNDO_MS = 8000;

export type UndoableOptions = {
  /** Past tense, states what happened: "Removed from Talent Bench". */
  message: string;
  /** Runs immediately. Should already have succeeded before `undoable` is called. */
  undo: () => Promise<unknown>;
  /** Shown if the undo itself fails. */
  undoErrorMessage?: string;
  /** Called after a successful undo, to re-sync local state. */
  onUndone?: () => void;
};

/**
 * Announce a completed, reversible action and offer to reverse it.
 *
 * Call AFTER the mutation has succeeded, this reports, it does not perform.
 * Reporting an action that has not landed yet is how an undo offer appears for
 * something that then fails, leaving the user to reverse a change that never
 * happened.
 */
export function undoable({ message, undo, undoErrorMessage, onUndone }: UndoableOptions): void {
  let running = false;

  toast.success(message, {
    duration: UNDO_MS,
    action: {
      label: "Undo",
      onClick: () => {
        // The toast can fire its action more than once if clicked quickly;
        // reversing twice would re-apply the original change.
        if (running) return;
        running = true;
        const id = toast.loading("Undoing…");
        undo()
          .then(() => {
            toast.success("Undone", { id });
            onUndone?.();
          })
          .catch(() => {
            toast.error(undoErrorMessage || "Couldn't undo that, the change is still applied.", { id });
          });
      },
    },
  });
}
