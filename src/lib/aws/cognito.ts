import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  ListGroupsCommand,
  ListUsersInGroupCommand,
  CreateGroupCommand,
  InitiateAuthCommand,
  ChangePasswordCommand,
  RevokeTokenCommand,
} from "@aws-sdk/client-cognito-identity-provider";

import { groupNameForRole, highestStaffRole, normalizeStaffRole } from "@/lib/auth/config";
import { classifyPasswordChangeError, type PasswordChangeFailure } from "@/lib/password-change";

// Assignable staff roles. There is no public "user" role, every account is
// created by an admin and belongs to exactly one of these groups.
export type StaffRole = "admin" | "hr" | "recruiter" | "sales" | "media";
export const STAFF_ROLES: StaffRole[] = ["admin", "hr", "recruiter", "sales", "media"];

// Get configuration at runtime
const getConfig = () => ({
  region: process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.NEXT_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.NEXT_AWS_SECRET_ACCESS_KEY || "",
  },
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "",
});

// Create Cognito client
// One client per credential set, reused across calls.
let cachedClient: { key: string; client: CognitoIdentityProviderClient } | null = null;

const createCognitoClient = () => {
  const config = getConfig();
  const key = [config.region, config.credentials.accessKeyId, config.credentials.secretAccessKey].join("|");
  if (cachedClient?.key === key) return cachedClient.client;
  const client = new CognitoIdentityProviderClient({
    region: config.region,
    credentials: config.credentials,
  });
  cachedClient = { key, client };
  return client;
};

/**
 * Username → group names for the whole pool, one ListUsersInGroup per group.
 * Replaces an AdminListGroupsForUser call per user, which was an N+1 and runs
 * into that API's low rate limit as the team grows.
 */
async function groupsByUsername(): Promise<Map<string, string[]>> {
  const config = getConfig();
  const client = createCognitoClient();

  const groupNames: string[] = [];
  let groupToken: string | undefined;
  do {
    const res = await client.send(new ListGroupsCommand({ UserPoolId: config.userPoolId, Limit: 60, NextToken: groupToken }));
    for (const g of res.Groups ?? []) if (g.GroupName) groupNames.push(g.GroupName);
    groupToken = res.NextToken;
  } while (groupToken);

  const map = new Map<string, string[]>();
  await Promise.all(groupNames.map(async (GroupName) => {
    let token: string | undefined;
    do {
      const res = await client.send(new ListUsersInGroupCommand({ UserPoolId: config.userPoolId, GroupName, Limit: 60, NextToken: token }));
      for (const u of res.Users ?? []) {
        if (!u.Username) continue;
        const list = map.get(u.Username) ?? [];
        list.push(GroupName);
        map.set(u.Username, list);
      }
      token = res.NextToken;
    } while (token);
  }));
  return map;
}

export interface CognitoUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: "active" | "inactive" | "pending";
  role: StaffRole | null;
  groups: string[];
  createdAt: string;
  lastModified?: string;
  enabled: boolean;
}

// Map Cognito user status to our status
const mapUserStatus = (cognitoStatus: string | undefined, enabled: boolean): "active" | "inactive" | "pending" => {
  if (!enabled) return "inactive";
  switch (cognitoStatus) {
    case "CONFIRMED":
      return "active";
    case "UNCONFIRMED":
    case "FORCE_CHANGE_PASSWORD":
      return "pending";
    default:
      return "inactive";
  }
};

// Get user role from groups. null when the account belongs to no staff group of
// THIS site: groups are namespaced per application, so `web:hr` and the legacy
// bare `hr` both count while an HR-portal group such as `hr:employee` does not.
const getRoleFromGroups = (groups: string[]): StaffRole | null =>
  (highestStaffRole(groups) as StaffRole | null) ?? null;

// List all users from Cognito
export async function listCognitoUsers(options?: {
  limit?: number;
  paginationToken?: string;
  filter?: string;
}): Promise<{ success: boolean; users?: CognitoUser[]; nextToken?: string; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new ListUsersCommand({
      UserPoolId: config.userPoolId,
      Limit: options?.limit || 60,
      PaginationToken: options?.paginationToken,
      Filter: options?.filter,
    });

    const [response, membership] = await Promise.all([
      client.send(command),
      groupsByUsername().catch((error) => {
        console.error("Error listing group membership, falling back per user:", error);
        return null;
      }),
    ]);

    const usersWithGroups = await Promise.all(
      (response.Users || []).map(async (user) => {
        const username = user.Username || "";
        const groups = membership ? membership.get(username) ?? [] : await getUserGroups(username);

        // Extract attributes
        const attrs = user.Attributes || [];
        const email = attrs.find((a) => a.Name === "email")?.Value || "";
        const name = attrs.find((a) => a.Name === "name")?.Value ||
                     attrs.find((a) => a.Name === "given_name")?.Value ||
                     email.split("@")[0];
        const phone = attrs.find((a) => a.Name === "phone_number")?.Value;

        const cognitoUser: CognitoUser = {
          id: user.Username || "",
          email,
          name,
          phone,
          status: mapUserStatus(user.UserStatus, user.Enabled !== false),
          role: getRoleFromGroups(groups),
          groups,
          createdAt: user.UserCreateDate?.toISOString() || new Date().toISOString(),
          lastModified: user.UserLastModifiedDate?.toISOString(),
          enabled: user.Enabled !== false,
        };

        return cognitoUser;
      })
    );

    return {
      success: true,
      users: usersWithGroups,
      nextToken: response.PaginationToken,
    };
  } catch (error) {
    console.error("Error listing Cognito users:", error);
    return {
      success: false,
      error: "Couldn't load the team list. Please try again.",
    };
  }
}

// Get groups for a user
export async function getUserGroups(username: string): Promise<string[]> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminListGroupsForUserCommand({
      UserPoolId: config.userPoolId,
      Username: username,
    });

    const response = await client.send(command);
    return (response.Groups || []).map((g) => g.GroupName || "").filter(Boolean);
  } catch (error) {
    console.error("Error getting user groups:", error);
    return [];
  }
}

// Get a single user by username
export async function getCognitoUser(username: string): Promise<{ success: boolean; user?: CognitoUser; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminGetUserCommand({
      UserPoolId: config.userPoolId,
      Username: username,
    });

    const response = await client.send(command);
    const groups = await getUserGroups(username);

    const attrs = response.UserAttributes || [];
    const email = attrs.find((a) => a.Name === "email")?.Value || "";
    const name = attrs.find((a) => a.Name === "name")?.Value ||
                 attrs.find((a) => a.Name === "given_name")?.Value ||
                 email.split("@")[0];
    const phone = attrs.find((a) => a.Name === "phone_number")?.Value;

    const user: CognitoUser = {
      id: username,
      email,
      name,
      phone,
      status: mapUserStatus(response.UserStatus, response.Enabled !== false),
      role: getRoleFromGroups(groups),
      groups,
      createdAt: response.UserCreateDate?.toISOString() || new Date().toISOString(),
      lastModified: response.UserLastModifiedDate?.toISOString(),
      enabled: response.Enabled !== false,
    };

    return { success: true, user };
  } catch (error) {
    console.error("Error getting Cognito user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get user",
    };
  }
}

const errorName = (error: unknown): string => (error as { name?: string })?.name ?? "";

const jwtSub = (token: string): string | undefined => {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    return typeof payload?.sub === "string" ? payload.sub : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Change a signed-in user's password.
 *
 * The session cookie holds an ID token, and ChangePassword wants an access
 * token, so the current password is verified by signing in again (the same
 * USER_PASSWORD_AUTH flow as /api/auth/signin) and the access token that
 * returns is used once and discarded. No token from the browser is involved.
 * `expectedSub` guards against the identifier resolving to another account.
 */
export async function changeOwnPassword(input: {
  username: string;
  expectedSub: string;
  currentPassword: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string; reason?: PasswordChangeFailure }> {
  const client = createCognitoClient();
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

  let accessToken: string;
  let refreshToken: string | undefined;
  try {
    const auth = await client.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: { USERNAME: input.username, PASSWORD: input.currentPassword },
      }),
    );
    if (auth.ChallengeName) {
      const reason = auth.ChallengeName === "NEW_PASSWORD_REQUIRED" ? "new-password-required" : "mfa-required";
      return { success: false, error: `Challenge ${auth.ChallengeName}`, reason };
    }
    const result = auth.AuthenticationResult;
    if (!result?.AccessToken) return { success: false, error: "No access token issued", reason: "unavailable" };
    if (jwtSub(result.AccessToken) !== input.expectedSub) {
      return { success: false, error: "Signed-in account does not match the session", reason: "unavailable" };
    }
    accessToken = result.AccessToken;
    refreshToken = result.RefreshToken;
  } catch (error) {
    const reason = classifyPasswordChangeError("verify", errorName(error), (error as Error)?.message);
    if (reason === "unavailable") console.error("Password change: verify failed:", error);
    return { success: false, error: errorName(error) || "Verify failed", reason };
  }

  try {
    await client.send(
      new ChangePasswordCommand({
        AccessToken: accessToken,
        PreviousPassword: input.currentPassword,
        ProposedPassword: input.newPassword,
      }),
    );
    return { success: true };
  } catch (error) {
    const reason = classifyPasswordChangeError("change", errorName(error), (error as Error)?.message);
    if (reason === "unavailable") console.error("Password change: change failed:", error);
    return { success: false, error: errorName(error) || "Change failed", reason };
  } finally {
    // Nobody holds the refresh token this minted; don't leave it live.
    if (refreshToken && clientId) {
      await client.send(new RevokeTokenCommand({ Token: refreshToken, ClientId: clientId })).catch(() => {});
    }
  }
}

/**
 * Make sure a group exists before assigning it. The namespaced groups
 * (`web:admin` and friends) are new, so the first assignment would otherwise
 * fail with ResourceNotFound. Best-effort: an existing group throws and that is
 * exactly the case we want to ignore.
 */
async function ensureGroup(groupName: string): Promise<void> {
  try {
    const config = getConfig();
    const client = createCognitoClient();
    await client.send(
      new CreateGroupCommand({ UserPoolId: config.userPoolId, GroupName: groupName }),
    );
  } catch {
    // Group already exists, or we lack CreateGroup, the add below reports it.
  }
}

// Add user to a group
export async function addUserToGroup(username: string, groupName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    await ensureGroup(groupName);

    const command = new AdminAddUserToGroupCommand({
      UserPoolId: config.userPoolId,
      Username: username,
      GroupName: groupName,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error adding user to group:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add user to group",
    };
  }
}

// Remove user from a group
export async function removeUserFromGroup(username: string, groupName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminRemoveUserFromGroupCommand({
      UserPoolId: config.userPoolId,
      Username: username,
      GroupName: groupName,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error removing user from group:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove user from group",
    };
  }
}

/**
 * Update a user's role on THIS site.
 *
 * Writes the namespaced group (`web:hr`) and clears every other group that
 * would grant a role here, legacy bare names included. Clearing the legacy ones
 * matters: reads accept both shapes, so leaving an old bare `admin` behind would
 * make a demotion no demotion at all.
 *
 * Groups belonging to another application (`hr:*`) are left strictly alone,
 * this site does not manage the HR portal's access.
 */
export async function updateUserRole(username: string, newRole: StaffRole): Promise<{ success: boolean; error?: string }> {
  try {
    const target = groupNameForRole(newRole);
    const currentGroups = await getUserGroups(username);

    // Every other group that grants a role on this site has to go.
    const stale = currentGroups.filter((g) => g !== target && normalizeStaffRole(g) !== null);
    for (const group of stale) {
      const result = await removeUserFromGroup(username, group);
      if (!result.success) {
        return result;
      }
    }

    // Add to the new role group
    const result = await addUserToGroup(username, target);
    if (!result.success) {
      return result;
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user role",
    };
  }
}

// Invite a new staff member: create the Cognito account with a temporary
// password (Cognito emails the invite containing the email + temp password)
// and assign their role group. On first sign-in they're forced to set a
// permanent password and provide their name + phone.
export async function inviteUser(
  email: string,
  role: StaffRole
): Promise<{ success: boolean; error?: string; code?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    // MessageAction is omitted so Cognito sends its default invitation email.
    // TemporaryPassword is omitted so Cognito generates and emails one.
    const created = await client.send(
      new AdminCreateUserCommand({
        UserPoolId: config.userPoolId,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        DesiredDeliveryMediums: ["EMAIL"],
      })
    );

    // Use the username Cognito assigned (the pool may use a UUID username with
    // email as an alias) so the group assignment targets the right account.
    const username = created.User?.Username || email;
    // Namespaced group, so this account is staff HERE and nowhere else.
    const roleResult = await addUserToGroup(username, groupNameForRole(role));
    if (!roleResult.success) {
      return roleResult;
    }

    return { success: true };
  } catch (error) {
    console.error("Error inviting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite user",
      // The SDK error name, so the route can map it; the message is not stable.
      code: errorName(error),
    };
  }
}

// Disable a user
export async function disableUser(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminDisableUserCommand({
      UserPoolId: config.userPoolId,
      Username: username,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error disabling user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to disable user",
    };
  }
}

// Enable a user
export async function enableUser(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminEnableUserCommand({
      UserPoolId: config.userPoolId,
      Username: username,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error enabling user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to enable user",
    };
  }
}

// Delete a user
export async function deleteUser(username: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminDeleteUserCommand({
      UserPoolId: config.userPoolId,
      Username: username,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

// Admin update user attributes (name, phone_number, etc.)
export async function updateCognitoUserAttributes(
  username: string,
  attributes: { Name: string; Value: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: config.userPoolId,
      Username: username,
      UserAttributes: attributes,
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error("Error updating user attributes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user attributes",
    };
  }
}

// List all groups in the user pool
export async function listGroups(): Promise<{ success: boolean; groups?: string[]; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

    const command = new ListGroupsCommand({
      UserPoolId: config.userPoolId,
    });

    const response = await client.send(command);
    const groups = (response.Groups || []).map((g) => g.GroupName || "").filter(Boolean);

    return { success: true, groups };
  } catch (error) {
    console.error("Error listing groups:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list groups",
    };
  }
}
