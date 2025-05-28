import React, { useState, useMemo, useEffect, useCallback } from "react";
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
} from "@mui/icons-material";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { TrainingPlan, Module, Simulation } from "../../../types/training";
import { useAuth } from "../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../utils/navigation";
import {
  fetchTrainingItems,
  type TrainingItemsPaginationParams,
} from "../../../services/training";
import DateSelector from "../../common/DateSelector";

// Extend dayjs with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

interface TrainingItemsTableProps {
  showTrainingPlans?: boolean; // Control whether to show training plans section
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  boxShadow: "none",
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.grey[100],
  fontWeight: 600,
  fontSize: "0.875rem",
}));

const TrainingItemsTable: React.FC<TrainingItemsTableProps> = ({
  showTrainingPlans = true,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState<{
    [key: string]: boolean;
  }>({});
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Format status labels to proper capitalization
  const formatStatusLabel = (status: string) => {
    if (status === "over_due" || status === "overdue") return "Overdue";

    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };


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

  // Determine if a simulation is completed
  const isSimulationCompleted = (status: string) =>
    status === "finished" || status === "completed";

  // Get color for simulation score based on completion status and score
  const getScoreColor = (score: number | null, status: string) => {
    if (!isSimulationCompleted(status) || score === null) {
      return "text.primary";
    }

    if (score >= 80) return "success.main";
    if (score >= 60) return "warning.main";
    return "error.main";
  };

  // Get display value for a simulation score
  const getScoreDisplay = (score: number | null, status: string) => {
    return isSimulationCompleted(status) && score !== null ? `${score}%` : "NA";
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
  const handleDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    // The dateRange state contains dates in the user's timezone
    // The isDateInRange function will handle conversion to UTC for backend comparison
  };


  const loadTrainingItems = useCallback(async () => {
    const params: TrainingItemsPaginationParams = {
      page: currentPage,
      pagesize: parseInt(rowsPerPage),
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }
    if (dateRange[0]) {
      params.startDate = dateRange[0].format("YYYY-MM-DD");
    }
    if (dateRange[1]) {
      params.endDate = dateRange[1].format("YYYY-MM-DD");
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchTrainingItems(user?.id || "user123", params);
      setTrainingPlans(data.training_plans || []);
      setModules(data.modules || []);
      setSimulations(data.simulations || []);
      if (data.pagination) {
        setTotalPages(data.pagination.total_pages);
        setTotalCount(data.pagination.total_count);
      }
    } catch (err) {
      console.error("Error loading training items:", err);
      setError("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    rowsPerPage,
    searchQuery,
    statusFilter,
    dateRange,
    currentWorkspaceId,
  ]);

  useEffect(() => {
    loadTrainingItems();
  }, [loadTrainingItems]);

  const isDateInRange = (dateStr: string | null) => {
    if (!dateStr) return true;
    if (!dateRange[0] && !dateRange[1]) return true;

    const backendDate = dayjs.utc(dateStr);

    let startDateUTC = null;
    let endDateUTC = null;

    if (dateRange[0]) {
      startDateUTC = currentTimeZone
        ? dayjs
            .tz(dateRange[0].format("YYYY-MM-DD"), currentTimeZone)
            .startOf("day")
            .utc()
        : dateRange[0].utc().startOf("day");
    }

    if (dateRange[1]) {
      endDateUTC = currentTimeZone
        ? dayjs
            .tz(dateRange[1].format("YYYY-MM-DD"), currentTimeZone)
            .endOf("day")
            .utc()
        : dateRange[1].utc().endOf("day");
    }

    if (startDateUTC && endDateUTC) {
      return (
        backendDate.isAfter(startDateUTC) && backendDate.isBefore(endDateUTC)
      );
    } else if (startDateUTC) {
      return backendDate.isAfter(startDateUTC);
    } else if (endDateUTC) {
      return backendDate.isBefore(endDateUTC);
    }

    return true;
  };

  const displayedTrainingPlans = showTrainingPlans ? trainingPlans : [];
  const displayedModules = modules;
  const displayedSimulations = simulations;

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
    const path = buildPathWithWorkspace(
      `/simulation/${simulationId}/${assignmentId}/attempt`,
      currentWorkspaceId,
      currentTimeZone,
    );
    navigate(path);
  };

  const handleTrainingPlanClick = (trainingPlan: TrainingPlan) => {
    const path = buildPathWithWorkspace(
      `/training/${trainingPlan.id}`,
      currentWorkspaceId,
      currentTimeZone,
    );
    navigate(path, {
      state: { trainingPlan },
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={3}>
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
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="over_due">Overdue</MenuItem>
            </Select>

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
        ) : totalCount === 0 ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Alert severity="info">No items match your search criteria.</Alert>
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
                        {plan.total_modules}{" "}
                        {plan.total_modules === 1 ? "Module" : "Modules"} |{" "}
                        {plan.total_simulations}{" "}
                        {plan.total_simulations === 1 ? "Sim" : "Sims"}
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
                        label={formatStatusLabel(plan.status)}
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
                          {module.total_simulations}{" "}
                          {module.total_simulations === 1
                            ? "Simulation"
                            : "Simulations"}
                        </Typography>
                      </Grid>
                      <Grid item xs={1.5}>
                        <Typography variant="body2">
                          {module.est_time || 0}m
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
                          label={formatStatusLabel(module.status)}
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
                              sx={{ color: getScoreColor(sim.final_score, sim.status) }}
                            >
                              {getScoreDisplay(sim.final_score, sim.status)}
                            </Typography>
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography variant="body2">
                              {sim.dueDate || sim.due_date || "No due date"}
                            </Typography>
                          </Grid>
                          <Grid item xs={2}>
                            <Chip
                              label={formatStatusLabel(sim.status)}
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
                        sx={{ color: getScoreColor(simulation.final_score, simulation.status) }}
                      >
                        {getScoreDisplay(simulation.final_score, simulation.status)}
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
                        label={formatStatusLabel(simulation.status)}
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
