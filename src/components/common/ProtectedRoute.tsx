import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  path
}) => {
  const { isAuthenticated, user, currentWorkspaceId } = useAuth();
  const location = useLocation();

  // If not authenticated, redirect to unauthorized page
  if (!isAuthenticated) {
    // Preserve the workspace_id when redirecting
    const params = new URLSearchParams(location.search);
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
    return <Navigate to={`/unauthorized${workspaceParam}`} />;
  }

  // If no user object, wait for it
  if (!user) {
    return null;
  }

  // Special case for dashboard path
  if (path === '/dashboard') {
    // For dashboard, we'll check if the user has any dashboard permission
    const hasAnyDashboardPermission = 
      user.permissions["dashboard-trainee"] || 
      user.permissions["dashboard-manager"] || 
      user.permissions["dashboard-admin"];

    if (!hasAnyDashboardPermission) {
      console.log('No dashboard permissions found');
      const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
      return <Navigate to={`/training${workspaceParam}`} />;
    }

    // If they have permission, the DashboardRouter component will handle which dashboard to show
    return <>{children}</>;
  }

  // For other paths, check permission as usual
  if (!hasPermission(path)) {
    console.log('Permission denied for path:', path);

    // Redirect to unauthorized page instead of dashboard
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
    return <Navigate to={`/unauthorized${workspaceParam}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;