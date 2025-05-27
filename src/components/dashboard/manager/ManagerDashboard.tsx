import {
  Check,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Download,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload,
  InfoOutlined,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  circularProgressClasses,
  Collapse,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  ListItemIcon,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  Tab,
  Table,
  styled,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Popover,
  Divider,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  Popper,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import {
  CalendarMonth as CalendarIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchManagerDashboardAggregatedData,
  fetchTrainingEntityAttemptsStatsForManagerDashboard,
  ManagerDashboardAggregatedDataResponse,
  ManagerDashboardTrainingEntityAttemptsStatsResponse,
} from "../../../services/manager";
import DashboardContent from "../DashboardContent";
import {
  fetchReporteeUsers,
  fetchUsersSummary,
  User,
  UserSummary,
} from "../../../services/users";
import { fetchTeams, TeamResponse, Team } from "../../../services/teams";
import DateSelector from "../../common/DateSelector";
import { BarChart } from "@mui/x-charts";

// Format status labels to proper capitalization
const formatStatusLabel = (status) => {
  if (!status) return "";
  if (typeof status !== "string") return status;

  if (status.toLowerCase() === "over_due" || status.toLowerCase() === "overdue")
    return "Overdue";

  return status
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Improved StatusPill component
const StatusPill = ({ status }) => {
  // Safety check for null/undefined status
  if (!status) return null;

  const { bg, color } = getStatusColor(status);

  return (
    <Chip
      label={formatStatusLabel(status)}
      size="small"
      sx={{
        bgcolor: bg,
        color: color,
        fontWeight: "medium",
        borderRadius: "16px",
        height: "24px",
        fontSize: "0.75rem",
      }}
    />
  );
};

const getStatusColor = (status) => {
  // Safety check for null/undefined status
  if (!status) return { bg: "#FFFAEB", color: "#B54708" };
  if (typeof status !== "string") return { bg: "#FFFAEB", color: "#B54708" };

  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case "in_progress":
    case "ongoing":
      return { bg: "#EEF4FF", color: "#3538CD" };
    case "completed":
    case "finished":
      return { bg: "#ECFDF3", color: "#027A48" };
    case "over_due":
    case "overdue":
      return { bg: "#FEF2F2", color: "#DC2626" };
    case "not_started":
      return { bg: "#FFFAEB", color: "#B54708" };
    default:
      console.log("Unknown status:", status);
      return { bg: "#FFFAEB", color: "#B54708" };
  }
};

// Mock data for the dashboard
const mockData = {
  dropdownData: [
    {
      items: ["user_name 01", "user_name 02", "user_name 03", "user_name 04"],
    },
    {
      items: ["Team 01", "Team 02", "Team 03", "Team 04"],
    },
  ],
  assignmentCounts: {
    trainingPlans: {
      total: 43,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10,
    },
    modules: {
      total: 240,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10,
    },
    simulations: {
      total: 240,
      completed: 10,
      inProgress: 10,
      notStarted: 10,
      overdue: 10,
    },
  },
  completionRates: {
    trainingPlan: 25,
    modules: 55,
    simulation: 85,
  },
  averageScores: {
    trainingPlan: 89,
    modules: 94,
    simulation: 94,
  },
  adherenceRates: {
    trainingPlan: 89,
    modules: 94,
    simulation: 94,
  },
  leaderBoards: {
    completion: [
      { team: "Team 01", score: 95 },
      { team: "Team 01", score: 85 },
      { team: "Team 01", score: 80 },
      { team: "Team 01", score: 60 },
      { team: "Team 01", score: 37 },
    ],
    averageScore: [
      { team: "Team 01", score: 95 },
      { team: "Team 01", score: 85 },
      { team: "Team 01", score: 80 },
      { team: "Team 01", score: 60 },
      { team: "Team 01", score: 37 },
    ],
    adherence: [
      { team: "Team 01", score: 95 },
      { team: "Team 01", score: 85 },
      { team: "Team 01", score: 80 },
      { team: "Team 01", score: 60 },
      { team: "Team 01", score: 37 },
    ],
  },
  trainingPlans: [
    {
      id: "45789",
      name: "Training_Plan_01",
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: "15 mins",
      trainees: [
        {
          name: "Abhinav",
          classId: "82840",
          status: "In Progress",
          dueDate: "25 Dec 2024",
          avgScore: null,
        },
        {
          name: "Abhinav",
          classId: "82840",
          status: "Not Started",
          dueDate: "25 Dec 2024",
          avgScore: null,
        },
        {
          name: "Abhinav",
          classId: "82840",
          status: "Completed",
          dueDate: "25 Dec 2024",
          avgScore: 86,
        },
        {
          name: "Abhinav",
          classId: "82840",
          status: "over_due",
          dueDate: "25 Dec 2024",
          avgScore: null,
        },
      ],
    },
    {
      id: "45789",
      name: "Training_Plan_01",
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: "15 mins",
      trainees: [],
    },
    {
      id: "45789",
      name: "Training_Plan_01",
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: "15 mins",
      trainees: [],
    },
    {
      id: "45789",
      name: "Training_Plan_01",
      assignedTrainees: 567,
      completionRate: 86,
      adherenceRate: 56,
      avgScore: 86,
      estTime: "15 mins",
      trainees: [],
    },
  ],
  creators: [
    {
      id: "4578933",
      name: "Creator 1",
    },
    {
      id: "4578922",
      name: "Creator 2",
    },
  ],
};

const defaultAggDashboardData: ManagerDashboardAggregatedDataResponse = {
  assignmentCounts: {
    trainingPlans: {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
    },
    modules: {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
    },
    simulations: {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overdue: 0,
    },
  },
  completionRates: {
    trainingPlans: 0,
    modules: 0,
    simulations: 0,
  },
  averageScores: {
    trainingPlans: 0,
    modules: 0,
    simulations: 0,
  },
  adherenceRates: {
    trainingPlans: 0,
    modules: 0,
    simulations: 0,
  },
  leaderBoards: {
    completion: [],
    averageScore: [],
    adherence: [],
  },
};

// Tooltip text for various cards on the dashboard
const TOOLTIP_ASSIGNMENTS =
  "Total = Completed + In Progress + Not Started + Overdue. Overdue counts assignments past the due date.";
const TOOLTIP_COMPLETION_RATE =
  "Completion Rate = (Completed / Total assignments) × 100.";
const TOOLTIP_AVERAGE_SCORE = "Average of scores from completed attempts.";
const TOOLTIP_ADHERENCE_RATE =
  "Adherence Rate = (On-time completions / Total completions) × 100.";
const TOOLTIP_COMPLETION_LEADERBOARD = "Teams ranked by completion rate.";
const TOOLTIP_AVERAGE_SCORE_LEADERBOARD = "Teams ranked by average score.";
const TOOLTIP_ADHERENCE_LEADERBOARD = "Teams ranked by adherence rate.";

// CircularProgressWithLabel component
const CircularProgressWithLabel = ({ value, size = 170, thickness = 5 }) => {
  return (
    <Box
      sx={{
        position: "relative",
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        py: "27px",
        px: "16px",
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={thickness}
          sx={{ color: "#919EAB29", width: "100%", height: "auto" }}
        />
        <CircularProgress
          variant="determinate"
          value={value}
          size={size}
          thickness={thickness}
          sx={(theme) => ({
            color: "#001EEE99",
            animationDuration: "550ms",
            position: "absolute",
            left: 0,
            width: "100%",
            height: "auto",
            [`& .${circularProgressClasses.circle}`]: {
              strokeLinecap: "round",
            },
            ...theme.applyStyles("dark", {
              color: "#308fe8",
            }),
          })}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h3"
            component="div"
            color="#000000"
            fontWeight="bold"
            fontSize={40}
          >
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

const dataset = [
  {
    score: 95,
    label: "Team 01",
  },
  {
    score: 85,
    label: "Team 02",
  },
  {
    score: 80,
    label: "Team 03",
  },
  {
    score: 60,
    label: "Team 04",
  },
  {
    score: 37,
    label: "Team 05",
  },
];

function valueFormatter(value: number | null) {
  return `${value}%`;
}

const chartSetting = {
  width: 350,
  height: 200,
  xAxis: [
    {
      min: 0,
      max: 100,
      tickMinStep: 20,
    },
  ],
};

// Updated LeaderBoard component with fixed height
const LeaderBoard = ({
  data,
  title,
  onSortChange,
  popupText,
  disabled = false,
}) => {
  const [sortBy, setSortBy] = useState("High to Low");

  const handleSortChange = (event) => {
    if (disabled) return; // Prevent sorting when disabled
    const newSortBy = event.target.value;
    setSortBy(newSortBy);
    if (onSortChange) {
      onSortChange(newSortBy);
    }
  };

  // Use empty data when disabled, otherwise use the provided data
  const chartData = disabled ? [] : data;

  // Sort the data based on current selection
  const sortedData = [...chartData].sort((a, b) => {
    if (sortBy === "High to Low") {
      return b.score - a.score;
    } else {
      return a.score - b.score;
    }
  });

  // Calculate dynamic bar sizing based on number of teams
  const numberOfTeams = sortedData.length;
  const maxTeamsForNormalHeight = 5;
  const baseHeight = 200;

  // Calculate margins to ensure consistent chart container height
  const topMargin = 10;
  const bottomMargin = 10;
  const chartAreaHeight = baseHeight - topMargin - bottomMargin;

  return (
    <Card
      sx={{
        borderRadius: 2,
        position: "relative",
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
        height: "100%", // Make height 100% to match other cards in the row
        display: "flex",
        flexDirection: "column",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <Stack justifyContent="space-between" height="100%">
        <Stack
          direction="column"
          justifyContent="space-between"
          alignItems="start"
          sx={{ px: 3, py: 1.5, borderBottom: "1px solid #0000001A" }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="start"
            width="100%"
          >
            <Typography color="#00000099" variant="h6">
              {title}
            </Typography>
            <InfoIconPopup title={popupText} />
          </Stack>
          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
            <Typography
              fontSize={12}
              variant="caption"
              color="#00000099"
              sx={{ mr: 1 }}
            >
              Sort by:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                disabled={disabled}
                sx={{
                  fontSize: 12,
                  "& .MuiSelect-select": {
                    py: 0.5,
                    px: 1,
                  },
                  "& fieldset": {
                    border: "1px solid #E0E0E0",
                  },
                }}
              >
                <MenuItem value="High to Low" sx={{ fontSize: 12 }}>
                  High to Low
                </MenuItem>
                <MenuItem value="Low to High" sx={{ fontSize: 12 }}>
                  Low to High
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
        <Stack
          sx={{
            px: 1.5,
            pt: 2,
            flex: 1,
            display: "flex",
            justifyContent: "center",
            height: baseHeight, // Fixed container height
            maxHeight: baseHeight, // Prevent expansion
            overflow: "hidden", // Hide any overflow
          }}
          gap={1}
        >
          <Box
            sx={{
              height: baseHeight, // Fixed height container
              maxHeight: baseHeight,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChart
              dataset={sortedData}
              yAxis={[{ 
                scaleType: "band", 
                dataKey: "team",
                categoryGap: numberOfTeams > maxTeamsForNormalHeight ? 0.1 : 0.2, // Reduce gap for more teams
              }]}
              xAxis={[
                {
                  min: 0,
                  max: 100,
                  tickMinStep: 20,
                  valueFormatter: (value) => `${value}%`,
                },
              ]}
              series={[
                {
                  dataKey: "score",
                  valueFormatter,
                  color: "#E8EDFF",
                },
              ]}
              barLabel="value"
              borderRadius={6}
              layout="horizontal"
              height={baseHeight} // Fixed height
              margin={{
                top: topMargin,
                bottom: bottomMargin,
                left: 60,
                right: 60,
              }}
              sx={{
                ".MuiChartsAxisTickLabel-root": {
                  fill: "#637381",
                  fontSize: numberOfTeams > maxTeamsForNormalHeight ? 12 : 14, // Smaller font for more teams
                  fontWeight: "medium",
                },
                ".MuiChartsAxis-line": {
                  stroke: "transparent",
                },
                ".MuiChartsAxis-tick": {
                  display: "none",
                },
                ".MuiChartsBarLabel-root": {
                  fontSize: numberOfTeams > maxTeamsForNormalHeight ? 11 : 12, // Smaller labels for more teams
                },
                // Ensure the chart doesn't expand beyond the container
                maxHeight: baseHeight,
                overflow: "hidden",
              }}
            />
          </Box>
        </Stack>
      </Stack>
    </Card>
  );
};

const InfoIconPopup = ({ title }) => {
  return (
    <Tooltip
      title={title}
      placement="top"
      arrow
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, -8],
              },
            },
          ],
        },
        tooltip: {
          sx: {
            bgcolor: "#000000",
            color: "#ffffff",
            width: "192px",
            px: 1.5,
            py: 1,
          },
        },
        arrow: {
          sx: { color: "#000000" },
        },
      }}
    >
      <InfoOutlined fontSize="small" color="action" />
    </Tooltip>
  );
};

// AssignmentCard component
const AssignmentCard = ({
  title,
  total,
  completed,
  inProgress,
  notStarted,
  overdue,
  popupText,
}) => {
  return (
    <Card
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        position: "relative",
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
        height: "100%", // Set to 100% to ensure consistency in row
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography
            fontSize={16}
            color="#00000099"
            fontWeight="semibold"
            variant="h6"
          >
            {title}
          </Typography>
          <InfoIconPopup title={popupText} />
        </Stack>

        <Typography
          variant="h2"
          sx={{ fontSize: 44 }}
          color="#000000CC"
          fontWeight="bold"
        >
          {total}
        </Typography>

        <Grid container gap="14px">
          <Grid item>
            <Box sx={{ bgcolor: "#ECFDF3", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#027A48"
              >
                Completed: {completed}
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box sx={{ bgcolor: "#EEF4FF", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#3538CD"
              >
                In Progress: {inProgress}
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box sx={{ bgcolor: "#FFFAEB", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#B54708"
              >
                Not Started: {notStarted}
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box sx={{ bgcolor: "#FEF2F2", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#DC2626"
              >
                Overdue: {overdue}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </Card>
  );
};

const CircularProgressCards = ({ value, title, popupText }) => {
  return (
    <Card
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        position: "relative",
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
        height: "100%", // Set to 100% to ensure consistency in row
      }}
    >
      <Stack spacing={2} alignItems="center" height="100%">
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ width: "100%" }}
        >
          <Typography
            color="#00000099"
            fontSize={16}
            fontWeight={600}
            variant="h6"
          >
            {title}
          </Typography>
          <InfoIconPopup title={popupText} />
        </Stack>
        <CircularProgressWithLabel value={value} />
      </Stack>
    </Card>
  );
};

const BreakupDataDialog = ({ downloadData, cancel }) => {
  return (
    <Dialog
      open={true}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 400,
          p: 3,
        },
      }}
    >
      <DialogTitle sx={{ p: 0, width: "100%", mb: "32px" }}>
        <Stack alignItems={"center"} gap="20px">
          <Stack
            direction="row"
            justifyContent="center"
            alignItems={"center"}
            width={"100%"}
          >
            <Stack
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "56px",
                height: "56px",
                bgcolor: "#001EEE0A",
                borderRadius: "50%",
              }}
            >
              <Stack
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  bgcolor: "#001EEE14",
                  borderRadius: "50%",
                }}
              >
                <FileDownloadOutlinedIcon
                  sx={{ color: "#143FDA", fontSize: 24 }}
                />
                {/* <VisibilityOffIcon sx={{ color: "#143FDA", fontSize: 18 }} /> */}
              </Stack>
            </Stack>
          </Stack>
          <Stack alignItems={"center"} gap={1}>
            <Typography
              variant="body2"
              fontSize={20}
              fontWeight={600}
              color="#000000E5"
            >
              Download Break-up Data
            </Typography>
            <Typography
              variant="body2"
              color="#00000099"
              textAlign={"center"}
              fontWeight={400}
              fontSize={14}
              width="90%"
            >
              Download the list of users.
            </Typography>
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0, width: "100%" }}>
        <Stack direction="row" width={"100%"} spacing={2}>
          <Button
            variant="outlined"
            sx={{
              borderColor: "#0000001A",
              color: "#000000CC",
            }}
            fullWidth
            onClick={cancel}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              bgcolor: "#001EEE",
            }}
            fullWidth
            onClick={downloadData}
          >
            Download
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

// TrainingPlanTable component
const TrainingPlanTable = ({
  trainingPlans,
  totalCount,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  allUserNamesMap,
  allUserClassIdsMap,
  activeTab,
  isTableLoading,
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIdForCsvDownload, setSelectedIdForCsvDownload] =
    useState<string>("");

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  const handlePopupClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    entityId: string,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedIdForCsvDownload(entityId);
  };
  const handlePopupClose = (e: any) => {
    e.stopPropagation();
    setAnchorEl(null);
  };
  const toggleRow = (id: any) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getCompactId = (id: string) => {
    if (!id || id.length < 6) return id;
    return `${id.slice(0, 3)}..${id.slice(-3)}`;
  };

  const handleOpenDownloadDialog = (e: any) => {
    e.stopPropagation();
    if (!selectedIdForCsvDownload) {
      console.warn("No entity ID selected for CSV download.");
      return;
    }
    setIsDialogOpen(true);
  };

  const handleDialogCancel = () => {
    setIsDialogOpen(false);
  };

  const handleDownloadCsv = () => {
    const headers = [
      "Trainee Name",
      "Class ID",
      "Status",
      "Due Date",
      "Avg. Score",
    ];
    const trainingEntityData = trainingPlans.find(
      (plan: any) => plan.id === selectedIdForCsvDownload,
    );
    const csvRows = [headers.join(",")];
    trainingEntityData.trainees?.forEach((row: any) => {
      const rowData = [
        allUserNamesMap.get(row.name) || row.name,
        allUserClassIdsMap.get(row.name) || "-",
        formatStatusLabel(row.status),
        row.dueDate,
        row.avgScore,
      ].join(",");
      csvRows.push(rowData);
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "table_data.csv";
    link.click();
    URL.revokeObjectURL(url);
    setIsDialogOpen(false);
    setSelectedIdForCsvDownload("");
  };

  return (
    <TableContainer
      component={Paper}
      sx={{ border: "1px solid #0000001A", borderRadius: 2, mt: 2 }}
    >
      <Table>
        <TableHead sx={{ bgcolor: "#F9FAFB" }}>
          <TableRow>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              ID No.
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              {activeTab === "TrainingPlan"
                ? "TRP Name"
                : activeTab === "Module"
                  ? "Module Name"
                  : "Simulation Name"}
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              Assigned Trainees
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              Completion rate
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              Adherence Rate
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              Avg. Score
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}>
              Est. Time
            </TableCell>
            <TableCell sx={{ py: 1, px: 2, color: "#00000066" }}></TableCell>
          </TableRow>
        </TableHead>
        {isTableLoading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} align="center">
                <CircularProgress />
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <TableBody>
            {trainingPlans.map((plan, index) => (
              <React.Fragment key={`${plan.id}-${index}`}>
                <TableRow
                  sx={{
                    fontSize: 16,
                    fontWeight: "medium",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleRow(`${plan.id}-${index}`)}
                >
                  <TableCell
                    color="#000000CC"
                    sx={{
                      py: "40px",
                      px: 2,
                      fontSize: 16,
                      fontWeight: "medium",
                    }}
                  >
                    {getCompactId(plan.id)}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 16,
                      fontWeight: "medium",
                    }}
                  >
                    {plan.name}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: 12,
                      fontWeight: "medium",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        bgcolor: "#F2F4F7",
                        color: "#344054",
                        width: "fit-content",
                        px: 1,
                        py: 0.4,
                        borderRadius: "16px",
                        fontWeight: "medium",
                        fontSize: "0.75rem",
                        height: "24px",
                      }}
                    >
                      {plan.assignedTrainees}

                      {plan.trainees.length > 0 &&
                        (expandedRows[`${plan.id}-${index}`] ? (
                          <ExpandLessIcon fontSize="small" sx={{ ml: 1 }} />
                        ) : (
                          <ExpandMoreIcon fontSize="small" sx={{ ml: 1 }} />
                        ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${plan.completionRate}%`}
                      size="small"
                      sx={{
                        color: "#027A48",
                        bgcolor: "#ECFDF3",
                        borderRadius: "16px",
                        height: "24px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${plan.adherenceRate}%`}
                      size="small"
                      sx={{
                        color: "#B54708",
                        bgcolor: "#FFFAEB",
                        borderRadius: "16px",
                        height: "24px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${plan.avgScore}%`}
                      size="small"
                      sx={{
                        color: "#027A48",
                        bgcolor: "#ECFDF3",
                        borderRadius: "16px",
                        height: "24px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={plan.estTime}
                      size="small"
                      sx={{
                        bgcolor: "#F2F4F7",
                        color: "#344054",
                        borderRadius: "16px",
                        height: "24px",
                        fontSize: "0.75rem",
                        fontWeight: "medium",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      sx={{ backgroundColor: "#0000000A", borderRadius: "4px" }}
                      onClick={(e) => handlePopupClick(e, plan.id)}
                      size="small"
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                    <Popover
                      id={id}
                      open={open}
                      anchorEl={anchorEl}
                      onClose={(e) => handlePopupClose(e)}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        sx: {
                          boxShadow: "0px 2px 8px -4px rgba(0, 0, 0, 0.1)",
                          borderRadius: 1, // Optional: to make it look smoother
                        },
                      }}
                    >
                      <Box
                        sx={{
                          border: 1,
                          p: 1,
                          bgcolor: "white",
                          borderColor: "white",
                          color: "#00000099",
                          fontWeight: "medium",
                          cursor: "pointer",
                        }}
                        onClick={(e) => handleOpenDownloadDialog(e)}
                      >
                        <FileDownloadOutlinedIcon sx={{ color: "#00000066" }} />{" "}
                        Download Break-up Data
                      </Box>
                    </Popover>
                  </TableCell>
                </TableRow>

                {/* Expanded row for trainees */}
                {plan.trainees.length > 0 && (
                  <TableRow
                    sx={{
                      p: 0,
                      borderTop: "1px solid #0000001A",
                      bgcolor: "#F9FAFB",
                    }}
                  >
                    <TableCell sx={{ p: 0 }} colSpan={8}>
                      <Collapse
                        in={expandedRows[`${plan.id}-${index}`]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    fontSize: 12,
                                    color: "#00000066",
                                    fontWeight: "medium",
                                    py: 1,
                                    px: 2,
                                  }}
                                >
                                  Trainee Name
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: 12,
                                    color: "#00000066",
                                    fontWeight: "medium",
                                    py: 1,
                                    px: 2,
                                  }}
                                >
                                  Class ID
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: 12,
                                    color: "#00000066",
                                    fontWeight: "medium",
                                    py: 1,
                                    px: 2,
                                  }}
                                >
                                  Status
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: 12,
                                    color: "#00000066",
                                    fontWeight: "medium",
                                    py: 1,
                                    px: 2,
                                  }}
                                >
                                  Due Date
                                </TableCell>
                                <TableCell
                                  sx={{
                                    fontSize: 12,
                                    color: "#00000066",
                                    fontWeight: "medium",
                                    py: 1,
                                    px: 2,
                                  }}
                                >
                                  Avg. Score
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {plan.trainees.map((trainee, idx) => (
                                <TableRow key={idx}>
                                  <TableCell
                                    sx={{
                                      color: "#00000099",
                                      fontWeight: "medium",
                                      fontSize: 16,
                                      p: 2,
                                    }}
                                  >
                                    {allUserNamesMap.get(trainee.name) ||
                                      trainee.name}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      color: "#00000099",
                                      fontWeight: "medium",
                                      fontSize: 16,
                                    }}
                                  >
                                    {allUserClassIdsMap.get(trainee.name) ||
                                      "-"}
                                  </TableCell>
                                  <TableCell>
                                    <StatusPill status={trainee.status} />
                                  </TableCell>
                                  <TableCell>{trainee.dueDate}</TableCell>
                                  <TableCell>
                                    {trainee.avgScore ? (
                                      <Chip
                                        label={`${trainee.avgScore}%`}
                                        size="small"
                                        sx={{
                                          color: "#027A48",
                                          bgcolor: "#ECFDF3",
                                          borderRadius: "16px",
                                          height: "24px",
                                          fontSize: "0.75rem",
                                          fontWeight: "medium",
                                        }}
                                      />
                                    ) : (
                                      <Chip
                                        label="NA"
                                        size="small"
                                        sx={{
                                          bgcolor: "#F2F4F7",
                                          color: "#344054",
                                          borderRadius: "16px",
                                          height: "24px",
                                          fontSize: "0.75rem",
                                          fontWeight: "medium",
                                        }}
                                      />
                                    )}
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
        )}
      </Table>
      <Box
        sx={{
          bgcolor: "#F9FAFB",
          display: "flex",
          justifyContent: "flex-start",
          width: "100%",
        }}
      >
        <TablePagination
          component="div"
          count={totalCount || 0} // Total number of items
          page={page}
          onPageChange={onChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Box>
      {isDialogOpen && (
        <BreakupDataDialog
          downloadData={handleDownloadCsv}
          cancel={handleDialogCancel}
        />
      )}
    </TableContainer>
  );
};

const DashboardAggregatedData = () => {
  return (
    <DashboardContent>
      <Container maxWidth="xl">
        <Stack gap="40px">
          {/* Assignment Cards */}
          <DashboardAggregatedData />
        </Stack>
      </Container>
    </DashboardContent>
  );
};

const menuSelectsx = {
  border: "1px solid #00000014",
  backgroundColor: "#ffffff",
  borderRadius: 1,
  color: "#00000099",
  fontWeight: 600,
  fontSize: 14,
  outline: "none",
  outlineColor: "transparent",
  boxShadow: "none",
  "& fieldset": { border: "none" },
  "& .MuiSelect-iconOpen": {
    transform: "none",
  },
  "& .MuiSelect-icon": { color: "#00000066" },
};
const menuSelectProps = {
  PaperProps: {
    sx: {
      mt: 1,
      border: "1px solid #0000001A",
      borderRadius: 2,
      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
      bgcolor: "white",
      width: 230,
      position: "relative",
    },
  },
  MenuListProps: {
    sx: {
      padding: 0,
      maxHeight: 350,
      overflowY: "auto",
    },
  },
};

const menuItemSx = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  py: 1.5,
  fontSize: 14,
  fontWeight: "medium",
  color: "#00000099",
  "&:not(:last-child)": {
    borderBottom: "1px solid #f0f0f0",
  },
  "&:hover": {
    bgcolor: "transparent",
    color: "#00000099",
  },
  "&.Mui-selected": {
    bgcolor: "#143FDA0A",
    color: "#143FDA",
  },
  "&.Mui-selected:hover": {
    bgcolor: "#143FDA0A",
    color: "#143FDA",
  },
};

const ManagerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] =
    useState<ManagerDashboardAggregatedDataResponse | null>(
      defaultAggDashboardData,
    );
  const [reporteeUser, setReporteeUser] = useState<[] | User[]>([]);
  const [filteredReporteeUserIds, setFilteredReporteeUserIds] = useState<
    [] | string[]
  >([]);
  const [
    filteredReporteeUserIdsTrainingEntity,
    setFilteredReporteeUserIdsTrainingEntity,
  ] = useState<[] | string[]>([]);
  const [allUserIds, setAllUserIds] = useState<[] | string[]>([]);
  const [allCreatorIds, setAllCreatorIds] = useState<[] | string[]>([]);
  const [reporteeUserIdsMapToName, setReporteeUserIdsMapToName] = useState<
    Map<string, string>
  >(new Map());
  const [reporteeUserIdsMapToClassId, setReporteeUserIdsMapToClassId] =
    useState<Map<string, string>>(new Map());
  // New comprehensive user maps using fetchUsersSummary
  const [allUserNamesMap, setAllUserNamesMap] = useState<Map<string, string>>(
    new Map(),
  );
  const [allUserClassIdsMap, setAllUserClassIdsMap] = useState<
    Map<string, string>
  >(new Map());
  const [reporteeTeam, setReporteeTeam] = useState<null | TeamResponse>(null);
  const [filteredReporteeTeamIds, setFilteredReporteeTeamIds] = useState<
    [] | string[]
  >([]);
  const [allTeamIds, setAllTeamIds] = useState<[] | string[]>([]);
  const [reporteeTeamIdsMapToName, setReporteeTeamIdsMapToName] = useState<
    Map<string, string>
  >(new Map());
  const [creatorIdsMapToName, setCreatorIdsMapToName] = useState<
    Map<string, string>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isAggregatedDataLoading, setIsAggregatedDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("TrainingPlan");
  const [teamframe, setTeamframe] = useState<[] | string[]>([]);
  const [teamframeNames, setTeamframeNames] = useState<[] | string[]>([]);
  const [timeframe, setTimeframe] = useState("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [trainingEntityAttempts, setTrainingEntityAttempts] = useState<
    ManagerDashboardTrainingEntityAttemptsStatsResponse[]
  >([]);
  const [trainingEntityPagination, setTrainingEntityPagination] = useState<any>({
    total_count: 0,
  });
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState("");
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);
  const [trainingEntityDateRange, setTrainingEntityDateRange] = useState<
    DateRange<Dayjs>
  >([null, null]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  // Control open state for table dropdown filters
  const [teamsDropdownOpen, setTeamsDropdownOpen] = useState(false);
  const [creatorsDropdownOpen, setCreatorsDropdownOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // State for managing leaderboard sorting
  const [completionSortBy, setCompletionSortBy] = useState("High to Low");
  const [averageScoreSortBy, setAverageScoreSortBy] = useState("High to Low");
  const [adherenceSortBy, setAdherenceSortBy] = useState("High to Low");

  //const [dashboardAggregatedData, setDashboardAggregatedData] = useState<ManagerDashboardAggregatedDataResponse | {}>({});
  const handleTeamframeChange = (event: any) => {
    const { value } = event.target;

    const selectedIds = typeof value === "string" ? value.split(",") : value;
    const selectedUserNames = selectedIds.map((id) => {
      const userName = reporteeUserIdsMapToName.get(id);
      const teamName = reporteeTeamIdsMapToName.get(id);
      return userName || teamName || "";
    });

    setTeamframe(selectedIds);
    setTeamframeNames(selectedUserNames);

    // // Update the individual selectors
    // const newSelectedTeams = selectedIds.filter((id) =>
    //   reporteeTeamIdsMapToName.has(id)
    // );

    //setSelectedTeams(newSelectedTeams);
  };
  // Handle changes from the team selector
  const handleTeamsChange = (event: any) => {
    const { value } = event.target;
    const newSelectedTeams =
      typeof value === "string" ? value.split(",") : value;
    setSelectedTeams(newSelectedTeams);
  };
  // Handle changes from the creator selector
  const handleCreatorChange = (event: any) => {
    const { value } = event.target;
    const newSelectedCreators =
      typeof value === "string" ? value.split(",") : value;
    setSelectedCreators(newSelectedCreators);
  };

  const handleApplyClick = () => {
    // Handle the selected users/teams here
    console.log("teamframe", teamframe, dropdownSearchQuery);
    let selectedUserIds = teamframe.filter((id: string) =>
      allUserIds.includes(id),
    );
    let selectedTeamIds = teamframe.filter((id: string) =>
      allTeamIds.includes(id),
    );
    if (
      (!selectedUserIds || selectedUserIds.length === 0) &&
      (!selectedTeamIds || selectedTeamIds.length === 0)
    ) {
      selectedUserIds = allUserIds;
      selectedTeamIds = allTeamIds;
    }
    setFilteredReporteeUserIds(selectedUserIds);
    setFilteredReporteeTeamIds(selectedTeamIds);
  };

  const loadReporteeUser = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        // In a real implementation, we would fetch data from the API
        const params = new URLSearchParams(location.search);
        const workspaceId = params.get("workspace_id");
        const data = await fetchReporteeUsers(workspaceId || "");
        console.log("repoertee users --------", data);
        const userData = data?.map((user: User) => user.user_id) || [];
        setReporteeUser(data);
        setFilteredReporteeUserIds(userData);
        setFilteredReporteeUserIdsTrainingEntity(userData);
        setFilteredReporteeUserIdsTrainingEntity(userData);
        setAllUserIds(userData);
        const userMap = new Map(
          data?.map((user) => [
            user.user_id,
            user.first_name + " " + user.last_name,
          ]),
        );
        const userMaptoClassId = new Map(
          data?.map((user) => [user.user_id, user.class_id || ""]),
        );
        setReporteeUserIdsMapToName(userMap);
        setReporteeUserIdsMapToClassId(userMaptoClassId);
      } catch (error) {
        console.error("Error loading reportee users:", error);
        setError("Failed to load reportee users");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadReporteeTeams = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        // In a real implementation, we would fetch data from the API
        const params = new URLSearchParams(location.search);
        const workspaceId = params.get("workspace_id");
        const data = await fetchTeams(
          workspaceId || "",
          undefined,
          undefined,
          undefined,
          user.id,
        );
        console.log("repoertee users --------", data);
        const teamsData = data?.items?.map((team: Team) => team.team_id);
        setReporteeTeam(data);
        if (teamsData) {
          setFilteredReporteeTeamIds(teamsData);
          setAllTeamIds(teamsData);
        }

        const teamMap = new Map(
          data?.items?.map((team) => [team.team_id, team.name]),
        );
        if (teamMap) {
          setReporteeTeamIdsMapToName(teamMap);
        }
      } catch (error) {
        console.error("Error loading reportee users:", error);
        setError("Failed to load reportee users");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Updated function to load all platform users for the table (no role filtering)
  const loadAllPlatformUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(location.search);
      const workspaceId = params.get("workspace_id");

      // Fetch ALL users without role filtering for the table
      const response = await fetchUsersSummary(workspaceId || "");

      console.log(
        "All platform users from fetchUsersSummary (no role filter):",
        response,
      );

      // Create comprehensive maps for both names and class IDs
      const comprehensiveUserNamesMap = new Map<string, string>();
      const comprehensiveUserClassIdsMap = new Map<string, string>();

      // First, add existing reportee user data
      reporteeUserIdsMapToName.forEach((name, id) => {
        comprehensiveUserNamesMap.set(id, name);
      });
      reporteeUserIdsMapToClassId.forEach((classId, id) => {
        comprehensiveUserClassIdsMap.set(id, classId);
      });

      // Then, add all platform users from fetchUsersSummary
      response?.forEach((user: any) => {
        const fullName = `${user.first_name} ${user.last_name}`;
        comprehensiveUserNamesMap.set(user.user_id, fullName);
        comprehensiveUserClassIdsMap.set(user.user_id, user.class_id || "");
      });

      setAllUserNamesMap(comprehensiveUserNamesMap);
      setAllUserClassIdsMap(comprehensiveUserClassIdsMap);

      console.log(
        "Updated comprehensive user names map:",
        comprehensiveUserNamesMap,
      );
      console.log(
        "Updated comprehensive user class IDs map:",
        comprehensiveUserClassIdsMap,
      );
    } catch (error) {
      console.error("Error loading all platform users:", error);
      setError("Failed to load platform users");
    } finally {
      setIsLoading(false);
    }
  };

  // Separate function to load creators with specific roles for the creator filter dropdown
  const loadCreators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(location.search);
      const workspaceId = params.get("workspace_id");

      // Fetch only users with Sim Creator and Manager roles for the creator dropdown
      const response = await fetchUsersSummary(workspaceId || "", [
        "Sim Creator",
        "Manager",
        "Instructional Designer",
        "anmol_test",
      ]);

      console.log("Creators and Managers from fetchUsersSummary:", response);

      // Update creator maps for the creator dropdown
      const creatorIdsList = response?.map((user: any) => user.user_id);
      if (creatorIdsList) {
        setAllCreatorIds(creatorIdsList);
      }
      const creatorMap = new Map(
        response?.map((user: any) => [
          user.user_id,
          user.first_name + " " + user.last_name,
        ]),
      );
      if (creatorMap) {
        setCreatorIdsMapToName(creatorMap);
      }
    } catch (error) {
      console.error("Error loading creators:", error);
      setError("Failed to load creators");
    } finally {
      setIsLoading(false);
    }
  };

  // Removed the old loadCreators function as it's now handled by loadAllPlatformUsers

  const updateLeaderBoards = (obj: ManagerDashboardAggregatedDataResponse) => {
    const { leaderBoards } = obj;

    for (const key in leaderBoards) {
      if (Array.isArray(leaderBoards[key])) {
        leaderBoards[key] = leaderBoards[key].map((item) => ({
          ...item,
          team: reporteeTeamIdsMapToName.get(item.team) || item.team,
        }));
      }
    }
  };

  const loadDashboardData = async (rangeOverride?: DateRange<Dayjs>) => {
    if (user?.id) {
      try {
        setIsAggregatedDataLoading(true);
        setError(null);
        const params: any = {
          assignedDateRange: { startDate: "", endDate: "" },
          trainingEntityDateRange: { startDate: "", endDate: "" },
          trainingEntityCreatedBy: [],
          trainingEntityTeams: [],
          trainingEntitySearchQuery: "",
        };

        const effectiveRange = rangeOverride ?? dateRange;

        if (effectiveRange[0] && effectiveRange[1]) {
          params.assignedDateRange.startDate =
            effectiveRange[0].format("YYYY-MM-DD");
          params.assignedDateRange.endDate =
            effectiveRange[1].format("YYYY-MM-DD");
        } else if (effectiveRange[0]) {
          params.assignedDateRange.startDate =
            effectiveRange[0].format("YYYY-MM-DD");
          params.assignedDateRange.endDate = null;
        } else if (effectiveRange[1]) {
          params.assignedDateRange.startDate = null;
          params.assignedDateRange.endDate =
            effectiveRange[1].format("YYYY-MM-DD");
        }

        // In a real implementation, we would fetch data from the API
        const data = await fetchManagerDashboardAggregatedData({
          user_id: user.id,
          reportee_user_ids: filteredReporteeUserIds,
          reportee_team_ids: filteredReporteeTeamIds,
          params,
        });
        updateLeaderBoards(data);
        setDashboardData(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsAggregatedDataLoading(false);
      }
    }
  };

  const loadTrainingEntityAttemptsForManagerDashboard = async (
    type: string,
    searchQueryOverride: string | null = null,
    selectedTeamsOverride: string[] | [] = [],
    trainingRangeOverride?: DateRange<Dayjs>,
  ) => {
    try {
      setIsTableLoading(true);
      if (searchQueryOverride == "" && selectedTeams.length == 0) {
        selectedTeamsOverride = allTeamIds;
      }
      const params: any = {
        assignedDateRange: { startDate: "", endDate: "" },
        trainingEntityDateRange: { startDate: "", endDate: "" },
        trainingEntityCreatedBy: selectedCreators.filter(
          (creatorId) =>
            creatorId !== "" && creatorId !== null && creatorId !== undefined,
        ),
        trainingEntityTeams:
          selectedTeamsOverride.length > 0
            ? selectedTeamsOverride
            : selectedTeams.filter(
                (teamId) =>
                  teamId !== "" && teamId !== null && teamId !== undefined,
              ),
        trainingEntitySearchQuery:
          searchQueryOverride !== null
            ? searchQueryOverride.trim()
            : searchQuery.trim(),
        trainingEntityReportingUserIds:
          selectedTeamsOverride.length > 0
            ? filteredReporteeUserIdsTrainingEntity
            : [],
      };

      const effectiveTrainingRange =
        trainingRangeOverride ?? trainingEntityDateRange;

      if (effectiveTrainingRange[0] && effectiveTrainingRange[1]) {
        params.trainingEntityDateRange.startDate =
          effectiveTrainingRange[0].format("YYYY-MM-DD");
        params.trainingEntityDateRange.endDate =
          effectiveTrainingRange[1].format("YYYY-MM-DD");
      } else if (effectiveTrainingRange[0]) {
        params.trainingEntityDateRange.startDate =
          effectiveTrainingRange[0].format("YYYY-MM-DD");
        params.trainingEntityDateRange.endDate = null;
      } else if (effectiveTrainingRange[1]) {
        params.trainingEntityDateRange.startDate = null;
        params.trainingEntityDateRange.endDate =
          effectiveTrainingRange[1].format("YYYY-MM-DD");
      }
      const pagination = {
        page: page,
        pagesize: rowsPerPage,
      };

      if (
        (params &&
          params.trainingEntityTeams &&
          params.trainingEntityTeams.length > 0) ||
        (params &&
          params.trainingEntityReportingUserIds &&
          params.trainingEntityReportingUserIds.length > 0)
      ) {
        const data = await fetchTrainingEntityAttemptsStatsForManagerDashboard({
          user_id: user?.id || "user123",
          type: type,
          reportee_user_ids: [],
          reportee_team_ids: [],
          params,
          pagination,
        });

        setTrainingEntityPagination(data.pagination);

        const processedTrainingEntity = data.training_entity?.map((entity: any) => {
          const processedTrainees = entity.trainees?.map((trainee: any) => ({
            ...trainee,
            avgScore:
              trainee.status && trainee.status.toLowerCase() === "in_progress"
                ? null
                : trainee.avgScore,
          }));
          return { ...entity, trainees: processedTrainees };
        });

        setTrainingEntityAttempts(processedTrainingEntity);
        setError(null);
      }
    } catch (err) {
      setError("Failed to load training entity attempts");
      console.error("Error loading training entity attempts:", err);
    } finally {
      setIsTableLoading(false);
    }
  };

  const filteredUserIds = allUserIds.filter((userId) =>
    (reporteeUserIdsMapToName.get(userId) || "")
      .toLowerCase()
      .includes(dropdownSearchQuery.toLowerCase().trim()),
  );

  const filteredTeams =
    reporteeTeam?.items?.filter((team) =>
      (reporteeTeamIdsMapToName.get(team.team_id) || "")
        .toLowerCase()
        .trim()
        .includes(dropdownSearchQuery.toLowerCase().trim()),
    ) || [];

  const filteredCreators = allCreatorIds.filter((creatorId) =>
    (creatorIdsMapToName.get(creatorId) || "")
      .toLowerCase()
      .includes(creatorSearchQuery.toLowerCase().trim()),
  );

  const filteredTeamEntity = filteredTeams?.filter((team) =>
    reporteeTeamIdsMapToName
      .get(team.team_id)
      ?.toLowerCase()
      .includes(teamSearchQuery.toLowerCase().trim()),
  );

  useEffect(() => {
    loadReporteeUser();
    loadReporteeTeams();
    // Load all platform users (no role filter) and creators separately
    loadAllPlatformUsers();
    loadCreators();
  }, [user?.id]);

  // Updated useEffect to call both functions when reportee data is loaded
  useEffect(() => {
    if (
      reporteeUserIdsMapToName.size > 0 &&
      reporteeUserIdsMapToClassId.size > 0
    ) {
      loadAllPlatformUsers();
      loadCreators();
    }
  }, [reporteeUserIdsMapToName, reporteeUserIdsMapToClassId]);

  useEffect(() => {
    if (
      (filteredReporteeUserIds && filteredReporteeUserIds?.length > 0) ||
      (filteredReporteeTeamIds && filteredReporteeTeamIds?.length > 0)
    ) {
      loadDashboardData();
      //loadTrainingEntityAttemptsForManagerDashboard(activeTab);
      //loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    }
  }, [filteredReporteeUserIds, filteredReporteeTeamIds]);

  useEffect(() => {
    handleTrainingEntityTeamSelectedApply();
  }, [filteredReporteeUserIdsTrainingEntity, allTeamIds]);

  useEffect(() => {
    handleTrainingEntityTeamSelectedApply();
  }, [filteredReporteeUserIdsTrainingEntity, allTeamIds]);

  // const handleTeamframeChange = (event: SelectChangeEvent<string>) => {
  //   setTeamframe(event.target.value);
  // };
  const handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    setTimeframe(event.target.value);
  };
  const handleTabChange = (event: any, newValue: any) => {
    setActiveTab(newValue);
    setSearchQuery(""); // Reset the Search Query when changing tabs
    loadTrainingEntityAttemptsForManagerDashboard(newValue, "");
    setPage(0); // Reset to the first page when changing tabs
  };

  const handleDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    loadDashboardData(range);
    // loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    // loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  };
  const handleTrainingEntityDateRangeApplyCallback = (
    range: DateRange<Dayjs>,
  ) => {
    setTrainingEntityDateRange(range);
    if (selectedTeams.length === 0) {
      loadTrainingEntityAttemptsForManagerDashboard(
        activeTab,
        null,
        allTeamIds,
        range,
      );
    } else {
      loadTrainingEntityAttemptsForManagerDashboard(activeTab, null, [], range);
    }
  };

  const handleTrainingEntitySelectedApply = () => {
    //loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    handleTrainingEntityTeamSelectedApply();
    setCreatorsDropdownOpen(false);
  };

  const handleTrainingEntityCreatorSelectedApply = () => {
    // if (selectedCreators.length === 0) {
    //   loadTrainingEntityAttemptsForManagerDashboard(activeTab, undefined, allCreatorIds);
    // } else {
    //   loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    // }
  };

  const handleTrainingEntityTeamSelectedApply = () => {
    if (selectedTeams.length === 0) {
      loadTrainingEntityAttemptsForManagerDashboard(
        activeTab,
        undefined,
        allTeamIds,
      );
    } else {
      loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    }
    setTeamsDropdownOpen(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page
    // loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  };

  const handleTrainingEntitySearch = () => {
    //loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    handleTrainingEntityTeamSelectedApply();
  };

  // Handlers for leaderboard sorting
  const handleCompletionSortChange = (newSortBy) => {
    setCompletionSortBy(newSortBy);
  };

  const handleAverageScoreSortChange = (newSortBy) => {
    setAverageScoreSortBy(newSortBy);
  };

  const handleAdherenceSortChange = (newSortBy) => {
    setAdherenceSortBy(newSortBy);
  };

  // Helper function to check if any users or teams are selected in the filter.
  // Leaderboards should be disabled whenever the filter has at least one
  // selected value. They are only enabled when nothing is selected.
  const hasUserSelections = () => {
    return teamframe.length > 0;
  };

  useEffect(() => {
    handleTrainingEntityTeamSelectedApply();
    //loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  }, [rowsPerPage, page]);

  if (isLoading) {
    return (
      <DashboardContent>
        <Container>
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
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
        <Stack gap="40px">
          {isAggregatedDataLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Assignment Cards */}
              <Stack gap={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={2}
                >
                  <Typography
                    sx={{ fontSize: 18 }}
                    variant="h4"
                    fontWeight="semibold"
                  >
                    My Team's Assignment and Progress
                  </Typography>

                  <Stack
                    direction={{
                      sm: "column",
                      md: "row",
                    }}
                    justifyContent="center"
                    gap="12px"
                    alignItems="center"
                  >
                    <FormControl
                      size="small"
                      sx={{ minWidth: 230, maxWidth: 230 }}
                    >
                      <Select
                        multiple
                        value={teamframe}
                        onChange={handleTeamframeChange}
                        displayEmpty
                        IconComponent={ExpandMoreIcon}
                        renderValue={(selected) => {
                          const filterSelected = selected.filter(
                            (data) => data,
                          );
                          if (filterSelected.length === 0) {
                            return <b>All Users and Teams</b>;
                          } else if (filterSelected.length === 1) {
                            return <b>1 selected</b>;
                          } else {
                            return <b>{filterSelected.length} selected</b>;
                          }
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              mt: 1,
                              border: "1px solid #0000001A",
                              borderRadius: 2,
                              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
                              bgcolor: "white",
                              width: 230,
                            },
                          },
                          MenuListProps: {
                            sx: {
                              padding: 0,
                            },
                          },
                        }}
                        sx={menuSelectsx}
                      >
                        <Stack
                          sx={{
                            position: "sticky",
                            top: "-2px",
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: "white",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          <TextField
                            placeholder="Search User or Team"
                            value={dropdownSearchQuery}
                            onKeyDown={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setDropdownSearchQuery(e.target.value)
                            }
                            InputProps={{
                              startAdornment: (
                                <InputAdornment sx={{ p: 0 }} position="start">
                                  <SearchIcon />
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              bgcolor: "white",
                              fontSize: 14,
                              borderRadius: "8px",
                              boxShadow: "0px 1px 2px 0px #1018280D",
                            }}
                            size="small"
                          />
                        </Stack>

                        <ListSubheader
                          sx={{
                            fontSize: 12,
                            lineHeight: 2,
                            fontWeight: 600,
                            color: "#00000066",
                            borderBottom: "1px solid #0000001A",
                            bgcolor: "#F9FAFB",
                            py: 0.5,
                            px: 2,
                          }}
                        >
                          Users
                        </ListSubheader>
                        {filteredUserIds.map((userId) => (
                          <MenuItem key={userId} sx={menuItemSx} value={userId}>
                            {reporteeUserIdsMapToName.get(userId)}
                            {teamframe.includes(userId) && (
                              <ListItemIcon>
                                <Check fontSize="small" color="primary" />
                              </ListItemIcon>
                            )}
                          </MenuItem>
                        ))}

                        <ListSubheader
                          sx={{
                            fontSize: 12,
                            lineHeight: 2,
                            fontWeight: 600,
                            color: "#00000066",
                            borderBottom: "1px solid #0000001A",
                            bgcolor: "#F9FAFB",
                            py: 0.5,
                            px: 2,
                          }}
                        >
                          Teams
                        </ListSubheader>
                        {filteredTeams &&
                          filteredTeams.map((team) => (
                            <MenuItem
                              key={team.team_id}
                              sx={menuItemSx}
                              value={team.team_id}
                            >
                              {reporteeTeamIdsMapToName.get(team.team_id)}
                              {teamframe.includes(team.team_id) && (
                                <ListItemIcon>
                                  <Check fontSize="small" color="primary" />
                                </ListItemIcon>
                              )}
                            </MenuItem>
                          ))}
                        {/* <MenuItem>{teamframe}</MenuItem> */}
                        {/*teamframe.length > 0 && (
                        <Stack p={0.5}>
                          <Button variant="contained" onClick={handleApplyClick}>
                            Apply
                          </Button>
                        </Stack>
                      )*/}
                        <Box
                          sx={{
                            position: "sticky",
                            bottom: "-2px",
                            left: 0,
                            right: 0,
                            p: 1,
                            bgcolor: "white",
                            borderTop: "1px solid #e0e0e0",
                          }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={handleApplyClick}
                          >
                            Apply
                          </Button>
                        </Box>
                      </Select>
                    </FormControl>

                    <DateSelector
                      dateRange={dateRange}
                      setDateRange={setDateRange}
                      handleDateRangeApplyCallback={
                        handleDateRangeApplyCallback
                      }
                      variant="managerGlobal"
                    />
                  </Stack>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <AssignmentCard
                        title="Training Plans Assigned"
                        total={
                          dashboardData.assignmentCounts.trainingPlans.total
                        }
                        completed={
                          dashboardData.assignmentCounts.trainingPlans.completed
                        }
                        inProgress={
                          dashboardData.assignmentCounts.trainingPlans
                            .inProgress
                        }
                        notStarted={
                          dashboardData.assignmentCounts.trainingPlans
                            .notStarted
                        }
                        overdue={
                          dashboardData.assignmentCounts.trainingPlans.overdue
                        }
                        popupText={TOOLTIP_ASSIGNMENTS}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <AssignmentCard
                        title="Modules Assigned"
                        total={dashboardData.assignmentCounts.modules.total}
                        completed={
                          dashboardData.assignmentCounts.modules.completed
                        }
                        inProgress={
                          dashboardData.assignmentCounts.modules.inProgress
                        }
                        notStarted={
                          dashboardData.assignmentCounts.modules.notStarted
                        }
                        overdue={dashboardData.assignmentCounts.modules.overdue}
                        popupText={TOOLTIP_ASSIGNMENTS}
                      />
                    )}
                  </Grid>
                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <AssignmentCard
                        title="Simulation Assigned"
                        total={dashboardData.assignmentCounts.simulations.total}
                        completed={
                          dashboardData.assignmentCounts.simulations.completed
                        }
                        inProgress={
                          dashboardData.assignmentCounts.simulations.inProgress
                        }
                        notStarted={
                          dashboardData.assignmentCounts.simulations.notStarted
                        }
                        overdue={
                          dashboardData.assignmentCounts.simulations.overdue
                        }
                        popupText={TOOLTIP_ASSIGNMENTS}
                      />
                    )}
                  </Grid>
                </Grid>
              </Stack>
              {/* Completion Rate Section */}
              <Stack gap={2}>
                <Typography
                  sx={{ fontSize: 18 }}
                  variant="h4"
                  fontWeight="semibold"
                >
                  Completion Rate
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Training Plan"
                            value={dashboardData.completionRates.trainingPlans}
                            popupText={TOOLTIP_COMPLETION_RATE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Modules"
                            value={dashboardData.completionRates.modules}
                            popupText={TOOLTIP_COMPLETION_RATE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Simulation"
                            value={dashboardData.completionRates.simulations}
                            popupText={TOOLTIP_COMPLETION_RATE}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <LeaderBoard
                        data={dashboardData.leaderBoards.completion}
                        title="Completion Rate Leader Board"
                        onSortChange={handleCompletionSortChange}
                        popupText={TOOLTIP_COMPLETION_LEADERBOARD}
                        disabled={hasUserSelections()}
                      />
                    )}
                  </Grid>
                </Grid>
              </Stack>
              {/* Average Score Section */}
              <Stack gap={2}>
                <Typography
                  sx={{ fontSize: 18 }}
                  variant="h4"
                  fontWeight="semibold"
                >
                  Average Score
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Training Plan"
                            value={dashboardData.averageScores.trainingPlans}
                            popupText={TOOLTIP_AVERAGE_SCORE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Modules"
                            value={dashboardData.averageScores.modules}
                            popupText={TOOLTIP_AVERAGE_SCORE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Simulation"
                            value={dashboardData.averageScores.simulations}
                            popupText={TOOLTIP_AVERAGE_SCORE}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <LeaderBoard
                        data={dashboardData.leaderBoards.averageScore}
                        title="Average Score Leader Board"
                        onSortChange={handleAverageScoreSortChange}
                        popupText={TOOLTIP_AVERAGE_SCORE_LEADERBOARD}
                        disabled={hasUserSelections()}
                      />
                    )}
                  </Grid>
                </Grid>
              </Stack>
              {/* Adherence Rate Section */}
              <Stack gap={2}>
                <Typography
                  sx={{ fontSize: 18 }}
                  variant="h4"
                  fontWeight="semibold"
                >
                  Adherence Rate (On-Time Completion Rate)
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Training Plan"
                            value={dashboardData.adherenceRates.trainingPlans}
                            popupText={TOOLTIP_ADHERENCE_RATE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Modules"
                            value={dashboardData.adherenceRates.modules}
                            popupText={TOOLTIP_ADHERENCE_RATE}
                          />
                        )}
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        {dashboardData && (
                          <CircularProgressCards
                            title="Simulation"
                            value={dashboardData.adherenceRates.simulations}
                            popupText={TOOLTIP_ADHERENCE_RATE}
                          />
                        )}
                      </Grid>
                    </Grid>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {dashboardData && (
                      <LeaderBoard
                        data={dashboardData.leaderBoards.adherence}
                        title="Adherence Rate Leader Board"
                        onSortChange={handleAdherenceSortChange}
                        popupText={TOOLTIP_ADHERENCE_LEADERBOARD}
                        disabled={hasUserSelections()}
                      />
                    )}
                  </Grid>
                </Grid>
              </Stack>
            </>
          )}
          {/* Training Plans/Modules/Simulations Tabs */}
          <Stack>
            <Box
              sx={{
                bgcolor: "#F9FAFB",
                mb: 2,
                width: "100%",
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                p: 0.5,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                scrollButtons="auto"
                variant="scrollable"
                allowScrollButtonsMobile
                sx={{
                  color: "#00000066",
                  fontSize: 16,
                  fontWeight: "semibold",

                  minHeight: 30,
                  "& .MuiTab-root": {
                    minHeight: 30,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: "semibold",
                    minWidth: 130,
                    p: 0,
                  },
                  "& .Mui-selected": {
                    color: "#000000CC",
                    fontWeight: "semibold",
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#444CE7",
                    height: 3,
                  },
                }}
              >
                <Tab label="Training Plans" value="TrainingPlan" />
                <Tab label="Modules" value="Module" />
                <Tab label="Simulations" value="Simulation" />
              </Tabs>
            </Box>
            {/* Search and Filters */}
            <Stack
              direction={{
                sm: "column",
                md: "row",
              }}
              bgcolor="#F9FAFB"
              borderRadius={1.5}
              p={1.5}
              spacing={2}
              gap={2}
              justifyContent="space-between"
            >
              <TextField
                placeholder={
                  activeTab === "TrainingPlan"
                    ? "Search by Training Plan Name or ID"
                    : activeTab === "Module"
                      ? "Search by Module Name or ID"
                      : "Search by Simulation Name or ID"
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTrainingEntitySearch();
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  width: "100%",
                  maxWidth: 350,
                  bgcolor: "white",
                  boxShadow: "0px 1px 2px 0px #1018280D",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      border: "1px solid #00000014",
                      borderRadius: 1,
                      borderColor: "#E0E0E0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#C0C0C0",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#E0E0E0",
                    },
                  },
                }}
                size="small"
              />

              <Stack
                direction={{
                  sm: "column",
                  md: "row",
                }}
                gap={2}
              >
                <FormControl size="small" sx={{ minWidth: 120, maxWidth: 120 }}>
                  <Select
                    multiple
                    open={teamsDropdownOpen}
                    onClose={() => setTeamsDropdownOpen(false)}
                    onOpen={() => setTeamsDropdownOpen(true)}
                    value={selectedTeams}
                    onChange={handleTeamsChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) => {
                      const filterSelected = selected.filter((data) => data);
                      if (filterSelected.length === 0) {
                        return "All Teams";
                      } else if (filterSelected.length === 1) {
                        return "1 selected";
                      } else {
                        return `${filterSelected.length} selected`;
                      }
                    }}
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <Stack
                      sx={{
                        position: "sticky",
                        top: "-2px",
                        left: 0,
                        right: 0,
                        p: 0.5,
                        bgcolor: "white",
                        borderBottom: "1px solid #e0e0e0",
                        zIndex: 10,
                      }}
                    >
                      <TextField
                        placeholder="Search Team"
                        onKeyDown={(e) => e.stopPropagation()}
                        value={teamSearchQuery}
                        onChange={(e) => setTeamSearchQuery(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment sx={{ p: 0 }} position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          bgcolor: "white",
                          fontSize: 14,
                          borderRadius: "8px",
                          boxShadow: "0px 1px 2px 0px #1018280D",
                        }}
                        size="small"
                      />
                    </Stack>
                    {filteredTeamEntity?.map((team) => (
                      <MenuItem
                        key={team.team_id}
                        sx={menuItemSx}
                        value={team.team_id}
                      >
                        {reporteeTeamIdsMapToName.get(team.team_id)}
                        {selectedTeams.includes(team.team_id) && (
                          <ListItemIcon>
                            <Check fontSize="small" color="primary" />
                          </ListItemIcon>
                        )}
                      </MenuItem>
                    ))}
                    <Box
                      sx={{
                        position: "sticky",
                        bottom: "-2px",
                        left: 0,
                        right: 0,
                        p: 0.5,
                        bgcolor: "white",
                        borderTop: "1px solid #e0e0e0",
                        borderBottom: "1px solid #e0e0e0",
                      }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={handleTrainingEntityTeamSelectedApply}
                      >
                        Apply
                      </Button>
                    </Box>
                  </Select>
                </FormControl>
                <DateSelector
                  dateRange={trainingEntityDateRange}
                  setDateRange={setTrainingEntityDateRange}
                  handleDateRangeApplyCallback={
                    handleTrainingEntityDateRangeApplyCallback
                  }
                />
                <FormControl size="small" sx={{ minWidth: 150, maxWidth: 150 }}>
                  <Select
                    multiple
                    open={creatorsDropdownOpen}
                    onClose={() => setCreatorsDropdownOpen(false)}
                    onOpen={() => setCreatorsDropdownOpen(true)}
                    value={selectedCreators}
                    onChange={handleCreatorChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) => {
                      const filterSelected = selected.filter((data) => data);
                      if (filterSelected.length === 0) {
                        return "All Creators";
                      } else if (filterSelected.length === 1) {
                        return "1 selected";
                      } else {
                        return `${filterSelected.length} selected`;
                      }
                    }}
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <Stack
                      sx={{
                        position: "sticky",
                        top: "0px",
                        left: 0,
                        right: 0,
                        p: 0.5,
                        bgcolor: "white",
                        borderBottom: "1px solid #e0e0e0",
                        zIndex: 10,
                      }}
                    >
                      <TextField
                        placeholder="Search Creators"
                        value={creatorSearchQuery}
                        onChange={(e) => setCreatorSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment sx={{ p: 0 }} position="start">
                              <SearchIcon />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          bgcolor: "white",
                          fontSize: 14,
                          borderRadius: "8px",
                          boxShadow: "0px 1px 2px 0px #1018280D",
                        }}
                        size="small"
                      />
                    </Stack>
                    {filteredCreators.map((id) => (
                      <MenuItem key={id} sx={menuItemSx} value={id}>
                        {creatorIdsMapToName.get(id)}
                        {selectedCreators.includes(id) && (
                          <ListItemIcon>
                            <Check fontSize="small" color="primary" />
                          </ListItemIcon>
                        )}
                      </MenuItem>
                    ))}
                    <Box
                      sx={{
                        position: "sticky",
                        bottom: "-2px",
                        left: 0,
                        right: 0,
                        p: 1,
                        bgcolor: "white",
                        borderTop: "1px solid #e0e0e0",
                      }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleTrainingEntitySelectedApply}
                      >
                        Apply
                      </Button>
                    </Box>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
            {/* Training Plans Table */}
            <TrainingPlanTable
              trainingPlans={trainingEntityAttempts}
              totalCount={trainingEntityPagination.total_count || 0} // Pass total count for pagination
              page={page}
              rowsPerPage={rowsPerPage}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              allUserNamesMap={allUserNamesMap}
              allUserClassIdsMap={allUserClassIdsMap}
              activeTab={activeTab}
              isTableLoading={isTableLoading}
            />
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default ManagerDashboard;