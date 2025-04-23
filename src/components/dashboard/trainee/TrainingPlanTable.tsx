import React, { useState } from "react";
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
  Divider,
  IconButton,
  Collapse,
  Button,
  Popover,
  InputAdornment,
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
import type { TrainingPlan, Module, Simulation } from "../../../types/training";
import { useAuth } from "../../../context/AuthContext";

interface TrainingPlanTableProps {
  trainingPlans: TrainingPlan[];
  modules?: Module[];
  simulations?: Simulation[];
  isLoading?: boolean;
  error?: string | null;
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

const DateFilterButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(0.75, 2),
  textTransform: "none",
  color: theme.palette.text.primary,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
  display: "flex",
  justifyContent: "space-between",
  minWidth: 180,
}));

const DateSelectionChip = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  borderRadius: "16px",
  padding: theme.spacing(0.75, 2),
  textTransform: "none",
  color: theme.palette.text.primary,
  fontWeight: "normal",
  justifyContent: "flex-start",
  "&:hover": {
    backgroundColor: theme.palette.grey[300],
  },
  width: "auto",
  marginBottom: "8px",
}));

const TrainingPlanTable: React.FC<TrainingPlanTableProps> = ({
  trainingPlans,
  modules = [],
  simulations = [],
  isLoading = false,
  error = null,
}) => {
  const navigate = useNavigate();
  const { currentWorkspaceId } = useAuth();
  const [rowsPerPage, setRowsPerPage] = useState("5");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedModules, setExpandedModules] = useState<{
    [key: string]: boolean;
  }>({});
  const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
  const [selectionState, setSelectionState] = useState<"start" | "end">(
    "start",
  );

  // Calculate total items
  const totalTrainingPlans = trainingPlans.length;
  const totalModules = modules.length;
  const totalSimulations = simulations.length;
  const totalItems = totalTrainingPlans + totalModules + totalSimulations;

  // Calculate total simulations across all items
  const totalSimulationsCount =
    trainingPlans.reduce((acc, plan) => acc + plan.total_simulations, 0) +
    modules.reduce((acc, module) => acc + module.total_simulations, 0) +
    simulations.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return { bg: "#EEF4FF", color: "#3538CD" };
      case "finished":
        return { bg: "#ECFDF3", color: "#027A48" };
      default:
        return { bg: "#FFFAEB", color: "#B54708" };
    }
  };

  // Format date range for display
  const getDateRangeText = () => {
    if (dateRange[0] && dateRange[1]) {
      return `${dateRange[0].format("MMM D, YYYY")} - ${dateRange[1].format("MMM D, YYYY")}`;
    } else if (dateRange[0]) {
      return `From ${dateRange[0].format("MMM D, YYYY")}`;
    } else if (dateRange[1]) {
      return `Until ${dateRange[1].format("MMM D, YYYY")}`;
    }
    return "All Time";
  };

  // Handle date filter
  const handleDateFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setDateAnchorEl(event.currentTarget);
  };

  const handleDateFilterClose = () => {
    setDateAnchorEl(null);
  };

  const handleDateRangeApply = () => {
    handleDateFilterClose();
  };

  // Function to handle date selections
  const handleDateSelect = (selectedDate: Dayjs) => {
    if (selectionState === "start") {
      // If we're selecting the start date, set both start and end to this date
      // and switch to selecting the end date
      setDateRange([selectedDate, selectedDate]);
      setSelectionState("end");
    } else {
      // If we're selecting the end date, compare with the start date
      const startDate = dateRange[0];

      if (startDate && selectedDate.isBefore(startDate)) {
        // If the selected end date is before the start date, swap them
        setDateRange([selectedDate, startDate]);
      } else {
        // Otherwise set the end date
        setDateRange([startDate, selectedDate]);
      }

      // Reset to selecting start date for next time
      setSelectionState("start");
    }
  };

  // Handle quick date selections
  const handleToday = () => {
    const today = dayjs();
    setDateRange([today, today]);
  };

  const handleTomorrow = () => {
    const tomorrow = dayjs().add(1, "day");
    setDateRange([tomorrow, tomorrow]);
  };

  const handleNext7Days = () => {
    const start = dayjs();
    const end = dayjs().add(6, "day");
    setDateRange([start, end]);
  };

  const handleNext30Days = () => {
    const start = dayjs();
    const end = dayjs().add(29, "day");
    setDateRange([start, end]);
  };

  const handleAllTime = () => {
    setDateRange([null, null]);
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
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

  const isDateInRange = (dateStr: string | null) => {
    if (!dateStr) return true;
    if (!dateRange[0] && !dateRange[1]) return true;

    const date = dayjs(dateStr);
    const startDate = dateRange[0];
    const endDate = dateRange[1];

    if (startDate && endDate) {
      return date.isAfter(startDate) && date.isBefore(endDate);
    } else if (startDate) {
      return date.isAfter(startDate);
    } else if (endDate) {
      return date.isBefore(endDate);
    }

    return true;
  };

  // Filter all items based on search query, status, and date range
  const filteredTrainingPlans = trainingPlans.filter((plan) => {
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
  });

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
    if (!isDateInRange(sim.due_date)) {
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
  const paginatedTrainingPlans = filteredTrainingPlans.slice(
    startIndex,
    endIndex,
  );
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
  const displayedTrainingPlans = paginatedTrainingPlans.slice(
    0,
    remainingItems,
  );
  remainingItems -= displayedTrainingPlans.length;

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

  // Updated to include assignment_id in navigation
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
    // Navigate to training plan details page with state containing the training plan data
    // Include workspace ID in the URL if available
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
              Training Plan
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
            {/* Date Range Picker Button */}
            <DateFilterButton
              onClick={handleDateFilterClick}
              startIcon={<CalendarIcon />}
              endIcon={<ArrowDownIcon />}
              sx={{
                backgroundColor: "background.paper",
                minHeight: "40px",
                minWidth: "180px",
                justifyContent: "space-between",
                padding: "6px 12px",
              }}
            >
              {getDateRangeText()}
            </DateFilterButton>

            {/* Date Range Picker Popover */}
            <Popover
              open={Boolean(dateAnchorEl)}
              anchorEl={dateAnchorEl}
              onClose={handleDateFilterClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              PaperProps={{
                sx: {
                  p: 3,
                  width: "auto",
                  mt: 1,
                  boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
                  borderRadius: 2,
                },
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textTransform: "uppercase",
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    mb: 1,
                  }}
                >
                  SELECT DATE RANGE
                </Typography>

                <Typography variant="h5" sx={{ mb: 3, fontWeight: "medium" }}>
                  {dateRange[0] && dateRange[1]
                    ? `${dateRange[0].format("MMM D")} – ${dateRange[1].format("MMM D")}`
                    : "Select dates"}
                </Typography>

                <Grid container spacing={2}>
                  {/* Left side - Quick selection chips */}
                  <Grid item xs={3}>
                    <Stack spacing={1} alignItems="flex-start">
                      <DateSelectionChip onClick={handleToday}>
                        Today
                      </DateSelectionChip>
                      <DateSelectionChip onClick={handleTomorrow}>
                        Tomorrow
                      </DateSelectionChip>
                      <DateSelectionChip onClick={handleNext7Days}>
                        Next 7 Days
                      </DateSelectionChip>
                      <DateSelectionChip onClick={handleNext30Days}>
                        Next 30 Days
                      </DateSelectionChip>
                      <DateSelectionChip onClick={handleAllTime}>
                        All Time
                      </DateSelectionChip>
                    </Stack>
                  </Grid>

                  {/* Right side - Calendars */}
                  <Grid item xs={9}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        ".MuiDateRangePickerViewDesktop-root": {
                          border: "none",
                          boxShadow: "none",
                        },
                      }}
                    >
                      <div style={{ display: "flex" }}>
                        {/* April Calendar */}
                        <div style={{ padding: "8px 12px" }}>
                          <div
                            style={{
                              textAlign: "center",
                              padding: "8px 0px",
                              fontWeight: 500,
                            }}
                          >
                            April 2025
                          </div>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7, 40px)",
                              gridGap: "4px",
                            }}
                          >
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              S
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              M
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              T
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              W
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              T
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              F
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              S
                            </Box>
                            {Array(30)
                              .fill(0)
                              .map((_, i) => {
                                const day = i + 1;
                                const date = dayjs()
                                  .year(2025)
                                  .month(3)
                                  .date(day);

                                // Check if this date is within the selected range
                                const isStartDate =
                                  dateRange[0] &&
                                  date.isSame(dateRange[0], "day");
                                const isEndDate =
                                  dateRange[1] &&
                                  date.isSame(dateRange[1], "day");
                                const isInRange =
                                  dateRange[0] &&
                                  dateRange[1] &&
                                  date.isAfter(dateRange[0], "day") &&
                                  date.isBefore(dateRange[1], "day");

                                return (
                                  <Box
                                    key={`apr-${day}`}
                                    sx={{
                                      width: "40px",
                                      height: "40px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      borderRadius:
                                        isStartDate || isEndDate
                                          ? "50%"
                                          : isInRange
                                            ? "0"
                                            : "50%",
                                      backgroundColor:
                                        isStartDate || isEndDate
                                          ? "#1976d2"
                                          : isInRange
                                            ? "rgba(25, 118, 210, 0.2)"
                                            : "transparent",
                                      color:
                                        isStartDate || isEndDate
                                          ? "white"
                                          : isInRange
                                            ? "#1976d2"
                                            : "text.primary",
                                      "&:hover": {
                                        backgroundColor:
                                          isStartDate || isEndDate
                                            ? "#1565c0"
                                            : isInRange
                                              ? "rgba(25, 118, 210, 0.3)"
                                              : "action.hover",
                                      },
                                    }}
                                    onClick={() => handleDateSelect(date)}
                                  >
                                    {day}
                                  </Box>
                                );
                              })}
                          </Box>
                        </div>

                        {/* Vertical divider */}
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ mx: 1 }}
                        />

                        {/* May Calendar */}
                        <div style={{ padding: "8px 12px" }}>
                          <div
                            style={{
                              textAlign: "center",
                              padding: "8px 0px",
                              fontWeight: 500,
                            }}
                          >
                            May 2025
                          </div>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(7, 40px)",
                              gridGap: "4px",
                            }}
                          >
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              S
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              M
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              T
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              W
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              T
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              F
                            </Box>
                            <Box
                              sx={{
                                textAlign: "center",
                                color: "text.secondary",
                                fontSize: "0.75rem",
                                padding: "8px 0",
                              }}
                            >
                              S
                            </Box>
                            {Array(31)
                              .fill(0)
                              .map((_, i) => {
                                const day = i + 1;
                                const date = dayjs()
                                  .year(2025)
                                  .month(4)
                                  .date(day);

                                // Check if this date is within the selected range
                                const isStartDate =
                                  dateRange[0] &&
                                  date.isSame(dateRange[0], "day");
                                const isEndDate =
                                  dateRange[1] &&
                                  date.isSame(dateRange[1], "day");
                                const isInRange =
                                  dateRange[0] &&
                                  dateRange[1] &&
                                  date.isAfter(dateRange[0], "day") &&
                                  date.isBefore(dateRange[1], "day");

                                return (
                                  <Box
                                    key={`may-${day}`}
                                    sx={{
                                      width: "40px",
                                      height: "40px",
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      cursor: "pointer",
                                      borderRadius:
                                        isStartDate || isEndDate
                                          ? "50%"
                                          : isInRange
                                            ? "0"
                                            : "50%",
                                      backgroundColor:
                                        isStartDate || isEndDate
                                          ? "#1976d2"
                                          : isInRange
                                            ? "rgba(25, 118, 210, 0.2)"
                                            : "transparent",
                                      color:
                                        isStartDate || isEndDate
                                          ? "white"
                                          : isInRange
                                            ? "#1976d2"
                                            : "text.primary",
                                      "&:hover": {
                                        backgroundColor:
                                          isStartDate || isEndDate
                                            ? "#1565c0"
                                            : isInRange
                                              ? "rgba(25, 118, 210, 0.3)"
                                              : "action.hover",
                                      },
                                    }}
                                    onClick={() => handleDateSelect(date)}
                                  >
                                    {day}
                                  </Box>
                                );
                              })}
                          </Box>
                        </div>
                      </div>
                    </Box>

                    {/* Buttons */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mt: 2,
                      }}
                    >
                      <Button
                        onClick={handleDateFilterClose}
                        sx={{ mr: 1, color: "text.primary" }}
                      >
                        Close
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleDateRangeApply}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#1565c0" },
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Popover>

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
              <MenuItem value="overdue">Overdue</MenuItem>
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
        ) : totalItems === 0 ? (
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Alert severity="info">
              No training plans, modules, or simulations assigned yet.
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
            {displayedTrainingPlans.length > 0 && (
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
                        {plan.total_modules} Modules | {plan.total_simulations}{" "}
                        Sims
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
                          {module.total_simulations} Simulations
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
                              {sim.est_time || 0}m
                            </Typography>
                          </Grid>
                          <Grid item xs={1.5}>
                            <Typography
                              variant="body2"
                              sx={{
                                color:
                                  sim.highest_attempt_score &&
                                  sim.highest_attempt_score >= 80
                                    ? "success.main"
                                    : sim.highest_attempt_score &&
                                        sim.highest_attempt_score >= 60
                                      ? "warning.main"
                                      : "error.main",
                              }}
                            >
                              {sim.highest_attempt_score
                                ? `${sim.highest_attempt_score}%`
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
                        {simulation.est_time || 0}m
                      </Typography>
                    </Grid>
                    <Grid item xs={1.5}>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            simulation.highest_attempt_score &&
                            simulation.highest_attempt_score >= 80
                              ? "success.main"
                              : simulation.highest_attempt_score &&
                                  simulation.highest_attempt_score >= 60
                                ? "warning.main"
                                : "error.main",
                        }}
                      >
                        {simulation.highest_attempt_score
                          ? `${simulation.highest_attempt_score}%`
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

            {totalFilteredItems === 0 && (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography color="text.secondary">
                  No items match your search criteria.
                </Typography>
              </Box>
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

export default TrainingPlanTable;
