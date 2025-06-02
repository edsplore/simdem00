import React from 'react';
import { Stack, Typography } from '@mui/material';

interface PlaybackHeaderProps {
  simulationName?: string;
}

const PlaybackHeader: React.FC<PlaybackHeaderProps> = ({ simulationName }) => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <Typography variant="h5" fontWeight={700}>
      Playback
    </Typography>
    {simulationName && (
      <>
        <Typography color="text.secondary">/</Typography>
        <Typography variant="subtitle1">{simulationName}</Typography>
      </>
    )}
  </Stack>
);

export default PlaybackHeader;
