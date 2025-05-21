import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Container, Link } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { buildPathWithWorkspace } from '../utils/navigation';
import api from '../services/api';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, currentWorkspaceId, currentTimeZone } = useAuth();
  const location = useLocation();

  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.login({ email, password });

      // Get workspace ID and timeZone from URL or context
      const params = new URLSearchParams(location.search);
      const workspaceId = params.get('workspace_id') || currentWorkspaceId;
      const timeZone = params.get('timeZone') || currentTimeZone;

      login(response.token, workspaceId || undefined, timeZone || undefined);
      navigate(buildPathWithWorkspace('/dashboard', workspaceId, timeZone));
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
          Sign in
        </Typography>
        {error && (
          <Typography color="error" align="center" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Typography>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign In
          </Button>
          <Typography align="center">
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to={buildPathWithWorkspace('/register', currentWorkspaceId, currentTimeZone)}
              underline="hover"
            >
              Register here
            </Link>
          </Typography>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;