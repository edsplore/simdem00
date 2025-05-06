import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const useRedirectIfAuthenticated = (redirectTo: string = '/dashboard') => {
  const { isAuthenticated, currentWorkspaceId, currentTimeZone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Preserve both workspace_id and timeZone when redirecting
      const redirectParams = new URLSearchParams();

      if (currentWorkspaceId) {
        redirectParams.set('workspace_id', currentWorkspaceId);
      }

      if (currentTimeZone) {
        redirectParams.set('timeZone', currentTimeZone);
      }

      const queryString = redirectParams.toString();
      navigate(`${redirectTo}${queryString ? `?${queryString}` : ''}`);
    }
  }, [isAuthenticated, navigate, redirectTo, currentWorkspaceId, currentTimeZone]);
};
