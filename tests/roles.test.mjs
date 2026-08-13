// Role boundaries. The Media role is the reason these exist: it is the first
// account on this site that must NOT see candidates, so "is staff" and "may
// see recruiting data" stopped being the same sentence. A regression here does
// not throw or fail a build, it quietly hands over the candidate database.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { load } from "./load.mjs";

const {
  UserRole,
  RECRUITING_ROLES,
  PUBLISHING_ROLES,
  JOB_EDIT_ROLES,
  hasStaffAccess,
  hasRecruitingAccess,
  hasPublishingAccess,
  canEditJobs,
  landingRouteFor,
  normalizeStaffRole,
  staffRolesOf,
  highestStaffRole,
  routeAccess,
} = load("src/lib/auth/config.ts");

/** Cognito writes namespaced groups; tests use the real shape. */
const g = (role) => [`web:${role}`];

describe("media is a real account", () => {
  test("web:media resolves to the media role", () => {
    assert.equal(normalizeStaffRole("web:media"), UserRole.MEDIA);
    assert.deepEqual(staffRolesOf(g("media")), [UserRole.MEDIA]);
    assert.equal(highestStaffRole(g("media")), UserRole.MEDIA);
  });

  test("a legacy unprefixed group still works", () => {
    assert.equal(normalizeStaffRole("media"), UserRole.MEDIA);
  });

  test("another application's namespace still grants nothing", () => {
    assert.equal(normalizeStaffRole("hr:media"), null);
    assert.equal(hasStaffAccess(["hr:media"]), false);
  });

  test("media may sign in and hold a profile", () => {
    // If this were false the account could authenticate and then be told it has
    // no role, which is how the pool reports a person who does not belong here.
    assert.equal(hasStaffAccess(g("media")), true);
  });
});

describe("media cannot reach recruiting data", () => {
  test("hasRecruitingAccess is false for media", () => {
    // requireStaff guards ~40 routes: candidates, applications, resumes,
    // pipeline, clients, vendors, contacts, job writes. This one assertion is
    // what keeps all of them shut.
    assert.equal(hasRecruitingAccess(g("media")), false);
  });

  test("every other role still passes it", () => {
    for (const role of ["admin", "hr", "recruiter", "sales"]) {
      assert.equal(hasRecruitingAccess(g(role)), true, `${role} lost recruiting access`);
    }
  });

  test("media is absent from RECRUITING_ROLES", () => {
    assert.equal(RECRUITING_ROLES.includes(UserRole.MEDIA), false);
    assert.equal(RECRUITING_ROLES.length, 4);
  });

  test("an account with both groups is judged on the recruiting one", () => {
    assert.equal(hasRecruitingAccess([...g("media"), ...g("hr")]), true);
  });
});

describe("publishing access", () => {
  test("admin, hr and media publish; recruiter and sales do not", () => {
    assert.equal(hasPublishingAccess(g("admin")), true);
    assert.equal(hasPublishingAccess(g("hr")), true);
    assert.equal(hasPublishingAccess(g("media")), true);
    assert.equal(hasPublishingAccess(g("recruiter")), false);
    assert.equal(hasPublishingAccess(g("sales")), false);
  });

  test("anonymous callers publish nothing", () => {
    assert.equal(hasPublishingAccess(null), false);
    assert.equal(hasPublishingAccess([]), false);
    assert.equal(hasRecruitingAccess(undefined), false);
  });
});

describe("job editing", () => {
  test("recruiter and media read postings without editing them", () => {
    assert.equal(canEditJobs(UserRole.RECRUITER), false);
    assert.equal(canEditJobs(UserRole.MEDIA), false);
  });

  test("admin, hr and sales edit them", () => {
    assert.equal(canEditJobs(UserRole.ADMIN), true);
    assert.equal(canEditJobs(UserRole.HR), true);
    assert.equal(canEditJobs(UserRole.SALES), true);
  });

  test("no role at all edits nothing", () => {
    assert.equal(canEditJobs(null), false);
    assert.equal(canEditJobs(undefined), false);
  });

  test("JOB_EDIT_ROLES is a subset of the recruiting roles", () => {
    assert.ok(JOB_EDIT_ROLES.every((r) => RECRUITING_ROLES.includes(r)));
  });
});

describe("routeAccess for media", () => {
  const allows = (path, role) => (routeAccess[path] || []).includes(role);

  test("media reaches exactly the publishing sections plus job postings", () => {
    for (const path of [
      "/admin/blog", "/admin/case-studies", "/admin/customer-stories",
      "/admin/news", "/admin/jobs",
    ]) {
      assert.equal(allows(path, UserRole.MEDIA), true, `media should reach ${path}`);
    }
  });

  test("media reaches its own settings, help and notifications", () => {
    for (const path of ["/admin/settings", "/admin/help", "/admin/notifications"]) {
      assert.equal(allows(path, UserRole.MEDIA), true, `media should reach ${path}`);
    }
  });

  test("media reaches NOTHING that carries recruiting or commercial data", () => {
    for (const path of [
      "/admin",                 // the dashboard is a recruiting report
      "/admin/applications", "/admin/candidates", "/admin/bench",
      "/admin/resumes", "/admin/lead-sourcing",
      "/admin/contacts", "/admin/clients", "/admin/vendors",
      "/admin/users", "/admin/roles", "/admin/api-keys", "/admin/content",
      "/admin/docs", "/hr",
    ]) {
      assert.equal(allows(path, UserRole.MEDIA), false, `media must NOT reach ${path}`);
    }
  });

  test("adding media did not widen anything for the other roles", () => {
    // The four recruiting roles must see exactly what they saw before.
    assert.deepEqual(routeAccess["/admin"], RECRUITING_ROLES);
    assert.equal(routeAccess["/admin/content"].length, 1);
    assert.deepEqual(routeAccess["/admin/clients"], [UserRole.ADMIN, UserRole.HR]);
    assert.equal(routeAccess["/admin/applications"].includes(UserRole.MEDIA), false);
  });

  test("the publishing routes and PUBLISHING_ROLES are the same set", () => {
    // The UI gate and the API gate (requirePublisher) must not drift.
    for (const path of ["/admin/blog", "/admin/case-studies", "/admin/customer-stories", "/admin/news"]) {
      assert.deepEqual([...routeAccess[path]].sort(), [...PUBLISHING_ROLES].sort(), path);
    }
  });
});

describe("landingRouteFor", () => {
  test("media lands on its own workspace, not the denied dashboard", () => {
    assert.equal(landingRouteFor(UserRole.MEDIA), "/admin/blog");
    assert.ok((routeAccess[landingRouteFor(UserRole.MEDIA)] || []).includes(UserRole.MEDIA));
  });

  test("every other role still lands on the dashboard", () => {
    for (const role of RECRUITING_ROLES) {
      assert.equal(landingRouteFor(role), "/admin");
    }
    assert.equal(landingRouteFor(null), "/admin");
  });
});
