// Who sees which notification, and per-user read/dismiss state.
//
// Pure: no AWS, no React. The API filters every response through this, so the
// payload itself carries only what the caller's roles may see; hiding in the UI
// alone would still ship "Jane Doe applied for X" to a Media account.
import { UserRole, RECRUITING_ROLES, staffRolesOf } from "@/lib/auth/config";

export const NOTIFICATION_TYPES = ["job_posted", "application_received", "contact_received"] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_AUDIENCE: Readonly<Record<NotificationType, readonly UserRole[]>> = {
  // A posting is public copy; everyone who works on the site may hear about it.
  job_posted: [...RECRUITING_ROLES, UserRole.MEDIA],
  // Names the applicant, so it is recruiting data.
  application_received: RECRUITING_ROLES,
  // Mirrors the contacts inbox (requireUserAdmin).
  contact_received: [UserRole.ADMIN, UserRole.HR],
};

// A type added later without an entry above stays with admins until it is named.
const UNKNOWN_TYPE_AUDIENCE: readonly UserRole[] = [UserRole.ADMIN];

export function isNotificationType(type: unknown): type is NotificationType {
  return typeof type === "string" && (NOTIFICATION_TYPES as readonly string[]).includes(type);
}

export function audienceFor(type: unknown): readonly UserRole[] {
  return isNotificationType(type) ? NOTIFICATION_AUDIENCE[type] : UNKNOWN_TYPE_AUDIENCE;
}

export function canSeeNotificationType(type: unknown, roles: readonly UserRole[]): boolean {
  const audience = audienceFor(type);
  return roles.some((r) => audience.includes(r));
}

/** A stored notification as read back from DynamoDB. */
export interface NotificationRecord {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  /** Legacy global flag; `true` counts as read for everyone. */
  isRead?: boolean;
  /** Cognito subs. A DynamoDB string set, so the DocumentClient hands back a Set. */
  readBy?: Iterable<string>;
  dismissedBy?: Iterable<string>;
  createdAt: string;
}

/** What a caller receives: their own read state, nobody else's ids. */
export interface NotificationView {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationViewer {
  userId: string;
  groups: ReadonlyArray<string> | null | undefined;
}

function includesUser(ids: unknown, userId: string): boolean {
  if (!userId || ids == null) return false;
  if (ids instanceof Set) return ids.has(userId);
  if (Array.isArray(ids)) return ids.includes(userId);
  return false;
}

export function isReadBy(n: NotificationRecord, userId: string): boolean {
  return n.isRead === true || includesUser(n.readBy, userId);
}

export function isDismissedBy(n: NotificationRecord, userId: string): boolean {
  return includesUser(n.dismissedBy, userId);
}

export function toNotificationView(n: NotificationRecord, userId: string): NotificationView {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    ...(n.link ? { link: n.link } : {}),
    ...(n.relatedId ? { relatedId: n.relatedId } : {}),
    isRead: isReadBy(n, userId),
    createdAt: n.createdAt,
  };
}

/** Role-visible, not dismissed by this viewer, projected to their view. Order kept. */
export function notificationsFor(
  items: readonly NotificationRecord[],
  viewer: NotificationViewer,
): NotificationView[] {
  const roles = staffRolesOf(viewer.groups);
  if (roles.length === 0) return [];
  return items
    .filter((n) => canSeeNotificationType(n.type, roles) && !isDismissedBy(n, viewer.userId))
    .map((n) => toNotificationView(n, viewer.userId));
}
