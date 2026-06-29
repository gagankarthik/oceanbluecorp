// Cross-app SSO bridge for the HR portal (hr.oceanbluecorp.com).
//
// The HR portal authenticates with AWS Amplify, which reads the Cognito session
// from cookies named `CognitoIdentityServiceProvider.<clientId>.<user>.*`. Both
// apps use the SAME Cognito User Pool and App Client, so if we mirror this site's
// tokens into those exact cookies on the shared parent domain
// (`.oceanbluecorp.com`), Amplify on the HR portal picks up the session with no
// second login. Clearing them on sign-out keeps the two apps in lockstep.

const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const SHARED_DOMAIN = '.oceanbluecorp.com';
const PREFIX = `CognitoIdentityServiceProvider.${CLIENT_ID}`;

/** Parent domain when on a *.oceanbluecorp.com host; host-only (e.g. localhost). */
function cookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname;
  return host === 'oceanbluecorp.com' || host.endsWith('.oceanbluecorp.com')
    ? SHARED_DOMAIN
    : undefined;
}

function setCookie(name: string, value: string, maxAgeDays = 30) {
  if (typeof document === 'undefined') return;
  const domain = cookieDomain();
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const expires = new Date(Date.now() + maxAgeDays * 86400_000).toUTCString();
  // JWTs and our other values are cookie-safe, but encode defensively to match
  // how Amplify's CookieStorage round-trips values.
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; SameSite=Lax` +
    `${domain ? `; Domain=${domain}` : ''}${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  const domain = cookieDomain();
  document.cookie =
    `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax` +
    `${domain ? `; Domain=${domain}` : ''}`;
}

/** Decode a JWT payload (base64url → JSON) without verifying — claims only. */
function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Amplify keys its session by the Cognito `username` from the access token —
 * exactly what we read here, so the cookie names match what Amplify expects.
 */
function usernameFrom(accessToken: string): string {
  const p = decodeJwt(accessToken);
  return String(p['username'] || p['sub'] || '');
}

type Tokens = { idToken: string; accessToken: string; refreshToken?: string };

/** Mirror the current session into the shared Amplify Cognito cookies. */
export function writeHrPortalSession({ idToken, accessToken, refreshToken }: Tokens) {
  if (!CLIENT_ID || !accessToken || !idToken) return;
  const username = usernameFrom(accessToken);
  if (!username) return;

  const userPrefix = `${PREFIX}.${username}`;
  setCookie(`${PREFIX}.LastAuthUser`, username);
  setCookie(`${userPrefix}.idToken`, idToken);
  setCookie(`${userPrefix}.accessToken`, accessToken);
  if (refreshToken) setCookie(`${userPrefix}.refreshToken`, refreshToken);
  setCookie(`${userPrefix}.clockDrift`, '0');
}

/** Remove the shared Amplify Cognito cookies (sign-out / session end). */
export function clearHrPortalSession(accessToken?: string) {
  if (!CLIENT_ID) return;
  const username = accessToken ? usernameFrom(accessToken) : '';
  // Try the LastAuthUser cookie value if we don't have a live access token.
  const resolved = username || readLastAuthUser();
  if (resolved) {
    const userPrefix = `${PREFIX}.${resolved}`;
    ['idToken', 'accessToken', 'refreshToken', 'clockDrift'].forEach((k) =>
      deleteCookie(`${userPrefix}.${k}`),
    );
  }
  deleteCookie(`${PREFIX}.LastAuthUser`);
}

function readLastAuthUser(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${PREFIX}.LastAuthUser=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : '';
}
