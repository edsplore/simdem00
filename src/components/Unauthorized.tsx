import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Container, CircularProgress } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

// Get the UAM API URL from environment variables
const UAM_API_URL = import.meta.env.VITE_CORE_FRONTEND_URL;

const Unauthorized = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 1;

  // Try to refresh token when component mounts
  useEffect(() => {
    const attemptRefresh = async () => {
      if (retryCount >= maxRetries) return;

      setIsRetryingAuth(true);

      try {
        // Get workspace ID and timeZone from URL
        const params = new URLSearchParams(location.search);
        const workspaceId = params.get('workspace_id');
        const timeZone = params.get('timeZone');

        console.log(`Unauthorized page: Attempting token refresh (attempt ${retryCount + 1}/${maxRetries})`);

        // Try to refresh the token
        await authService.refreshToken(workspaceId || null);

        // If successful, redirect to dashboard with both workspace_id and timeZone
        console.log('Token refresh successful, redirecting to dashboard');

        const redirectParams = new URLSearchParams();
        if (workspaceId) {
          redirectParams.set('workspace_id', workspaceId);
        }
        if (timeZone) {
          redirectParams.set('timeZone', timeZone);
        }

        const queryString = redirectParams.toString();
        navigate(`/dashboard${queryString ? `?${queryString}` : ''}`);
      } catch (error) {
        console.error('Token refresh failed from Unauthorized page:', error);
        setRetryCount(prev => prev + 1);
      } finally {
        setIsRetryingAuth(false);
      }
    };

    // Only attempt refresh if we haven't reached max retries
    if (retryCount < maxRetries) {
      const timer = setTimeout(() => {
        attemptRefresh();
      }, 10000); // Wait 10 seconds before trying

      return () => clearTimeout(timer);
    }
  }, [retryCount, location.search, navigate]);

  const handleGoToLogin = () => {
    // Preserve workspace_id and timeZone when redirecting to login
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');
    const timeZone = params.get('timeZone');
    const baseUrl = UAM_API_URL;

    // Build the URL with both parameters if available
    let redirectUrl = baseUrl;
    const redirectParams = new URLSearchParams();

    if (workspaceId) {
      redirectParams.set('workspace_id', workspaceId);
    }
    if (timeZone) {
      redirectParams.set('timeZone', timeZone);
    }

    const queryString = redirectParams.toString();
    if (queryString) {
      redirectUrl += `?${queryString}`;
    }

    window.location.href = redirectUrl;
  };

  const handleRetry = () => {
    // Reset retry count and try again
    setRetryCount(0);
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 3
        }}
      >
        {isRetryingAuth ? (
          <>
            <CircularProgress size={60} sx={{ mb: 3, color: '#444CE7' }} />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Attempting to restore your session
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
              Please wait while we try to reconnect...
            </Typography>
          </>
        ) : (
          <>
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                borderRadius: '50%', 
                bgcolor: '#FEF3F2', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mb: 3
              }}
            >
              <BlockIcon sx={{ fontSize: 40, color: '#D92D20' }} />
            </Box>

            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Access Denied
            </Typography>

            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
              You don't have permission to access this page or your session has expired.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              {retryCount < maxRetries && (
                <Button 
                  variant="outlined" 
                  onClick={handleRetry}
                  sx={{ 
                    borderColor: '#444CE7',
                    color: '#444CE7',
                    '&:hover': { borderColor: '#3538CD', bgcolor: '#F5F6FF' },
                    borderRadius: 2,
                    px: 4,
                    py: 1
                  }}
                >
                  Try Again
                </Button>
              )}

              <Button 
                variant="contained" 
                onClick={handleGoToLogin}
                sx={{ 
                  bgcolor: '#444CE7',
                  '&:hover': { bgcolor: '#3538CD' },
                  borderRadius: 2,
                  px: 4,
                  py: 1
                }}
              >
                Go to Login
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Unauthorized;
