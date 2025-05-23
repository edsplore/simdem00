import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  IconButton,
  Box,
  Chip,
  Tabs,
  Tab,
  SelectChangeEvent,
  TablePagination,
  CircularProgress,
  TableSortLabel,
  InputAdornment,
  Tooltip,
  Alert,
  Autocomplete,
} from "@mui/material";
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  LockOutlined as LockIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import DashboardContent from "../../DashboardContent";
import ActionsMenu from "./ActionsMenu";
import CreateSimulationDialog from "./CreateSimulationDialog";
import { 
  fetchSimulations, 
  type Simulation, 
  type SimulationPaginationParams,
  type SimulationsResponse
} from "../../../../services/simulations";
import {
  fetchDivisions,
  fetchDepartments,
} from "../../../../services/suggestions";
import { fetchTags, Tag } from "../../../../services/tags";
import { fetchUsersSummary, User, fetchUsersByIds } from "../../../../services/users";
import { useAuth } from "../../../../context/AuthContext";
import { hasCreatePermission } from "../../../../utils/permissions";
import { formatDateToTimeZone, formatTimeToTimeZone } from '../../../../utils/dateTime';
import OverflowTooltip from '../../../common/OverflowTooltip';

// Helper functions for date formatting with timezone
const formatDate = (dateString: string, timeZone: string | null = null) => {
  if (!dateString) return 'Invalid date';
  return formatDateToTimeZone(dateString, timeZone);
};

const formatDateTime = (dateString: string, timeZone: string | null = null) => {
  if (!dateString) return '';
  return formatTimeToTimeZone(dateString, timeZone);
};

// Helper function to format status with capital first letter
const formatStatus = (status: string): string => {
  if (!status) return '';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

// Helper function to format sim type with capital first letter of all words
const formatSimType = (simType: string): string => {
  if (!simType) return '';

  // Split by common delimiters (space, hyphen, slash, underscore) and capitalize each word
  return simType
    .split(/[\s\-\/\_]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-'); // Join with hyphen to maintain the original format
};

type Order = "asc" | "desc";
type OrderBy =
  | "sim_name"
  | "version"
  | "sim_type"
  | "status"
  | "tags"
  | "estTime"
  | "last_modified"
  | "modified_by"
  | "created_on"
  | "created_by";

// Map frontend OrderBy to backend sortBy
const orderByToSortBy: Record<OrderBy, string> = {
  sim_name: "simName",
  version: "version",
  sim_type: "simType",
  status: "status",
  tags: "tags",
  estTime: "estTime",
  last_modified: "lastModified",
  modified_by: "modifiedBy",
  created_on: "createdOn",
  created_by: "createdBy"
};

const ManageSimulationsPage = () => {
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const [currentTab, setCurrentTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState("All Tags");
  const [tagsSearchQuery, setTagsSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [departmentSearchQuery, setDepartmentSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All Divisions");
  const [divisionSearchQuery, setDivisionSearchQuery] = useState("");
  const [selectedCreator, setSelectedCreator] = useState("Created By");
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<Simulation | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Set default order to desc and orderBy to last_modified
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("last_modified");

  // New state variables for departments and divisions
  const [divisions, setDivisions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // New state for tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Reference to the table body to only update that part
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  // Flag to track if data is being refreshed (not initial load)
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for user name mapping
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Ref to track if users have been loaded
  const hasLoadedUsers = useRef(false);
  // Ref to track the latest API request for simulations
  const latestRequestId = useRef(0);

  // Check if user has create permission for manage-simulations
  const canCreateSimulation = hasCreatePermission("manage-simulations");

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      selectedTags !== "All Tags" ||
      selectedDepartment !== "All Departments" ||
      selectedDivision !== "All Divisions" ||
      selectedCreator !== "Created By" ||
      currentTab !== "All"
    );
  }, [searchQuery, selectedTags, selectedDepartment, selectedDivision, selectedCreator, currentTab]);

  // Create a memoized pagination params object
  const paginationParams = useMemo<SimulationPaginationParams>(() => {
    const params: SimulationPaginationParams = {
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
      // Convert single tag to array as per the Pydantic model
      params.tags = [selectedTags];
    }

    if (selectedDepartment !== "All Departments") {
      params.department = selectedDepartment;
    }

    if (selectedDivision !== "All Divisions") {
      params.division = selectedDivision;
    }

    if (selectedCreator !== "Created By") {
      params.createdBy = selectedCreator;
    }

    // Add status filter based on the current tab
    if (currentTab !== "All") {
      // Convert to lowercase and use array as per the Pydantic model
      params.status = [currentTab.toLowerCase()];
    }

    return params;
  }, [
    page,
    rowsPerPage,
    orderBy,
    order,
    searchQuery,
    selectedTags,
    selectedDepartment,
    selectedDivision,
    selectedCreator,
    currentTab
  ]);

  // Function to fetch user details for creator and modifier IDs
  const fetchUserDetails = useCallback(async (simulations: Simulation[]) => {
    if (!currentWorkspaceId || simulations.length === 0) return;

    try {
      // Collect all unique user IDs from created_by and modified_by fields
      const userIds = new Set<string>();
      simulations.forEach(sim => {
        if (sim.created_by && !userMap[sim.created_by]) {
          userIds.add(sim.created_by);
        }
        if (sim.modified_by && !userMap[sim.modified_by]) {
          userIds.add(sim.modified_by);
        }
      });

      // Skip API call if we already have all user details
      if (userIds.size === 0) return;

      const userIdsArray = Array.from(userIds);
      console.log("Fetching user details for IDs:", userIdsArray);

      const usersData = await fetchUsersByIds(currentWorkspaceId, userIdsArray);

      // Use functional update to avoid dependency on current userMap
      setUserMap(prevUserMap => {
        const newUserMap = { ...prevUserMap };
        usersData.forEach(userData => {
          if (userData.user_id) {
            // Use fullName if available, otherwise construct from first and last name
            const fullName = userData.fullName || 
              `${userData.first_name || ''} ${userData.last_name || ''}`.trim();

            newUserMap[userData.user_id] = fullName || userData.user_id;
          }
        });
        return newUserMap;
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }, [currentWorkspaceId]); // Removed userMap from dependency array

  // Load all users for the creator filter - FIXED to avoid repeated API calls
  const loadAllUsers = useCallback(async () => {
    if (!currentWorkspaceId) return;

    try {
      setIsLoadingUsers(true);
      const usersData = await fetchUsersSummary(currentWorkspaceId);
      setUsers(usersData);

      // Use functional update to avoid dependency on current userMap
      setUserMap(prevUserMap => {
        const newUserMap = { ...prevUserMap };
        usersData.forEach(userData => {
          if (userData.user_id) {
            // Use fullName if available, otherwise construct from first and last name
            const fullName = userData.fullName || 
              `${userData.first_name || ''} ${userData.last_name || ''}`.trim();

            newUserMap[userData.user_id] = fullName || userData.user_id;
          }
        });
        return newUserMap;
      });
    } catch (error) {
      console.error("Error loading all users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [currentWorkspaceId]); // Removed userMap from dependency array

  // Load all users when component mounts - use ref to ensure it only runs once
  useEffect(() => {
    if (!hasLoadedUsers.current && currentWorkspaceId) {
      loadAllUsers();
      hasLoadedUsers.current = true;
    }
  }, [loadAllUsers, currentWorkspaceId]);

  const loadSimulations = useCallback(async () => {
    if (!user?.id) return;

    const requestId = ++latestRequestId.current;

    try {
      // Only show loading spinner on initial load, not on refreshes
      if (!isRefreshing) {
        setIsLoading(true);
      } else if (tableBodyRef.current) {
        // For refreshes, we'll just update a specific part of the UI
        tableBodyRef.current.style.opacity = '0.6';
      }

      setError(null);

      const response = await fetchSimulations(user.id, paginationParams);

      // Ignore results from outdated requests
      if (requestId !== latestRequestId.current) return;

      setSimulations(response.simulations);

      // Update pagination information from the response
      if (response.pagination) {
        setTotalCount(response.pagination.total_count);
        setTotalPages(response.pagination.total_pages);
      }

      // If we got fewer results than expected and we're not on page 1,
      // it might mean we're on a page that no longer exists after filtering
      if (response.simulations.length === 0 && page > 0) {
        setPage(0); // Go back to first page
      }

      // Fetch user details for the simulations
      await fetchUserDetails(response.simulations);
    } catch (err) {
      // Only set the error if this is the latest request
      if (requestId === latestRequestId.current) {
        setError("Failed to load simulations");
      }
      console.error("Error loading simulations:", err);
    } finally {
      if (requestId === latestRequestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);

        // Restore opacity after refresh
        if (tableBodyRef.current) {
          tableBodyRef.current.style.opacity = '1';
        }
      }
    }
  }, [user?.id, paginationParams, page, isRefreshing, fetchUserDetails]);

  const refreshSimulations = useCallback(() => {
    setIsRefreshing(true);
    loadSimulations();
  }, [loadSimulations]);

  // Load simulations when component mounts
  useEffect(() => {
    loadSimulations();
  }, []);

  // When pagination params change, refresh data without full loading state
  const isFirstPaginationChange = useRef(true);
  useEffect(() => {
    if (isFirstPaginationChange.current) {
      // Skip the effect on initial render to avoid duplicate API call
      isFirstPaginationChange.current = false;
      return;
    }

    setIsRefreshing(true);
    loadSimulations();
  }, [paginationParams]);

  // Load divisions and departments when component mounts
  useEffect(() => {
    if (currentWorkspaceId) {
      // Fetch divisions
      const loadDivisions = async () => {
        setIsLoadingDivisions(true);
        try {
          const divisionsData = await fetchDivisions(currentWorkspaceId);
          console.log("Loaded divisions:", divisionsData);
          setDivisions(divisionsData);
        } catch (error) {
          console.error("Failed to load divisions:", error);
        } finally {
          setIsLoadingDivisions(false);
        }
      };

      // Fetch departments
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartments(currentWorkspaceId);
          console.log("Loaded departments:", departmentsData);
          setDepartments(departmentsData);
        } catch (error) {
          console.error("Failed to load departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      };

      loadDivisions();
      loadDepartments();
    }
  }, [currentWorkspaceId]);

  // Load tags
  useEffect(() => {
    const loadTags = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingTags(true);
        const tagsData = await fetchTags(user.id);
        setTags(tagsData);
      } catch (error) {
        console.error("Error loading tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadTags();
  }, [user?.id]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    setPage(0); // Reset to first page when changing tabs
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    row: Simulation,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRow(null);
  };

  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
    setPage(0); // Reset to first page when sorting changes
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle filter changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  const handleTagsChange = (event: any, newValue: string | null) => {
    setSelectedTags(newValue || "All Tags");
    setPage(0); // Reset to first page when filter changes
  };

  const handleDepartmentChange = (event: any, newValue: string | null) => {
    setSelectedDepartment(newValue || "All Departments");
    setPage(0); // Reset to first page when filter changes
  };

  const handleDivisionChange = (event: any, newValue: string | null) => {
    setSelectedDivision(newValue || "All Divisions");
    setPage(0); // Reset to first page when filter changes
  };

  const handleCreatorChange = (event: any, newValue: string | null) => {
    setSelectedCreator(newValue || "Created By");
    setPage(0); // Reset to first page when filter changes
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // New function to reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedTags("All Tags");
    setSelectedDepartment("All Departments");
    setSelectedDivision("All Divisions");
    setSelectedCreator("Created By");
    setCreatorSearchQuery("");
    setTagsSearchQuery("");
    setDepartmentSearchQuery("");
    setDivisionSearchQuery("");
    setCurrentTab("All");
    setPage(0);
  };

  // Helper function to get user name from ID
  const getUserName = (userId: string): string => {
    return userMap[userId] || userId;
  };

  // Helper to gather enabled levels for display
  const getEnabledLevels = (simulation: Simulation): string[] => {
    const levels: string[] = [];

    if (simulation.lvl1?.isEnabled) {
      levels.push('Lvl 01');
    }
    if (simulation.lvl2?.isEnabled) {
      levels.push('Lvl 02');
    }
    if (simulation.lvl3?.isEnabled) {
      levels.push('Lvl 03');
    }

    return levels.length > 0 ? levels : ['N/A'];
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

  // Filter divisions based on search query
  const filteredDivisions = useMemo(() => {
    return divisions.filter(division => {
      return !divisionSearchQuery || 
        division.toLowerCase().includes(divisionSearchQuery.toLowerCase());
    });
  }, [divisions, divisionSearchQuery]);

  // Filter departments based on search query
  const filteredDepartments = useMemo(() => {
    return departments.filter(department => {
      return !departmentSearchQuery || 
        department.toLowerCase().includes(departmentSearchQuery.toLowerCase());
    });
  }, [departments, departmentSearchQuery]);

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

    if (simulations.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 3 }}>
            <Typography variant="body1" color="text.secondary">
              No simulations found matching your criteria.
            </Typography>
          </TableCell>
        </TableRow>
      );
    }

    return simulations.map((row, index) => (
      <TableRow key={index}>
        <TableCell sx={{ minWidth: 250 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <OverflowTooltip>{row.sim_name}</OverflowTooltip>
            {row.islocked && (
              <LockIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            )}
          </Stack>
        </TableCell>
        <TableCell sx={{ width: 100 }}>
          v{row.version}
        </TableCell>
        <TableCell sx={{ width: 160 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {getEnabledLevels(row).map((lvl, i) => (
              <Chip
                key={`${lvl}-${i}`}
                label={lvl}
                size="small"
                sx={{ bgcolor: "#F2F4F7", color: "#344054" }}
              />
            ))}
          </Box>
        </TableCell>
        <TableCell sx={{ width: 150 }}>
          <Tooltip title={formatSimType(row.sim_type)} arrow>
            <Chip
              label={formatSimType(row.sim_type)}
              size="small"
              sx={{ 
                bgcolor: "#F5F6FF", 
                color: "#444CE7",
                maxWidth: "100%",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }
              }}
            />
          </Tooltip>
        </TableCell>
        <TableCell sx={{ width: 120 }}>
          <Tooltip title={formatStatus(row.status)} arrow>
            <Chip
              label={formatStatus(row.status)}
              size="small"
              sx={{
                bgcolor:
                  row.status === "published"
                    ? "#ECFDF3"
                    : row.status === "draft"
                      ? "#F5F6FF"
                      : "#F9FAFB",
                color:
                  row.status === "published"
                    ? "#027A48"
                    : row.status === "draft"
                      ? "#444CE7"
                      : "#344054",
                maxWidth: "100%",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }
              }}
            />
          </Tooltip>
        </TableCell>
        <TableCell sx={{ width: 200 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ maxWidth: 180 }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {row.tags &&
                row.tags.map((tag, i) => (
                  <Tooltip key={i} title={tag} arrow>
                    <Chip
                      label={tag}
                      size="small"
                      sx={{
                        bgcolor: "#F5F6FF",
                        color: "#444CE7",
                        maxWidth: "100%",
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  </Tooltip>
                ))}
            </Box>
          </Stack>
        </TableCell>
        <TableCell sx={{ width: 100 }}>
          {row.est_time ? `${row.est_time} mins` : ''}
        </TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          <Stack>
            <Typography variant="body2">
              {formatDate(row.last_modified, currentTimeZone)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {formatDateTime(row.last_modified, currentTimeZone)}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Stack>
            <OverflowTooltip>
              {getUserName(row.modified_by)}
            </OverflowTooltip>
          </Stack>
        </TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          <Stack>
            <Typography variant="body2">
              {formatDate(row.created_on, currentTimeZone)}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {formatDateTime(row.created_on, currentTimeZone)}
            </Typography>
          </Stack>
        </TableCell>
        <TableCell sx={{ minWidth: 150 }}>
          <Stack>
            <OverflowTooltip>
              {getUserName(row.created_by)}
            </OverflowTooltip>
          </Stack>
        </TableCell>
        <TableCell align="right" sx={{ width: 100 }}>
          <IconButton
            size="small"
            onClick={(event) => handleMenuOpen(event, row)}
          >
            <MoreVertIcon />
          </IconButton>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 1 }}>
          {/* Header */}
          <Stack>
            <Typography variant="h4" fontWeight="medium">
              Manage Simulations
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create assign and manage your simulations
            </Typography>
          </Stack>

          {/* Update Create Button to open dialog */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  minWidth: "auto",
                  px: 3,
                  bgcolor: "#F9FAFB",
                  color: "#AEAFB0",
                  borderRadius: 1,
                  "&:hover": {
                    bgcolor: "#EDEFF1",
                  },
                  "&.Mui-selected": {
                    color: "#323232",
                    fontWeight: "bold",
                  },
                },
              }}
            >
              <Tab label="All" value="All" />
              <Tab label="Published" value="Published" />
              <Tab label="Draft" value="Draft" />
              <Tab label="Archived" value="Archived" />
            </Tabs>
            <Button
              variant="contained"
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={!canCreateSimulation}
              sx={{
                bgcolor: "primary.main",
                color: "white",
                textTransform: "none",
                borderRadius: 2,
                "&.Mui-disabled": {
                  bgcolor: "rgba(68, 76, 231, 0.3)",
                  color: "white",
                },
              }}
            >
              Create Simulation
            </Button>
          </Stack>

          {/* Filters */}
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{
              bgcolor: "#F9FAFB",
              p: 1.5,
              borderRadius: 2,
            }}
          >
            <TextField
              placeholder="Search by Sim Name"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{
                width: 300,
                bgcolor: "#FFFFFF",
                borderRadius: 10,
                "& .MuiInputBase-root": {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
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
              {/* Tags Filter - Updated with Autocomplete */}
              <Autocomplete
                value={selectedTags === "All Tags" ? null : selectedTags}
                onChange={handleTagsChange}
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
                      bgcolor: "#FFFFFF",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingTags ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                loading={isLoadingTags}
                loadingText="Loading tags..."
                noOptionsText="No tags found"
                sx={{ width: 150 }}
              />

              {/* Division Filter - Updated with Autocomplete */}
              <Autocomplete
                value={selectedDivision === "All Divisions" ? null : selectedDivision}
                onChange={handleDivisionChange}
                inputValue={divisionSearchQuery}
                onInputChange={(event, newInputValue) => {
                  setDivisionSearchQuery(newInputValue);
                }}
                options={["All Divisions", ...filteredDivisions]}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Divisions"
                    size="small"
                    sx={{
                      minWidth: 150,
                      bgcolor: "#FFFFFF",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingDivisions ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                loading={isLoadingDivisions}
                loadingText="Loading divisions..."
                noOptionsText="No divisions found"
                sx={{ width: 180 }}
              />

              {/* Department Filter - Updated with Autocomplete */}
              <Autocomplete
                value={selectedDepartment === "All Departments" ? null : selectedDepartment}
                onChange={handleDepartmentChange}
                inputValue={departmentSearchQuery}
                onInputChange={(event, newInputValue) => {
                  setDepartmentSearchQuery(newInputValue);
                }}
                options={["All Departments", ...filteredDepartments]}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="All Departments"
                    size="small"
                    sx={{
                      minWidth: 150,
                      bgcolor: "#FFFFFF",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isLoadingDepartments ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                loading={isLoadingDepartments}
                loadingText="Loading departments..."
                noOptionsText="No departments found"
                sx={{ width: 180 }}
              />

              {/* Created By Filter - Without loading indicator */}
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
                      bgcolor: "#FFFFFF",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        height: 40,
                      },
                    }}
                  />
                )}
                loading={false}
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

          {/* Table Container - Always visible regardless of loading state */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                overflow: "auto",
                "&::-webkit-scrollbar": {
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#c1c1c1",
                  borderRadius: "4px",
                  "&:hover": {
                    backgroundColor: "#a8a8a8",
                  },
                },
                scrollbarWidth: "thin",
                scrollbarColor: "#c1c1c1 #f1f1f1",
              }}
            >
              <Table
                sx={{
                  minWidth: 1500,
                  borderRadius: 2,
                  overflow: "hidden",
                  tableLayout: "fixed",
                }}
              >
                {/* Table Header - Always visible */}
                <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 250,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "sim_name"}
                        direction={orderBy === "sim_name" ? order : "asc"}
                        onClick={() => handleRequestSort("sim_name")}
                      >
                        Sim Name
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 100,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "version"}
                        direction={orderBy === "version" ? order : "asc"}
                        onClick={() => handleRequestSort("version")}
                      >
                        Version
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 160,
                      }}
                    >
                      Level
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 150,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "sim_type"}
                        direction={orderBy === "sim_type" ? order : "asc"}
                        onClick={() => handleRequestSort("sim_type")}
                      >
                        Sim Type
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 120,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "status"}
                        direction={orderBy === "status" ? order : "asc"}
                        onClick={() => handleRequestSort("status")}
                      >
                        Status
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 200,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "tags"}
                        direction={orderBy === "tags" ? order : "asc"}
                        onClick={() => handleRequestSort("tags")}
                      >
                        Tags
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 100,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "estTime"}
                        direction={orderBy === "estTime" ? order : "asc"}
                        onClick={() => handleRequestSort("estTime")}
                      >
                        Est. Time
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 180,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "last_modified"}
                        direction={
                          orderBy === "last_modified" ? order : "asc"
                        }
                        onClick={() => handleRequestSort("last_modified")}
                      >
                        Last Modified
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 150,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "modified_by"}
                        direction={orderBy === "modified_by" ? order : "asc"}
                        onClick={() => handleRequestSort("modified_by")}
                      >
                        Modified by
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 180,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "created_on"}
                        direction={orderBy === "created_on" ? order : "asc"}
                        onClick={() => handleRequestSort("created_on")}
                      >
                        Created On
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 150,
                      }}
                    >
                      <TableSortLabel
                        active={orderBy === "created_by"}
                        direction={orderBy === "created_by" ? order : "asc"}
                        onClick={() => handleRequestSort("created_by")}
                      >
                        Created by
                      </TableSortLabel>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: "#959697",
                        padding: "6px 16px",
                        width: 100,
                      }}
                    >
                      Actions
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
                bgcolor: "#F9FAFB",
                borderTop: "1px solid rgba(224, 224, 224, 1)",
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
        </Stack>
      </Container>

      <ActionsMenu
        anchorEl={anchorEl}
        selectedRow={selectedRow}
        onClose={handleMenuClose}
        onCloneSuccess={refreshSimulations}
        onArchiveSuccess={refreshSimulations}
        onUnarchiveSuccess={refreshSimulations}
      />

      <CreateSimulationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </DashboardContent>
  );
};

export default ManageSimulationsPage;