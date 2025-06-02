import React from 'react';
import { Stack, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { buildPathWithWorkspace } from '../../../../utils/navigation';

interface PlaybackHeaderProps {
  simulationName?: string;
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

const PlaybackHeader: React.FC<PlaybackHeaderProps> = ({
  simulationName,
  showDetails,
  onToggleDetails,
}) => {
  const { currentWorkspaceId, currentTimeZone } = useAuth();

  if (!simulationName) {
    // Default header used on playback list page
    return (
      <Stack spacing={1}>
        <Typography variant="h4" fontWeight="medium">
          Playback
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Playback and Evaluate Your Training Simulations
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ position: 'sticky', top: 0, zIndex: 1000 }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Link
          to={buildPathWithWorkspace(
            '/playback',
            currentWorkspaceId,
            currentTimeZone,
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
        <Typography variant="h6">{simulationName}</Typography>
      </Stack>
      {onToggleDetails && (
        <Button
          variant="text"
          onClick={onToggleDetails}
          sx={{
            padding: '10px',
            color: '#343F8A',
            backgroundColor: '#F5F6FE',
            '&:hover': { backgroundColor: '#F5F6FE' },
            textTransform: 'none',
          }}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      )}
    </Stack>
  );
};

export default PlaybackHeader;
