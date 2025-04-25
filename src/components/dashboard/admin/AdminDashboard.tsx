import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Stack, 
  Typography, 
  Box, 
  Card, 
  Grid, 
  CircularProgress, 
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
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import DashboardContent from '../DashboardContent';
import { useAuth } from '../../../context/AuthContext';
// import { fetchAdminDashboardData, fetchUserActivityLog } from '../../../services/admin';
// import { adminDashboardData } from '../../../services/mockData/adminDashboard';

const adminDashboardData = {
  platformStats: {
    newUsers: {
      total: 240,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    },
    activeUsers: {
      total: 7876,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    },
    deactivatedUsers: {
      total: 240,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    },
    dailyActiveUsers: {
      total: 873,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    },
    weeklyActiveUsers: {
      total: 7876,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    },
    monthlyActiveUsers: {
      total: 29898,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199
      }
    }
  },
  userActivity: [
    {
      id: 1,
      name: 'John Doe',
      email: 'johndoe@humana.com',
      role: 'Trainee',
      division: 'EverAI Labs',
      department: 'Engineering',
      addedOn: '25 Dec 2024',
      status: 'Active',
      assignedSimulations: 24
    },
    {
      id: 2,
      name: 'John Doe',
      email: 'johndoe@humana.com',
      role: 'Trainee',
      division: 'EverAI Labs',
      department: 'Engineering',
      addedOn: '25 Dec 2024',
      status: 'Active',
      assignedSimulations: 24
    },
    {
      id: 3,
      name: 'John Doe',
      email: 'johndoe@humana.com',
      role: 'Trainee',
      division: 'EverAI Labs',
      department: 'Engineering',
      addedOn: '25 Dec 2024',
      status: 'Active',
      assignedSimulations: 24
    },
    {
      id: 4,
      name: 'John Doe',
      email: 'johndoe@humana.com',
      role: 'Trainee',
      division: 'EverAI Labs',
      department: 'Engineering',
      addedOn: '25 Dec 2024',
      status: 'Active',
      assignedSimulations: 24
    },
    {
      id: 5,
      name: 'Jane Smith',
      email: 'janesmith@humana.com',
      role: 'Manager',
      division: 'EverAI Labs',
      department: 'Product',
      addedOn: '20 Dec 2024',
      status: 'Active',
      assignedSimulations: 12
    },
    {
      id: 6,
      name: 'Robert Johnson',
      email: 'robertjohnson@humana.com',
      role: 'Designer',
      division: 'EverAI Labs',
      department: 'Design',
      addedOn: '18 Dec 2024',
      status: 'Inactive',
      assignedSimulations: 8
    },
    {
      id: 7,
      name: 'Emily Davis',
      email: 'emilydavis@humana.com',
      role: 'Admin',
      division: 'EverAI Labs',
      department: 'Operations',
      addedOn: '15 Dec 2024',
      status: 'Active',
      assignedSimulations: 0
    }
  ],
  totalUsers: 110
};

// UserStatsCard component
const UserStatsCard = ({ title, total, breakdown, icon }) => {
  return (
    <Card sx={{ p: 2, borderRadius: 2, height: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <InfoIcon fontSize="small" color="action" />
        </Stack>

        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', my: 2 }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={180}
            thickness={8}
            sx={{ color: '#F5F6FF', position: 'absolute' }}
          />
          <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h3" fontWeight="bold">{total.toLocaleString()}</Typography>
          </Box>
        </Box>

        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#444CE7', mr: 1 }} />
              <Typography variant="body2">Admin</Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">{breakdown.admin}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#7F56D9', mr: 1 }} />
              <Typography variant="body2">Manager</Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">{breakdown.manager}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F63D68', mr: 1 }} />
              <Typography variant="body2">Designer</Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">{breakdown.designer}</Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#F79009', mr: 1 }} />
              <Typography variant="body2">Trainees</Typography>
            </Box>
            <Typography variant="body2" fontWeight="medium">{breakdown.trainees}</Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(adminDashboardData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [department, setDepartment] = useState('All Department');
  const [division, setDivision] = useState('All Divisions');
  const [role, setRole] = useState('All Roles');
  const [status, setStatus] = useState('All Status');
  const [timeframe, setTimeframe] = useState('All Time');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [userActivityData, setUserActivityData] = useState({
    users: adminDashboardData.userActivity,
    total: adminDashboardData.totalUsers
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          // In a real implementation, we would fetch data from the API
          // const data = await fetchAdminDashboardData(user.id);
          // setDashboardData(data);

          // For now, we'll use mock data
          setDashboardData(adminDashboardData);
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

  useEffect(() => {
    const loadUserActivity = async () => {
      try {
        // In a real implementation, we would fetch data from the API with filters
        const data = await fetchUserActivityLog({
          department: department !== 'All Department' ? department : undefined,
          division: division !== 'All Divisions' ? division : undefined,
          role: role !== 'All Roles' ? role : undefined,
          status: status !== 'All Status' ? status : undefined,
          timeframe: timeframe !== 'All Time' ? timeframe : undefined,
          search: searchQuery,
          page,
          limit: rowsPerPage
        });

        setUserActivityData(data);
      } catch (error) {
        console.error('Error loading user activity:', error);
      }
    };

    loadUserActivity();
  }, [searchQuery, department, division, role, status, timeframe, page, rowsPerPage]);

  const handleChangePage = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage - 1);
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent<string>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    setDepartment(event.target.value);
  };

  const handleDivisionChange = (event: SelectChangeEvent<string>) => {
    setDivision(event.target.value);
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRole(event.target.value);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value);
  };

  const handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    setTimeframe(event.target.value);
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" fontWeight="medium">
              Simulator Platform Stats
            </Typography>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={timeframe}
                onChange={handleTimeframeChange}
                displayEmpty
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="All Time">All Time</MenuItem>
                <MenuItem value="Today">Today</MenuItem>
                <MenuItem value="This Week">This Week</MenuItem>
                <MenuItem value="This Month">This Month</MenuItem>
                <MenuItem value="This Year">This Year</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* First row of stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="New Users Onboarded" 
                total={dashboardData.platformStats.newUsers.total}
                breakdown={dashboardData.platformStats.newUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="Active Users" 
                total={dashboardData.platformStats.activeUsers.total}
                breakdown={dashboardData.platformStats.activeUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="Deactivated Users" 
                total={dashboardData.platformStats.deactivatedUsers.total}
                breakdown={dashboardData.platformStats.deactivatedUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
          </Grid>

          {/* Second row of stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="Daily Active Users (DAU)" 
                total={dashboardData.platformStats.dailyActiveUsers.total}
                breakdown={dashboardData.platformStats.dailyActiveUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="Weekly Active Users (WAU)" 
                total={dashboardData.platformStats.weeklyActiveUsers.total}
                breakdown={dashboardData.platformStats.weeklyActiveUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <UserStatsCard 
                title="Monthly Active Users (MAU)" 
                total={dashboardData.platformStats.monthlyActiveUsers.total}
                breakdown={dashboardData.platformStats.monthlyActiveUsers.breakdown}
                icon={<InfoIcon />}
              />
            </Grid>
          </Grid>

          {/* User Status and Activity Log */}
          <Typography variant="h5" fontWeight="medium">
            User Status and Activity Log
          </Typography>

          {/* Search and Filters */}
          <Stack direction="row" spacing={2} justifyContent="space-between">
            <TextField
              placeholder="Search by Assignment Name or ID"
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
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={department}
                  onChange={handleDepartmentChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All Department">All Department</MenuItem>
                  <MenuItem value="Engineering">Engineering</MenuItem>
                  <MenuItem value="Product">Product</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <Select
                  value={division}
                  onChange={handleDivisionChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All Divisions">All Divisions</MenuItem>
                  <MenuItem value="EverAI Labs">EverAI Labs</MenuItem>
                  <MenuItem value="Product Development">Product Development</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={role}
                  onChange={handleRoleChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All Roles">All Roles</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="Designer">Designer</MenuItem>
                  <MenuItem value="Trainee">Trainee</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={status}
                  onChange={handleStatusChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All Status">All Status</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={timeframe}
                  onChange={handleTimeframeChange}
                  displayEmpty
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="All Time">All Time</MenuItem>
                  <MenuItem value="Today">Today</MenuItem>
                  <MenuItem value="This Week">This Week</MenuItem>
                  <MenuItem value="This Month">This Month</MenuItem>
                  <MenuItem value="This Year">This Year</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {/* User Activity Table */}
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell>Name & Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Division & Department</TableCell>
                  <TableCell>Added On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Simulations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userActivityData.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2" fontWeight="medium">{user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        sx={{ 
                          bgcolor: '#F5F6FF',
                          color: '#444CE7',
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack>
                        <Typography variant="body2">{user.division}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.department}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{user.addedOn}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status} 
                        size="small" 
                        sx={{ 
                          bgcolor: user.status === 'Active' ? '#ECFDF3' : '#FEF3F2',
                          color: user.status === 'Active' ? '#027A48' : '#B42318',
                          fontWeight: 'medium'
                        }}
                      />
                    </TableCell>
                    <TableCell>{user.assignedSimulations}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={rowsPerPage.toString()}
                onChange={handleChangeRowsPerPage}
                displayEmpty
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                {`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, userActivityData.total)} of ${userActivityData.total}`}
              </Typography>

              <IconButton disabled={page === 0}>
                <ChevronLeftIcon />
              </IconButton>

              <IconButton disabled={page >= Math.ceil(userActivityData.total / rowsPerPage) - 1}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default AdminDashboard;