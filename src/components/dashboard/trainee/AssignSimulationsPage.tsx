import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  IconButton,
  Box,
  Tabs,
  Tab,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TableSortLabel,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import DashboardContent from '../DashboardContent';
import AssignTrainingPlanDialog from './AssignTrainingPlanDialog';
import AssignModuleDialog from './AssignModuleDialog';
import AssignSimulationsDialog from './AssignSimulationsDialog';
import { 
  fetchAssignments, 
  type Assignment, 
  type AssignmentPaginationParams,
} from '../../../services/assignments';
import { fetchUsersByIds, fetchUsersSummary, type User } from '../../../services/users';
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

// Map frontend OrderBy to backend sortBy
const orderByToSortBy: Record<OrderBy, string> = {
  name: "name",
  type: "type",
  teams: "teamCount",
  trainees: "traineeCount",
  start_date: "startDate",
  end_date: "endDate",
  status: "status",
  last_modified_at: "lastModifiedAt",
  last_modified_by: "lastModifiedBy",
  created_at: "createdAt",
  created_by: "createdBy"
};

const AssignSimulationsPage = () => {
  const { user, currentWorkspaceId } = useAuth();
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);
  const [isSimulationDialogOpen, setIsSimulationDialogOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('last_modified_at');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  // State for user name mapping
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Check if user has create permission for assign-simulations
  const canAssignSimulations = hasCreatePermission('assign-simulations');

  // Create a memoized pagination params object
  const paginationParams = useMemo<AssignmentPaginationParams>(() => {
    
    
    
    const params: AssignmentPaginationParams = {
      page: page + 1, // API uses 1-based indexing
      pagesize: rowsPerPage,
      sortBy: orderByToSortBy[orderBy],
      sortDir: order
    };

    // Add filters if they're not set to "All"
    if (searchQuery) {
      params.search = searchQuery;
    }

    if (selectedCreator !== "Created By") {
      params.createdBy = selectedCreator;
    }

    // Add type filter based on current tab
    if (currentTab === 'Training Plans') {
      params.type = 'TrainingPlan';
    } else if (currentTab === 'Modules') {
      params.type = 'Module';
    } else if (currentTab === 'Simulations') {
      params.type = 'Simulation';
    }

    return params;
  }, [
    page,
    rowsPerPage,
    orderBy,
    order,
    searchQuery,
    selectedCreator,
    currentTab
  ]);

  // Function to fetch user details for creator and modifier IDs
  const fetchUserDetails = useCallback(async (assignments: Assignment[]) => {
    if (!currentWorkspaceId || assignments.length === 0) return;

    try {
      // Collect all unique user IDs from created_by and modified_by fields
      const userIds = new Set<string>();
      assignments.forEach(assignment => {
        if (assignment.created_by && !userMap[assignment.created_by]) {
          userIds.add(assignment.created_by);
        }
        if (assignment.last_modified_by && !userMap[assignment.last_modified_by]) {
          userIds.add(assignment.last_modified_by);
        }
      });

      // Skip API call if we already have all user details
      if (userIds.size === 0) return;

      const userIdsArray = Array.from(userIds);

      const usersData = await fetchUsersByIds(currentWorkspaceId, userIdsArray);

      // Create a mapping of user IDs to full names
      const newUserMap: Record<string, string> = { ...userMap };

      usersData.forEach(userData => {
        if (userData.user_id) {
          // Use fullName if available, otherwise construct from first and last name
          const fullName = userData.fullName || 
            `${userData.first_name || ''} ${userData.last_name || ''}`.trim();

          newUserMap[userData.user_id] = fullName || userData.user_id;
        }
      });

      setUserMap(newUserMap);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [currentWorkspaceId, userMap]);

  // Load all users for the creator filter - only once when component mounts
  useEffect(() => {
    if (!currentWorkspaceId || usersLoaded) return;

    const loadAllUsers = async () => {
      try {
        setIsLoadingUsers(true);
        const usersData = await fetchUsersSummary(currentWorkspaceId);
        setUsers(usersData);

        // Also update the user map with these users
        const newUserMap: Record<string, string> = { ...userMap };
        usersData.forEach(userData => {
          if (userData.user_id) {
            // Use fullName if available, otherwise construct from first and last name
            const fullName = userData.fullName || 
              `${userData.first_name || ''} ${userData.last_name || ''}`.trim();

            newUserMap[userData.user_id] = fullName || userData.user_id;
          }
        });

        setUserMap(newUserMap);
        setUsersLoaded(true);
      } catch (error) {
        console.error("Error loading all users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadAllUsers();
  }, [currentWorkspaceId, userMap, usersLoaded]);

  const loadAssignments = useCallback(async () => {
    if (!paginationParams) return;

    try {
      // Only show loading spinner on initial load, not on refreshes
      if (!isRefreshing) {
        setIsLoading(true);
      } else {
        // For refreshes, we'll just update a specific part of the UI
        if (tableBodyRef.current) {
          tableBodyRef.current.style.opacity = '0.6';
        }
      }

      setError(null);

      const response = await fetchAssignments(paginationParams);

      setAssignments(response.assignments);

      // Update pagination information from the response
      if (response.pagination) {
        setTotalCount(response.pagination.total_count);
        setTotalPages(response.pagination.total_pages);
      }

      // If we got fewer results than expected and we're not on page 1,
      // it might mean we're on a page that no longer exists after filtering
      if (response.assignments.length === 0 && page > 0) {
        setPage(0); // Go back to first page
      }

      // Fetch user details for the assignments
      await fetchUserDetails(response.assignments);
    } catch (err) {
      setError("Failed to load assignments");
      console.error("Error loading assignments:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);

      // Restore opacity after refresh
      if (tableBodyRef.current) {
        tableBodyRef.current.style.opacity = '1';
      }
    }
  }, [paginationParams, page, isRefreshing, fetchUserDetails]);

  // Initial data load
  useEffect(() => {
    loadAssignments();
  }, []);

  // When pagination params change, refresh data without full loading state
  useEffect(() => {
    // Skip the initial load which is handled by the mount effect
    if (isLoading) return;

    setIsRefreshing(true);
    loadAssignments();
  }, [paginationParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
    setPage(0); // Reset to first page when sorting changes
  };

  const handleRowClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDetailsDialogOpen(true);
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
    loadAssignments();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  const handleCreatorChange = (event: any, newValue: string | null) => {
    setSelectedCreator(newValue || "Created By");
    setPage(0); // Reset to first page when filter changes
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

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

  // Helper function to get user name from ID
  const getUserName = (userId: string): string => {
    return userMap[userId] || userId;
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      const email = user.email || '';

      return !creatorSearchQuery || 
        fullName.toLowerCase().includes(creatorSearchQuery.toLowerCase()) ||
        email.toLowerCase().includes(creatorSearchQuery.toLowerCase());
    });
  }, [users, creatorSearchQuery]);

  // Render the table content based on loading state
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
            <CircularProgress />
          </TableCell>
        </TableRow>
      );
    }

    if (error) {
      return (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
            <Alert severity="error">{error}</Alert>
          </TableCell>
        </TableRow>
      );
    }

    if (assignments.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No assignments found matching your criteria.
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return assignments.map((row, index) => (
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
            <Typography variant="body2" noWrap>{getUserName(row.last_modified_by)}</Typography>
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
            <Typography variant="body2" noWrap>{getUserName(row.created_by)}</Typography>
          </Stack>
        </TableCell>
      </TableRow>
    ));
  };

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
              placeholder="Search by Assignment Name"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
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
                      onClick={handleClearSearch}
                      edge="end"
                      aria-label="clear search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Stack direction="row" spacing={2} sx={{ ml: "auto" }}>
              {/* Created By Filter - Updated to use Autocomplete with search */}
              <Autocomplete
                value={selectedCreator === "Created By" ? null : selectedCreator}
                onChange={handleCreatorChange}
                inputValue={creatorSearchQuery}
                onInputChange={(event, newInputValue) => {
                  setCreatorSearchQuery(newInputValue);
                }}
                options={["Created By", ...filteredUsers.map(user => user.user_id)]}
                getOptionLabel={(option) => {
                  if (option === "Created By") return "Created By";
                  const user = users.find(u => u.user_id === option);
                  if (!user) return option;
                  return user.fullName || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || option;
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Created By"
                    size="small"
                    sx={{
                      minWidth: 180,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingUsers ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                loading={isLoadingUsers}
                loadingText="Loading users..."
                noOptionsText="No users found"
                sx={{ width: 200 }}
              />
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

                {/* Table Body - This is the part that will be updated */}
                <TableBody ref={tableBodyRef}>
                  {renderTableContent()}
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
                count={totalCount}
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
