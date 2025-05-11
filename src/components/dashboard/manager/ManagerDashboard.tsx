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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
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
import { fetchReporteeUsers, fetchUsersSummary, User, UserSummary } from "../../../services/users";
import { fetchTeams, TeamResponse, Team } from "../../../services/teams";
import DateSelector from "../../common/DateSelector";
import { BarChart } from "@mui/x-charts";

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

// LeaderBoard component
const LeaderBoard = ({ data, title, sortBy = "High to Low", popupText }) => {
  return (
    <Card
      sx={{
        borderRadius: 2,
        position: "relative",
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
        height: "fit-content",
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
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography fontSize={12} variant="caption" color="#00000099">
              Sort by: {sortBy}
            </Typography>
          </Box>
        </Stack>
        <Stack sx={{ px: 1.5, pt: 2 }} gap={1}>
          <BarChart
            dataset={data}
            yAxis={[{ scaleType: "band", dataKey: "team" }]}
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
            sx={{
              ".MuiChartsAxisTickLabel-root": {
                fill: "#637381",
                fontSize: 14,
                fontWeight: "medium",
              },
              ".MuiChartsAxis-line": {
                stroke: "transparent",
              },
              ".MuiChartsAxis-tick": {
                display: "none",
              },
            }}
            {...chartSetting}
          />
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
            <Box sx={{ bgcolor: "#F2F4F7", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#344054"
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
                Not started: {notStarted}
              </Typography>
            </Box>
          </Grid>
          <Grid>
            <Box sx={{ bgcolor: "#FEF3F2", py: 0.5, px: 2, borderRadius: 100 }}>
              <Typography
                variant="body2"
                sx={{ fontSize: 16 }}
                fontWeight="medium"
                color="#B42318"
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
      }}
    >
      <Stack spacing={2} alignItems="center">
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
                <FileDownloadOutlinedIcon sx={{ color: "#143FDA", fontSize: 24 }} />
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
  reporteeUserIdsMapToName,
  activeTab,
  reporteeUserIdsMapToClassId,
  isTableLoading,
}) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIdForCsvDownload, setSelectedIdForCsvDownload] = useState<string>("");

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;


  const handlePopupClick = (event: React.MouseEvent<HTMLButtonElement>, entityId: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#ECFDF3", color: "#027A48" };
      case "in_progress":
        return { bg: "#F2F4F7", color: "#344054" };
      case "not_started":
        return { bg: "#FFFAEB", color: "#B54708" };
      default:
        return { bg: "#F9FAFB", color: "#B54708" };
    }
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
    const headers = ["Trainee Name", "Class ID", "Status", "Due Date","Avg. Score"]
    const trainingEntityData = trainingPlans.find((plan: any) => plan.id === selectedIdForCsvDownload)
    const csvRows = [headers.join(",")];
    trainingEntityData.trainees?.forEach((row: any) => {
      const rowData = [
        reporteeUserIdsMapToName[row.name] || row.name,
        reporteeUserIdsMapToClassId[row.name],
        row.status,
        row.dueDate,
        row.avgScore,
      ].join(",");
      csvRows.push(rowData);
    })
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = 'table_data.csv';
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
              {activeTab === "TrainingPlan" ? "TRP Name" : activeTab === "Module" ? "Module Name" : "Simulation Name"}
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
                  sx={{ py: "40px", px: 2, fontSize: 16, fontWeight: "medium" }}
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
                      borderRadius: "25px",
                      fontWeight: "medium",
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
                  <Typography
                    sx={{
                      color: "#027A48",
                      bgcolor: "#ECFDF3",
                      width: "fit-content",
                      borderRadius: "25px",
                      px: 1,
                      py: 0.4,
                      fontSize: 14,
                      fontWeight: "medium",
                    }}
                  >
                    {plan.completionRate}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color: "#B54708",
                      fontWeight: "medium",
                      bgcolor: "#FFFAEB",
                      width: "fit-content",
                      borderRadius: "25px",
                      px: 1,
                      py: 0.4,
                      fontSize: 14,
                    }}
                  >
                    {plan.adherenceRate}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      color: "#027A48",
                      fontWeight: "medium",
                      bgcolor: "#ECFDF3",
                      width: "fit-content",
                      borderRadius: "25px",
                      px: 1,
                      py: 0.4,
                      fontSize: 14,
                    }}
                  >
                    {plan.avgScore}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    sx={{
                      bgcolor: "#F2F4F7",
                      color: "#344054",
                      width: "fit-content",
                      px: 1.2,
                      py: 0.4,
                      borderRadius: "25px",
                      fontWeight: "medium",
                    }}
                  >
                    {plan.estTime}
                  </Typography>
                </TableCell>
                <TableCell>
                <IconButton sx={{ backgroundColor: "#0000000A" , borderRadius: "4px"}} onClick={(e) => handlePopupClick(e, plan.id)} size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                  <Popover
                        id={id}
                        open={open}
                        anchorEl={anchorEl}
                        onClose={(e)=>handlePopupClose(e)}
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                        transformOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
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
                       color:'#00000099',
                       fontWeight:'medium',
                       cursor:'pointer',
                      }}
                      onClick={(e)=>handleOpenDownloadDialog(e)}
                    >
                    <FileDownloadOutlinedIcon sx={{ color: '#00000066'}} />  Download Break-up Data
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
                                {/* <TableCell>
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      bgcolor: getStatusColor(trainee.status)
                                        .color,
                                    }}
                                  />
                                </TableCell> */}
                                <TableCell
                                  sx={{
                                    color: "#00000099",
                                    fontWeight: "medium",
                                    fontSize: 16,
                                    p: 2,
                                  }}
                                >
                                  {reporteeUserIdsMapToName.get(trainee.name) ||
                                    trainee.name}
                                </TableCell>
                                <TableCell
                                  sx={{
                                    color: "#00000099",
                                    fontWeight: "medium",
                                    fontSize: 16,
                                  }}
                                >
                                  {reporteeUserIdsMapToClassId.get(trainee.name) || trainee.classId}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={trainee.status}
                                    size="small"
                                    sx={{
                                      bgcolor: getStatusColor(trainee.status)
                                        .bg,
                                      color: getStatusColor(trainee.status)
                                        .color,
                                      fontWeight: "medium",
                                    }}
                                  />
                                </TableCell>
                                <TableCell>{trainee.dueDate}</TableCell>
                                <TableCell>
                                  {trainee.avgScore ? (
                                    <Typography
                                      sx={{
                                        color: "#027A48",
                                        fontWeight: "medium",
                                        bgcolor: "#ECFDF3",
                                        width: "fit-content",
                                        borderRadius: "25px",
                                        px: 1,
                                        py: 0.4,
                                        fontSize: 14,
                                      }}
                                    >
                                      {trainee.avgScore}%
                                    </Typography>
                                  ) : (
                                    <Typography
                                      sx={{
                                        bgcolor: "#F2F4F7",
                                        color: "#344054",
                                        width: "fit-content",
                                        fontSize: 14,
                                        px: 1.2,
                                        py: 0.4,
                                        borderRadius: "25px",
                                        fontWeight: "medium",
                                      }}
                                    >
                                      NA
                                    </Typography>
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
          count={totalCount} // Total number of items
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
      position: 'relative',
    },
  },
  MenuListProps: {
    sx: {
      padding: 0,
      maxHeight:350,
      overflowY:"auto",
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
    borderBottom: "1px solid #f0f0f0"
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
    useState<ManagerDashboardAggregatedDataResponse | null>(null);
  const [reporteeUser, setReporteeUser] = useState<[] | User[]>([]);
  const [filteredReporteeUserIds, setFilteredReporteeUserIds] = useState<[] | string[]>([]);
  const [allUserIds, setAllUserIds] = useState<[] | string[]>([]);
  const [allCreatorIds, setAllCreatorIds] = useState<[] | string[]>([]);
  const [reporteeUserIdsMapToName, setReporteeUserIdsMapToName] = useState<Map<string, string>>(new Map());
  const [reporteeUserIdsMapToClassId, setReporteeUserIdsMapToClassId] = useState<Map<string, string>>(new Map());
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
  const [trainingEntityPagination, setTrainingEntityPagination] = useState<any>(
    {}
  );
  const [dropdownSearchQuery, setDropdownSearchQuery] = useState("");
  const [creatorSearchQuery, setCreatorSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  const [trainingEntityDateRange, setTrainingEntityDateRange] = useState<
    DateRange<Dayjs>
  >([null, null]);
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

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
      allUserIds.includes(id)
    );
    let selectedTeamIds = teamframe.filter((id: string) =>
      allTeamIds.includes(id)
    );
    if ((!selectedUserIds || selectedUserIds.length === 0) && (!selectedTeamIds || selectedTeamIds.length === 0)) {
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
        setAllUserIds(userData);
        const userMap = new Map(
          data?.map((user) => [user.user_id, user.first_name + " " + user.last_name])
        );
        const userMaptoClassId = new Map(
          data?.map((user) => [user.user_id, user.class_id || ""])
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
          user.id
        );
        console.log("repoertee users --------", data);
        const teamsData = data?.items?.map((team: Team) => team.team_id);
        setReporteeTeam(data);
        if (teamsData) {
          setFilteredReporteeTeamIds(teamsData);
          setAllTeamIds(teamsData);
        }

        const teamMap = new Map(
          data?.items?.map((team) => [team.team_id, team.name])
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

  const loadCreators = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams(location.search);
      const workspaceId = params.get("workspace_id");
      const response = await fetchUsersSummary(workspaceId || "");
      const creatorIdsList = response?.map((user: UserSummary) => user.user_id);
      if (creatorIdsList) {
        setAllCreatorIds(creatorIdsList);
      }
      const creatorMap = new Map(
        response?.map((user) => [user.user_id, user.first_name + " " + user.last_name])
      );
      if (creatorMap) {
        setCreatorIdsMapToName(creatorMap);
      }
      
    } catch (error) {
      console.error("Error loading reportee users:", error);
      setError("Failed to load reportee users");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (user?.id) {
      try {
        setIsAggregatedDataLoading(true);
        setError(null);
        const params: any = {
          assignedDateRange: { startDate: "", endDate: "" },
          trainingEntityDateRange: { startDate: "", endDate: "" },
          trainingEntityCreatedBy: selectedCreators.filter((creatorId) => (creatorId !== "" && creatorId !== null && creatorId !== undefined)),
          trainingEntityTeams: selectedTeams.filter((teamId) => (teamId !== "" && teamId !== null && teamId !== undefined)),
          trainingEntitySearchQuery: searchQuery,
        };

        if (dateRange[0] && dateRange[1]) {
          params.assignedDateRange.startDate =
            dateRange[0].format("YYYY-MM-DD");
          params.assignedDateRange.endDate = dateRange[1].format("YYYY-MM-DD");
        } else if (dateRange[0]) {
          params.assignedDateRange.startDate =
            dateRange[0].format("YYYY-MM-DD");
          params.assignedDateRange.endDate = null;
        } else if (dateRange[1]) {
          params.assignedDateRange.startDate = null;
          params.assignedDateRange.endDate = dateRange[1].format("YYYY-MM-DD");
        }

        // In a real implementation, we would fetch data from the API
        const data = await fetchManagerDashboardAggregatedData({
          user_id: user.id,
          reportee_user_ids: filteredReporteeUserIds,
          reportee_team_ids: filteredReporteeTeamIds,
          params,
        });
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
    selectedTeamsOverride: string[] | [] = []
  ) => {
    try {
      setIsTableLoading(true);
      const params: any = {
        assignedDateRange: { startDate: "", endDate: "" },
        trainingEntityDateRange: { startDate: "", endDate: "" },
        trainingEntityCreatedBy: selectedCreators.filter((creatorId) => (creatorId !== "" && creatorId !== null && creatorId !== undefined)),
        trainingEntityTeams: selectedTeamsOverride.length > 0 ? selectedTeamsOverride : selectedTeams.filter((teamId) => (teamId !== "" && teamId !== null && teamId !== undefined)),
        trainingEntitySearchQuery: searchQueryOverride !== null ? searchQueryOverride : searchQuery,
      };

      if (dateRange[0] && dateRange[1]) {
        params.assignedDateRange.startDate =
          dateRange[0].format("YYYY-MM-DD");
        params.assignedDateRange.endDate = dateRange[1].format("YYYY-MM-DD");
      } else if (dateRange[0]) {
        params.assignedDateRange.startDate =
          dateRange[0].format("YYYY-MM-DD");
        params.assignedDateRange.endDate = null;
      } else if (dateRange[1]) {
        params.assignedDateRange.startDate = null;
        params.assignedDateRange.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      if (trainingEntityDateRange[0] && trainingEntityDateRange[1]) {
        params.trainingEntityDateRange.startDate =
          trainingEntityDateRange[0].format("YYYY-MM-DD");
        params.trainingEntityDateRange.endDate =
          trainingEntityDateRange[1].format("YYYY-MM-DD");
      } else if (trainingEntityDateRange[0]) {
        params.trainingEntityDateRange.startDate =
          trainingEntityDateRange[0].format("YYYY-MM-DD");
        params.trainingEntityDateRange.endDate = null;
      } else if (trainingEntityDateRange[1]) {
        params.trainingEntityDateRange.startDate = null;
        params.trainingEntityDateRange.endDate =
          trainingEntityDateRange[1].format("YYYY-MM-DD");
      }
      const pagination = {
        page: page,
        pagesize: rowsPerPage,
      };

      const data = await fetchTrainingEntityAttemptsStatsForManagerDashboard({
        user_id: user?.id || "user123",
        type: type,
        reportee_user_ids: filteredReporteeUserIds,
        reportee_team_ids: filteredReporteeTeamIds,
        params,
        pagination,
      });

      setTrainingEntityPagination(data.pagination);
      setTrainingEntityAttempts(data.training_entity);
      setError(null);
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
      .includes(dropdownSearchQuery.toLowerCase().trim())
  );

  const filteredTeams =
    reporteeTeam?.items?.filter((team) =>
      (reporteeTeamIdsMapToName.get(team.team_id) || "")
        .toLowerCase()
        .trim()
        .includes(dropdownSearchQuery.toLowerCase().trim())
    ) || [];

  const filteredCreators = allCreatorIds.filter((creatorId) =>
    (creatorIdsMapToName.get(creatorId) || "")
      .toLowerCase()
      .includes(creatorSearchQuery.toLowerCase().trim())
  );

  const filteredTeamEntity = filteredTeams?.filter((team) =>
    reporteeTeamIdsMapToName
      .get(team.team_id)
      ?.toLowerCase()
      .includes(teamSearchQuery.toLowerCase().trim())
  );

  useEffect(() => {
    loadReporteeUser();
    loadReporteeTeams();
    loadCreators();
  }, [user?.id]);

  useEffect(() => {
    if ((filteredReporteeUserIds && filteredReporteeUserIds?.length > 0) || (filteredReporteeTeamIds && filteredReporteeTeamIds?.length > 0)) {
      loadDashboardData();
      loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    }
  }, [filteredReporteeUserIds, filteredReporteeTeamIds]);

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

  const handleDateRangeApplyCallback = () => {
    loadDashboardData();
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  };
  const handleTrainingEntityDateRangeApplyCallback = () => {
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  };

  const handleTrainingEntitySelectedApply = () => {
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
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
      loadTrainingEntityAttemptsForManagerDashboard(activeTab, undefined, allTeamIds);
    } else {
      loadTrainingEntityAttemptsForManagerDashboard(activeTab);
    }
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
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  };

  useEffect(() => {
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
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
                  <FormControl size="small" sx={{ minWidth: 230, maxWidth: 230 }}>
                    <Select
                      multiple
                      value={teamframe}
                      onChange={handleTeamframeChange}
                      displayEmpty
                      IconComponent={ExpandMoreIcon}
                      renderValue={(selected) =>{
                        const filterSelected = selected.filter((data) => data);
                        return(
                          filterSelected.length === 0 ? (
                          "All Users and Teams"
                        ) : teamframeNames.length > 0 ? (
                          teamframeNames[0] +
                          (teamframeNames[1] ? `${teamframeNames[1]}` : "")
                        ) : (
                          "All Users and Teams"
                        ))}
                      }
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
                      <Stack sx={{
                            position: 'sticky',
                            top: "-2px",
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: 'white',
                            borderBottom: '1px solid #e0e0e0',
                          }}>
                        <TextField
                          placeholder="Search User or Team"
                          value={dropdownSearchQuery}
                          onKeyDown={(e) => e.stopPropagation()}
                          onChange={(e) => setDropdownSearchQuery(e.target.value)}
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
                            position: 'sticky',
                            bottom: "-2px",
                            left: 0,
                            right: 0,
                            p: 1,
                            bgcolor: 'white',
                            borderTop: '1px solid #e0e0e0',
                          }}
                        >
                        <Button fullWidth variant="contained" onClick={handleApplyClick}>
                          Apply
                        </Button>
                      </Box>
                    </Select>
                  </FormControl>

                  <DateSelector
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    handleDateRangeApplyCallback={handleDateRangeApplyCallback}
                  />
                </Stack>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  {dashboardData && (
                    <AssignmentCard
                      title="Training Plans Assigned"
                      total={dashboardData.assignmentCounts.trainingPlans.total}
                      completed={
                        dashboardData.assignmentCounts.trainingPlans.completed
                      }
                      inProgress={
                        dashboardData.assignmentCounts.trainingPlans.inProgress
                      }
                      notStarted={
                        dashboardData.assignmentCounts.trainingPlans.notStarted
                      }
                      overdue={
                        dashboardData.assignmentCounts.trainingPlans.overdue
                      }
                      popupText="On time completed test Sim / Total no. of test sims completed"
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  {dashboardData && (
                    <AssignmentCard
                      title="Modules Assigned"
                      total={dashboardData.assignmentCounts.modules.total}
                      completed={dashboardData.assignmentCounts.modules.completed}
                      inProgress={
                        dashboardData.assignmentCounts.modules.inProgress
                      }
                      notStarted={
                        dashboardData.assignmentCounts.modules.notStarted
                      }
                      overdue={dashboardData.assignmentCounts.modules.overdue}
                      popupText="On time completed test Sim / Total no. of test sims completed"
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
                      overdue={dashboardData.assignmentCounts.simulations.overdue}
                      popupText="On time completed test Sim / Total no. of test sims completed"
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
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Modules"
                          value={dashboardData.completionRates.modules}
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Simulation"
                          value={dashboardData.completionRates.simulations}
                          popupText="On time completed test Sim / Total no. of test sims completed"
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
                      sortBy="High to Low"
                      popupText="On time completed test Sim / Total no. of test sims completed"
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
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Modules"
                          value={dashboardData.averageScores.modules}
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Simulation"
                          value={dashboardData.averageScores.simulations}
                          popupText="On time completed test Sim / Total no. of test sims completed"
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
                      sortBy="High to Low"
                      popupText="On time completed test Sim / Total no. of test sims completed"
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
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Modules"
                          value={dashboardData.adherenceRates.modules}
                          popupText="On time completed test Sim / Total no. of test sims completed"
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      {dashboardData && (
                        <CircularProgressCards
                          title="Simulation"
                          value={dashboardData.adherenceRates.simulations}
                          popupText="On time completed test Sim / Total no. of test sims completed"
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
                      sortBy="High to Low"
                      popupText="On time completed test Sim / Total no. of test sims completed"
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
                placeholder={activeTab === "TrainingPlan" ? "Search by Training Plan Name or ID" : activeTab === "Module" ? "Search by Module Name or ID" : "Search by Simulation Name or ID"}
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
                    value={selectedTeams}
                    onChange={handleTeamsChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) =>{
                      const filterSelected = selected.filter((data) => data);
                      return(filterSelected.length === 0 ? (
                        "All Teams"
                      ) : (
                        filterSelected
                          .map((id) => reporteeTeamIdsMapToName.get(id))
                          .join(", ")
                      ))}
                    }
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                     <Stack sx={{
                            position: 'sticky',
                            top: "-2px",
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: 'white',
                            borderBottom: '1px solid #e0e0e0',
                            zIndex: 10,
                          }}>
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
                            position: 'sticky',
                            bottom: "-2px",
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: 'white',
                            borderTop: '1px solid #e0e0e0',
                            borderBottom: '1px solid #e0e0e0',
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
                    value={selectedCreators}
                    onChange={handleCreatorChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) =>
                     {  
                      const filterSelected = selected.filter((data) => data);
                      return(filterSelected.length === 0 ? "All Creators" : (
                        filterSelected
                          .map((id) => creatorIdsMapToName.get(id))
                          .join(", ")
                      ))}
                    }
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <Stack sx={{
                            position: 'sticky',
                            top: "0px",
                            left: 0,
                            right: 0,
                            p: 0.5,
                            bgcolor: 'white',
                            borderBottom: '1px solid #e0e0e0',
                            zIndex: 10,
                          }}>
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
                      <MenuItem
                        key={id}
                        sx={menuItemSx}
                        value={id}
                      >
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
                            position: 'sticky',
                            bottom: "-2px",
                            left: 0,
                            right: 0,
                            p: 1,
                            bgcolor: 'white',
                            borderTop: '1px solid #e0e0e0',
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
              trainingPlans={
                trainingEntityAttempts
              }
              totalCount={trainingEntityPagination.total_count} // Pass total count for pagination
              page={page}
              rowsPerPage={rowsPerPage}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              reporteeUserIdsMapToName={reporteeUserIdsMapToName}
              activeTab={activeTab}
              reporteeUserIdsMapToClassId={reporteeUserIdsMapToClassId}
              isTableLoading={isTableLoading}
            />
          </Stack>
         
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default ManagerDashboard;


