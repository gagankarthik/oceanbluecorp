"use client";

// Typed readers for the console's shared lists. Every screen reading one of
// these keys shares one request and one copy; a write calls the matching
// refresh* so every reader updates.

import type { Application, Job } from "@/lib/aws/dynamodb";
import { mutate, useResource } from "./use-resource";

export const JOBS_KEY = "/api/jobs?fields=summary";
export const APPLICATIONS_KEY = "/api/applications?fields=summary";
export const BENCH_KEY = "/api/applications?bench=1&fields=summary";
export const USERS_KEY = "/api/users";
export const MY_TASKS_KEY = "/api/tasks?scope=mine&open=1";

/** A row of /api/users, as the client sees it. */
export interface DirectoryUser {
  id: string;
  sub?: string;
  email: string;
  name: string;
  role: string | null;
  status?: "active" | "inactive" | "pending";
}

export function useJobSummaries(enabled = true) {
  const r = useResource<{ jobs?: Job[] }>(enabled ? JOBS_KEY : null);
  return { ...r, jobs: r.data?.jobs };
}

export function useApplicationSummaries({ bench = false, enabled = true } = {}) {
  const r = useResource<{ applications?: Application[] }>(enabled ? (bench ? BENCH_KEY : APPLICATIONS_KEY) : null);
  return { ...r, applications: r.data?.applications };
}

/** The staff directory. `enabled` false for roles the route answers 403. */
export function useUserDirectory(enabled = true) {
  const r = useResource<{ users?: DirectoryUser[] }>(enabled ? USERS_KEY : null, { freshMs: 5 * 60_000 });
  return { ...r, users: r.data?.users };
}

export const refreshApplications = () => mutate((k) => k.startsWith("/api/applications"));
export const refreshJobs = () => mutate((k) => k.startsWith("/api/jobs"));
export const refreshTasks = () => mutate((k) => k.startsWith("/api/tasks"));
