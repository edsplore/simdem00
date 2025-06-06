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
  TableFooter,
} from "@mui/material";
import {
  DataGridPremium,
  GridColDef,
  GridPaginationModel,
} from "@mui/x-data-grid-premium";
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
import { LineChart, PieChart } from "@mui/x-charts";
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
}

const colors = ["#E3E8FB", "#C8D2F7", "#7891EB", "#375CE5", "#B3B8F6", "#8FA0F4"];

const addMissingRoles = (
  stats: AdminDashboardUserStatsResponse,
  roles: string[],
): AdminDashboardUserStatsResponse => {
  const ensure = (stat: UserStat): UserStat => {
    const map = new Map(stat.role_breakdown.map((r) => [r.role, r.count]));
    const breakdown = roles.map((r) => ({ role: r, count: map.get(r) ?? 0 }));
    return { ...stat, role_breakdown: breakdown };
  };

  return {
    new_users: ensure(stats.new_users),
    activation_pending_users: ensure(stats.activation_pending_users),
    active_users: ensure(stats.active_users),
    deactivated_users: ensure(stats.deactivated_users),
  };
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
}: UserStatsCardProps) => {
  const pieData = breakdown.map((item, idx) => ({
    id: idx,
    value: item.count,
    label: item.role,
    color: colors[(idx % (colors.length - 1)) + 1],
  }));

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
        <Box sx={{ position: "relative" }}>
          <PieChart
            series={[{
              data: pieData,
              innerRadius: size / 2 - 20,
              outerRadius: size / 2,
            }]}
            width={size}
            height={size}
            hideLegend
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
                      bgcolor: colors[(idx % (colors.length - 1)) + 1],
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
        const augmented = addMissingRoles(stats, roleNames);
        setDashboardStats(augmented);
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

    const loadRoles = async () => {
      try {
        const data = await fetchRoles();
        setRolesList(data.map((r) => r.name));
      } catch (err) {
        console.error("Failed to load roles:", err);
      }
    };

    loadDivisions();
    loadDepartments();
    loadRoles();
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

  const userColumns: GridColDef[] = [
    {
      field: "nameEmail",
      headerName: "Name & Email",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Stack>
          <Typography variant="body2" color="#000000CC" fontWeight="medium">
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="#00000099">
            {params.row.email}
          </Typography>
        </Stack>
      ),
      sortable: false,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F2F4F7", color: "#344054", fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "divisionDepartment",
      headerName: "Division & Department",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Stack>
          <Typography variant="body2">{params.row.division}</Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.department}
          </Typography>
        </Stack>
      ),
      sortable: false,
    },
    { field: "addedOn", headerName: "Added On", flex: 0.6, minWidth: 120 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            bgcolor:
              params.value === "ACTIVE" ? "#F2F4F7" : "#FEF3F2",
            color: params.value === "ACTIVE" ? "#344054" : "#B42318",
            fontWeight: "medium",
          }}
        />
      ),
    },
    {
      field: "assignedSimulations",
      headerName: "Assigned Simulations",
      flex: 0.7,
      minWidth: 150,
    },
    {
      field: "completionRate",
      headerName: "Completion Rate",
      flex: 0.6,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F2F4F7", color: "#344054", fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "adherenceRate",
      headerName: "Adherence Rate",
      flex: 0.6,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F2F4F7", color: "#344054", fontWeight: "medium" }}
        />
      ),
    },
    {
      field: "averageScore",
      headerName: "Average Score",
      flex: 0.6,
      minWidth: 150,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F2F4F7", color: "#344054", fontWeight: "medium" }}
        />
      ),
    },
    { field: "activatedOn", headerName: "Activated On", flex: 0.6, minWidth: 150 },
    { field: "deActivatedOn", headerName: "Deactivated On", flex: 0.7, minWidth: 150 },
    {
      field: "loginCount",
      headerName: "Login Count",
      flex: 0.5,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{ bgcolor: "#F2F4F7", color: "#344054", fontWeight: "medium" }}
        />
      ),
    },
    { field: "lastLoginOn", headerName: "Last Login Date", flex: 0.7, minWidth: 150 },
    {
      field: "lastSessionDuration",
      headerName: "Last Session Duration",
      flex: 0.7,
      minWidth: 170,
    },
  ];


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
            <Paper
              sx={{
                boxShadow: "none",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <DataGridPremium
                autoHeight
                rowHeight={68}
                rows={userActivity}
                columns={userColumns}
                getRowId={(row) => row.id}
                loading={isLoading}
                pagination
                paginationMode="server"
                rowCount={userActivityData.total}
                pageSizeOptions={[10, 25, 50, 100]}
                paginationModel={{ page, pageSize: rowsPerPage }}
                onPaginationModelChange={(model: GridPaginationModel) => {
                  setPage(model.page);
                  setRowsPerPage(model.pageSize);
                }}
                scrollbarSize={8}
                sx={{
                  border: "none",
                  width: "100%",
                  "& .MuiDataGrid-main": {
                    border: "none",
                  },
                  "& .table-header": {
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #E5E7EB",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#6B7280",
                    "& .MuiDataGrid-columnHeaderTitle": {
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#6B7280",
                    },
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    borderBottom: "1px solid #E5E7EB",
                    minHeight: "56px !important",
                    maxHeight: "56px !important",
                  },
                  "& .MuiDataGrid-columnHeader": {
                    padding: "0 16px",
                    "&:focus, &:focus-within": {
                      outline: "none",
                    },
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #F3F4F6",
                    padding: "12px 16px",
                    fontSize: "14px",
                    color: "#374151",
                    minHeight: "68px !important",
                    maxHeight: "68px !important",
                    display: "flex",
                    alignItems: "center",
                    "&:focus, &:focus-within": {
                      outline: "none",
                    },
                  },
                  "& .MuiDataGrid-row": {
                    backgroundColor: "#ffffff",
                    minHeight: "68px !important",
                    maxHeight: "68px !important",
                    "&:nth-of-type(even)": {
                      backgroundColor: "#F9FAFB",
                    },
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #E5E7EB",
                    backgroundColor: "#ffffff",
                    minHeight: "60px",
                  },
                  "& .MuiDataGrid-selectedRowCount": {
                    display: "none",
                  },
                }}
              />
            </Paper>
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default AdminDashboard
