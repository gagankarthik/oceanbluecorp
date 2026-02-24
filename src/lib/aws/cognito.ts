import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminGetUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminDeleteUserCommand,
  ListGroupsCommand,
} from "@aws-sdk/client-cognito-identity-provider";

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
const createCognitoClient = () => {
  const config = getConfig();
  return new CognitoIdentityProviderClient({
    region: config.region,
    credentials: config.credentials,
  });
};

export interface CognitoUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  status: "active" | "inactive" | "pending";
  role: "admin" | "hr" | "user";
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

// Get user role from groups
const getRoleFromGroups = (groups: string[]): "admin" | "hr" | "user" => {
  if (groups.includes("admin")) return "admin";
  if (groups.includes("hr")) return "hr";
  return "user";
};

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

    const response = await client.send(command);

    // Get groups for each user
    const usersWithGroups = await Promise.all(
      (response.Users || []).map(async (user) => {
        const username = user.Username || "";
        const groups = await getUserGroups(username);

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
      error: error instanceof Error ? error.message : "Failed to list users",
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

// Add user to a group
export async function addUserToGroup(username: string, groupName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getConfig();
    const client = createCognitoClient();

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

// Update user role (manages groups)
export async function updateUserRole(username: string, newRole: "admin" | "hr" | "user"): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current groups
    const currentGroups = await getUserGroups(username);

    // Role groups
    const roleGroups = ["admin", "hr"];

    // Remove from all role groups first
    for (const group of roleGroups) {
      if (currentGroups.includes(group)) {
        const result = await removeUserFromGroup(username, group);
        if (!result.success) {
          return result;
        }
      }
    }

    // Add to new role group (if not 'user' - user is the default with no group)
    if (newRole !== "user") {
      const result = await addUserToGroup(username, newRole);
      if (!result.success) {
        return result;
      }
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
