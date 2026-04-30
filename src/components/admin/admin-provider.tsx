"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { CommandPalette } from "./command-palette";

interface OpenEditOptions {
  candidate?: Application | null;
  mode?: "create" | "edit";
  defaultJobId?: string;
}

interface AdminContextValue {
  openCandidateEditor: (opts?: OpenEditOptions) => void;
  openCommandPalette: () => void;
  candidateRevision: number;
  setJobs: (jobs: Job[]) => void;
}

const AdminContext = React.createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const ctx = React.useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [revision, setRevision] = React.useState(0);
  const [jobs, setJobs] = React.useState<Job[]>([]);

  const openCandidateEditor = React.useCallback((opts: OpenEditOptions = {}) => {
    const isCreate = !opts.candidate && opts.mode !== "edit";
    if (isCreate) {
      const url = opts.defaultJobId
        ? `/admin/applications/new?jobId=${opts.defaultJobId}`
        : "/admin/applications/new";
      router.push(url);
      return;
    }
    // Edit mode — navigate to full-page edit form
    if (opts.candidate?.id) {
      router.push(`/admin/applications/${opts.candidate.id}/edit`);
    }
  }, [router]);

  const openCommandPalette = React.useCallback(() => setPaletteOpen(true), []);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        openCandidateEditor();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openCandidateEditor]);

  const value = React.useMemo<AdminContextValue>(
    () => ({ openCandidateEditor, openCommandPalette, candidateRevision: revision, setJobs }),
    [openCandidateEditor, openCommandPalette, revision],
  );

  return (
    <AdminContext.Provider value={value}>
      {children}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        userRole={user?.role}
        onCreateCandidate={() => {
          setPaletteOpen(false);
          openCandidateEditor();
        }}
      />
    </AdminContext.Provider>
  );
}
