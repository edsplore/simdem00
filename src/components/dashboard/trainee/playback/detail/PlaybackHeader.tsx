import React from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography, Button } from '@mui/material';
import { useAuth } from '../../../../../context/AuthContext';
import { buildPathWithWorkspace } from '../../../../../utils/navigation';

interface PlaybackHeaderProps {
  showDetails: boolean;
  onToggleDetails: () => void;
}

const PlaybackHeader: React.FC<PlaybackHeaderProps> = ({
  showDetails,
  onToggleDetails,
}) => {
  const { currentWorkspaceId, currentTimeZone } = useAuth();
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        position: 'sticky', // Make it sticky
        top: 0, // Stick to the top
        zIndex: 1000, // Ensure it's above other content
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Link
          to={buildPathWithWorkspace(
            '/playback',
            currentWorkspaceId,
            currentTimeZone
          )}
          style={{ textDecoration: 'none' }}
        >
          <Typography variant="h4" color="text.secondary">
            Playback
          </Typography>
        </Link>
        <Typography variant="h6" color="text.secondary">
          /
        </Typography>
        <Typography variant="h6">Humana_MS_PCP Change</Typography>
      </Stack>
      <Button
        variant="text"
        onClick={onToggleDetails}
        sx={{
          padding: '10px',
          color: '#343F8A', // Text color
          backgroundColor: '#F5F6FE', // Background color
          '&:hover': {
            backgroundColor: '#F5F6FE', // Keep the same background color on hover
          },
          textTransform: 'none', // Prevent uppercase text
        }}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </Button>
    </Stack>
  );
};

export default PlaybackHeader;
