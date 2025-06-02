import React from 'react';
import { Avatar, Box, Paper, Typography } from '@mui/material';

interface ScoreDetailsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const ScoreDetailsCard: React.FC<ScoreDetailsCardProps> = ({ icon, label, value }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', columnGap: 2 }}>
    <Avatar variant="rounded" sx={{ bgcolor: 'grey.50' }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  </Paper>
);

export default ScoreDetailsCard;
