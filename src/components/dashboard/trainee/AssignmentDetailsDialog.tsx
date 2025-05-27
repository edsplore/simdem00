import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  IconButton,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { Assignment } from '../../../services/assignments';
import { fetchUsersByIds, type User } from '../../../services/users';
import { fetchTeams, type Team } from '../../../services/teams';
import { useAuth } from '../../../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`assignment-tabpanel-${index}`}
      aria-labelledby={`assignment-tab-${index}`}
      {...other}
      style={{ maxHeight: '400px', overflowY: 'auto' }}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `assignment-tab-${index}`,
    'aria-controls': `assignment-tabpanel-${index}`,
  };
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface AssignmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment | null;
}

const AssignmentDetailsDialog: React.FC<AssignmentDetailsDialogProps> = ({ 
  open, 
  onClose, 
  assignment 
}) => {
  const { currentWorkspaceId } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const loadAssignmentDetails = async () => {
      if (!open || !assignment || !currentWorkspaceId) return;

      setIsLoading(true);
      setError(null);

      try {

        // Load users and teams in parallel
        const [usersData, teamsResponse] = await Promise.all([
          // Only fetch users if there are trainee IDs
          assignment.trainee_id && assignment.trainee_id.length > 0 
            ? fetchUsersByIds(currentWorkspaceId, assignment.trainee_id)
            : Promise.resolve([]),
          // Only fetch teams if there are team IDs
          assignment.team_id && assignment.team_id.length > 0
            ? fetchTeams(currentWorkspaceId)
            : Promise.resolve({ teams: [], items: [] })
        ]);


        setUsers(usersData);

        // Handle different team response structures
        let teamsList: Team[] = [];

        if (teamsResponse.teams && Array.isArray(teamsResponse.teams)) {
          teamsList = teamsResponse.teams;
        } else if (teamsResponse.items && Array.isArray(teamsResponse.items)) {
          teamsList = teamsResponse.items;
        }


        // Filter teams to only include those in the assignment
        if (assignment.team_id && assignment.team_id.length > 0) {
          const filteredTeams = teamsList.filter(team => 
            assignment.team_id.includes(team.team_id)
          );
          setTeams(filteredTeams);
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('Error loading assignment details:', error);
        setError('Failed to load assignment details');
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignmentDetails();
  }, [open, assignment, currentWorkspaceId]);

  // Reset tab to first tab when dialog opens
  useEffect(() => {
    if (open) {
      setTabValue(0);
    }
  }, [open]);

  if (!assignment) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Assignment Details
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="assignment details tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={
              <Badge badgeContent={teams.length} color="primary" showZero>
                <GroupIcon />
              </Badge>
            } 
            label="Teams" 
            {...a11yProps(0)} 
          />
          <Tab 
            icon={
              <Badge badgeContent={users.length} color="primary" showZero>
                <PersonIcon />
              </Badge>
            } 
            label="Trainees" 
            {...a11yProps(1)} 
          />
        </Tabs>
      </Box>
      <DialogContent sx={{ p: 3 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {teams.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  {teams.map((team, index) => (
                    <React.Fragment key={team.team_id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#F5F6FF' }}>
                            <GroupIcon sx={{ color: '#444CE7' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {team.team_name || team.name || `Team ${index + 1}`}
                            </Typography>
                          }
                          secondary={
                            <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                {team.member_user_ids?.length || team.team_members_count || 0} members
                              </Typography>
                              {team.leader && (
                                <Typography variant="body2" color="text.secondary">
                                  Leader: {team.leader.name}
                                </Typography>
                              )}
                              {team.status && (
                                <Chip 
                                  label={team.status} 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    bgcolor: '#F5F6FF',
                                    color: '#444CE7',
                                    mt: 0.5,
                                    width: 'fit-content'
                                  }}
                                />
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                      {index < teams.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: '#F5F6FF' }}>
                    <GroupIcon sx={{ color: '#444CE7', fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    No Teams Assigned
                  </Typography>                  
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {users.length > 0 ? (
                <List sx={{ bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  {users.map((user, index) => (
                    <React.Fragment key={user.user_id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: '#F5F6FF' }}>
                            <PersonIcon sx={{ color: '#444CE7' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body1" fontWeight="medium">
                              {user.fullName || `${user.first_name} ${user.last_name}`}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {user.email}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < users.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: '#F5F6FF' }}>
                    <PersonIcon sx={{ color: '#444CE7', fontSize: 30 }} />
                  </Avatar>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    No Trainees Assigned
                  </Typography>                  
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDetailsDialog;
