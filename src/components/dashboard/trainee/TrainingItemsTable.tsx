import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Grid,
  Paper,
  TextField,
  Typography,
  Chip,
  Select,
  MenuItem,
  Pagination,
  Box,
  styled,
  CircularProgress,
  Alert,
  IconButton,
  Collapse,
  Button,
  Popover,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarMonth as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Clear as ClearIcon,
  RestartAlt as ResetIcon,
} from "@mui/icons-material";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import type { TrainingPlan, Module, Simulation } from "../../../types/training";
import { useAuth } from "../../../context/AuthContext";
import DateSelector from "../../common/DateSelector";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

interface TrainingItemsTableProps {
  trainingPlans?: TrainingPlan[];
  modules?: Module[];
  simulations?: Simulation[];
  isLoading?: boolean;
  error?: string | null;
  showTrainingPlans?: boolean; // Control whether to show training plans section
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "none",
}));

const HeaderChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.shape.borderRadius,
  height: 24,
  fontSize: "0.75rem",
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[100],
  fontWeight: 600,
  fontSize: "0.875rem",
}));

const TrainingItemsTable: React.FC<TrainingItemsTableProps> = ({
  trainingPlans = [],
  modules = [],
  simulations = [],
  isLoading = false,
  error = null,
  showTrainingPlans = true,
}) => {
  const navigate = useNavigate();
  const { currentWorkspaceId, currentTimeZone } = useAuth();
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState<{
    [key: string]: boolean;
  }>({});

  // Check if any filters are applied
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      statusFilter !== "all" ||
      (dateRange[0] !== null || dateRange[1] !== null)
    );
  }, [searchQuery, statusFilter, dateRange]);

  // Calculate total simulations count
  const totalSimulationsCount = showTrainingPlans 
    ? trainingPlans.reduce((acc, plan) => acc + plan.total_simulations, 0) +
      modules.reduce((acc, module) => acc + module.total_simulations, 0) +
      simulations.length
    : modules.reduce((acc, module) => acc + module.total_simulations, 0) +
      simulations.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
      case "ongoing":
        return { bg: "#EEF4FF", color: "#3538CD" };
      case "completed":
      case "finished":
        return { bg: "#ECFDF3", color: "#027A48" };
      case "over_due":
      case "overdue":
        return { bg: "#FEF2F2", color: "#DC2626" };
      default:
        return { bg: "#FFFAEB", color: "#B54708" };
    }
  };

  // Handle page change
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number,
  ) => {
    setCurrentPage(value);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (
    e: React.ChangeEvent<{ value: unknown }>,
  ) => {
    setRowsPerPage(e.target.value as string);
    setCurrentPage(1);
  };

  // Handle date range apply callback
  const handleDateRangeApplyCallback = () => {
    // The dateRange state contains dates in the user's timezone
    // The isDateInRange function will handle conversion to UTC for backend comparison
    console.log("Date range applied:", dateRange);
  };

  // New function to reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setDateRange([null, null]);
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const isDateInRange = (dateStr: string | null) => {
    if (!dateStr) return true;
    if (!dateRange[0] && !dateRange[1]) return true;

    // Parse the backend date (assumed to be in UTC)
    const backendDate = dayjs.utc(dateStr);

    // Convert selected date range to UTC for comparison
    // The selected dates are in the user's timezone, so we need to convert them
    let startDateUTC = null;
    let endDateUTC = null;

    if (dateRange[0]) {
      // Convert start of day in user's timezone to UTC
      startDateUTC = currentTimeZone 
        ? dayjs.tz(dateRange[0].format('YYYY-MM-DD'), currentTimeZone).startOf('day').utc()
        : dateRange[0].utc().startOf('day');
    }

    if (dateRange[1]) {
      // Convert end of day in user's timezone to UTC
      endDateUTC = currentTimeZone
        ? dayjs.tz(dateRange[1].format('YYYY-MM-DD'), currentTimeZone).endOf('day').utc()
        : dateRange[1].utc().endOf('day');
    }

    // Compare UTC dates
    if (startDateUTC && endDateUTC) {
      return backendDate.isAfter(startDateUTC) && backendDate.isBefore(endDateUTC);
    } else if (startDateUTC) {
      return backendDate.isAfter(startDateUTC);
    } else if (endDateUTC) {
      return backendDate.isBefore(endDateUTC);
    }

    return true;
  };

  // Filter items based on search query, status, and date range
  const filteredTrainingPlans = showTrainingPlans 
    ? trainingPlans.filter((plan) => {
        if (
          searchQuery &&
          !plan.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        ) {
          return false;
        }
        if (statusFilter !== "all" && plan.status !== statusFilter) {
          return false;
        }
        if (!isDateInRange(plan.due_date)) {
          return false;
        }
        return true;
      })
    : [];

  const filteredModules = modules.filter((module) => {
    if (
      searchQuery &&
      !module.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== "all" && module.status !== statusFilter) {
      return false;
    }
    if (!isDateInRange(module.due_date)) {
      return false;
    }
    return true;
  });

  const filteredSimulations = simulations.filter((sim) => {
    if (
      searchQuery &&
      !sim.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (statusFilter !== "all" && sim.status !== statusFilter) {
      return false;
    }
    if (!isDateInRange(sim.dueDate || sim.due_date)) {
      return false;
    }
    return true;
  });

  // Calculate total filtered items
  const totalFilteredItems =
    filteredTrainingPlans.length +
    filteredModules.length +
    filteredSimulations.length;

  // Calculate pagination
  const pageSize = parseInt(rowsPerPage);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Get paginated items
  const paginatedTrainingPlans = filteredTrainingPlans.slice(startIndex, endIndex);
  const paginatedModules = filteredModules.slice(
    Math.max(0, startIndex - filteredTrainingPlans.length),
    Math.max(0, endIndex - filteredTrainingPlans.length),
  );
  const paginatedSimulations = filteredSimulations.slice(
    Math.max(
      0,
      startIndex - filteredTrainingPlans.length - filteredModules.length,
    ),
    Math.max(
      0,
      endIndex - filteredTrainingPlans.length - filteredModules.length,
    ),
  );

  // Ensure we don't exceed page size across all categories
  let remainingItems = pageSize;
  const displayedTrainingPlans = showTrainingPlans 
    ? paginatedTrainingPlans.slice(0, remainingItems)
    : [];
  if (showTrainingPlans) {
    remainingItems -= displayedTrainingPlans.length;
  }

  const displayedModules =
    remainingItems > 0 ? paginatedModules.slice(0, remainingItems) : [];
  remainingItems -= displayedModules.length;

  const displayedSimulations =
    remainingItems > 0 ? paginatedSimulations.slice(0, remainingItems) : [];

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalFilteredItems / pageSize));

  const toggleModuleExpand = (moduleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleSimulationClick = (
    simulationId: string,
    assignmentId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const workspaceParam = currentWorkspaceId
      ? `?workspace_id=${currentWorkspaceId}`
      : "";
    navigate(
      `/simulation/${simulationId}/${assignmentId}/attempt${workspaceParam}`,
    );
  };

  const handleTrainingPlanClick = (trainingPlan: TrainingPlan) => {
    const workspaceParam = currentWorkspaceId
      ? `?workspace_id=${currentWorkspaceId}`
      : "";
    navigate(`/training/${trainingPlan.id}${workspaceParam}`, {
      state: { trainingPlan },
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h5" fontWeight="600">
              {showTrainingPlans ? "Training Plan" : "Training Plan Contents"}
            </Typography>
            <HeaderChip
              label={`${totalSimulationsCount} Simulations`}
              size="small"
            />
          </Stack>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: 2,
            bgcolor: "#F9FAFB",
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TextField
            placeholder="Search"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 240 }}
            InputProps={{
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
          <Stack direction="row" spacing={2}>
            <DateSelector
              dateRange={dateRange}
              setDateRange={setDateRange}
              handleDateRangeApplyCallback={handleDateRangeApplyCallback}
            />

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
              sx={{
                minWidth: 120,
                bgcolor: "background.paper",
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="finished">Completed</MenuItem>
              <MenuItem value="ongoing">In Progress</MenuItem>
              <MenuItem value="over_due">Overdue</MenuItem>
            </Select>

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
        </Paper>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        ) : totalFilteredItems === 0 ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Alert severity="info">
              No items match your search criteria.
            </Alert>
          </Box>
        ) : (
          <StyledPaper>
            <Grid container sx={{ p: 2, bgcolor: "grey.50" }}>
              <Grid item xs={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
              </Grid>
              <Grid item xs={2.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Contents
                </Typography>
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Est. Time
                </Typography>
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Score
                </Typography>
              </Grid>
              <Grid item xs={1.5}>
                <Typography variant="subtitle2" color="text.secondary">
                  Due Date
                </Typography>
              </Grid>
              <Grid item xs={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
              </Grid>
            </Grid>

            {/* Training Plans Section */}
            {showTrainingPlans && displayedTrainingPlans.length > 0 && (
              <>
                <SectionHeader>Training Plans</SectionHeader>
                {displayedTrainingPlans.map((plan) => (
                  <Grid
                    key={plan.id}
                    container
                    sx={{
                      p: 2,
                      borderTop: 1,
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "action.hover",
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => handleTrainingPlanClick(plan)}
                  >
                    <Grid item xs={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="500">
                          {plan.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.completion_percentage}% completed
                        </Typography>
                        <Box
                          sx={{
                            height: 2,
                            width: "100%",
                            bgcolor: "primary.50",
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              height: "100%",
                              width: `${plan.completion_percentage}%`,
                              bgcolor: "primary.main",
                            }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={2.5}>
                      <Typography variant="body2">
                        {plan.total_modules} {plan.total_modules === 1 ? 'Module' : 'Modules'} | {plan.total_simulations}{" "}
                        {plan.total_simulations === 1 ? 'Sim' : 'Sims'}
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">{plan.est_time}m</Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            plan.average_sim_score >= 80
                              ? "success.main"
                              : plan.average_sim_score >= 60
                                ? "warning.main"
                                : "error.main",
                        }}
                      >
                        {plan.average_sim_score}%
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">
                        {plan.due_date || "No due date"}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Chip
                        label={plan.status.replace("_", " ")}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(plan.status).bg,
                          color: getStatusColor(plan.status).color,
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Grid>
                  </Grid>
                ))}
              </>
            )}

            {/* Modules Section */}
            {displayedModules.length > 0 && (
              <>
                <SectionHeader>Modules</SectionHeader>
                {displayedModules.map((module) => (
                  <React.Fragment key={module.id}>
                    <Grid
                      container
                      sx={{
                        p: 2,
                        borderTop: 1,
                        borderColor: "divider",
                        "&:hover": {
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      <Grid item xs={3}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <IconButton
                            size="small"
                            onClick={(e) => toggleModuleExpand(module.id, e)}
                            sx={{ mr: 1 }}
                          >
                            {expandedModules[module.id] ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight="500">
                              {module.name}
                            </Typography>
                            <Chip
                              label="Module"
                              size="small"
                              sx={{
                                bgcolor: "#F5F6FF",
                                color: "#444CE7",
                                height: 20,
                                width: "fit-content",
                              }}
                            />
                          </Stack>
                        </Stack>
                      </Grid>
                      <Grid item xs={2.5}>
                        <Typography variant="body2">
                          {module.total_simulations} {module.total_simulations === 1 ? 'Simulation' : 'Simulations'}
                        </Typography>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography variant="body2">
                          {module.estimated_time || 0}m
                        </Typography>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              module.average_score >= 80
                                ? "success.main"
                                : module.average_score >= 60
                                  ? "warning.main"
                                  : "error.main",
                          }}
                        >
                          {module.average_score}%
                        </Typography>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography variant="body2">
                          {module.due_date || "No due date"}
                        </Typography>
                      </Grid>
                      <Grid item xs={2}>
                        <Chip
                          label={module.status.replace("_", " ")}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(module.status).bg,
                            color: getStatusColor(module.status).color,
                            fontWeight: 500,
                            fontSize: "0.75rem",
                          }}
                        />
                      </Grid>
                    </Grid>

                    {/* Expandable Simulations within Module */}
                    <Collapse
                      in={expandedModules[module.id]}
                      timeout="auto"
                      unmountOnExit
                    >
                      {module.simulations.map((sim) => (
                        <Grid
                          container
                          key={sim.simulation_id}
                          sx={{
                            p: 2,
                            pl: 6,
                            borderTop: 1,
                            borderColor: "divider",
                            bgcolor: "grey.50",
                            "&:hover": {
                              bgcolor: "action.hover",
                              cursor: "pointer",
                            },
                          }}
                          onClick={(e) =>
                            handleSimulationClick(
                              sim.simulation_id,
                              sim.assignment_id,
                              e,
                            )
                          }
                        >
                          <Grid item xs={3}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" fontWeight="500">
                                {sim.name}
                              </Typography>
                              <Chip
                                label="Simulation"
                                size="small"
                                sx={{
                                  bgcolor: "#F5F6FF",
                                  color: "#444CE7",
                                  height: 20,
                                  width: "fit-content",
                                }}
                              />
                            </Stack>
                          </Grid>
                          <Grid item xs={2.5}>
                            <Chip
                              label={sim.type}
                              size="small"
                              sx={{
                                bgcolor: "#F5F6FF",
                                color: "#444CE7",
                                height: 20,
                              }}
                            />
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography variant="body2">
                              {sim.estTime || 0}m
                            </Typography>
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  sim.final_score &&
                                  sim.final_score >= 80
                                    ? "success.main"
                                    : sim.final_score &&
                                        sim.final_score >= 60
                                      ? "warning.main"
                                      : "error.main",
                              }}
                            >
                              {sim.final_score
                                ? `${sim.final_score}%`
                                : "N/A"}
                            </Typography>
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography variant="body2">
                              {sim.dueDate || sim.due_date || "No due date"}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Chip
                              label={sim.status.replace("_", " ")}
                              size="small"
                              sx={{
                                bgcolor: getStatusColor(sim.status).bg,
                                color: getStatusColor(sim.status).color,
                                fontWeight: 500,
                                fontSize: "0.75rem",
                              }}
                            />
                          </Grid>
                        </Grid>
                      ))}
                    </Collapse>
                  </React.Fragment>
                ))}
              </>
            )}

            {/* Simulations Section */}
            {displayedSimulations.length > 0 && (
              <>
                <SectionHeader>Simulations</SectionHeader>
                {displayedSimulations.map((simulation) => (
                  <Grid
                    key={simulation.simulation_id}
                    container
                    sx={{
                      p: 2,
                      borderTop: 1,
                      borderColor: "divider",
                      "&:hover": {
                        bgcolor: "action.hover",
                        cursor: "pointer",
                      },
                    }}
                    onClick={(e) =>
                      handleSimulationClick(
                        simulation.simulation_id,
                        simulation.assignment_id,
                        e,
                      )
                    }
                  >
                    <Grid item xs={3}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="500">
                          {simulation.name}
                        </Typography>
                        <Chip
                          label="Simulation"
                          size="small"
                          sx={{
                            bgcolor: "#F5F6FF",
                            color: "#444CE7",
                            height: 20,
                            width: "fit-content",
                          }}
                        />
                      </Stack>
                    </Grid>
                    <Grid item xs={2.5}>
                      <Chip
                        label={simulation.type}
                        size="small"
                        sx={{
                          bgcolor: "#F5F6FF",
                          color: "#444CE7",
                          height: 20,
                        }}
                      />
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">
                        {simulation.estTime || 0}m
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            simulation.final_score &&
                            simulation.final_score >= 80
                              ? "success.main"
                              : simulation.final_score &&
                                  simulation.final_score >= 60
                                ? "warning.main"
                                : "error.main",
                        }}
                      >
                        {simulation.final_score
                          ? `${simulation.final_score}%`
                          : "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography variant="body2">
                        {simulation.dueDate ||
                          simulation.due_date ||
                          "No due date"}
                      </Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Chip
                        label={simulation.status.replace("_", " ")}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(simulation.status).bg,
                          color: getStatusColor(simulation.status).color,
                          fontWeight: 500,
                          fontSize: "0.75rem",
                        }}
                      />
                    </Grid>
                  </Grid>
                ))}
              </>
            )}

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ p: 2, borderTop: 1, borderColor: "divider" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Rows per page:
                </Typography>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(e as any)}
                  size="small"
                  sx={{ minWidth: 70 }}
                >
                  <MenuItem value="5">5</MenuItem>
                  <MenuItem value="10">10</MenuItem>
                  <MenuItem value="25">25</MenuItem>
                  <MenuItem value="50">50</MenuItem>
                </Select>
              </Stack>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                shape="rounded"
                size="small"
              />
            </Stack>
          </StyledPaper>
        )}
      </Stack>
    </LocalizationProvider>
  );
};

export default TrainingItemsTable;