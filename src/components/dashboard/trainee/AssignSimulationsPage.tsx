import React, { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  Box,
  Tabs,
  Tab,
  SelectChangeEvent,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  LockOutlined as LockIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import DashboardContent from '../DashboardContent';
import AssignTrainingPlanDialog from './AssignTrainingPlanDialog';
import AssignModuleDialog from './AssignModuleDialog';
import AssignSimulationsDialog from './AssignSimulationsDialog';
import { fetchAssignments, type Assignment } from '../../../services/assignments';
import { fetchUsersByIds, type User } from '../../../services/users';
import { fetchTeams, type Team } from '../../../services/teams';
import { useAuth } from '../../../context/AuthContext';
import { hasCreatePermission } from '../../../utils/permissions';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';

const formatDate = (dateString: string) => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

type Order = 'asc' | 'desc';
type OrderBy = 'name' | 'type' | 'teams' | 'trainees' | 'start_date' | 'end_date' | 'status' | 'last_modified_at' | 'last_modified_by' | 'created_at' | 'created_by';

const AssignSimulationsPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Check if user has create permission for assign-simulations
  const canAssignSimulations = hasCreatePermission('assign-simulations');

  // Filter data based on current tab and search query
  const filteredData = assignments.filter((item) => {
    // First apply tab filter
    if (currentTab === 'Training Plans' && item.type !== 'TrainingPlan') {
      return false;
    }
    if (currentTab === 'Modules' && item.type !== 'Module') {
      return false;
    }
    if (currentTab === 'Simulations' && item.type !== 'Simulation') {
      return false;
    }

    // Then apply search filter
    if (searchQuery && !item.name?.toLowerCase().includes(searchQuery.trim().toLowerCase())) {
      return false;
    }

    return true;
  });

  const getButtonText = () => {
    switch (currentTab) {
      case 'Modules':
        return 'Assign Module';
      case 'Simulations':
        return 'Assign Simulation';
      default:
        return 'Assign Training Plan';
    }
  };

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAssignments();
        setAssignments(data);
      } catch (err) {
        setError('Failed to load assignments');
        console.error('Error loading assignments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAssignDialog = () => {
    if (currentTab === 'Modules') {
      setIsModuleDialogOpen(true);
    } else if (currentTab === 'Simulations') {
      setIsSimulationDialogOpen(true);
    } else {
      setIsAssignDialogOpen(true);
    }
  };

  const handleCloseAssignDialog = () => {
    setIsAssignDialogOpen(false);
  };

  const handleCloseModuleDialog = () => {
    setIsModuleDialogOpen(false);
  };

  const handleCloseSimulationDialog = () => {
    setIsSimulationDialogOpen(false);
  };

  const handleAssignmentCreated = () => {
    // Refresh the assignments list
    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchAssignments();
        setAssignments(data);
      } catch (err) {
        setError('Failed to load assignments');
        console.error('Error loading assignments:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleRowClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsDialogOpen(true);
  };

  const sortedData = React.useMemo(() => {
    if (!filteredData.length) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'teams':
          aValue = a.team_id?.length || 0;
          bValue = b.team_id?.length || 0;
          break;
        case 'trainees':
          aValue = a.trainee_id?.length || 0;
          bValue = b.trainee_id?.length || 0;
          break;
        case 'start_date':
          aValue = new Date(a.start_date || 0).getTime();
          bValue = new Date(b.start_date || 0).getTime();
          break;
        case 'end_date':
          aValue = new Date(a.end_date || 0).getTime();
          bValue = new Date(b.end_date || 0).getTime();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'last_modified_at':
          aValue = new Date(a.last_modified_at || 0).getTime();
          bValue = new Date(b.last_modified_at || 0).getTime();
          break;
        case 'last_modified_by':
          aValue = a.last_modified_by || '';
          bValue = b.last_modified_by || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'created_by':
          aValue = a.created_by || '';
          bValue = b.created_by || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const result = (aValue < bValue) ? -1 : (aValue > bValue) ? 1 : 0;
      return order === 'asc' ? result : -result;
    });
  }, [filteredData, order, orderBy]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 4 }}>
          {/* Header */}
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Assign Simulations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Assign simulation, modules and training plan to the trainee
            </Typography>
          </Stack>

          {/* Tabs and Create Button */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 3,
                  bgcolor: '#F9FAFB',
                  color: '#AEAFB0',
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: '#EDEFF1',
                  },
                  '&.Mui-selected': {
                    color: '#323232',
                    fontWeight: 'bold',
                  },
                },
              }}
            >
              <Tab label="Training Plans" value="Training Plans" />
              <Tab label="Modules" value="Modules" />
              <Tab label="Simulations" value="Simulations" />
            </Tabs>
            <Button
              variant="contained"
              onClick={handleOpenAssignDialog}
              disabled={!canAssignSimulations}
              sx={{
                bgcolor: '#444CE7',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
                '&.Mui-disabled': {
                  bgcolor: 'rgba(68, 76, 231, 0.3)',
                  color: 'white',
                },
              }}
            >
              {getButtonText()}
            </Button>
          </Stack>

          {/* Filters */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{
              bgcolor: '#F9FAFB',
              p: 1.5,
              borderRadius: 2,
            }}
          >
            <TextField
              placeholder="Search by Assignment Name or ID"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{
                width: 300,
                bgcolor: '#FFFFFF',
                borderRadius: 10,
                '& .MuiInputBase-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                      aria-label="clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
              <Select
                value={selectedTags}
                onChange={(e: SelectChangeEvent) => setSelectedTags(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All Tags">All Tags</MenuItem>
              </Select>
              <Select
                value={selectedStatus}
                onChange={(e: SelectChangeEvent) => setSelectedStatus(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="All Status">All Status</MenuItem>
              </Select>
              <Select
                value={selectedCreator}
                onChange={(e: SelectChangeEvent) => setSelectedCreator(e.target.value)}
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: '#FFFFFF',
                  borderRadius: 2,
                }}
              >
                <MenuItem value="Created By">Created By</MenuItem>
              </Select>
            </Stack>
          </Stack>

          {/* Table */}
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', my: 4 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box 
              sx={{ 
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: '#c1c1c1',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#a8a8a8',
                  },
                },
                scrollbarWidth: 'thin',
                scrollbarColor: '#c1c1c1 #f1f1f1',
              }}
            >
              <Table sx={{ minWidth: 1500, borderRadius: 2, overflow: 'hidden', tableLayout: 'fixed' }}>
                <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 250 }}>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        Assignment Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'type'}
                        direction={orderBy === 'type' ? order : 'asc'}
                        onClick={() => handleRequestSort('type')}
                      >
                        Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'teams'}
                        direction={orderBy === 'teams' ? order : 'asc'}
                        onClick={() => handleRequestSort('teams')}
                      >
                        Teams
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'trainees'}
                        direction={orderBy === 'trainees' ? order : 'asc'}
                        onClick={() => handleRequestSort('trainees')}
                      >
                        Trainees
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'start_date'}
                        direction={orderBy === 'start_date' ? order : 'asc'}
                        onClick={() => handleRequestSort('start_date')}
                      >
                        Start Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'end_date'}
                        direction={orderBy === 'end_date' ? order : 'asc'}
                        onClick={() => handleRequestSort('end_date')}
                      >
                        Due Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 180 }}>
                      <TableSortLabel
                        active={orderBy === 'last_modified_at'}
                        direction={orderBy === 'last_modified_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('last_modified_at')}
                      >
                        Last Modified
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'last_modified_by'}
                        direction={orderBy === 'last_modified_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('last_modified_by')}
                      >
                        Modified by
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 180 }}>
                      <TableSortLabel
                        active={orderBy === 'created_at'}
                        direction={orderBy === 'created_at' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_at')}
                      >
                        Created On
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px' }}>
                      <TableSortLabel
                        active={orderBy === 'created_by'}
                        direction={orderBy === 'created_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_by')}
                      >
                        Created by
                      </TableSortLabel>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow 
                        key={index}
                        onClick={() => handleRowClick(row)}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <TableCell sx={{ minWidth: 250 }}>
                          {row.name || 'Untitled Assignment'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.type}
                            size="small"
                            sx={{
                              bgcolor: '#F5F6FF',
                              color: '#444CE7',
                            }}
                          />
                        </TableCell>
                        <TableCell>{row.team_id?.length || 0} Teams</TableCell>
                        <TableCell>{row.trainee_id?.length || 0} Trainees</TableCell>
                        <TableCell>{formatDate(row.start_date)}</TableCell>
                        <TableCell>{formatDate(row.end_date)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                bgcolor: '#F5F6FF',
                                color: '#444CE7',
                              }}
                            />
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Stack>
                            <Typography variant="body2">{formatDate(row.last_modified_at)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(row.last_modified_at).toLocaleTimeString()}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" noWrap>{row.last_modified_by}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Stack>
                            <Typography variant="body2">{formatDate(row.created_at)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(row.created_at).toLocaleTimeString()}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack>
                            <Typography variant="body2" noWrap>{row.created_by}</Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </Box>
            <Box
              sx={{
                bgcolor: '#F9FAFB',
                borderTop: '1px solid rgba(224, 224, 224, 1)',
              }}
            >
              <TablePagination
                component="div"
                count={filteredData.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
              />
            </Box>
          </TableContainer>
          )}
        </Stack>
      </Container>

      <AssignTrainingPlanDialog
        open={isAssignDialogOpen}
        onClose={handleCloseAssignDialog}
        onAssignmentCreated={handleAssignmentCreated}
      />
      <AssignModuleDialog
        open={isModuleDialogOpen}
        onClose={handleCloseModuleDialog}
        onAssignmentCreated={handleAssignmentCreated}
      />
      <AssignSimulationsDialog
        open={isSimulationDialogOpen}
        onClose={handleCloseSimulationDialog}
        onAssignmentCreated={handleAssignmentCreated}
      />
      <AssignmentDetailsDialog
        open={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        assignment={selectedAssignment}
      />
    </DashboardContent>
  );
};

export default AssignSimulationsPage;