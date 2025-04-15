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

  // Check permission-based access
  if (!hasPermission(path)) {
    console.log('Permission denied for path:', path);

    // Redirect to unauthorized page instead of dashboard
    const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
    return <Navigate to={`/unauthorized${workspaceParam}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;