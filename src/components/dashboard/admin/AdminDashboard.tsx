import React, { useState, useEffect } from "react";
import {
  Container,
  Stack,
  Typography,
  Box,
  Card,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tooltip,
  circularProgressClasses,
  TableFooter,
} from "@mui/material";
import {
  Search as SearchIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore,
  InfoOutlined,
} from "@mui/icons-material";
import DashboardContent from "../DashboardContent";
import { useAuth } from "../../../context/AuthContext";
import {
  AdminDashboardUserActivityPayload,
  AdminDashboardUserActivityPayloadParams,
  AdminDashboardUserActivityResponse,
  AdminDashboardUserStatsResponse,
  fetchAdminDashboardStats,
  fetchAdminDashboardUserActivity,
} from "../../../services/admin";
import { DateRange } from "@mui/x-date-pickers-pro";
import { Dayjs } from "dayjs";
import DateSelector from "../../common/DateSelector";
// import { fetchAdminDashboardData, fetchUserActivityLog } from '../../../services/admin';
// import { adminDashboardData } from '../../../services/mockData/adminDashboard';

const adminDashboardData = {
  platformStats: {
    newUsers: {
      total: 240,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
    activeUsers: {
      total: 7876,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
    deactivatedUsers: {
      total: 240,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
    dailyActiveUsers: {
      total: 873,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
    weeklyActiveUsers: {
      total: 7876,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
    monthlyActiveUsers: {
      total: 29898,
      breakdown: {
        admin: 4,
        manager: 24,
        designer: 4,
        trainees: 199,
      },
    },
  },
  userActivity: [
    {
      id: 1,
      name: "John Doe",
      email: "johndoe@humana.com",
      role: "Trainee",
      division: "EverAI Labs",
      department: "Engineering",
      addedOn: "25 Dec 2024",
      status: "Active",
      assignedSimulations: 24,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 2,
      name: "John Doe",
      email: "johndoe@humana.com",
      role: "Trainee",
      division: "EverAI Labs",
      department: "Engineering",
      addedOn: "25 Dec 2024",
      status: "Active",
      assignedSimulations: 24,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 3,
      name: "John Doe",
      email: "johndoe@humana.com",
      role: "Trainee",
      division: "EverAI Labs",
      department: "Engineering",
      addedOn: "25 Dec 2024",
      status: "Active",
      assignedSimulations: 24,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 4,
      name: "John Doe",
      email: "johndoe@humana.com",
      role: "Trainee",
      division: "EverAI Labs",
      department: "Engineering",
      addedOn: "25 Dec 2024",
      status: "Active",
      assignedSimulations: 24,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 5,
      name: "Jane Smith",
      email: "janesmith@humana.com",
      role: "Manager",
      division: "EverAI Labs",
      department: "Product",
      addedOn: "20 Dec 2024",
      status: "Active",
      assignedSimulations: 12,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 6,
      name: "Robert Johnson",
      email: "robertjohnson@humana.com",
      role: "Designer",
      division: "EverAI Labs",
      department: "Design",
      addedOn: "18 Dec 2024",
      status: "Inactive",
      assignedSimulations: 8,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
    {
      id: 7,
      name: "Emily Davis",
      email: "emilydavis@humana.com",
      role: "Admin",
      division: "EverAI Labs",
      department: "Operations",
      addedOn: "15 Dec 2024",
      status: "Active",
      assignedSimulations: 0,
      completionRate: "86%",
      adherenceRate: "56%",
      avgScore: "86%",
      activatedOn: "25 Dec 2024",
      deactivatedOn: "25 Dec 2024",
      loginCount: 24,
      lastLoginDate: "25 Dec 2024",
      lastSessionDuration: 86,
    },
  ],
  totalUsers: 110,
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

// UserStatsCard component
const UserStatsCard = ({
  title,
  total,
  breakdown,
  icon,
  popupText,
  size = 170,
  thickness = 5,
}) => {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6">{title}</Typography>
        <InfoIconPopup title={popupText} />
      </Stack>

      <Grid container alignItems="center" spacing={1.5}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              position: "relative",
              display: "inline-flex",
            }}
          >
            <CircularProgress
              variant="determinate"
              value={breakdown.trainees}
              size={size}
              thickness={thickness}
              sx={{ color: "#E3E8FB" }}
            />
            <CircularProgress
              variant="determinate"
              value={breakdown.designer}
              size={size}
              thickness={thickness}
              sx={() => ({
                color: "#C8D2F7",
                animationDuration: "550ms",
                position: "absolute",
                left: 0,
                width: "100%",
                height: "auto",
              })}
            />
            <CircularProgress
              variant="determinate"
              value={breakdown.manager}
              size={size}
              thickness={thickness}
              sx={() => ({
                color: "#7891EB",
                animationDuration: "550ms",
                position: "absolute",
                left: 0,
                width: "100%",
                height: "auto",
              })}
            />
            <CircularProgress
              variant="determinate"
              value={breakdown.admin}
              size={size}
              thickness={thickness}
              sx={() => ({
                color: "#375CE5",
                animationDuration: "550ms",
                position: "absolute",
                left: 0,
                width: "100%",
                height: "auto",
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
              <Typography variant="h3" fontWeight="bold">
                {total.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={1} bgcolor="#F9FAFB" py={1} px={2} borderRadius={1}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 8,
                    borderRadius: "25px",
                    bgcolor: "#375CE5",
                  }}
                />
                <Typography
                  color="#000000CC"
                  fontSize={16}
                  fontWeight={600}
                  variant="body2"
                >
                  {breakdown.admin} Admin
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 8,
                    borderRadius: "25px",
                    bgcolor: "#7891EB",
                  }}
                />
                <Typography
                  color="#000000CC"
                  fontSize={16}
                  fontWeight={600}
                  variant="body2"
                >
                  {breakdown.manager} Manager
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 8,
                    borderRadius: "25px",
                    bgcolor: "#C8D2F7",
                  }}
                />
                <Typography
                  color="#000000CC"
                  fontSize={16}
                  fontWeight={600}
                  variant="body2"
                >
                  {breakdown.designer} Designer
                </Typography>
              </Box>
            </Stack>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "start",
                  gap: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 8,
                    borderRadius: "25px",
                    bgcolor: "#E3E8FB",
                  }}
                />
                <Typography
                  color="#000000CC"
                  fontSize={16}
                  fontWeight={600}
                  variant="body2"
                >
                  {breakdown.trainees} Trainees
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
};
const menuSelectsx = {
  border: "1px solid #00000014",
  borderRadius: 1,
  color: "#00000099",
  fontWeight: 600,
  fontSize: 14,
  outline: "none",
  p: 0,
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(adminDashboardData);
  const [dashboardStats, setDashboardStats] =
    useState<AdminDashboardUserStatsResponse | null>(null);
  const [userActivity, setUserActivity] = useState<
    AdminDashboardUserActivityResponse[]
  >([]);

  const [userActivityParams, setUserActivityParams] =
    useState<AdminDashboardUserActivityPayloadParams | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("All Department");
  const [division, setDivision] = useState("All Divisions");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [timeframe, setTimeframe] = useState("All Time");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);

  const [userActivityData, setUserActivityData] = useState({
    users: adminDashboardData.userActivity,
    total: adminDashboardData.totalUsers,
  });

  const handleDateRangeApplyCallback = (range: DateRange<Dayjs>) => {};

  const loadUserActivity = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        // In a real implementation, we would fetch data from the API
        const payload: AdminDashboardUserActivityPayload = {
          user_id: user.id,
        };

        if (userActivityParams) {
          payload["pagination"] = userActivityParams;
        }
        const data = await fetchAdminDashboardUserActivity(payload);
        setUserActivity(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadAdminDashboardStats = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        // In a real implementation, we would fetch data from the API
        const data = await fetchAdminDashboardStats({
          user_id: user.id,
        });
        setDashboardStats(data);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUserActivity();
    loadAdminDashboardStats();
  }, [user?.id]);

  // useEffect(() => {
  //   const loadUserActivity = async () => {
  //     try {
  //       // In a real implementation, we would fetch data from the API with filters
  //       const data = await fetchUserActivityLog({
  //         department: department !== "All Department" ? department : undefined,
  //         division: division !== "All Divisions" ? division : undefined,
  //         role: role !== "All Roles" ? role : undefined,
  //         status: status !== "All Status" ? status : undefined,
  //         timeframe: timeframe !== "All Time" ? timeframe : undefined,
  //         search: searchQuery,
  //         page,
  //         limit: rowsPerPage,
  //       });

  //       setUserActivityData(data);
  //     } catch (error) {
  //       console.error("Error loading user activity:", error);
  //     }
  //   };

  //   loadUserActivity();
  // }, [
  //   searchQuery,
  //   department,
  //   division,
  //   role,
  //   status,
  //   timeframe,
  //   page,
  //   rowsPerPage,
  // ]);

  useEffect(() => {
    if (
      userActivityParams?.department ||
      userActivityParams?.dateRange ||
      userActivityParams?.division ||
      userActivityParams?.role ||
      userActivityParams?.status
    ) {
      loadUserActivity();
    }
  }, [userActivityParams]);

  const handleChangePage = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    setPage(newPage - 1);
  };

  const handleChangeRowsPerPage = (event: SelectChangeEvent<string>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    setUserActivityParams({
      ...userActivityParams,
      department: event.target.value,
    });
  };

  const handleDivisionChange = (event: SelectChangeEvent<string>) => {
    setUserActivityParams({
      ...userActivityParams,
      division: event.target.value,
    });
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setUserActivityParams({
      ...userActivityParams,
      role: event.target.value,
    });
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setUserActivityParams({
      ...userActivityParams,
      status: event.target.value,
    });
  };

  const handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    setTimeframe(event.target.value);
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
        <Stack spacing={4} sx={{ py: 4 }}>
          {/* Header */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              sx={{ fontSize: 18 }}
              variant="h4"
              fontWeight="semibold"
              color="#000000CC"
            >
              Simulator Platform Stats
            </Typography>

            <DateSelector
              dateRange={dateRange}
              setDateRange={setDateRange}
              handleDateRangeApplyCallback={handleDateRangeApplyCallback}
            />
          </Stack>

          {/* First row of stats */}

          {dashboardStats ? (
            <Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="New Users Onboarded"
                    total={dashboardStats?.new_users.total_users}
                    breakdown={dashboardStats?.new_users.breakdown}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="Active Users"
                    total={dashboardStats?.active_users.total_users}
                    breakdown={dashboardStats?.active_users.breakdown}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="Deactivated Users"
                    total={dashboardStats?.deactivated_users.total_users}
                    breakdown={dashboardStats?.deactivated_users.total_users}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <></>
          )}

          {/* Second row of stats */}
          {dashboardStats ? (
            <Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="Daily Active Users (DAU)"
                    total={dashboardStats?.daily_active_users.total_users}
                    breakdown={dashboardStats?.daily_active_users.breakdown}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="Weekly Active Users (WAU)"
                    total={dashboardStats?.weekly_active_users.total_users}
                    breakdown={dashboardStats?.weekly_active_users.breakdown}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <UserStatsCard
                    title="Monthly Active Users (MAU)"
                    total={dashboardStats?.monthly_active_users.total_users}
                    breakdown={dashboardStats?.monthly_active_users.breakdown}
                    icon={<InfoIcon />}
                    popupText="On time completed test Sim / Total no. of test sims completed"
                  />
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <></>
          )}

          {/* User Status and Activity Log */}
          <Typography
            sx={{ fontSize: 18 }}
            variant="h5"
            fontWeight="semibold"
            color="#000000CC"
          >
            User Status and Activity Log
          </Typography>

          <Stack>
            {/* Search and Filters */}
            <Stack
              direction={{
                sm: "column",
                md: "row",
              }}
              gap={2}
              bgcolor="#F9FAFB"
              borderRadius={1.5}
              p={1.5}
              justifyContent="space-between"
            >
              <TextField
                placeholder="Search by Assignment Name or ID"
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
                  value={department}
                  onChange={handleDepartmentChange}
                  displayEmpty
                  IconComponent={ExpandMore}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Department">
                    All Department
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Engineering">
                    Engineering
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Product">
                    Product
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Design">
                    Design
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Operations">
                    Operations
                  </MenuItem>
                </Select>

                <Select
                  value={division}
                  onChange={handleDivisionChange}
                  displayEmpty
                  IconComponent={ExpandMore}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Divisions">
                    All Divisions
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="EverAI Labs">
                    EverAI Labs
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Product Development">
                    Product Development
                  </MenuItem>
                </Select>

                <Select
                  value={role}
                  onChange={handleRoleChange}
                  displayEmpty
                  IconComponent={ExpandMore}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Roles">
                    All Roles
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Admin">
                    Admin
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Manager">
                    Manager
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Designer">
                    Designer
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Trainee">
                    Trainee
                  </MenuItem>
                </Select>

                <Select
                  value={status}
                  onChange={handleStatusChange}
                  displayEmpty
                  IconComponent={ExpandMore}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Status">
                    All Status
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Active">
                    Active
                  </MenuItem>
                  <MenuItem sx={menuItemSx} value="Inactive">
                    Inactive
                  </MenuItem>
                </Select>

                <DateSelector
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  handleDateRangeApplyCallback={handleDateRangeApplyCallback}
                />
              </Stack>
            </Stack>

            {/* User Activity Table */}
            <Stack sx={{ borderRadius: 2 }}>
              <TableContainer
                component={Paper}
                sx={{
                  border: "1px solid #0000001A",
                  borderTopLeftRadius: "16px",
                  borderTopRightRadius: "16px",
                  mt: 2,
                }}
                style={{ overflowX: "auto" }}
              >
                <Table style={{ minWidth: 6 * 550 }}>
                  <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                    <TableRow>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          fontSize: 14,
                          width: "150px",
                        }}
                      >
                        Name & Email
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Role
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Division & Department
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Added On
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Assigned Simulations
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Completetion Rate
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Adherence Rate
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Average Score
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Activated On
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Deactivated On
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Login Count
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Last Login Date
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1,
                          px: 2,
                          color: "#00000066",
                          width: "250px",
                        }}
                      >
                        Last Session Duration
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {userActivity.map(
                      (user: AdminDashboardUserActivityResponse) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <Stack>
                              <Typography
                                variant="body2"
                                color="#000000CC"
                                fontWeight="medium"
                              >
                                {user.name}
                              </Typography>
                              <Typography variant="caption" color="#00000099">
                                {user.email}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={user.role}
                              size="small"
                              sx={{
                                bgcolor: "#F2F4F7",
                                color: "#344054",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack>
                              <Typography variant="body2">
                                {user.division}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {user.department}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>{user.addedOn}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.status}
                              size="small"
                              sx={{
                                bgcolor:
                                  user.status === "ACTIVE"
                                    ? "#F2F4F7"
                                    : "#FEF3F2",
                                color:
                                  user.status === "ACTIVE"
                                    ? "#344054"
                                    : "#B42318",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell> {user.assignedSimulations}</TableCell>
                          <TableCell>
                            {" "}
                            <Chip
                              label={user.completionRate}
                              size="small"
                              sx={{
                                bgcolor: "#F2F4F7",
                                color: "#344054",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {" "}
                            <Chip
                              label={user.adherenceRate}
                              size="small"
                              sx={{
                                bgcolor: "#F2F4F7",
                                color: "#344054",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {" "}
                            <Chip
                              label={user.averageScore}
                              size="small"
                              sx={{
                                bgcolor: "#F2F4F7",
                                color: "#344054",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell>{user.activatedOn}</TableCell>
                          <TableCell>{user.deActivatedOn}</TableCell>
                          <TableCell>
                            <Chip
                              label={user.loginCount}
                              size="small"
                              sx={{
                                bgcolor: "#F2F4F7",
                                color: "#344054",
                                fontWeight: "medium",
                              }}
                            />
                          </TableCell>
                          <TableCell>{user.lastLoginOn}</TableCell>
                          <TableCell>{user.lastSessionDuration}</TableCell>
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TableContainer
                sx={{
                  border: "1px solid #0000001A",
                  borderBottomLeftRadius: "16px",
                  borderTop: "0px",
                  borderBottomRightRadius: "16px",
                }}
              >
                <Table>
                  <TableRow sx={{ bgcolor: "#F9FAFB" }}>
                    <TableCell
                      sx={{ py: 1, px: 2, color: "#00000099", fontWeight: 500 }}
                      colSpan={3}
                    >
                      Rows per page:
                      <Select
                        value={rowsPerPage.toString()}
                        onChange={handleChangeRowsPerPage}
                        displayEmpty
                        IconComponent={ExpandMore}
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

                    <TableCell colSpan={3} sx={{ py: 1, px: 2 }}>
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
                          {`${page * rowsPerPage + 1}-${Math.min(
                            (page + 1) * rowsPerPage,
                            userActivityData.total
                          )} of ${userActivityData.total}`}
                        </Typography>

                        <IconButton disabled={page === 0}>
                          <ChevronLeftIcon />
                        </IconButton>

                        <IconButton
                          disabled={
                            page >=
                            Math.ceil(userActivityData.total / rowsPerPage) - 1
                          }
                        >
                          <ChevronRightIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </Table>
              </TableContainer>
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default AdminDashboard;
