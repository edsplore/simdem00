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
  Button,
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
  SelectChangeEvent,
  Tooltip,
  circularProgressClasses,
  TableFooter,
} from "@mui/material";
import { lighten } from "@mui/material/styles";
import {
  Search as SearchIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore,
  InfoOutlined,
} from "@mui/icons-material";
import DashboardContent from "../DashboardContent";
import { useAuth } from "../../../context/AuthContext";
import { fetchDivisions, fetchDepartments } from "../../../services/suggestions";
import {
  AdminDashboardUserActivityResponse,
  AdminDashboardUserStatsResponse,
  UserStat,
  RoleCount,
  fetchAdminDashboardStats,
  fetchAdminUsersTable,
  AdminUsersTableRequest,
} from "../../../services/admin";
import { fetchRoles } from "../../../services/roles";
import { DateRange } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import DateSelector from "../../common/DateSelector";
import { LineChart } from "@mui/x-charts";
import {
  fetchActiveUserMetricsHistory,
  ActiveUserMetricsHistoryItem,
} from "../../../services/metrics";
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
    activationPendingUsers: {
      total: 120,
      breakdown: {
        admin: 1,
        manager: 10,
        designer: 5,
        trainees: 104,
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
interface UserStatsCardProps {
  title: string;
  total: number;
  breakdown: RoleCount[];
  icon?: React.ReactNode;
  popupText?: string;
  size?: number;
  thickness?: number;
}

const BASE_COLOR = "#375CE5";
const TRACK_COLOR = lighten(BASE_COLOR, 0.85);

const generateRoleColors = (count: number): string[] => {
  if (count <= 0) return [];

  const baseHue = 227; // hue for BASE_COLOR (#375CE5)
  const saturation = 70;
  const lightness = 55;

  return Array.from({ length: count }, (_, idx) => {
    const hue = (baseHue + (idx * 360) / count) % 360;
    return `hsl(${hue}deg ${saturation}% ${lightness}%)`;
  });
};

// Tooltip text for the KPI cards
const TOOLTIP_NEW_USERS =
  "Total new users onboarded to this workspace. Breakdown shows counts by role.";
const TOOLTIP_PENDING_USERS =
  "Invited users pending activation. Breakdown shows counts by role.";
const TOOLTIP_ACTIVE_USERS =
  "Currently active user accounts. Breakdown shows counts by role.";
const TOOLTIP_DEACTIVATED_USERS =
  "Users whose accounts are deactivated. Breakdown shows counts by role.";

const UserStatsCard = ({
  title,
  total,
  breakdown,
  icon,
  popupText,
  size = 140,
  thickness = 3,
}: UserStatsCardProps) => {
  const roleColors = React.useMemo(
    () => generateRoleColors(breakdown.length),
    [breakdown.length],
  );

  // Calculate cumulative percentages for proper circular progress display
  let cumulativePercentage = 0;
  const progressData = breakdown.map((item, idx) => {
    const percentage = total ? (item.count / total) * 100 : 0;
    const startPercentage = cumulativePercentage;
    cumulativePercentage += percentage;
    return { ...item, percentage, startPercentage, color: roleColors[idx] };
  });

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 2,
        background:
          "linear-gradient(white, white) padding-box, linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0) 100%) border-box",
        border: "1px solid transparent",
        boxShadow: "0px 12px 24px -4px #919EAB1F",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" sx={{ fontSize: 16 }}>{title}</Typography>
        <InfoIconPopup title={popupText} />
      </Stack>

      <Stack spacing={3} alignItems="center" flex={1}>
        {/* Circular Progress */}
        <Box sx={{ position: "relative", display: "inline-flex" }}>
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            thickness={thickness}
            sx={{ color: TRACK_COLOR }}
          />
          {progressData.map((item, idx) => (
            <CircularProgress
              key={`${item.role}-${idx}`}
              variant="determinate"
              value={item.percentage}
              size={size}
              thickness={thickness}
              sx={{
                color: item.color,
                position: "absolute",
                left: 0,
                transform: `rotate(${item.startPercentage * 3.6}deg)`,
                transformOrigin: "center",
              }}
            />
          ))}
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
            <Typography variant="h4" fontWeight="bold">
              {total.toLocaleString()}
            </Typography>
          </Box>
        </Box>

        {/* Role Breakdown in 2 columns with gray background */}
        <Box
          sx={{
            width: "100%",
            bgcolor: "#F9FAFB",
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Grid container spacing={1.5}>
            {breakdown.map((item, idx) => (
              <Grid item xs={6} key={`${item.role}-breakdown-${idx}`}>
                <Stack
                  alignItems="flex-start"
                  spacing={0.5}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 8,
                      borderRadius: "25px",
                      bgcolor: progressData[idx].color,
                    }}
                  />
                  <Typography
                    color="#000000CC"
                    fontSize={13}
                    fontWeight={500}
                    variant="body2"
                    sx={{ lineHeight: 1.2 }}
                  >
                    {item.count} {item.role}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Stack>
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

const mergeRoleBreakdown = (
  breakdown: RoleCount[] = [],
  roles: string[] = [],
): RoleCount[] => {
  const roleMap = new Map(breakdown.map((b) => [b.role, b.count]));
  return roles.map((r) => ({ role: r, count: roleMap.get(r) ?? 0 }));
};

const AdminDashboard = () => {
  const { user, currentWorkspaceId } = useAuth();
  const [dashboardData, setDashboardData] = useState(adminDashboardData);
  const [dashboardStats, setDashboardStats] =
    useState<AdminDashboardUserStatsResponse | null>(null);
  const [userActivity, setUserActivity] = useState<
    AdminDashboardUserActivityResponse[]
  >([]);

  const [userActivityParams, setUserActivityParams] =
    useState<AdminUsersTableRequest>({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("All Department");
  const [division, setDivision] = useState("All Divisions");
  const [departments, setDepartments] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [rolesList, setRolesList] = useState<string[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [timeframe, setTimeframe] = useState("All Time");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);

  const [engagementDateRange, setEngagementDateRange] = useState<DateRange<Dayjs>>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);
  const [engagementRole, setEngagementRole] = useState("All Roles");

  const [userEngagementData, setUserEngagementData] = useState<
    ActiveUserMetricsHistoryItem[]
  >([]);

  const [userActivityData, setUserActivityData] = useState({
    users: adminDashboardData.userActivity,
    total: adminDashboardData.totalUsers,
  });

  const engagementDataFiltered = userEngagementData;

  const handleEngagementDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    setEngagementDateRange(range);
  };

  const handleUserDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    setDateRange(range);
    setUserActivityParams({
      ...userActivityParams,
      start_time: range[0] ? range[0].toISOString() : undefined,
      end_time: range[1] ? range[1].toISOString() : undefined,
    });
    setPage(0);
  };

  const loadUserActivity = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const payload: AdminUsersTableRequest = {
        page: page + 1,
        limit: 5,
        search: searchQuery || undefined,
        division: division !== "All Divisions" ? division : undefined,
        department: department !== "All Department" ? department : undefined,
        role: role !== "All Roles" ? role : undefined,
        status: status !== "All Status" ? status.toUpperCase() : undefined,
        start_time: userActivityParams.start_time,
        end_time: userActivityParams.end_time     
      };

      const data = await fetchAdminUsersTable(payload);
      setUserActivity(data.items);
      setUserActivityData({ users: data.items, total: data.total_count });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminDashboardStats = async () => {
    if (currentWorkspaceId) {
      try {
        setIsLoading(true);
        setError(null);
        const [stats, roles] = await Promise.all([
          fetchAdminDashboardStats(currentWorkspaceId),
          fetchRoles(),
        ]);
        const roleNames = roles.map((r) => r.name);
        setRolesList(roleNames);

        const augment = (s: UserStat) => ({
          ...s,
          role_breakdown: mergeRoleBreakdown(s.role_breakdown, roleNames),
        });

        setDashboardStats({
          new_users: augment(stats.new_users),
          activation_pending_users: augment(stats.activation_pending_users),
          active_users: augment(stats.active_users),
          deactivated_users: augment(stats.deactivated_users),
        });
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const loadUserEngagementMetrics = async () => {
    try {
      const days =
        engagementDateRange[0] && engagementDateRange[1]
          ? engagementDateRange[1].diff(engagementDateRange[0], "day") + 1
          : 30;
      const { metrics } = await fetchActiveUserMetricsHistory(days);
      const mapped = metrics.map((m) => ({
        date: dayjs(m.date).format("MM/DD"),
        daily: m.daily_active_users,
        weekly: m.weekly_active_users,
        monthly: m.monthly_active_users,
      }));
      setUserEngagementData(mapped);
    } catch (error) {
      console.error("Failed to load engagement metrics:", error);
    }
  };

  useEffect(() => {
    loadUserActivity();
    loadAdminDashboardStats();
    loadUserEngagementMetrics();
  }, [user?.id, currentWorkspaceId]);

  // Load divisions and departments when workspace changes
  useEffect(() => {
    if (!currentWorkspaceId) return;

    const loadDivisions = async () => {
      setIsLoadingDivisions(true);
      try {
        const data = await fetchDivisions(currentWorkspaceId);
        setDivisions(data);
      } catch (err) {
        console.error("Failed to load divisions:", err);
      } finally {
        setIsLoadingDivisions(false);
      }
    };

    const loadDepartments = async () => {
      setIsLoadingDepartments(true);
      try {
        const data = await fetchDepartments(currentWorkspaceId);
        setDepartments(data);
      } catch (err) {
        console.error("Failed to load departments:", err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    loadDivisions();
    loadDepartments();
    // Roles are loaded as part of loadAdminDashboardStats
  }, [currentWorkspaceId]);

  useEffect(() => {
    loadUserEngagementMetrics();
  }, [engagementDateRange]);

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
    loadUserActivity();
  }, [userActivityParams, searchQuery, page, rowsPerPage]);

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
    setDepartment(event.target.value);
    setUserActivityParams({
      ...userActivityParams,
      department: event.target.value,
    });
    setPage(0);
  };

  const handleDivisionChange = (event: SelectChangeEvent<string>) => {
    setDivision(event.target.value);
    setUserActivityParams({
      ...userActivityParams,
      division: event.target.value,
    });
    setPage(0);
  };

  const handleRoleChange = (event: SelectChangeEvent<string>) => {
    setRole(event.target.value);
    setUserActivityParams({
      ...userActivityParams,
      role: event.target.value,
    });
    setPage(0);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setStatus(event.target.value);
    setUserActivityParams({
      ...userActivityParams,
      status: event.target.value,
    });
    setPage(0);
  };

  const handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    setTimeframe(event.target.value);
  };


  const handleEngagementRoleChange = (event: SelectChangeEvent<string>) => {
    setEngagementRole(event.target.value);
  };

  const handleExportCsv = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Division",
      "Department",
      "Added On",
      "Status",
      "Assigned Simulations",
      "Completion Rate",
      "Adherence Rate",
      "Average Score",
      "Activated On",
      "Deactivated On",
      "Login Count",
      "Last Login Date",
      "Last Session Duration",
    ];

    const csvRows = [headers.join(",")];
    userActivity.forEach((user) => {
      const row = [
        user.name,
        user.email,
        user.role,
        user.division,
        user.department,
        user.addedOn,
        user.status,
        user.assignedSimulations,
        user.completionRate,
        user.adherenceRate,
        user.averageScore,
        user.activatedOn,
        user.deActivatedOn,
        user.loginCount,
        user.lastLoginOn,
        user.lastSessionDuration,
      ].join(",");
      csvRows.push(row);
    });
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "user_activity.csv";
    link.click();
    URL.revokeObjectURL(url);
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

          </Stack>

          {/* First row of stats */}

          {dashboardStats ? (
            <Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <UserStatsCard
                    title="New Users Onboarded"
                    total={dashboardStats?.new_users?.total_count ?? 0}
                    breakdown={dashboardStats?.new_users?.role_breakdown ?? []}
                    icon={<InfoIcon />}
                    popupText={TOOLTIP_NEW_USERS}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <UserStatsCard
                    title="Activation Pending Users"
                    total={dashboardStats?.activation_pending_users?.total_count ?? 0}
                    breakdown={dashboardStats?.activation_pending_users?.role_breakdown ?? []}
                    icon={<InfoIcon />}
                    popupText={TOOLTIP_PENDING_USERS}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <UserStatsCard
                    title="Active Users"
                    total={dashboardStats?.active_users?.total_count ?? 0}
                    breakdown={dashboardStats?.active_users?.role_breakdown ?? []}
                    icon={<InfoIcon />}
                    popupText={TOOLTIP_ACTIVE_USERS}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <UserStatsCard
                    title="Deactivated Users"
                    total={dashboardStats?.deactivated_users?.total_count ?? 0}
                    breakdown={dashboardStats?.deactivated_users?.role_breakdown ?? []}
                    icon={<InfoIcon />}
                    popupText={TOOLTIP_DEACTIVATED_USERS}
                  />
                </Grid>
              </Grid>
            </Stack>
          ) : (
            <></>
          )}

          {/* User Engagement Graph */}
          <Stack spacing={2}>
            <Stack direction={{ sm: "column", md: "row" }} justifyContent="space-between" alignItems={{ sm: "flex-start", md: "center" }}>
              <Typography variant="h5" sx={{ fontSize: 18 }} color="#000000CC" fontWeight="semibold">
                User Engagement
              </Typography>
              <Stack direction={{ sm: "column", md: "row" }} spacing={2}>
                <DateSelector
                  dateRange={engagementDateRange}
                  setDateRange={setEngagementDateRange}
                  handleDateRangeApplyCallback={handleEngagementDateRangeApplyCallback}
                  variant="managerGlobal"
                />
                <Select
                  value={engagementRole}
                  onChange={handleEngagementRoleChange}
                  displayEmpty
                  IconComponent={ExpandMore}
                  MenuProps={menuSelectProps}
                  sx={menuSelectsx}
                  size="small"
                >
                  <MenuItem sx={menuItemSx} value="All Roles">
                    All Roles
                  </MenuItem>
                  {rolesList.map((r) => (
                    <MenuItem sx={menuItemSx} key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
            </Stack>
            <Box sx={{ width: "100%" }}>
              <LineChart
                dataset={engagementDataFiltered}
                xAxis={[{ scaleType: "point", dataKey: "date" }]}
                series={[
                  { dataKey: "daily", label: "DAU", color: "#375CE5" },
                  { dataKey: "weekly", label: "WAU", color: "#7891EB" },
                  { dataKey: "monthly", label: "MAU", color: "#C8D2F7" },
                ]}
                height={300}
              />
            </Box>
          </Stack>

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
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
                  {departments.map((dept) => (
                    <MenuItem sx={menuItemSx} key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
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
                  {divisions.map((div) => (
                    <MenuItem sx={menuItemSx} key={div} value={div}>
                      {div}
                    </MenuItem>
                  ))}
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
                  {rolesList.map((r) => (
                    <MenuItem sx={menuItemSx} key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
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
                  handleDateRangeApplyCallback={handleUserDateRangeApplyCallback}
                  variant="managerGlobal"
                />
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadOutlinedIcon />}
                  onClick={handleExportCsv}
                >
                  Export CSV
                </Button>
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
