import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Stack,
  Container,
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
  Chip,
  Tabs,
  Tab,
  TablePagination,
  CircularProgress,
  TableSortLabel,
  InputAdornment,
  Autocomplete,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';
import DashboardContent from '../../DashboardContent';
import CreateTrainingPlanDialog from './CreateTrainingPlanDialog';
import CreateModuleDialog from './CreateModuleDialog';
import TrainingPlanDetailsDialog from './TrainingPlanDetailsDialog';
import ModuleDetailsDialog from './ModuleDetailsDialog';
import EditTrainingPlanDialog from './EditTrainingPlanDialog';
import EditModuleDialog from './EditModuleDialog';
import TrainingPlanActionsMenu from './TrainingPlanActionsMenu';
import { useAuth } from '../../../../context/AuthContext';
import { 
  fetchTrainingPlans, 
  type TrainingPlan, 
  type TrainingPlanPaginationParams,
} from '../../../../services/trainingPlans';
import { 
  fetchModules, 
  type Module,
  type ModulePaginationParams,
  fetchModuleDetails,
} from '../../../../services/modules';
import { fetchTags, type Tag } from '../../../../services/tags';
import { fetchUsersSummary, type User } from '../../../../services/users';
import { hasCreatePermission } from '../../../../utils/permissions';
import { fetchTrainingPlanDetails } from '../../../../services/training';
import { formatDateToTimeZone, formatTimeToTimeZone } from '../../../../utils/dateTime';

// Update formatDate function to use timezone
const formatDate = (dateString: string, timeZone: string | null = null) => {
  if (!dateString) return 'Not set';
  return formatDateToTimeZone(dateString, timeZone);
};

const formatDateTime = (dateString: string, timeZone: string | null = null) => {
  if (!dateString) return '';
  return formatTimeToTimeZone(dateString, timeZone);
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'name'
  | 'tags'
  | 'status'
  | 'estimated_time'
  | 'created_at'
  | 'created_by'
  | 'last_modified_at'
  | 'last_modified_by';

// Map frontend OrderBy to backend sortBy
const orderByToSortBy: Record<OrderBy, string> = {
  name: "name",
  tags: "tags",
  status: "status",
  estimated_time: "estimatedTime",
  created_at: "createdAt",
  created_by: "createdBy",
  last_modified_at: "lastModifiedAt",
  last_modified_by: "lastModifiedBy"
};

const ManageTrainingPlanPage = () => {
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const [currentTab, setCurrentTab] = useState('Training Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState('All Tags');
  const [tagsSearchQuery, setTagsSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState('Created By');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [creatorSearchQuery, setCreatorSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('last_modified_at');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<{ id: string; type: 'module' | 'training-plan'; status?: string } | null>(null);
  const [selectedTrainingPlan, setSelectedTrainingPlan] = useState<TrainingPlan | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isModuleDetailsDialogOpen, setIsModuleDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditModuleDialogOpen, setIsEditModuleDialogOpen] = useState(false);
  const [editingTrainingPlan, setEditingTrainingPlan] = useState<TrainingPlan | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [trainingPlanDetails, setTrainingPlanDetails] = useState<any>(null);
  const [moduleDetails, setModuleDetails] = useState<any>(null);
  const [isLoadingModuleDetails, setIsLoadingModuleDetails] = useState(false);

  // Check if user has create permission for manage-training-plan
  const canCreateTrainingPlan = hasCreatePermission('manage-training-plan');

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      selectedTags !== "All Tags" ||
      selectedCreator !== "Created By" ||
      selectedStatus !== "All"
    );
  }, [searchQuery, selectedTags, selectedCreator, selectedStatus]);

  // Helper function to check if an item is archived
  const isItemArchived = (item: TrainingPlan | Module): boolean => {
    return item.status?.toLowerCase() === 'archived';
  };

  // Create a memoized pagination params object for training plans
  const trainingPlanPaginationParams = useMemo<TrainingPlanPaginationParams>(() => {
    const params: TrainingPlanPaginationParams = {
      page: page + 1, // API uses 1-based indexing
      pagesize: rowsPerPage,
      sortBy: orderByToSortBy[orderBy],
      sortDir: order
    };

    // Add filters if they're not set to "All"
    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    if (selectedTags !== "All Tags") {
      params.tags = [selectedTags];
    }

    if (selectedCreator !== "Created By") {
      params.createdBy = selectedCreator;
    }

    if (selectedStatus !== 'All') {
      params.status = [selectedStatus.toLowerCase()];
    }

    if (selectedStatus !== 'All') {
      params.status = [selectedStatus.toLowerCase()];
    }

    return params;
  }, [
    page,
    rowsPerPage,
    orderBy,
    order,
    searchQuery,
    selectedTags,
    selectedCreator,
    selectedStatus
  ]);

  // Create a memoized pagination params object for modules
  const modulePaginationParams = useMemo<ModulePaginationParams>(() => {
    const params: ModulePaginationParams = {
      page: page + 1, // API uses 1-based indexing
      pagesize: rowsPerPage,
      sortBy: orderByToSortBy[orderBy],
      sortDir: order
    };

    // Add filters if they're not set to "All"
    if (searchQuery) {
      params.search = searchQuery;
    }

    if (selectedTags !== "All Tags") {
      params.tags = [selectedTags];
    }

    if (selectedCreator !== "Created By") {
      params.createdBy = selectedCreator;
    }

    return params;
  }, [
    page,
    rowsPerPage,
    orderBy,
    order,
    searchQuery,
    selectedTags,
    selectedCreator,
    selectedStatus
  ]);

  // Load all users once when component mounts
  useEffect(() => {
    const loadAllUsers = async () => {
      if (!currentWorkspaceId) return;

      try {
        setIsLoadingUsers(true);
        const usersData = await fetchUsersSummary(currentWorkspaceId);
        setUsers(usersData);

        // Also update the user map with these users
        const newUserMap: Record<string, string> = {};
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
        console.error("Error loading all users:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    loadAllUsers();
  }, [currentWorkspaceId]); // Only run once when component mounts or workspace changes

  // Load tags
  useEffect(() => {
    const loadTags = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingTags(true);
        const tagsData = await fetchTags(user.id);
        setTags(tagsData);
      } catch (error) {
        console.error('Error loading tags:', error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadTags();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (currentTab === 'Training Plans') {
        const response = await fetchTrainingPlans(user?.id || 'user123', trainingPlanPaginationParams);
        setTrainingPlans(response.training_plans);

        // Update pagination information from the response
        if (response.pagination) {
          setTotalCount(response.pagination.total_count);
          setTotalPages(response.pagination.total_pages);
        }

        // If we got fewer results than expected and we're not on page 1,
        // it might mean we're on a page that no longer exists after filtering
        if (response.training_plans.length === 0 && page > 0) {
          setPage(0); // Go back to first page
        }
      } else {
        const response = await fetchModules(user?.id || 'user123', modulePaginationParams);
        setModules(response.modules);

        // Update pagination information from the response
        if (response.pagination) {
          setTotalCount(response.pagination.total_count);
          setTotalPages(response.pagination.total_pages);
        }

        // If we got fewer results than expected and we're not on page 1,
        // it might mean we're on a page that no longer exists after filtering
        if (response.modules.length === 0 && page > 0) {
          setPage(0); // Go back to first page
        }
      }
    } catch (err) {
      setError(`Failed to load ${currentTab.toLowerCase()}`);
      console.error(`Error loading ${currentTab.toLowerCase()}:`, err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadData();
  }, [currentTab, user?.id]);

  // When pagination params change, refresh data without full loading state
  useEffect(() => {
    // Skip the initial load which is handled by the mount effect
    if (isLoading) return;

    setIsRefreshing(true);
    loadData();
  }, [currentTab === 'Training Plans' ? trainingPlanPaginationParams : modulePaginationParams]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setPage(0);
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    id: string,
    type: 'module' | 'training-plan',
    status: string
  ) => {
    // Stop event propagation to prevent row click
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedItem({ id, type, status });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
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
    setPage(0);
  };

  const handleRowClick = async (item: TrainingPlan | Module) => {
    // Check if the item is archived - if so, don't proceed
    if (isItemArchived(item)) {
      return;
    }

    // Only show details dialog for training plans
    if (currentTab === 'Training Plans') {
      setSelectedTrainingPlan(item as TrainingPlan);

      // Fetch training plan details
      try {
        setIsLoadingDetails(true);
        const details = await fetchTrainingPlanDetails(user?.id || '', item.id);
        setTrainingPlanDetails(details);
        setIsDetailsDialogOpen(true);
      } catch (error) {
        console.error('Error fetching training plan details:', error);
        setError('Failed to load training plan details');
      } finally {
        setIsLoadingDetails(false);
      }
    } else {
      // For modules tab
      setSelectedModule(item as Module);

      // Fetch module details
      try {
        setIsLoadingModuleDetails(true);
        const details = await fetchModuleDetails(item.id);
        setModuleDetails(details);
        setIsModuleDetailsDialogOpen(true);
      } catch (error) {
        console.error('Error fetching module details:', error);
        setError('Failed to load module details');
      } finally {
        setIsLoadingModuleDetails(false);
      }
    }
  };

  const handleEditClick = (id: string, type: 'module' | 'training-plan') => {
    if (type === 'training-plan') {
      // Find the training plan to edit
      const planToEdit = trainingPlans.find(plan => plan.id === id);
      if (planToEdit) {
        setEditingTrainingPlan(planToEdit);
        setIsEditDialogOpen(true);
      }
    } else {
      // Find the module to edit
      const moduleToEdit = modules.find(module => module.id === id);
      if (moduleToEdit) {
        setEditingModule(moduleToEdit);
        setIsEditModuleDialogOpen(true);
      }
    }
  };

  const handleUpdateSuccess = () => {
    // Reload data after successful update
    loadData();
  };

  // Add callback handlers for create operations
  const handleTrainingPlanCreated = () => {
    // Refresh the data after creating a training plan
    loadData();
  };

  const handleModuleCreated = () => {
    // Refresh the data after creating a module
    loadData();
  };

  // New function to reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTags("All Tags");
    setSelectedCreator("Created By");
    setSelectedStatus("All");
    setCreatorSearchQuery("");
    setTagsSearchQuery("");
    setPage(0);
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

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      return !tagsSearchQuery || 
        tag.name.toLowerCase().includes(tagsSearchQuery.toLowerCase());
    });
  }, [tags, tagsSearchQuery]);

  // Helper function to get user name from ID
  const getUserName = (userId: string): string => {
    return userMap[userId] || userId;
  };

  const currentData = currentTab === 'Training Plans' ? trainingPlans : modules;

  const sortedData = React.useMemo(() => {
    if (!currentData.length) return currentData;

    return [...currentData].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'tags':
          aValue = a.tags.join(',') || '';
          bValue = b.tags.join(',') || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'estimated_time':
          aValue = a.estimated_time || 0;
          bValue = b.estimated_time || 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at || 0).getTime();
          bValue = new Date(b.created_at || 0).getTime();
          break;
        case 'created_by':
          aValue = a.created_by || '';
          bValue = b.created_by || '';
          break;
        case 'last_modified_at':
          aValue = new Date(a.last_modified_at || 0).getTime();
          bValue = new Date(b.last_modified_at || 0).getTime();
          break;
        case 'last_modified_by':
          aValue = a.last_modified_by || '';
          bValue = b.last_modified_by || '';
          break;
        default:
          aValue = a.name || '';
          bValue = b.name || '';
      }

      const result = (aValue < bValue) ? -1 : (aValue > bValue) ? 1 : 0;
      return order === 'asc' ? result : -result;
    });
  }, [currentData, order, orderBy]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 1 }}>
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Manage Training Plan
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage training plan and modules
            </Typography>
          </Stack>

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
            </Tabs>
            <Button
              variant="contained"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateTrainingPlan}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                textTransform: 'none',
                borderRadius: 2,
                '&.Mui-disabled': {
                  bgcolor: 'rgba(68, 76, 231, 0.3)',
                  color: 'white',
                },
              }}
            >
              {currentTab === 'Training Plans'
                ? 'Create Training Plan'
                : 'Create Module'}
            </Button>
          </Stack>

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
              placeholder={`Search by ${currentTab === 'Training Plans' ? 'Training Plan' : 'Module'} Name`}
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
              {/* Tags Filter - Updated with Autocomplete */}
              <Autocomplete
                value={selectedTags === "All Tags" ? null : selectedTags}
                onChange={(event, newValue) => {
                  setSelectedTags(newValue || "All Tags");
                  setPage(0);
                }}
                inputValue={tagsSearchQuery}
                onInputChange={(event, newInputValue) => {
                  setTagsSearchQuery(newInputValue);
                }}
                options={["All Tags", ...filteredTags.map(tag => tag.name)]}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Tags"
                    size="small"
                    sx={{
                      minWidth: 120,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                  />
                )}
                noOptionsText="No tags found"
                sx={{ width: 150 }}
              />

              {/* Status Filter */}
              <Autocomplete
                value={selectedStatus === 'All' ? null : selectedStatus}
                onChange={(event, newValue) => {
                  setSelectedStatus(newValue || 'All');
                  setPage(0);
                }}
                options={['All', 'Published', 'Archived']}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Status"
                    size="small"
                    sx={{
                      minWidth: 120,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                  />
                )}
                sx={{ width: 130 }}
              />

              {/* Created By Filter - Updated to use Autocomplete with search */}
              <Autocomplete
                value={selectedCreator === "Created By" ? null : selectedCreator}
                onChange={(event, newValue) => {
                  setSelectedCreator(newValue || "Created By");
                  setPage(0);
                }}
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
                  />
                )}
                noOptionsText="No users found"
                sx={{ width: 200 }}
              />

              {/* Reset Filters Button */}
              <Tooltip title="Reset all filters">
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<ResetIcon />}
                    onClick={handleResetFilters}
                    disabled={!hasActiveFilters}
                    sx={{
                      borderColor: hasActiveFilters ? "#444CE7" : "#E0E0E0",
                      color: hasActiveFilters ? "#444CE7" : "#A0A0A0",
                      "&:hover": {
                        borderColor: "#3538CD",
                        bgcolor: "#F5F6FF",
                      },
                      borderRadius: 2,
                      height: 40,
                    }}
                  >
                  </Button>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: 'center', my: 4, color: 'error.main' }}>
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
            <Box sx={{
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
            }}>
              <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 250 }}>
                      <TableSortLabel
                        active={orderBy === 'name'}
                        direction={orderBy === 'name' ? order : 'asc'}
                        onClick={() => handleRequestSort('name')}
                      >
                        {currentTab === 'Training Plans' ? 'Training Plan' : 'Module'}
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 200 }}>
                      <TableSortLabel
                        active={orderBy === 'tags'}
                        direction={orderBy === 'tags' ? order : 'asc'}
                        onClick={() => handleRequestSort('tags')}
                      >
                        Tags
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 120 }}>
                      <TableSortLabel
                        active={orderBy === 'status'}
                        direction={orderBy === 'status' ? order : 'asc'}
                        onClick={() => handleRequestSort('status')}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 120 }}>
                      <TableSortLabel
                        active={orderBy === 'estimated_time'}
                        direction={orderBy === 'estimated_time' ? order : 'asc'}
                        onClick={() => handleRequestSort('estimated_time')}
                      >
                        Est. Time
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
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'created_by'}
                        direction={orderBy === 'created_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('created_by')}
                      >
                        Created By
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
                    <TableCell sx={{ color: '#959697', padding: '6px 16px', width: 150 }}>
                      <TableSortLabel
                        active={orderBy === 'last_modified_by'}
                        direction={orderBy === 'last_modified_by' ? order : 'asc'}
                        onClick={() => handleRequestSort('last_modified_by')}
                      >
                        Modified By
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#959697', padding: '6px 16px', width: 100 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No {currentTab.toLowerCase()} found matching your criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((item) => {
                      const isArchived = isItemArchived(item);
                      return (
                        <TableRow 
                          key={item.id} 
                          onClick={isArchived ? undefined : () => handleRowClick(item)}
                          sx={{
                            cursor: isArchived ? 'default' : 'pointer',
                            opacity: isArchived ? 0.6 : 1,
                            '&:hover': {
                              bgcolor: isArchived ? 'transparent' : 'action.hover',
                            },
                          }}
                        >
                          <TableCell sx={{ minWidth: 250 }}>{item.name}</TableCell>
                          <TableCell sx={{ width: 200 }}>
                            <Stack direction="row" spacing={1}>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxWidth: 180 }}>
                                {item.tags.map((tag, i) => (
                                  <Chip
                                    key={i}
                                    label={tag}
                                    size="small"
                                    sx={{ 
                                      bgcolor: '#F5F6FF', 
                                      color: '#444CE7',
                                      maxWidth: '100%',
                                      '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                      }
                                    }}
                                  />
                                ))}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: 120 }}>{item.status}</TableCell>
                          <TableCell sx={{ width: 120 }}>{item.estimated_time}m</TableCell>
                          <TableCell>
                            <Stack sx={{ minWidth: 180 }}>
                              <Typography variant="body2">{formatDate(item.created_at, currentTimeZone)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(item.created_at, currentTimeZone)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack sx={{ minWidth: 150 }}>
                              <Typography variant="body2" noWrap>{getUserName(item.created_by)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack sx={{ minWidth: 180 }}>
                              <Typography variant="body2">{formatDate(item.last_modified_at, currentTimeZone)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(item.last_modified_at, currentTimeZone)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Stack sx={{ minWidth: 150 }}>
                              <Typography variant="body2" noWrap>{getUserName(item.last_modified_by)}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="right" sx={{ width: 100 }}>
                            <IconButton 
                              size="small" 
                              onClick={(event) => handleMenuOpen(
                                event,
                                item.id,
                                currentTab === 'Training Plans' ? 'training-plan' : 'module',
                                item.status || ''
                              )}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ bgcolor: '#F9FAFB', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
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

        <TrainingPlanDetailsDialog
          open={isDetailsDialogOpen}
          onClose={() => setIsDetailsDialogOpen(false)}
          trainingPlan={selectedTrainingPlan}
          trainingPlanDetails={trainingPlanDetails}
          isLoading={isLoadingDetails}
        />

        <ModuleDetailsDialog
          open={isModuleDetailsDialogOpen}
          onClose={() => setIsModuleDetailsDialogOpen(false)}
          module={selectedModule}
          moduleDetails={moduleDetails}
          isLoading={isLoadingModuleDetails}
        />

        <TrainingPlanActionsMenu
          anchorEl={anchorEl}
          selectedItem={selectedItem}
          onClose={handleMenuClose}
          onCloneSuccess={loadData}
          onEditClick={handleEditClick}
          onArchiveSuccess={loadData}
          onUnarchiveSuccess={loadData}
        />

        <EditTrainingPlanDialog
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          trainingPlan={editingTrainingPlan}
          onUpdateSuccess={handleUpdateSuccess}
        />

        <EditModuleDialog
          open={isEditModuleDialogOpen}
          onClose={() => setIsEditModuleDialogOpen(false)}
          module={editingModule}
          onUpdateSuccess={handleUpdateSuccess}
        />
      </Container>

      {/* Updated dialogs with callbacks */}
      {currentTab === 'Training Plans' ? (
        <CreateTrainingPlanDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onTrainingPlanCreated={handleTrainingPlanCreated}
        />
      ) : (
        <CreateModuleDialog
          open={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onModuleCreated={handleModuleCreated}
        />
      )}
    </DashboardContent>
  );
};

export default ManageTrainingPlanPage;