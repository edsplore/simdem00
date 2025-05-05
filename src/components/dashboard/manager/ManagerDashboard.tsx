import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Stack, 
  Typography, 
  Box, 
  Card, 
  Grid, 
  CircularProgress, 
  Tabs, 
  Tab, 
  TextField, 
  InputAdornment,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Chip
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import DashboardContent from '../DashboardContent';
import { useAuth } from '../../../context/AuthContext';
// import { fetchManagerDashboardData } from '../../../services/manager';

// Mock data for the dashboard
const mockData = {
  assignmentCounts: {
    trainingPlans: {
      total: 43,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10
    },
    modules: {
      total: 240,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10
    },
    simulations: {
      total: 240,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10
    }
  },
  completionRates: {
    trainingPlan: 25,
    modules: 55,
    simulation: 85
  },
  averageScores: {
    trainingPlan: 89,
    modules: 94,
    simulation: 94
  },
  adherenceRates: {
    trainingPlan: 89,
    modules: 94,
    simulation: 94
  },
  leaderBoards: {
    completion: [
      { team: 'Team 01', score: 95 },
      { team: 'Team 01', score: 85 },
      { team: 'Team 01', score: 80 },
      { team: 'Team 01', score: 60 },
      { team: 'Team 01', score: 37 }
    ],
    averageScore: [
      { team: 'Team 01', score: 95 },
      { team: 'Team 01', score: 85 },
      { team: 'Team 01', score: 80 },
      { team: 'Team 01', score: 60 },
      { team: 'Team 01', score: 37 }
    ],
    adherence: [
      { team: 'Team 01', score: 95 },
      { team: 'Team 01', score: 85 },
      { team: 'Team 01', score: 80 },
      { team: 'Team 01', score: 60 },
      { team: 'Team 01', score: 37 }
    ]
  },
  trainingPlans: [
    {
      id: '45789',
      name: 'Training_Plan_01',
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: '15 mins',
      trainees: [
        { name: 'Abhinav', classId: '82840', status: 'In Progress', dueDate: '25 Dec 2024', avgScore: null },
        { name: 'Abhinav', classId: '82840', status: 'Not Started', dueDate: '25 Dec 2024', avgScore: null },
        { name: 'Abhinav', classId: '82840', status: 'Completed', dueDate: '25 Dec 2024', avgScore: 86 }
      ]
    },
    {
      id: '45789',
      name: 'Training_Plan_01',
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: '15 mins',
      trainees: []
    },
    {
      id: '45789',
      name: 'Training_Plan_01',
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: '15 mins',
      trainees: []
    },
    {
      id: '45789',
      name: 'Training_Plan_01',
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: '15 mins',
      trainees: []
    }
  ]
};

// CircularProgressWithLabel component
const CircularProgressWithLabel = ({ value, size = 200, thickness = 8 }) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ color: '#F5F6FF' }}
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={size}
          thickness={thickness}
          sx={{
            color: '#444CE7',
            position: 'absolute',
            left: 0,
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="h3" component="div" color="text.primary" fontWeight="bold">
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// LeaderBoard component
const LeaderBoard = ({ data, title, sortBy = 'High to Low' }) => {
  return (
    <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              Sort by: {sortBy}
            </Typography>
            <InfoIcon fontSize="small" color="action" />
          </Box>
        </Stack>

        {data.map((item, index) => (
          <Box key={index} sx={{ position: 'relative', mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 0.5 }}>{item.team}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box
                sx={{
                  height: 8,
                  borderRadius: 4,
                  width: `${item.score}%`,
                  bgcolor: '#444CE7',
                  position: 'relative',
                  zIndex: 1,
                }}
              />
              <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                {item.score}%
              </Typography>
            </Box>
          </Box>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">0</Typography>
          <Typography variant="caption" color="text.secondary">20%</Typography>
          <Typography variant="caption" color="text.secondary">40%</Typography>
          <Typography variant="caption" color="text.secondary">60%</Typography>
          <Typography variant="caption" color="text.secondary">80%</Typography>
          <Typography variant="caption" color="text.secondary">100%</Typography>
        </Box>
      </Stack>
    </Card>
  );
};

// AssignmentCard component
const AssignmentCard = ({ title, total, completed, inProgress, notStarted, overdue }) => {
  return (
    <Card sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <InfoIcon fontSize="small" color="action" />
        </Stack>

        <Typography variant="h2" fontWeight="bold">{total}</Typography>

        <Grid container spacing={1}>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#ECFDF3', p: 1, borderRadius: 1 }}>
              <Typography variant="body2" color="#027A48">Completed: {completed}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#F5F6FF', p: 1, borderRadius: 1 }}>
              <Typography variant="body2" color="#444CE7">In Progress: {inProgress}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#FFFAEB', p: 1, borderRadius: 1 }}>
              <Typography variant="body2" color="#B54708">Not started: {notStarted}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box sx={{ bgcolor: '#FEF3F2', p: 1, borderRadius: 1 }}>
              <Typography variant="body2" color="#B42318">Overdue: {overdue}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );
};

// TrainingPlanTable component
const TrainingPlanTable = ({ trainingPlans }) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return { bg: '#ECFDF3', color: '#027A48' };
      case 'In Progress':
        return { bg: '#F5F6FF', color: '#444CE7' };
      case 'Not Started':
        return { bg: '#FFFAEB', color: '#B54708' };
      default:
        return { bg: '#F9FAFB', color: '#6D7295' };
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: '#F9FAFB' }}>
          <TableRow>
            <TableCell>ID No.</TableCell>
            <TableCell>TRP Name</TableCell>
            <TableCell>Assigned Trainees</TableCell>
            <TableCell>Completion rate</TableCell>
            <TableCell>Adherence Rate</TableCell>
            <TableCell>Avg. Score</TableCell>
            <TableCell>Est. Time</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trainingPlans.map((plan, index) => (
            <React.Fragment key={`${plan.id}-${index}`}>
              <TableRow>
                <TableCell>{plan.id}</TableCell>
                <TableCell>{plan.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleRow(`${plan.id}-${index}`)}>
                    {plan.assignedTrainees}
                    {plan.trainees.length > 0 && (
                      expandedRows[`${plan.id}-${index}`] ? 
                        <ExpandLessIcon fontSize="small" sx={{ ml: 1 }} /> : 
                        <ExpandMoreIcon fontSize="small" sx={{ ml: 1 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#027A48', fontWeight: 'medium' }}>{plan.completionRate}%</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#B54708', fontWeight: 'medium' }}>{plan.adherenceRate}%</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ color: '#027A48', fontWeight: 'medium' }}>{plan.avgScore}%</Typography>
                </TableCell>
                <TableCell>{plan.estTime}</TableCell>
                <TableCell>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>

              {/* Expanded row for trainees */}
              {plan.trainees.length > 0 && (
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                    <Collapse in={expandedRows[`${plan.id}-${index}`]} timeout="auto" unmountOnExit>
                      <Box sx={{ margin: 1 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell></TableCell>
                              <TableCell>Trainee Name</TableCell>
                              <TableCell>Class ID</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Due Date</TableCell>
                              <TableCell>Avg. Score</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {plan.trainees.map((trainee, idx) => (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Box 
                                    sx={{ 
                                      width: 8, 
                                      height: 8, 
                                      borderRadius: '50%', 
                                      bgcolor: getStatusColor(trainee.status).color 
                                    }} 
                                  />
                                </TableCell>
                                <TableCell>{trainee.name}</TableCell>
                                <TableCell>{trainee.classId}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={trainee.status} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: getStatusColor(trainee.status).bg,
                                      color: getStatusColor(trainee.status).color,
                                      fontWeight: 'medium'
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{trainee.dueDate}</TableCell>
                                <TableCell>
                                  {trainee.avgScore ? 
                                    <Typography sx={{ color: '#027A48', fontWeight: 'medium' }}>{trainee.avgScore}%</Typography> : 
                                    'NA'
                                  }
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          // In a real implementation, we would fetch data from the API
          // const data = await fetchManagerDashboardData(user.id);
          // setDashboardData(data);

          // For now, we'll use mock data
          setDashboardData(mockData);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setError('Failed to load dashboard data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();
  }, [user?.id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <Container>
          <Typography color="error" sx={{ mt: 4 }}>
            {error}
          </Typography>
        </Container>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <Stack spacing={4} sx={{ py: 4 }}>
          {/* Header */}
          <Typography variant="h4" fontWeight="medium">
            My Team's Assignment and Progress
          </Typography>

          {/* Assignment Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <AssignmentCard 
                title="Training Plans Assigned" 
                total={dashboardData.assignmentCounts.trainingPlans.total}
                completed={dashboardData.assignmentCounts.trainingPlans.completed}
                inProgress={dashboardData.assignmentCounts.trainingPlans.inProgress}
                notStarted={dashboardData.assignmentCounts.trainingPlans.notStarted}
                overdue={dashboardData.assignmentCounts.trainingPlans.overdue}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AssignmentCard 
                title="Modules Assigned" 
                total={dashboardData.assignmentCounts.modules.total}
                completed={dashboardData.assignmentCounts.modules.completed}
                inProgress={dashboardData.assignmentCounts.modules.inProgress}
                notStarted={dashboardData.assignmentCounts.modules.notStarted}
                overdue={dashboardData.assignmentCounts.modules.overdue}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <AssignmentCard 
                title="Simulation Assigned" 
                total={dashboardData.assignmentCounts.simulations.total}
                completed={dashboardData.assignmentCounts.simulations.completed}
                inProgress={dashboardData.assignmentCounts.simulations.inProgress}
                notStarted={dashboardData.assignmentCounts.simulations.notStarted}
                overdue={dashboardData.assignmentCounts.simulations.overdue}
              />
            </Grid>
          </Grid>

          {/* Completion Rate Section */}
          <Typography variant="h5" fontWeight="medium">
            Completion Rate
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Training Plan</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.completionRates.trainingPlan} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Modules</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.completionRates.modules} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Simulation</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.completionRates.simulation} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <LeaderBoard 
                data={dashboardData.leaderBoards.completion} 
                title="Completion Rate Leader Board" 
                sortBy="High to Low"
              />
            </Grid>
          </Grid>

          {/* Average Score Section */}
          <Typography variant="h5" fontWeight="medium">
            Average Score
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Training Plan</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.averageScores.trainingPlan} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Modules</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.averageScores.modules} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Simulation</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.averageScores.simulation} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <LeaderBoard 
                data={dashboardData.leaderBoards.averageScore} 
                title="Average Score Leader Board" 
                sortBy="High to Low"
              />
            </Grid>
          </Grid>

          {/* Adherence Rate Section */}
          <Typography variant="h5" fontWeight="medium">
            Adherence Rate (On-Time Completion Rate)
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Training Plan</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.adherenceRates.trainingPlan} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Modules</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.adherenceRates.modules} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ p: 2, height: '100%', borderRadius: 2 }}>
                <Stack spacing={2} alignItems="center">
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: '100%' }}>
                    <Typography variant="h6">Simulation</Typography>
                    <InfoIcon fontSize="small" color="action" />
                  </Stack>
                  <CircularProgressWithLabel value={dashboardData.adherenceRates.simulation} />
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <LeaderBoard 
                data={dashboardData.leaderBoards.adherence} 
                title="Adherence Rate Leader Board" 
                sortBy="High to Low"
              />
            </Grid>
          </Grid>

          {/* Training Plans/Modules/Simulations Tabs */}
          <Box>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 'medium',
                  minWidth: 120,
                },
                '& .Mui-selected': {
                  color: '#444CE7',
                  fontWeight: 'bold',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#444CE7',
                  height: 3,
                }
              }}
            >
              <Tab label="Training Plans" value="Training Plans" />
              <Tab label="Modules" value="Modules" />
              <Tab label="Simulations" value="Simulations" />
            </Tabs>
          </Box>

          {/* Search and Filters */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <TextField
              placeholder="Search by Training Plan Name or ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 300 }}
              size="small"
            />

            <Stack direction="row" spacing={2}>
              <Select
                value="All Teams"
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="All Teams">All Teams</MenuItem>
              </Select>

              <Select
                value="All Time"
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="All Time">All Time</MenuItem>
              </Select>

              <Select
                value="All Creators"
                size="small"
                sx={{ minWidth: 120 }}
              >
                <MenuItem value="All Creators">All Creators</MenuItem>
              </Select>
            </Stack>
          </Stack>

          {/* Training Plans Table */}
          {activeTab === 'Training Plans' && (
            <TrainingPlanTable trainingPlans={dashboardData.trainingPlans} />
          )}

          {/* Modules Table - Would be similar to Training Plans but with module-specific data */}
          {activeTab === 'Modules' && (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Modules data would be displayed here
            </Typography>
          )}

          {/* Simulations Table - Would be similar to Training Plans but with simulation-specific data */}
          {activeTab === 'Simulations' && (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              Simulations data would be displayed here
            </Typography>
          )}
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default ManagerDashboard;