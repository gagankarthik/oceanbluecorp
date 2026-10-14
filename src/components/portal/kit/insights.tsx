"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "./Button";
import { Drawer } from "./overlay";

const InSheet = createContext(false);

/** True inside InsightsSheet: charts stack in one column there */
export const useInSheet = () => useContext(InSheet);

/**
 * A page's charts live behind one header button and open in a side sheet,
 * so the table stays the page. Children stack; InsightsRow flattens inside.
 * Pass a function to get `close`, e.g. to shut the sheet after a chart filters the table.
 */
export function InsightsSheet({
  title = "Insights",
  description,
  children,
  open: openProp,
  onOpenChange,
}: {
  title?: string;
  description?: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  /** Controlled: the page opens it (e.g. from a header ⋯ menu) and no button renders */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (v: boolean) => (controlled ? onOpenChange?.(v) : setOpenState(v));
  const close = () => setOpen(false);
  return (
    <>
      {!controlled && (
        <Button variant="secondary" icon="chart" onClick={() => setOpen(true)}>
          Insights
        </Button>
      )}
      {open && (
        <Drawer title={title} width="lg" onClose={close}>
          <InSheet.Provider value={true}>
            {description && <p className="-mt-1 mb-5 text-adm-base text-mist-600">{description}</p>}
            <div className="grid gap-5 [&>*]:min-w-0">{typeof children === "function" ? children(close) : children}</div>
          </InSheet.Provider>
        </Drawer>
      )}
    </>
  );
}
