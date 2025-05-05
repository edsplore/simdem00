import {
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
  Button,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Popover,
  Divider,
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
import DateSelector from "../../common/DateSelector";

// Mock data for the dashboard
const mockData = {
  dropdownData: [
    {
      group: "Users",
      items: [
        { id: "user-1", name: "User_name 01" },
        { id: "user-2", name: "User_name 02" },
        { id: "search", name: "Search User or Team", isSearch: true },
        { id: "user-3", name: "User_name 03" },
      ],
    },
    {
      group: "Teams",
      items: [
        { id: "team-1", name: "Team 01" },
        { id: "team-2", name: "Team 02" },
        { id: "team-3", name: "Team 03" },
        { id: "team-4", name: "Team 04" },
      ],
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
      <Stack spacing={2} justifyContent="space-between" height="100%">
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
          {data.map((item, index) => (
            <Stack direction="row" alignItems="start" width="100%">
              <Typography
                fontSize={12}
                color="#919EAB"
                variant="body2"
                width="30%"
                sx={{ mb: 0.5 }}
              >
                {item.team}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  borderBottom: "1px dashed #919EAB3D",
                }}
              >
                <Box
                  sx={{
                    height: 20,
                    borderRadius: 1,
                    width: `${item.score}%`,
                    bgcolor: "#001EEE1A",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "end",
                    px: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 1,
                      fontWeight: "semibold",
                      fontSize: 12,
                      color: "#001EEE",
                    }}
                  >
                    {item.score}%
                  </Typography>
                </Box>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            pb: 1.5,
            mt: 0,
          }}
        >
          <Typography
            width="20%"
            variant="caption"
            color="#919EAB"
          ></Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            0
          </Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            20%
          </Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            40%
          </Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            60%
          </Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            80%
          </Typography>
          <Typography fontSize={12} variant="caption" color="#919EAB">
            100%
          </Typography>
        </Box>
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
const TrainingPlanTable = ({ trainingPlans }) => {
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
              TRP Name
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
                  {plan.id}
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
                                  {trainee.name}
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
        <TableFooter sx={{ bgcolor: "#F9FAFB" }}>
          <TableRow>
            <TableCell
              sx={{ py: 1, px: 2, color: "#00000099", fontWeight: 500 }}
              colSpan={4}
            >
              Rows per page:
              <Select
                // value={rowsPerPage.toString()}
                // onChange={handleChangeRowsPerPage}
                displayEmpty
                IconComponent={ExpandMoreIcon}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      mt: 1,
                      border: "1px solid #0000001A",
                      borderRadius: 2,
                      boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
                      bgcolor: "white",
                      width: 50,
                    },
                  },
                  MenuListProps: {
                    sx: {
                      padding: 0,
                    },
                  },
                }}
                sx={{
                  height: "22px",
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
                }}
                size="small"
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </TableCell>
            <TableCell colSpan={4} sx={{ py: 1, px: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  height: "22px",
                }}
              >
                <Typography
                  variant="body2"
                  color="#00000099"
                  fontWeight={500}
                  sx={{ mr: 2 }}
                >
                  {/* {`${page * rowsPerPage + 1}-${Math.min(
                    (page + 1) * rowsPerPage,
                    userActivityData.total
                  )} of ${userActivityData.total}`} */}
                  1 - 10 of 10
                </Typography>

                {/* <IconButton disabled={page === 0}> */}
                <IconButton>
                  <ChevronLeftIcon />
                </IconButton>

                <IconButton
                // disabled={
                //   page >= Math.ceil(userActivityData.total / rowsPerPage) - 1
                // }
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

const menuSelectsx = {
  border: "1px solid #00000014",
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
      width: 200,
    },
  },
  MenuListProps: {
    sx: {
      padding: 0,
    },
  },
};
const menuItemSx = {
  py: 1.5,
  fontSize: 14,
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("TrainingPlan");
  const [teamframe, setTeamframe] = useState("All Teams");
  const [timeframe, setTimeframe] = useState("Today");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [trainingEntityAttempts, setTrainingEntityAttempts] = useState<
    ManagerDashboardTrainingEntityAttemptsStatsResponse[]
  >([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [userActivityData, setUserActivityData] = useState({
    users: mockData.trainingPlans,
    total: mockData.trainingPlans,
  });

  //const [dashboardAggregatedData, setDashboardAggregatedData] = useState<ManagerDashboardAggregatedDataResponse | {}>({});
  const filteredTrainingEntities = trainingEntityAttempts.filter((entity) => {
    const query = searchQuery.toLowerCase();
    return entity.name.toLowerCase().includes(query);
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          // In a real implementation, we would fetch data from the API
          const data = await fetchManagerDashboardAggregatedData({
            user_id: user.id,
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
    loadDashboardData();
    loadTrainingEntityAttemptsForManagerDashboard(activeTab);
  }, [user?.id]);

  const handleTeamframeChange = (event: SelectChangeEvent<string>) => {
    setTeamframe(event.target.value);
  };
  const handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    setTimeframe(event.target.value);
  };
  const handleTabChange = (event: any, newValue: any) => {
    setActiveTab(newValue);
    loadTrainingEntityAttemptsForManagerDashboard(newValue);
  };

  const loadTrainingEntityAttemptsForManagerDashboard = async (
    type: string
  ) => {
    try {
      setIsTableLoading(true);
      const data = await fetchTrainingEntityAttemptsStatsForManagerDashboard({
        user_id: user?.id || "user123",
        type: type,
      });
      setTrainingEntityAttempts(data);
      setError(null);
    } catch (err) {
      setError("Failed to load training entity attempts");
      console.error("Error loading training entity attempts:", err);
    } finally {
      setIsTableLoading(false);
    }
  };

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
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={teamframe}
                    onChange={handleTeamframeChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
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
                    <MenuItem sx={menuItemSx} value="All Teams">
                      All Teams
                    </MenuItem>
                  </Select>
                </FormControl>

                <DateSelector />

                {/* <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={timeframe}
                    onChange={handleTimeframeChange}
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    MenuProps={menuSelectProps}
                    sx={menuSelectsx}
                  >
                    <MenuItem sx={menuItemSx} value="All Time">
                      All Time
                    </MenuItem>
                    <MenuItem sx={menuItemSx} value="Today">
                      Today
                    </MenuItem>
                    <MenuItem sx={menuItemSx} value="Yesterday">
                      Yesterday
                    </MenuItem>
                    <MenuItem sx={menuItemSx} value="Last 7 days">
                      Last 7 days
                    </MenuItem>
                    <MenuItem sx={menuItemSx} value="Last 30 days">
                      Last 30 days
                    </MenuItem>
                    <MenuItem sx={menuItemSx} value="Custom">
                      Custom
                    </MenuItem>
                  </Select>
                </FormControl> */}
                {/* {timeframe === "Custom" && (
                  <TextField
                    type="date"
                    label="Select Date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    required
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      mt: 1.5,
                      width: 230,
                      "& .MuiInputBase-root": {
                        fontSize: 14,
                      },
                    }}
                  />
                )} */}
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
                placeholder="Search by Training Plan Name or ID"
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
                <Select
                  IconComponent={ExpandMoreIcon}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  value="All Teams"
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Teams">
                    All Teams
                  </MenuItem>
                </Select>

                <DateSelector />

                {/* <Select
                  IconComponent={ExpandMoreIcon}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  value="All Time"
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Time">
                    All Time
                  </MenuItem>
                </Select> */}

                <Select
                  value="All Creators"
                  size="small"
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  IconComponent={ExpandMoreIcon}
                >
                  <MenuItem sx={menuItemSx} value="All Creators">
                    All Creators
                  </MenuItem>
                </Select>
              </Stack>
            </Stack>
            {/* Training Plans Table */}
            <TrainingPlanTable
              trainingPlans={
                filteredTrainingEntities
                  ? filteredTrainingEntities
                  : trainingEntityAttempts
              }
            />
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default ManagerDashboard;
