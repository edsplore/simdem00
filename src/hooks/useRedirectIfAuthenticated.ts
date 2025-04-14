import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, currentWorkspaceId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Preserve the workspace_id when redirecting
      const workspaceParam = currentWorkspaceId ? `?workspace_id=${currentWorkspaceId}` : '';
      navigate(`${redirectTo}${workspaceParam}`);
    }
  }, [isAuthenticated, navigate, redirectTo, currentWorkspaceId]);
};