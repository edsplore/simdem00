import {
  Check,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
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
} from "@mui/material";
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
import { fetchReporteeUsers, User } from "../../../services/users";
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

// TrainingPlanTable component
const TrainingPlanTable = ({
  trainingPlans,
  totalCount,
  page,
  rowsPerPage,
  onChangePage,
  onChangeRowsPerPage,
  reporteeUserIdsMapToName,
}) => {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return { bg: "#ECFDF3", color: "#027A48" };
      case "In Progress":
        return { bg: "#F2F4F7", color: "#344054" };
      case "Not Started":
        return { bg: "#FFFAEB", color: "#B54708" };
      default:
        return { bg: "#F9FAFB", color: "#B54708" };
    }
  };

  const getCompactId = (id: string) => {
    if (!id || id.length < 6) return id;
    return `${id.slice(0, 3)}..${id.slice(-3)}`;
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
              Name
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
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
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
                                  {trainee.classId}
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
    </TableContainer>
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
    },
  },
  MenuListProps: {
    sx: {
      padding: 0,
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
  borderBottom: "1px solid #f0f0f0",
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
  const [filteredReporteeUserIds, setFilteredReporteeUserIds] = useState<
    [] | string[]
  >([]);
  const [allUserIds, setAllUserIds] = useState<[] | string[]>([]);
  const [reporteeUserIdsMapToName, setReporteeUserIdsMapToName] = useState<
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
  const [isLoading, setIsLoading] = useState(false);
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
  const [creatorName, setCreatorName] = useState<[] | string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [userActivityData, setUserActivityData] = useState({
    users: mockData.trainingPlans,
    total: mockData.trainingPlans,
  });

  //const [dashboardAggregatedData, setDashboardAggregatedData] = useState<ManagerDashboardAggregatedDataResponse | {}>({});
  const handleTeamframeChange = (event) => {
    const { value } = event.target;

    const selectedIds = typeof value === "string" ? value.split(",") : value;
    const selectedUserNames = selectedIds.map((id) => {
      const userName = reporteeUserIdsMapToName.get(id);
      const teamName = reporteeTeamIdsMapToName.get(id);
      return userName || teamName || "";
    });

    setTeamframe(selectedIds);
    setTeamframeNames(selectedUserNames);

    // Update the individual selectors
    const newSelectedTeams = selectedIds.filter((id) =>
      reporteeTeamIdsMapToName.has(id)
    );

    setSelectedTeams(newSelectedTeams);
  };
  // Handle changes from the team selector
  const handleTeamsChange = (event) => {
    const { value } = event.target;
    const newSelectedTeams =
      typeof value === "string" ? value.split(",") : value;
    setSelectedTeams(newSelectedTeams);
  };

  const handleCreatorChange = (event) => {
    const { value } = event.target;
    const newSelectedCreators =
      typeof value === "string" ? value.split(",") : value;

    const selectedCreatorName = reporteeUser
      .filter((creator) => newSelectedCreators.includes(creator.user_id))
      .map((creator) => creator.fullName);

    setCreatorName(selectedCreatorName);
    setSelectedCreators(newSelectedCreators);
  };

  const handleApplyClick = () => {
    // Handle the selected users/teams here
    console.log("teamframe", teamframe, dropdownSearchQuery);
    const selectedUserIds = teamframe.filter((id: string) =>
      allUserIds.includes(id)
    );
    const selectedTeamIds = teamframe.filter((id: string) =>
      allTeamIds.includes(id)
    );
    setFilteredReporteeUserIds(selectedUserIds);
    setFilteredReporteeTeamIds(selectedTeamIds);
  };

  const filteredTrainingEntities = trainingEntityAttempts.filter((entity) => {
    const query = searchQuery.toLowerCase();
    return entity.name.toLowerCase().includes(query);
  });

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
          data?.map((user) => [user.user_id, user.fullName])
        );
        setReporteeUserIdsMapToName(userMap);
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

  const loadDashboardData = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        const params: any = {
          assignedDateRange: { startDate: "", endDate: "" },
          trainingEntityDateRange: { startDate: "", endDate: "" },
          trainingEntityCreatedBy: selectedCreators,
          trainingEntityTeams: selectedTeams,
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
        setIsLoading(false);
      }
    }
  };
  const filteredUserIds = allUserIds.filter((userId) =>
    (reporteeUserIdsMapToName.get(userId) || "")
      .toLowerCase()
      .includes(dropdownSearchQuery.toLowerCase())
  );

  const filteredTeams =
    reporteeTeam?.items?.filter((team) =>
      (reporteeTeamIdsMapToName.get(team.team_id) || "")
        .toLowerCase()
        .includes(dropdownSearchQuery.toLowerCase())
    ) || [];

  const filteredCreators = reporteeUser.filter((creator) =>
    creator.fullName.toLowerCase().includes(creatorSearchQuery.toLowerCase())
  );

  const filteredTeamEntity = filteredTeams?.filter((team) =>
    reporteeTeamIdsMapToName
      .get(team.team_id)
      ?.toLowerCase()
      .includes(teamSearchQuery.toLowerCase())
  );

  useEffect(() => {
    loadReporteeUser();
    loadReporteeTeams();
  }, [user?.id]);

  useEffect(() => {
    if (filteredReporteeUserIds && filteredReporteeUserIds?.length > 0) {
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
    loadTrainingEntityAttemptsForManagerDashboard(newValue);
    setPage(0); // Reset to the first page when changing tabs
  };

  const loadTrainingEntityAttemptsForManagerDashboard = async (
    type: string
  ) => {
    try {
      setIsTableLoading(true);
      const params: any = {
        assignedDateRange: { startDate: "", endDate: "" },
        trainingEntityDateRange: { startDate: "", endDate: "" },
        trainingEntityCreatedBy: selectedCreators,
        trainingEntityTeams: selectedTeams,
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to the first page
    // loadTrainingEntityAttemptsForManagerDashboard(activeTab);
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
                    renderValue={(selected) =>
                      selected.length === 0 ? (
                        <>Select Users or Teams</>
                      ) : teamframeNames.length > 0 ? (
                        teamframeNames[0] +
                        (teamframeNames[1] ? `, ${teamframeNames[1]}` : "")
                      ) : (
                        "Select Users or Teams"
                      )
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
                    <Stack sx={{ padding: 0.5 }}>
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
                    {teamframe.length > 0 && (
                      <Stack p={0.5}>
                        <Button variant="contained" onClick={handleApplyClick}>
                          Apply
                        </Button>
                      </Stack>
                    )}
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
                placeholder="Search by Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  // width: 300,
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
                    renderValue={(selected) =>
                      selected.length === 0 ? (
                        <>All Teams</>
                      ) : (
                        selected
                          .map((id) => reporteeTeamIdsMapToName.get(id))
                          .join(", ")
                      )
                    }
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <Stack sx={{ padding: 0.5 }}>
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
                    {selectedTeams.length > 0 && (
                      <Stack p={0.5}>
                        <Button
                          variant="contained"
                          onClick={handleTrainingEntitySelectedApply}
                        >
                          Apply
                        </Button>
                      </Stack>
                    )}
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
                      selected.length === 0 ? <>All Creators</> : creatorName
                    }
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <Stack sx={{ padding: 0.5 }}>
                      <TextField
                        placeholder="Search Cretors"
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
                    {filteredCreators.map((creator) => (
                      <MenuItem
                        key={creator.user_id}
                        sx={menuItemSx}
                        value={creator.user_id}
                      >
                        {creator.fullName}
                        {selectedCreators.includes(creator.user_id) && (
                          <ListItemIcon>
                            <Check fontSize="small" color="primary" />
                          </ListItemIcon>
                        )}
                      </MenuItem>
                    ))}
                    {selectedCreators.length > 0 && (
                      <Stack p={0.5}>
                        <Button
                          variant="contained"
                          onClick={handleTrainingEntitySelectedApply}
                        >
                          Apply
                        </Button>
                      </Stack>
                    )}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
            {/* Training Plans Table */}
            <TrainingPlanTable
              trainingPlans={
                filteredTrainingEntities
                  ? filteredTrainingEntities
                  : trainingEntityAttempts
              }
              totalCount={trainingEntityPagination.total_count} // Pass total count for pagination
              page={page}
              rowsPerPage={rowsPerPage}
              onChangePage={handleChangePage}
              onChangeRowsPerPage={handleChangeRowsPerPage}
              reporteeUserIdsMapToName={reporteeUserIdsMapToName}
            />
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default ManagerDashboard;


