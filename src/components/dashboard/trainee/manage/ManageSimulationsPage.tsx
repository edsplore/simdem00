import React, { useState, useMemo, useEffect } from "react";
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
} from "@mui/material";
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Lock as LockIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import DashboardContent from "../../DashboardContent";
import ActionsMenu from "./ActionsMenu";
import CreateSimulationDialog from "./CreateSimulationDialog";
import { fetchSimulations, Simulation } from "../../../../services/simulations";
import {
  fetchDivisions,
  fetchDepartments,
} from "../../../../services/suggestions";
import { fetchTags, Tag } from "../../../../services/tags";
import { useAuth } from "../../../../context/AuthContext";
import { hasCreatePermission } from "../../../../utils/permissions";

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ManageSimulationsPage = () => {
  const { user, currentWorkspaceId } = useAuth();
  const [currentTab, setCurrentTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState("All Tags");
  const [selectedDepartment, setSelectedDepartment] =
    useState("All Departments");
  const [selectedDivision, setSelectedDivision] = useState("All Divisions");
  const [selectedCreator, setSelectedCreator] = useState("Created By");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRow, setSelectedRow] = useState<Simulation | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>("asc");
  const [orderBy, setOrderBy] = useState<OrderBy>("sim_name");

  // New state variables for departments and divisions
  const [divisions, setDivisions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  // New state for tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Check if user has create permission for manage-simulations
  const canCreateSimulation = hasCreatePermission("manage-simulations");

  const loadSimulations = async () => {
    try {
      setIsLoading(true);
      const data = await fetchSimulations(user?.id || "user123");
      setSimulations(data);
      setError(null);
    } catch (err) {
      setError("Failed to load simulations");
      console.error("Error loading simulations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load simulations when component mounts or user changes
  useEffect(() => {
    loadSimulations();
  }, [user?.id]);

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

  // Filter data based on current tab, search query, department and division
  const filteredData = useMemo(() => {
    return simulations.filter((row) => {
      // First apply tab filter
      if (
        currentTab !== "All" &&
        row.status.toLowerCase() !== currentTab.toLowerCase()
      ) {
        return false;
      }

      // Then apply search filter
      if (searchQuery) {
        const searchLower = searchQuery.trim().toLowerCase();
        const nameMatch = row.sim_name.toLowerCase().includes(searchLower);
        const idMatch = row.id && row.id.toLowerCase().includes(searchLower);
        if (!nameMatch && !idMatch) {
          return false;
        }
      }

      // Apply department filter
      if (
        selectedDepartment !== "All Departments" &&
        row.department_id !== selectedDepartment
      ) {
        return false;
      }

      // Apply division filter
      if (
        selectedDivision !== "All Divisions" &&
        row.division_id !== selectedDivision
      ) {
        return false;
      }

      // Apply tag filter
      if (selectedTags !== "All Tags") {
        if (!row.tags || !row.tags.includes(selectedTags)) {
          return false;
        }
      }

      // Apply creator filter
      if (
        selectedCreator !== "Created By" &&
        row.created_by !== selectedCreator
      ) {
        return false;
      }

      return true;
    });
  }, [
    currentTab,
    searchQuery,
    selectedDepartment,
    selectedDivision,
    selectedTags,
    selectedCreator,
    simulations,
  ]);

  const sortedData = useMemo(() => {
    if (!filteredData.length) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue, bValue;

      switch (orderBy) {
        case "sim_name":
          aValue = a.sim_name || "";
          bValue = b.sim_name || "";
          break;
        case "version":
          aValue = a.version || "";
          bValue = b.version || "";
          break;
        case "sim_type":
          aValue = a.sim_type || "";
          bValue = b.sim_type || "";
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "tags":
          aValue = a.tags?.join(",") || "";
          bValue = b.tags?.join(",") || "";
          break;
        case "estTime":
          aValue = a.est_time || "";
          bValue = b.est_time || "";
          break;
        case "last_modified":
          aValue = new Date(a.last_modified || 0).getTime();
          bValue = new Date(b.last_modified || 0).getTime();
          break;
        case "modified_by":
          aValue = a.modified_by || "";
          bValue = b.modified_by || "";
          break;
        case "created_on":
          aValue = new Date(a.created_on || 0).getTime();
          bValue = new Date(b.created_on || 0).getTime();
          break;
        case "created_by":
          aValue = a.created_by || "";
          bValue = b.created_by || "";
          break;
        default:
          aValue = a.sim_name || "";
          bValue = b.sim_name || "";
      }

      const result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return order === "asc" ? result : -result;
    });
  }, [filteredData, order, orderBy]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={3} sx={{ py: 4 }}>
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
              <Tab label="Archive" value="Archive" />
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
              placeholder="Search by Sim Name or ID"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                      onClick={() => setSearchQuery("")}
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
              <Select
                value={selectedTags}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedTags(e.target.value)
                }
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflow: "auto",
                    },
                  },
                }}
              >
                <MenuItem value="All Tags">All Tags</MenuItem>
                {isLoadingTags ? (
                  <MenuItem disabled>Loading tags...</MenuItem>
                ) : tags.length === 0 ? (
                  <MenuItem disabled>No tags available</MenuItem>
                ) : (
                  tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.name}>
                      {tag.name}
                    </MenuItem>
                  ))
                )}
              </Select>

              {/* Division Filter - Updated */}
              <Select
                value={selectedDivision}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedDivision(e.target.value)
                }
                size="small"
                sx={{
                  minWidth: 150,
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflow: "auto",
                    },
                  },
                }}
              >
                <MenuItem value="All Divisions">All Divisions</MenuItem>
                {isLoadingDivisions ? (
                  <MenuItem disabled>Loading divisions...</MenuItem>
                ) : divisions.length === 0 ? (
                  <MenuItem disabled>No divisions available</MenuItem>
                ) : (
                  divisions.map((division) => (
                    <MenuItem key={division} value={division}>
                      {division}
                    </MenuItem>
                  ))
                )}
              </Select>

              {/* Department Filter - Updated */}
              <Select
                value={selectedDepartment}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedDepartment(e.target.value)
                }
                size="small"
                sx={{
                  minWidth: 150,
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,
                }}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      overflow: "auto",
                    },
                  },
                }}
              >
                <MenuItem value="All Departments">All Departments</MenuItem>
                {isLoadingDepartments ? (
                  <MenuItem disabled>Loading departments...</MenuItem>
                ) : departments.length === 0 ? (
                  <MenuItem disabled>No departments available</MenuItem>
                ) : (
                  departments.map((department) => (
                    <MenuItem key={department} value={department}>
                      {department}
                    </MenuItem>
                  ))
                )}
              </Select>

              <Select
                value={selectedCreator}
                onChange={(e: SelectChangeEvent) =>
                  setSelectedCreator(e.target.value)
                }
                size="small"
                sx={{
                  minWidth: 120,
                  bgcolor: "#FFFFFF",
                  borderRadius: 2,
                }}
              >
                <MenuItem value="Created By">Created By</MenuItem>
                {/* Add more creators based on unique creators in simulations */}
                {Array.from(new Set(simulations.map((sim) => sim.created_by)))
                  .filter(Boolean)
                  .map((creator) => (
                    <MenuItem key={creator} value={creator}>
                      {creator}
                    </MenuItem>
                  ))}
              </Select>
            </Stack>
          </Stack>

          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", my: 4, color: "error.main" }}>
              <Typography>{error}</Typography>
            </Box>
          ) : (
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
                          width: 100,
                        }}
                      >
                        Level
                      </TableCell>
                      <TableCell
                        sx={{
                          color: "#959697",
                          padding: "6px 16px",
                          width: 120,
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
                  <TableBody>
                    {sortedData
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((row, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ minWidth: 250 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {row.sim_name}
                              {row.islocked && (
                                <LockIcon
                                  sx={{ fontSize: 16, color: "text.secondary" }}
                                />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: 100 }}>
                            v{row.version}
                          </TableCell>
                          <TableCell>Lvl 02</TableCell>
                          <TableCell sx={{ width: 120 }}>
                            <Chip
                              label={row.sim_type}
                              size="small"
                              sx={{ bgcolor: "#F5F6FF", color: "#444CE7" }}
                            />
                          </TableCell>
                          <TableCell sx={{ width: 120 }}>
                            <Chip
                              label={row.status}
                              size="small"
                              sx={{
                                bgcolor:
                                  row.status === "Published"
                                    ? "#ECFDF3"
                                    : row.status === "Draft"
                                      ? "#F5F6FF"
                                      : "#F9FAFB",
                                color:
                                  row.status === "Published"
                                    ? "#027A48"
                                    : row.status === "Draft"
                                      ? "#444CE7"
                                      : "#344054",
                              }}
                            />
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
                                    <Chip
                                      key={i}
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
                                  ))}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ width: 100 }}>
                            {row.est_time}
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Stack>
                              <Typography variant="body2">
                                {formatDate(row.last_modified)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(
                                  row.last_modified,
                                ).toLocaleTimeString()}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <Stack>
                              <Typography variant="body2" noWrap>
                                {row.modified_by}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 180 }}>
                            <Stack>
                              <Typography variant="body2">
                                {formatDate(row.created_on)}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {new Date(row.created_on).toLocaleTimeString()}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ minWidth: 150 }}>
                            <Stack>
                              <Typography variant="body2" noWrap>
                                {row.created_by}
                              </Typography>
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
                      ))}
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

      <ActionsMenu
        anchorEl={anchorEl}
        selectedRow={selectedRow}
        onClose={handleMenuClose}
        onCloneSuccess={loadSimulations}
      />

      <CreateSimulationDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </DashboardContent>
  );
};

export default ManageSimulationsPage;
