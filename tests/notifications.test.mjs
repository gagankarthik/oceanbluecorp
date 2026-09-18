// Who receives which notification. A regression here is silent: the bell looks
// the same either way, and the leak ("Jane Doe applied for X" to Media) is in
// the payload.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  NOTIFICATION_TYPES,
  audienceFor,
  canSeeNotificationType,
  isReadBy,
  isDismissedBy,
  toNotificationView,
  notificationsFor,
} = load("src/lib/notifications.ts");
const { UserRole } = load("src/lib/auth/config.ts");

const ALL = [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES, UserRole.MEDIA];
const seers = (type) => ALL.filter((r) => canSeeNotificationType(type, [r]));

const note = (over = {}) => ({
  id: "n1",
  type: "job_posted",
  title: "New Job Posted",
  message: "Engineer in Columbus",
  isRead: false,
  createdAt: "2026-09-18T10:00:00.000Z",
  ...over,
});

describe("audience by type", () => {
  test("applications go to the recruiting roles, never media", () => {
    assert.deepEqual(seers("application_received"), [UserRole.ADMIN, UserRole.HR, UserRole.RECRUITER, UserRole.SALES]);
  });

  test("contact submissions mirror the contacts inbox: admin and hr", () => {
    assert.deepEqual(seers("contact_received"), [UserRole.ADMIN, UserRole.HR]);
  });

  test("job postings reach every staff role, media included", () => {
    assert.deepEqual(seers("job_posted"), ALL);
  });

  test("an unknown type fails closed to admins", () => {
    assert.deepEqual(seers("payroll_run"), [UserRole.ADMIN]);
    assert.deepEqual(audienceFor(undefined), [UserRole.ADMIN]);
    assert.deepEqual(audienceFor("constructor"), [UserRole.ADMIN]);
  });

  test("every declared type has an explicit audience", () => {
    for (const t of NOTIFICATION_TYPES) assert.ok(audienceFor(t).length > 0, t);
  });

  test("no roles sees nothing", () => {
    for (const t of NOTIFICATION_TYPES) assert.equal(canSeeNotificationType(t, []), false, t);
  });

  test("any held role is enough", () => {
    assert.equal(canSeeNotificationType("application_received", [UserRole.MEDIA, UserRole.SALES]), true);
  });
});

describe("per-user read state", () => {
  test("legacy isRead: true stays read for everyone", () => {
    assert.equal(isReadBy(note({ isRead: true }), "u-anyone"), true);
  });

  test("readBy is per user, as an array or a DynamoDB string set", () => {
    assert.equal(isReadBy(note({ readBy: ["u-a"] }), "u-a"), true);
    assert.equal(isReadBy(note({ readBy: ["u-a"] }), "u-b"), false);
    assert.equal(isReadBy(note({ readBy: new Set(["u-b"]) }), "u-b"), true);
  });

  test("an empty user id never matches", () => {
    assert.equal(isReadBy(note({ readBy: [""] }), ""), false);
    assert.equal(isDismissedBy(note({ dismissedBy: new Set([""]) }), ""), false);
  });

  test("the view carries the caller's read state and nobody's ids", () => {
    const view = toNotificationView(note({ readBy: new Set(["u-a"]), dismissedBy: ["u-c"] }), "u-a");
    assert.equal(view.isRead, true);
    assert.equal("readBy" in view, false);
    assert.equal("dismissedBy" in view, false);
  });
});

describe("notificationsFor", () => {
  const items = [
    note({ id: "job", type: "job_posted" }),
    note({ id: "app", type: "application_received", message: "Jane Doe applied for Engineer" }),
    note({ id: "contact", type: "contact_received" }),
    note({ id: "future", type: "payroll_run" }),
    note({ id: "gone", type: "job_posted", dismissedBy: new Set(["u-media"]) }),
  ];
  const ids = (viewer) => notificationsFor(items, viewer).map((n) => n.id);

  test("media sees postings only, minus what it dismissed", () => {
    assert.deepEqual(ids({ userId: "u-media", groups: ["web:media"] }), ["job"]);
  });

  test("a recruiter sees postings and applications", () => {
    assert.deepEqual(ids({ userId: "u-rec", groups: ["web:recruiter"] }), ["job", "app", "gone"]);
  });

  test("hr adds contacts; admin adds unknown types", () => {
    assert.deepEqual(ids({ userId: "u-hr", groups: ["web:hr"] }), ["job", "app", "contact", "gone"]);
    assert.deepEqual(ids({ userId: "u-admin", groups: ["web:admin"] }), ["job", "app", "contact", "future", "gone"]);
  });

  test("dismissal is per user", () => {
    assert.ok(ids({ userId: "u-other-media", groups: ["web:media"] }).includes("gone"));
  });

  test("a group from another app grants nothing", () => {
    assert.deepEqual(ids({ userId: "u-x", groups: ["hr:admin"] }), []);
    assert.deepEqual(ids({ userId: "u-x", groups: [] }), []);
  });
});
