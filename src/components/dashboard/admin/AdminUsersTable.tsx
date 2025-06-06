import React, { useEffect, useState } from "react";
import {
  Stack,
  Paper,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  Button,
} from "@mui/material";
import {
  DataGridPremium,
  GridColDef,
  GridPaginationModel,
} from "@mui/x-data-grid-premium";
import {
  Search as SearchIcon,
  FileDownloadOutlined as FileDownloadOutlinedIcon,
  ExpandMore,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";
import { fetchDivisions, fetchDepartments } from "../../../services/suggestions";
import {
  AdminDashboardUserActivityResponse,
  fetchAdminUsersTable,
  AdminUsersTableRequest,
} from "../../../services/admin";
import { fetchRoles } from "../../../services/roles";
import { DateRange } from "@mui/x-date-pickers-pro";
import dayjs, { Dayjs } from "dayjs";
import DateSelector from "../../common/DateSelector";

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

const AdminUsersTable = () => {
  const { currentWorkspaceId } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("All Department");
  const [division, setDivision] = useState("All Divisions");
  const [role, setRole] = useState("All Roles");
  const [status, setStatus] = useState("All Status");
  const [departments, setDepartments] = useState<string[]>([]);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [rolesList, setRolesList] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([null, null]);
  const [userActivity, setUserActivity] = useState<AdminDashboardUserActivityResponse[]>([]);
  const [userActivityData, setUserActivityData] = useState({ users: [] as AdminDashboardUserActivityResponse[], total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const handleUserDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    setDateRange(range);
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
          <span style={{ fontWeight: 500 }}>{params.row.name}</span>
          <span style={{ fontSize: 12 }}>{params.row.email}</span>
        </Stack>
      ),
      sortable: false,
    },
    {
      field: "role",
      headerName: "Role",
      flex: 0.5,
      minWidth: 120,
    },
    {
      field: "divisionDepartment",
      headerName: "Division & Department",
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Stack>
          <span>{params.row.division}</span>
          <span style={{ fontSize: 12, color: "#666" }}>{params.row.department}</span>
        </Stack>
      ),
      sortable: false,
    },
    { field: "addedOn", headerName: "Added On", flex: 0.6, minWidth: 120 },
    { field: "status", headerName: "Status", flex: 0.5, minWidth: 120 },
    { field: "assignedSimulations", headerName: "Assigned Simulations", flex: 0.7, minWidth: 150 },
    { field: "completionRate", headerName: "Completion Rate", flex: 0.6, minWidth: 150 },
    { field: "adherenceRate", headerName: "Adherence Rate", flex: 0.6, minWidth: 150 },
    { field: "averageScore", headerName: "Average Score", flex: 0.6, minWidth: 150 },
    { field: "activatedOn", headerName: "Activated On", flex: 0.6, minWidth: 150 },
    { field: "deActivatedOn", headerName: "Deactivated On", flex: 0.7, minWidth: 150 },
    { field: "loginCount", headerName: "Login Count", flex: 0.5, minWidth: 120 },
    { field: "lastLoginOn", headerName: "Last Login Date", flex: 0.7, minWidth: 150 },
    { field: "lastSessionDuration", headerName: "Last Session Duration", flex: 0.7, minWidth: 170 },
  ];

  const loadUserActivity = async () => {
    try {
      setIsLoading(true);
      const payload: AdminUsersTableRequest = {
        page,
        limit: rowsPerPage,
        search: searchQuery || undefined,
        division: division !== "All Divisions" ? division : undefined,
        department: department !== "All Department" ? department : undefined,
        role: role !== "All Roles" ? role : undefined,
        status: status !== "All Status" ? status.toUpperCase() : undefined,
        start_time: dateRange[0] ? dateRange[0].toISOString() : undefined,
        end_time: dateRange[1] ? dateRange[1].toISOString() : undefined,
      };
      const data = await fetchAdminUsersTable(payload);
      setUserActivity(data.items);
      setUserActivityData({ users: data.items, total: data.total_count });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUserActivity();
  }, [searchQuery, page, rowsPerPage, division, department, role, status, dateRange]);

  useEffect(() => {
    if (!currentWorkspaceId) return;
    const loadData = async () => {
      try {
        const [divs, depts, roles] = await Promise.all([
          fetchDivisions(currentWorkspaceId),
          fetchDepartments(currentWorkspaceId),
          fetchRoles(),
        ]);
        setDivisions(divs);
        setDepartments(depts);
        setRolesList(roles.map((r) => r.name));
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      }
    };
    loadData();
  }, [currentWorkspaceId]);

  return (
    <Stack>
      <Stack
        direction={{ sm: "column", md: "row" }}
        gap={2}
        bgcolor="#F9FAFB"
        borderRadius={1.5}
        p={1.5}
        justifyContent="space-between"
      >
        <TextField
          placeholder="Search by Assignment Name or ID"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchQuery(searchInput);
              setPage(0);
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

        <Stack direction={{ sm: "column", md: "row" }} gap={2}>
          <Select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(0);
            }}
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
            onChange={(e) => {
              setDivision(e.target.value);
              setPage(0);
            }}
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
            onChange={(e) => {
              setRole(e.target.value);
              setPage(0);
            }}
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
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
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
  );
};

export default AdminUsersTable;
