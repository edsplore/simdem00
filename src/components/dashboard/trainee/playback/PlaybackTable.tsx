import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Paper,
  TextField,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import {
  DataGridPremium,
  GridColDef,
  GridPaginationModel,
} from "@mui/x-data-grid-premium";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
import { useAuth } from "../../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../../utils/navigation";
import { mapLevelToCode } from "../../../../utils/simulation";

import {
  AttemptsResponse,
  fetchPlaybackRowData,
  FetchPlaybackRowDataPayload,
  FetchPlaybackRowDataResponse,
  PlaybackRowPaginationParams,
} from "../../../../services/playback";
import DateSelector from "../../../common/DateSelector";

const PlaybackTable = () => {
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const navigate = useNavigate();

  const [paginationParams, setPaginationParams] =
    useState<PlaybackRowPaginationParams>({
      page: 1,
      pagesize: 5,
    });
  const [playbackData, setPlaybackData] =
    useState<FetchPlaybackRowDataResponse | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange<Dayjs>>([
    dayjs().subtract(6, "day"),
    dayjs(),
  ]);
  const [simTypeFilter, setSimTypeFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const handleRowClick = (id: string) => {
    const path = buildPathWithWorkspace(
      `/playback/${id}`,
      currentWorkspaceId,
      currentTimeZone
    );
    navigate(path);
  };
  const handleDateRangeApplyCallback = (range: DateRange<Dayjs>) => {
    // state already updated, nothing extra to do
  };

  const isDateInRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return true;
    if (!dateRange[0] && !dateRange[1]) return true;

    const backendDate = dayjs.utc(dateStr);

    let startDateUTC = null as Dayjs | null;
    let endDateUTC = null as Dayjs | null;

    if (dateRange[0]) {
      startDateUTC = dateRange[0].utc().startOf("day");
    }

    if (dateRange[1]) {
      endDateUTC = dateRange[1].utc().endOf("day");
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

  const filteredData = useMemo(() => {
    if (!playbackData?.attempts) return [];
    const q = searchQuery.trim().toLowerCase();

    return playbackData.attempts.filter((row) => {
      if (q && !row.simName.toLowerCase().includes(q)) {
        return false;
      }
      if (
        simTypeFilter !== "all" &&
        row.simType.replace(/_/g, "-") !== simTypeFilter
      ) {
        return false;
      }
      if (
        levelFilter !== "all" &&
        mapLevelToCode(levelFilter) !== mapLevelToCode(row.simLevel)
      ) {
        return false;
      }
      if (!isDateInRange((row as any).completedAt)) {
        return false;
      }
      return true;
    });
  }, [playbackData, searchQuery, simTypeFilter, levelFilter, dateRange]);

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'trainingPlan',
        headerName: 'Training Plan',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'moduleName',
        headerName: 'Module',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'simName',
        headerName: 'Sim Name',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'simType',
        headerName: 'Sim Type',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'simLevel',
        headerName: 'Level',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'score',
        headerName: 'Sim Score',
        flex: 1,
        renderCell: (params) => (
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              fontWeight: 500,
              color:
                params.value >= 80
                  ? '#22c55e'
                  : params.value >= 60
                  ? '#f59e0b'
                  : '#ef4444',
            }}
          >
            {params.value}%
          </Typography>
        ),
      },
      {
        field: 'estTime',
        headerName: 'Est. Time',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'dueDate',
        headerName: 'Due Date',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'attemptType',
        headerName: 'Attempt Type',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'attemptNumber',
        headerName: 'Attempt Number',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'timeTaken',
        headerName: 'Time Taken',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'latestAttemptDate',
        headerName: 'Latest Attempt Date',
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    []
  );

  const loadPlaybackData = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);

        const pagination: PlaybackRowPaginationParams = {
          ...paginationParams,
          search: searchQuery.trim() || undefined,
        };

        if (simTypeFilter !== "all") {
          pagination.simType = simTypeFilter.replace(/-/g, "_");
        }

        if (levelFilter !== "all") {
          pagination.level = mapLevelToCode(levelFilter);
        }

        if (dateRange[0]) {
          pagination.createdFrom = dateRange[0]
            .utc()
            .startOf("day")
            .toISOString();
        }

        if (dateRange[1]) {
          pagination.createdTo = dateRange[1]
            .utc()
            .endOf("day")
            .toISOString();
        }

        const payload: FetchPlaybackRowDataPayload = {
          user_id: user.id,
          pagination,
        };

        const data = await fetchPlaybackRowData(payload);
        setPlaybackData(data);

        if (data.pagination) {
          setTotalCount(data.pagination.total_count);
          setTotalPages(data.pagination.total_pages);
        }
      } catch (error) {
        console.error("Error loading playback data:", error);
        setError("Failed to load playback data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPlaybackData();
  }, [user?.id, paginationParams, simTypeFilter, levelFilter, dateRange]);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <TextField
          placeholder="Search"
          size="small"
          sx={{ maxWidth: 300 }}
          value={searchQuery}
          onKeyDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            const value = e.target.value;
            setSearchQuery(value);
            setPaginationParams((prevState) => ({
              ...prevState,
              search: value,
              page: 1,
            }));
          }}
        />
        <Stack direction="row" spacing={2}>
          <DateSelector
            dateRange={dateRange}
            setDateRange={setDateRange}
            handleDateRangeApplyCallback={handleDateRangeApplyCallback}
            variant="managerGlobal"
          />
          <Select
            value={simTypeFilter}
            onChange={(e) => setSimTypeFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 160, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="audio">Audio</MenuItem>
            <MenuItem value="visual-audio">Visual Audio</MenuItem>
            <MenuItem value="chat">Chat</MenuItem>
            <MenuItem value="visual-chat">Visual Chat</MenuItem>
            <MenuItem value="visual">Visual Only</MenuItem>
          </Select>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            size="small"
            sx={{ minWidth: 120, bgcolor: "background.paper" }}
          >
            <MenuItem value="all">All Levels</MenuItem>
            <MenuItem value="1">Level 01</MenuItem>
            <MenuItem value="2">Level 02</MenuItem>
            <MenuItem value="3">Level 03</MenuItem>
          </Select>
        </Stack>
      </Stack>

      <Paper
        sx={{
          boxShadow: 'none',
          border: '1px solid',
          borderColor: 'divider',
          height: 500,
        }}
      >
        <DataGridPremium
          rows={filteredData}
          columns={columns}
          getRowId={(row) => row.id}
          loading={isLoading}
          pagination
          paginationMode="server"
          rowCount={totalCount}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationModel={{
            page: paginationParams.page - 1,
            pageSize: paginationParams.pagesize,
          }}
          onPaginationModelChange={(model: GridPaginationModel) =>
            setPaginationParams((prevState) => ({
              ...prevState,
              page: model.page + 1,
              pagesize: model.pageSize,
            }))
          }
          onRowClick={(params) => handleRowClick(params.row.id)}
          sx={{
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: '#f8f9fa',
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: '#f0f0f0',
            },
          }}
        />
      </Paper>
    </Stack>
  );
};

export default PlaybackTable;