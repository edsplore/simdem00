import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { hasPermission } from '../../utils/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  path: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  path
}) => {
  const { isAuthenticated, user } = useAuth();

  // If not authenticated, show unauthorized
  if (!isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  // If no user object, wait for it
  if (!user) {
    return null;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('Role access denied:', {
      userRole: user.role,
      allowedRoles,
    });
    return <Navigate to="/dashboard" />;
  }

  // Check permission-based access
  // if (!hasPermission(path)) {
  //   console.log('Permission denied for path:', path);
  //   return <Navigate to="/dashboard" />;
  // }

  return <>{children}</>;
};

export default ProtectedRoute;