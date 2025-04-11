import React, { useState } from 'react';
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyIcon from '@mui/icons-material/Key';
import { User } from '../../types/auth';

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

const countryCodes = [
  { code: 'IND', dialCode: '+91', name: 'India' },
  { code: 'USA', dialCode: '+1', name: 'United States' },
  { code: 'UK', dialCode: '+44', name: 'United Kingdom' },
  { code: 'AUS', dialCode: '+61', name: 'Australia' },
  { code: 'CAN', dialCode: '+1', name: 'Canada' },
];

interface ProfileDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const roles = [
  'Simulator | Trainee',
  'Simulator | Admin',
  'Recruiter | Trainee',
  'Recruiter | Admin',
];

const ProfileDetailsDialog: React.FC<ProfileDetailsDialogProps> = ({
  open,
  onClose,
  user,
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([
    'Simulator | Trainee',
    'Recruiter | Trainee',
  ]);
  const [timeZone, setTimeZone] = useState('UTC+0:00');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('IND');

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
    }
  };

  const handleCountryCodeChange = (event: any) => {
    setCountryCode(event.target.value);
    handleChange();
  };

  const getCurrentDialCode = () => {
    const country = countryCodes.find((c) => c.code === countryCode);
    return country?.dialCode || '+91';
  };

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleCancel = () => {
    setHasChanges(false);
    // Reset values
    setTimeZone('UTC+0:00');
    setPhoneNumber('');
  };

  const handleSave = () => {
    setHasChanges(false);
    // Save logic here
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: '#F5F6FF', width: 48, height: 48 }}>
            <PersonIcon sx={{ color: '#444CE7' }} />
          </Avatar>
          <Stack spacing={0.5} flex={1}>
            <Typography
              variant="h6"
              sx={{ fontFamily: 'Inter', fontWeight: 500 }}
            >
              My Profile
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: 'Inter' }}
            >
              Edit your profile details
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Email Info */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              bgcolor: '#F9FAFB',
              p: 2,
              borderRadius: 1,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontFamily: 'Inter' }}
            >
              Email: 
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
              {user?.email || ''}
            </Typography>
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

          {/* Admin Email */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              bgcolor: '#F9FAFB',
              p: 2,
              borderRadius: 1,
            }}
          >
            <KeyIcon sx={{ color: 'text.secondary' }} />
            <Stack flex={1}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: 'Inter' }}
              >
                User ID:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                {user?.id || ''}
              </Typography>
            </Stack>
            <IconButton onClick={handleCopyEmail} size="small">
              <ContentCopyIcon />
            </IconButton>
          </Stack>

          {/* Form Fields */}
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <ReadOnlyField
                fullWidth
                label="First Name"
                defaultValue={user?.name?.split(' ')[0] || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
              <ReadOnlyField
                fullWidth
                label="Last Name"
                defaultValue={user?.name?.split(' ').slice(1).join(' ') || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
            </Stack>

            <Select
              value={timeZone}
              onChange={(e) => {
                setTimeZone(e.target.value);
                handleChange();
              }}
              fullWidth
              sx={{ fontFamily: 'Inter' }}
            >
              <MenuItem value="UTC+5:30">UTC+5:30</MenuItem>
              <MenuItem value="UTC+0:00">UTC+0:00</MenuItem>
            </Select>

            <Stack direction="row" spacing={2}>
              {/* Email Address Field */}
              <ReadOnlyField
                label="Email Address"
                defaultValue={user?.email || ''}
                disabled
                InputLabelProps={{
                  shrink: true,
                  sx: { fontFamily: 'Inter', width: 250 },
                }}
                InputProps={{
                  sx: {
                    fontFamily: 'Inter',
                    borderRadius: 2,
                  },
                }}
              />

              {/* Phone Number Section */}
              <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                <Select
                  value={countryCode}
                  onChange={handleCountryCodeChange}
                  sx={{
                    width: 100,
                    fontFamily: 'Inter',
                    '& .MuiSelect-select': {
                      padding: '8.5px 14px',
                    },
                  }}
                >
                  {countryCodes.map((country) => (
                    <MenuItem
                      key={country.code}
                      value={country.code}
                      sx={{ fontFamily: 'Inter' }}
                    >
                      {country.code}
                    </MenuItem>
                  ))}
                </Select>
                <EditableField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    handleChange();
                  }}
                  InputProps={{
                    startAdornment: (
                      <Typography
                        component="span"
                        sx={{
                          mr: 1,
                          fontFamily: 'Inter',
                          color: 'text.secondary',
                        }}
                      >
                        {getCurrentDialCode()}
                      </Typography>
                    ),
                  }}
                  InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
                />
              </Stack>
            </Stack>

            <Stack direction="row" spacing={2}>
              <ReadOnlyField
                fullWidth
                label="Division"
                defaultValue={user?.division || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
              <ReadOnlyField
                fullWidth
                label="Department"
                defaultValue={user?.department || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <ReadOnlyField
                fullWidth
                label="Internal User ID"
                defaultValue={user?.id || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
              <ReadOnlyField
                fullWidth
                label="External User ID"
                defaultValue={user?.externalId || ''}
                disabled
                InputLabelProps={{ sx: { fontFamily: 'Inter' } }}
              />
            </Stack>

            <ReadOnlyField
              fullWidth
              label="Reporting To"
              defaultValue={user?.reportingTo || ''}
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
      </DialogContent>

      {hasChanges && (
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleCancel}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: 'Inter',
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={handleSave}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontFamily: 'Inter',
              bgcolor: '#444CE7',
              '&:hover': {
                bgcolor: '#3538CD',
              },
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      )}
    </StyledDialog>
  );
};

export default ProfileDetailsDialog;