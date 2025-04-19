import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Container, CircularProgress } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Unauthorized = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Try to refresh token when component mounts
  useEffect(() => {
    const attemptRefresh = async () => {
      if (retryCount >= maxRetries) return;

      setIsRetryingAuth(true);

      try {
        // Get workspace ID from URL
        const params = new URLSearchParams(location.search);
        const workspaceId = params.get('workspace_id');

        console.log(`Unauthorized page: Attempting token refresh (attempt ${retryCount + 1}/${maxRetries})`);

        // Try to refresh the token
        await authService.refreshToken(workspaceId || null);

        // If successful, redirect to dashboard
        console.log('Token refresh successful, redirecting to dashboard');
        const workspaceParam = workspaceId ? `?workspace_id=${encodeURIComponent(workspaceId)}` : '';
        navigate(`/dashboard${workspaceParam}`);
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
      }, 3000); // Wait 3 seconds before trying

      return () => clearTimeout(timer);
    }
  }, [retryCount, location.search, navigate]);

  const handleGoToLogin = () => {
    // Preserve workspace_id when redirecting to login
    const params = new URLSearchParams(location.search);
    const workspaceId = params.get('workspace_id');
    const baseUrl = 'https://eu2ccapsal001.eastus2.cloudapp.azure.com';

    if (workspaceId) {
      window.location.href = `${baseUrl}?workspace_id=${encodeURIComponent(workspaceId)}`;
    } else {
      window.location.href = baseUrl;
    }
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