import React, { useState } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { TextField, Button, Paper, Typography, Container, MenuItem, Link } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { buildPathWithWorkspace } from '../utils/navigation';
import api from '../services/api';
import { UserRole } from '../types/auth';
import { useRedirectIfAuthenticated } from '../hooks/useRedirectIfAuthenticated';

const roles: { value: UserRole; label: string }[] = [
  { value: 'trainee', label: 'Trainee/Learner' },
  { value: 'trainer', label: 'Trainer/Manager' },
  { value: 'creator', label: 'Creator/Designer' },
  { value: 'org_admin', label: 'Organization Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'trainee' as UserRole,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, currentWorkspaceId, currentTimeZone } = useAuth();
  const location = useLocation();

  // Redirect if already authenticated
  useRedirectIfAuthenticated();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await api.register(formData);

      // Get workspace ID and timeZone from URL or context
      const params = new URLSearchParams(location.search);
      const workspaceId = params.get('workspace_id') || currentWorkspaceId;
      const timeZone = params.get('timeZone') || currentTimeZone;

      login(response.token, workspaceId || undefined, timeZone || undefined);
      navigate(buildPathWithWorkspace('/dashboard', workspaceId, timeZone));
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during registration');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={6} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
          Register
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
            label="Full Name"
            name="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            {roles.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Register
          </Button>
          <Typography align="center">
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to={buildPathWithWorkspace('/login', currentWorkspaceId, currentTimeZone)}
              underline="hover"
            >
              Sign in here
            </Link>
          </Typography>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;