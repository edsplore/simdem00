import React, { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  CircularProgress,
  Typography,
  Stack,
  Avatar,
  Checkbox,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';

interface Assignee {
  id: string;
  name: string;
  email?: string;
  type: 'team' | 'trainee';
}

interface AssigneeSearchFilterProps {
  assignees: Assignee[];
  selectedAssignees: string[];
  isLoading: boolean;
  onSelect: (assigneeId: string) => void;
}

const AssigneeSearchFilter: React.FC<AssigneeSearchFilterProps> = ({
  assignees,
  selectedAssignees,
  isLoading,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Improved filtering with proper null/undefined checks
  const filteredAssignees = assignees.filter(assignee => {
    const name = assignee.name || '';
    const email = assignee.email || '';
    const query = searchQuery.toLowerCase();

    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query);
  });

  return (
    <>
      <Box sx={{ p: 2, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search users or teams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
          }}
        />
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : assignees.length === 0 ? (
        <MenuItem disabled>No users or teams available</MenuItem>
      ) : filteredAssignees.length === 0 ? (
        <MenuItem disabled>No matches found</MenuItem>
      ) : (
        filteredAssignees.map((assignee) => (
          <MenuItem
            key={assignee.id}
            value={assignee.id}
            onClick={() => onSelect(assignee.id)}
            sx={{
              py: 1,
              px: 2,
              '&:hover': {
                bgcolor: '#F5F6FF',
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Checkbox
                checked={selectedAssignees.includes(assignee.id)}
                sx={{
                  color: '#D0D5DD',
                  '&.Mui-checked': {
                    color: '#444CE7',
                  },
                }}
              />
              <Avatar sx={{ width: 24, height: 24, bgcolor: '#F5F6FF' }}>
                {assignee.type === 'team' ? (
                  <GroupIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                ) : (
                  <PersonIcon sx={{ color: '#444CE7', width: 16, height: 16 }} />
                )}
              </Avatar>
              <Stack spacing={0.5} flex={1}>
                <Typography variant="body2">
                  {assignee.name || 'Unnamed'}
                </Typography>
                {assignee.email && (
                  <Typography variant="caption" color="text.secondary">
                    {assignee.email}
                  </Typography>
                )}
              </Stack>
              <Chip
                label={assignee.type === 'team' ? 'Team' : 'Trainee'}
                size="small"
                sx={{
                  bgcolor: '#F5F6FF',
                  color: '#444CE7',
                  height: 24,
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: '12px',
                  },
                }}
              />
            </Stack>
          </MenuItem>
        ))
      )}
    </>
  );
};

export default AssigneeSearchFilter;