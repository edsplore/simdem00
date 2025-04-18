// JSON Web Token
// {
//   "sub": "user123@weareverise.com",
//   "first_name": "user",
//   "last_name": "123",
//   "division": "EverAI Product",
//   "department": "Product Design dev",
//   "reporting_to": "charlie.white@weareverise.com",
//   "WS-2025-1001": {
//       "roles": {
//           "simulator": ["manager", "trainer"],
//           "qa_coaching": ["coach", "admin"],
//           "knowledge_miner": ["analyst", "manager"]
//       },
//       "permissions": {
//           "simulator": {
//               "training": ["read", "write"],
//               "playback": ["read"],
//               "dashboard_admin": ["read", "write"],
//               "dashboard_trainee": ["read"]
//           },
//           "qa_coaching": {
//               "training": ["read", "write"]
//           },
//           "knowledge_miner": {
//               "miner_module": ["read", "write"]
//           }
//       }
//   },
//   "WS-2025-1002": {
//       "roles": {
//           "simulator": ["manager", "trainer"],
//           "qa_coaching": ["coach", "admin"],
//           "knowledge_miner": ["analyst", "manager"]
//       },
//       "permissions": {
//           "simulator": {
//               "training": ["read", "write"],
//               "playback": ["read"],
//               "dashboard_admin": ["read", "write"],
//               "dashboard_trainee": ["read"]
//           },
//           "qa_coaching": {
//               "training": ["read", "write"]
//           },
//           "knowledge_miner": {
//               "miner_module": ["read", "write"]
//           }
//       }
//   },
//   "iat": 1612435154,  
//   "exp": 1612445154  
// }


import { authService } from '../services/authService';

// Map dashboard routes to their corresponding permission keys
export const PERMISSION_MAP: { [key: string]: string } = {
  '/dashboard': 'dashboard-trainee',
  '/dashboard-admin': 'dashboard-admin',
  '/dashboard-manager': 'dashboard-manager',
  '/training': 'training-plan',
  '/playback': 'playback',
  '/manage-simulations': 'manage-simulations',
  '/manage-training-plan': 'manage-training-plan',
  '/assign-simulations': 'assign-simulations',
  '/settings': 'settings', // Assuming everyone has access to settings
  '/support': 'support', // Assuming everyone has access to support
  '/feedback': 'feedback', // Assuming everyone has access to feedback
};

/**
 * Check if the user has both ACCESS and READ permissions for a specific feature
 * @param permissionKey The permission key to check
 * @returns boolean indicating if the user has both ACCESS and READ permissions
 */
export const hasAccessAndReadPermission = (permissionKey: string): boolean => {
  try {
    const user = authService.getCurrentUser();
    if (!user) return false;

    return user.permissions[permissionKey] || false;
  } catch (error) {
    console.error(`Error checking permission for ${permissionKey}:`, error);
    return false;
  }
}

/**
 * Check if the user has CREATE permission for a specific feature
 * @param permissionKey The permission key to check
 * @returns boolean indicating if the user has CREATE permission
 */
export const hasCreatePermission = (permissionKey: string): boolean => {
  try {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // First check for specific create permission
    const createPermissionKey = `${permissionKey}_create`;
    if (user.permissions[createPermissionKey]) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking create permission for ${permissionKey}:`, error);
    return false;
  }
}

/**
 * Check if the user has UPDATE permission for a specific feature
 * @param permissionKey The permission key to check
 * @returns boolean indicating if the user has UPDATE permission
 */
export const hasUpdatePermission = (permissionKey: string): boolean => {
  try {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // First check for specific update permission
    const updatePermissionKey = `${permissionKey}_update`;
    if (user.permissions[updatePermissionKey]) {
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error checking update permission for ${permissionKey}:`, error);
    return false;
  }
}

/**
 * Check if the user has DELETE permission for a specific feature
 * @param permissionKey The permission key to check
 * @returns boolean indicating if the user has DELETE permission
 */
export const hasDeletePermission = (permissionKey: string): boolean => {
  try {
    const user = authService.getCurrentUser();
    if (!user) return false;

    // Check for specific delete permission
    const deletePermissionKey = `${permissionKey}_delete`;
    return user.permissions[deletePermissionKey] || false;
  } catch (error) {
    console.error(`Error checking create permission for ${permissionKey}:`, error);
    return false;
  }
}

/**
 * Check if the user has permission to access a specific path
 * @param path The route path to check
 * @returns boolean indicating if the user has permission
 */
export const hasPermission = (path: string): boolean => {
  try {
    const user = authService.getCurrentUser();

    // Log for debugging
    console.log(`Checking permission for path: ${path}`);
    console.log('Current user:', user);

    if (!user) {
      console.log('No user found, denying access');
      return false;
    }

    // For paths that don't require specific permissions
    if (!PERMISSION_MAP[path]) {
      console.log(`No permission mapping for path ${path}, allowing access`);
      return true;
    }

    // Check if the user has the required permission
    const permissionKey = PERMISSION_MAP[path];
    const hasAccess = user.permissions[permissionKey] || false;

    console.log(`Permission key: ${permissionKey}, Has access: ${hasAccess}`);
    console.log('User permissions:', user.permissions);

    return hasAccess;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}
