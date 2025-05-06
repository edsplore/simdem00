import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { User, DecodedToken } from "../types/auth";
import apiClient from "./api/interceptors";

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_BACKEND_URL;

// Environment-specific URLs
const REFRESH_TOKEN_URL = `${UAM_API_URL}/uam/auth/tokens/access/refresh`;

class AuthService {
  private refreshTokenTimeout?: NodeJS.Timeout;
  private currentUser: User | null = null;
  private token: string | null = null;
  private currentWorkspaceId: string | null = null;
  private refreshAttempts: number = 0;
  private maxRefreshAttempts: number = 3;
  private refreshRetryDelay: number = 5000; // 5 seconds
  private refreshPromise: Promise<string> | null = null;
  private isRefreshingToken: boolean = false;

  async refreshToken(workspaceId?: string | null): Promise<string> {
    // If there's already a refresh in progress, return that promise instead of starting a new one
    if (this.refreshPromise) {
      console.log("Refresh already in progress, returning existing promise");
      return this.refreshPromise;
    }

    // Create a new refresh promise
    this.refreshPromise = this.doRefreshToken(workspaceId);

    // When the promise resolves or rejects, clear the stored promise
    this.refreshPromise.finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  private async doRefreshToken(workspaceId?: string | null): Promise<string> {
    try {
      console.log(
        `Refresh token attempt ${this.refreshAttempts + 1}/${
          this.maxRefreshAttempts
        }`
      );

      // Use the provided workspace ID or the stored one
      const effectiveWorkspaceId = workspaceId || this.currentWorkspaceId;
      console.log("Using workspace ID for refresh:", effectiveWorkspaceId);

      // const response = await axios.post(REFRESH_TOKEN_URL, "", {
      //   withCredentials: true, // This ensures cookies are sent with the request
      //   headers: {
      //     "Access-Control-Allow-Origin": "*",
      //     ...(effectiveWorkspaceId
      //       ? { "X-WORKSPACE-ID": effectiveWorkspaceId }
      //       : {}),
      //   },
      // });

      // console.log("Refresh token response:", {
      //   status: response.status,
      //   statusText: response.statusText,
      //   headers: response.headers,
      //   data: response.data,
      // });

      // const newToken = response.data;
      const newToken =
        "eyJhbGciOiJSUzI1NiJ9.eyJkaXZpc2lvbiI6IkV2ZXJBSSBMYWJzIiwic3ViIjoiYW5tb2xfdGVzdEB5b3BtYWlsLmNvbSIsInVzZXJfaWQiOiI2N2Y2Mjg2Yjc1YjkyMjZhOWFmYWJmYWEiLCJpc3MiOiJzZWxmIiwiV1MtMSI6eyJyb2xlcyI6eyJzaW11bGF0b3IiOlsiYW5tb2xfdGVzdCJdfSwicGVybWlzc2lvbnMiOnsic2ltdWxhdG9yIjp7Im1hbmFnZS10cmFpbmluZy1wbGFuIjpbWyJBQ0NFU1MiLCJDUkVBVEUiLCJSRUFEIiwiVVBEQVRFIiwiREVMRVRFIl1dLCJtYW5hZ2Utc2ltdWxhdGlvbnMiOltbIkFDQ0VTUyIsIkNSRUFURSIsIlJFQUQiLCJVUERBVEUiLCJERUxFVEUiXV0sImRhc2hib2FyZC10cmFpbmVlIjpbWyJBQ0NFU1MiLCJSRUFEIl1dLCJ0cmFpbmluZy1wbGFuIjpbWyJBQ0NFU1MiLCJSRUFEIl1dLCJwbGF5YmFjayI6W1siQUNDRVNTIiwiUkVBRCJdXSwiZGFzaGJvYXJkLW1hbmFnZXIiOltbXV0sImRhc2hib2FyZC1hZG1pbiI6W1tdXSwiYXNzaWduLXNpbXVsYXRpb25zIjpbWyJBQ0NFU1MiLCJDUkVBVEUiLCJSRUFEIl1dfX19LCJsYXN0X25hbWUiOiJSaXNoaSIsInJlcG9ydGluZ190byI6IlNpbXVsYXRvciBNYW5hZ2VyIiwiZXhwIjoxNzQ2NDI2MzQzLCJkZXBhcnRtZW50IjoiUHJvZHVjdCBEZXNpZ24gZGV2IiwiaWF0IjoxNzQ2NDI1MTQzLCJmaXJzdF9uYW1lIjoiQW5tb2wifQ.SOcei4UewtAYlWS-bsuRAzuwo6U-GZaem20HN8TQ3W_hr8qFUfWuJfrkSY49FfEB5ZltRFwxJ9-ovgPd7jVobOPUU0XD_ihWYO0aLeUJvrecgyY7qjigdt_Cgbx5R35UK3nu5H_lqWOxYdBRicY2P7ZJGDizCZjxJGi33w-OVqbaiAoZ-UOiDeHUNRlNWPCwl86AQ8pBj8gWmvjUTGNXwnGVk53ckmjSqcWshRkRpK_uwRTG6PqslOjavdu1b81TyMfQjR5GHPy5W9qkT8AMSNaLsLHBE6xn-S2IZIIsdAhdXjzX6JhntgLIYxr81-wyrSK7YVc69eGEDeULQCL1Og";
      this.token = newToken;

      // Reset refresh attempts on success
      this.refreshAttempts = 0;

      // Update the user data based on the new token
      this.updateUserFromToken(newToken, effectiveWorkspaceId);

      // Start the refresh timer
      this.startRefreshTimer(newToken);

      return newToken;
    } catch (error) {
      // Enhanced error logging
      console.error("Token refresh failed:", {
        error: error instanceof Error ? error.message : "Unknown error",
        response: axios.isAxiosError(error)
          ? {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
            }
          : undefined,
        request: axios.isAxiosError(error)
          ? {
              method: error.config?.method,
              url: error.config?.url,
              headers: error.config?.headers,
            }
          : undefined,
      });

      // If all attempts failed, clear auth data and throw error
      this.clearAuthData();
      throw error;
    }
  }

  startRefreshTimer(token: string) {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const expiresIn = decoded.exp * 1000 - Date.now();

      console.log("Setting up refresh timer:", {
        expiresIn: `${Math.round(expiresIn / 1000)}s`,
        refreshIn: `${Math.round((expiresIn - 60000) / 1000)}s`,
        currentTime: new Date().toISOString(),
        expiresAt: new Date(decoded.exp * 1000).toISOString(),
      });

      // Clear any existing timer
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout);
      }

      // Set timer to refresh 1 minute before expiry
      this.refreshTokenTimeout = setTimeout(() => {
        console.log("Refresh timer triggered");
        this.refreshToken();
      }, expiresIn - 60000); // Refresh 1 minute before expiry
    } catch (error) {
      console.error("Failed to start refresh timer:", {
        error: error instanceof Error ? error.message : "Unknown error",
        token: token ? "Present" : "Missing",
      });
    }
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string, workspaceId?: string | null) {
    this.token = token;
    if (workspaceId) {
      this.currentWorkspaceId = workspaceId;
    }
    this.updateUserFromToken(token, workspaceId);
    this.startRefreshTimer(token);
  }

  clearAuthData() {
    this.token = null;
    this.currentUser = null;
    this.currentWorkspaceId = null;
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
  }

  logout() {
    this.clearAuthData();
  }

  updateUserFromToken(token: string, workspaceId?: string | null) {
    try {
      // Decode the token and log the full structure for debugging
      const decodedToken = jwtDecode<DecodedToken>(token);
      console.log("FULL DECODED TOKEN:", decodedToken);

      // Store the workspace ID if provided
      if (workspaceId) {
        this.currentWorkspaceId = workspaceId;
      }

      // Find all workspace keys by looking for keys that contain roles and permissions
      const workspaceKeys = Object.keys(decodedToken).filter(
        (key) =>
          decodedToken[key] &&
          typeof decodedToken[key] === "object" &&
          decodedToken[key]?.roles
      );

      console.log("Found workspace keys:", workspaceKeys);

      if (workspaceKeys.length === 0) {
        console.error("No workspaces found in token");
        return null;
      }

      // Determine which workspace to use
      let selectedWorkspace = null;
      let selectedWorkspaceKey = "";
      let selectedRole = "Unknown";

      // If we have a specific workspace ID to use
      if (this.currentWorkspaceId) {
        console.log(
          `Looking for specific workspace: ${this.currentWorkspaceId}`
        );

        // Try to find the specified workspace
        if (workspaceKeys.includes(this.currentWorkspaceId)) {
          selectedWorkspaceKey = this.currentWorkspaceId;
          selectedWorkspace = decodedToken[this.currentWorkspaceId];

          // Find the first simulator role if available
          if (
            selectedWorkspace.roles?.simulator &&
            selectedWorkspace.roles.simulator.length > 0
          ) {
            selectedRole = selectedWorkspace.roles.simulator[0];
          } else {
            // Otherwise use any available role
            const allRoles = Object.values(
              selectedWorkspace.roles || {}
            ).flat();
            selectedRole = allRoles.length > 0 ? allRoles[0] : "Unknown";
          }

          console.log(
            `Using specified workspace: ${selectedWorkspaceKey} with role: ${selectedRole}`
          );
        } else {
          console.warn(
            `Specified workspace ${this.currentWorkspaceId} not found in token`
          );
        }
      }

      // If we still don't have a workspace (either no specific one was requested or it wasn't found)
      if (!selectedWorkspace) {
        // Check each workspace for simulator permissions
        for (const key of workspaceKeys) {
          const workspace = decodedToken[key];
          console.log(`Checking workspace: ${key}`, workspace);

          // Check if this workspace has simulator roles
          if (workspace.roles?.simulator) {
            console.log(
              `Found simulator roles in workspace ${key}:`,
              workspace.roles.simulator
            );

            // Check if this workspace has simulator permissions
            if (workspace.permissions?.simulator) {
              console.log(`Found simulator permissions in workspace ${key}`);
              selectedWorkspace = workspace;
              selectedWorkspaceKey = key;
              selectedRole = workspace.roles.simulator[0] || "Unknown";
              break; // Found a workspace with simulator permissions, stop searching
            }
          }
        }
      }

      if (!selectedWorkspace) {
        console.error("No valid workspace found in token");
        return null;
      }

      console.log("Selected workspace:", selectedWorkspaceKey);
      console.log("Selected role:", selectedRole);

      // Process permissions
      const permissions: { [key: string]: boolean } = {};

      // Process simulator permissions if they exist
      if (selectedWorkspace.permissions?.simulator) {
        console.log(
          "Processing simulator permissions:",
          selectedWorkspace.permissions.simulator
        );

        Object.entries(selectedWorkspace.permissions.simulator).forEach(
          ([permKey, permValues]) => {
            console.log(`Processing permission: ${permKey}`, permValues);

            // Check if the permission has ACCESS and READ
            const hasAccess =
              (Array.isArray(permValues) &&
                permValues.some(
                  (perm) => Array.isArray(perm) && perm.includes("ACCESS")
                )) ||
              false;

            const hasRead =
              (Array.isArray(permValues) &&
                permValues.some(
                  (perm) => Array.isArray(perm) && perm.includes("READ")
                )) ||
              false;

            const hasCreate =
              (Array.isArray(permValues) &&
                permValues.some(
                  (perm) => Array.isArray(perm) && perm.includes("CREATE")
                )) ||
              false;

            const hasUpdate =
              (Array.isArray(permValues) &&
                permValues.some(
                  (perm) => Array.isArray(perm) && perm.includes("UPDATE")
                )) ||
              false;

            const hasDelete =
              (Array.isArray(permValues) &&
                permValues.some(
                  (perm) => Array.isArray(perm) && perm.includes("DELETE")
                )) ||
              false;

            const hasWrite = hasCreate || hasUpdate;

            console.log(
              `Permission ${permKey}: Access=${hasAccess}, Read=${hasRead}, Create=${hasCreate}, Update=${hasUpdate}, Delete=${hasDelete}, Write=${hasWrite}`
            );

            // Only add permission if it has both ACCESS and READ
            if (hasAccess && hasRead) {
              permissions[permKey] = true;
            }

            // Add write permission if applicable
            if (hasWrite) {
              permissions[`${permKey}_write`] = true;
            }

            // Add specific create permission if applicable
            if (hasCreate) {
              permissions[`${permKey}_create`] = true;
            }

            // Add specific update permission if applicable
            if (hasUpdate) {
              permissions[`${permKey}_update`] = true;
            }

            // Add specific delete permission if applicable
            if (hasDelete) {
              permissions[`${permKey}_delete`] = true;
            }
          }
        );
      } else {
        console.warn("No simulator permissions found in selected workspace");
      }

      console.log("Final permissions object:", permissions);

      // Create user object
      const user: User = {
        id: decodedToken.user_id,
        email: decodedToken.sub,
        name: `${decodedToken.first_name} ${decodedToken.last_name}`,
        role: selectedRole,
        permissions: permissions,
        division: decodedToken.division || "",
        department: decodedToken.department || "",
        profileImageUrl: decodedToken.profile_img_url || "",
        workspaceId: selectedWorkspaceKey,
        internalId: decodedToken.internal_user_id || "",
        externalId: decodedToken.external_user_id || "",
        phoneNumber: decodedToken.phone_no || "",
        reportingTo: decodedToken.reporting_to?.name || "",
      };

      console.log("Created user object:", user);

      // Store user in memory
      this.currentUser = user;
      this.currentWorkspaceId = selectedWorkspaceKey;

      return user;
    } catch (error) {
      console.error("Error updating user from token:", error);
      return null;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    if (!this.token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(this.token);
      return decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  getCurrentWorkspaceId(): string | null {
    return this.currentWorkspaceId;
  }
}

export const authService = new AuthService();
