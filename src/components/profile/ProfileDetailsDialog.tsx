import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Box,
  Avatar,
  styled,
  Button,
  Chip,
  Autocomplete,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { User } from '../../types/auth';
import { fetchUserDetails, UserDetails } from '../../services/users';
import { useAuth } from '../../context/AuthContext';

// List of all standard time zones
const TIMEZONES = [
  { value: 'UTC-12:00', label: '(UTC-12:00) International Date Line West' },
  { value: 'UTC-11:00', label: '(UTC-11:00) Coordinated Universal Time-11' },
  { value: 'UTC-10:00', label: '(UTC-10:00) Hawaii' },
  { value: 'UTC-09:30', label: '(UTC-09:30) Marquesas Islands' },
  { value: 'UTC-09:00', label: '(UTC-09:00) Alaska' },
  { value: 'UTC-08:00', label: '(UTC-08:00) Pacific Time (US & Canada)' },
  { value: 'UTC-07:00', label: '(UTC-07:00) Mountain Time (US & Canada)' },
  { value: 'UTC-06:00', label: '(UTC-06:00) Central Time (US & Canada)' },
  { value: 'UTC-05:00', label: '(UTC-05:00) Eastern Time (US & Canada)' },
  { value: 'UTC-04:00', label: '(UTC-04:00) Atlantic Time (Canada)' },
  { value: 'UTC-03:30', label: '(UTC-03:30) Newfoundland' },
  { value: 'UTC-03:00', label: '(UTC-03:00) Brasilia' },
  { value: 'UTC-02:00', label: '(UTC-02:00) Mid-Atlantic' },
  { value: 'UTC-01:00', label: '(UTC-01:00) Azores' },
  { value: 'UTC+00:00', label: '(UTC+00:00) London, Dublin, Edinburgh' },
  { value: 'UTC+01:00', label: '(UTC+01:00) Berlin, Vienna, Rome, Paris' },
  { value: 'UTC+02:00', label: '(UTC+02:00) Athens, Istanbul, Helsinki' },
  { value: 'UTC+03:00', label: '(UTC+03:00) Moscow, Baghdad, Kuwait' },
  { value: 'UTC+03:30', label: '(UTC+03:30) Tehran' },
  { value: 'UTC+04:00', label: '(UTC+04:00) Dubai, Baku, Tbilisi' },
  { value: 'UTC+04:30', label: '(UTC+04:30) Kabul' },
  { value: 'UTC+05:00', label: '(UTC+05:00) Karachi, Tashkent' },
  { value: 'UTC+05:30', label: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi' },
  { value: 'UTC+05:45', label: '(UTC+05:45) Kathmandu' },
  { value: 'UTC+06:00', label: '(UTC+06:00) Dhaka, Almaty, Novosibirsk' },
  { value: 'UTC+06:30', label: '(UTC+06:30) Yangon (Rangoon)' },
  { value: 'UTC+07:00', label: '(UTC+07:00) Bangkok, Hanoi, Jakarta' },
  { value: 'UTC+08:00', label: '(UTC+08:00) Beijing, Hong Kong, Singapore' },
  { value: 'UTC+08:45', label: '(UTC+08:45) Eucla' },
  { value: 'UTC+09:00', label: '(UTC+09:00) Tokyo, Seoul, Osaka' },
  { value: 'UTC+09:30', label: '(UTC+09:30) Adelaide, Darwin' },
  { value: 'UTC+10:00', label: '(UTC+10:00) Sydney, Melbourne, Brisbane' },
  { value: 'UTC+10:30', label: '(UTC+10:30) Lord Howe Island' },
  { value: 'UTC+11:00', label: '(UTC+11:00) Solomon Islands, New Caledonia' },
  { value: 'UTC+12:00', label: '(UTC+12:00) Auckland, Wellington, Fiji' },
  { value: 'UTC+12:45', label: '(UTC+12:45) Chatham Islands' },
  { value: 'UTC+13:00', label: '(UTC+13:00) Samoa, Tonga, Phoenix Islands' },
  { value: 'UTC+14:00', label: '(UTC+14:00) Line Islands' },
];

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    fontFamily: 'Inter',
  },
}));

const ReadOnlyField = styled(TextField)({
  '& .MuiInputBase-input': {
    backgroundColor: '#F9FAFB',
    fontFamily: 'Inter',
  },
  '& .MuiInputBase-input.Mui-disabled': {
    backgroundColor: '#F9FAFB',
    WebkitTextFillColor: '#475467',
    fontFamily: 'Inter',
  },
});

const EditableField = styled(TextField)({
  '& .MuiInputBase-input': {
    backgroundColor: '#ffffff',
    fontFamily: 'Inter',
  },
});

interface ProfileDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  profileImageUrl: string | null;
  user: User | null;
}

const ProfileDetailsDialog: React.FC<ProfileDetailsDialogProps> = ({
  open,
  onClose,
  profileImageUrl,
  user,
}) => {
  const { currentWorkspaceId, currentTimeZone } = useAuth();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Get the time zone label from the value
  const getTimeZoneLabel = (value: string | null): string => {
    if (!value) return '';
    const timezone = TIMEZONES.find(tz => tz.value === value);
    return timezone ? timezone.label : value;
  };

  // Fetch user details when dialog opens
  useEffect(() => {
    const loadUserDetails = async () => {
      if (!open || !user?.id || !user?.workspaceId) return;

      try {
        setIsLoading(true);
        setError(null);
        const details = await fetchUserDetails(user.id, user.workspaceId);
        setUserDetails(details);
      } catch (err) {
        console.error('Error loading user details:', err);
        setError('Failed to load user details');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserDetails();
  }, [open, user?.id, user?.workspaceId]);

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: '#F5F6FF', width: 48, height: 48 }}>
            {profileImageUrl ? (
              <img src={profileImageUrl} alt={user?.name || 'User'} style={{ width: '100%', height: '100%' }} />
            ) : (
              user?.name ? (
                user.name.split(' ').map(n => n[0]).join('').toUpperCase()
              ) : (
                <PersonIcon sx={{ color: '#444CE7' }} />
              )
            )}
          </Avatar>
          <Stack spacing={0.5} flex={1}>
            <Typography
              variant="h6"
              sx={{ fontFamily: 'Inter', fontWeight: 500 }}
            >
              My Profile
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ p: 2 }}>
            {error}
          </Typography>
        ) : (
          <Stack spacing={3}>
            {/* Email Info */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                bgcolor: '#F9FAFB',
                p: 2,
                borderRadius: 1,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontFamily: 'Inter' }}
                >
                  Email: 
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                  {userDetails?.user?.email || user?.email || ''}
                </Typography>
              </Stack>
              <Box
                sx={{
                  bgcolor: '#fff',
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: '0.75rem',
                  fontFamily: 'Inter',
                }}
              >
                {user?.role || ''}
              </Box>
            </Stack>

            {/* Form Fields */}
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2}>
                <ReadOnlyField
                  fullWidth
                  label="First Name"
                  defaultValue={userDetails?.user?.first_name || user?.name?.split(' ')[0] || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
                <ReadOnlyField
                  fullWidth
                  label="Last Name"
                  defaultValue={userDetails?.user?.last_name || user?.name?.split(' ').slice(1).join(' ') || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
              </Stack>

              {/* Time Zone Field - Now Read-Only */}
              <ReadOnlyField
                fullWidth
                label="Time Zone"
                value={getTimeZoneLabel(currentTimeZone)}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />

              {updateSuccess && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Time zone updated successfully
                </Alert>
              )}

              <Stack direction="row" spacing={2}>
                {/* Email Address Field */}
                <ReadOnlyField
                  fullWidth
                  label="Email Address"
                  defaultValue={userDetails?.user?.email || user?.email || ''}
                  disabled
                  InputLabelProps={{
                    shrink: true,
                    sx: { fontFamily: 'Inter' },
                  }}
                  InputProps={{
                    sx: {
                      fontFamily: 'Inter',
                      borderRadius: 2,
                    },
                  }}
                />

                <ReadOnlyField
                  fullWidth
                  label="Phone Number"
                  defaultValue={userDetails?.user?.phone_no || user?.phoneNumber || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <ReadOnlyField
                  fullWidth
                  label="Division"
                  defaultValue={userDetails?.user?.division || user?.division || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
                <ReadOnlyField
                  fullWidth
                  label="Department"
                  defaultValue={userDetails?.user?.department || user?.department || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <ReadOnlyField
                  fullWidth
                  label="Internal User ID"
                  defaultValue={userDetails?.user?.internal_user_id || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
                <ReadOnlyField
                  fullWidth
                  label="External User ID"
                  defaultValue={userDetails?.user?.external_user_id || ''}
                  disabled
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
              </Stack>

              <ReadOnlyField
                fullWidth
                label="Reporting To"
                defaultValue={userDetails?.user?.reporting_to?.name || user?.reportingTo || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />

              <ReadOnlyField
                fullWidth
                label="Assign Roles"
                value={user?.role || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                InputProps={{
                  sx: {
                    '& .MuiInputBase-input': {
                      color: '#475467',
                    },
                  },
                }}
              />
            </Stack>
          </Stack>
        )}
      </DialogContent>
    </StyledDialog>
  );
};

export default ProfileDetailsDialog;
