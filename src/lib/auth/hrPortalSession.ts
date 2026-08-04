// Legacy cleanup for the retired HR-portal SSO bridge.
//
// This site and the HR portal used to share one Cognito User Pool and one App
// Client, so signing in here mirrored the session into
// `CognitoIdentityServiceProvider.<clientId>.*` cookies on the shared parent
// domain (`.oceanbluecorp.com`) and the portal picked it up with no second
// login. That is gone: the HR portal now runs on its own user pool, holds its
// own accounts, and never shares an identity, a token or a cookie with this
// site. Placed workforce and candidates exist only over there.
//
// Nothing writes those cookies any more. All that remains is expiring the ones
// already sitting in returning users' browsers, which otherwise hold a live
// token for this pool on a domain no app reads until they age out.

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const SHARED_DOMAIN = '.oceanbluecorp.com';
const PREFIX = `CognitoIdentityServiceProvider.${CLIENT_ID}`;

function onSharedDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'oceanbluecorp.com' || host.endsWith(SHARED_DOMAIN);
}

/**
 * Expire every shared-domain Cognito cookie this site used to mirror for the HR
 * portal. Idempotent, safe to call on every load, and a no-op off the
 * oceanbluecorp.com domain (local dev never wrote them).
 *
 * Deletion has to repeat the exact Domain the cookie was set with, otherwise the
 * browser treats it as a different cookie and the original survives.
 */
export function clearLegacyHrPortalCookies() {
  if (typeof document === 'undefined' || !CLIENT_ID || !onSharedDomain()) return;

  try {
    const names = document.cookie
      .split('; ')
      .map((c) => c.split('=')[0])
      .filter((n) => n.startsWith(PREFIX));
    if (names.length === 0) return;

    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    new Set(names).forEach((name) => {
      document.cookie =
        `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; ` +
        `Domain=${SHARED_DOMAIN}; SameSite=Lax${secure}`;
    });
  } catch {
    /* noop */
  }
}
