import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Paper,
  TextField,
  Typography,
  Select,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
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
        width: 200,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: '#374151',
              fontWeight: 400
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'moduleName',
        headerName: 'Module',
        width: 150,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: '#374151',
              fontWeight: 400
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'simName',
        headerName: 'Sim Name',
        width: 250,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: '#374151',
              fontWeight: 400
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'simType',
        headerName: 'Sim Type',
        width: 130,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'simLevel',
        headerName: 'Level',
        width: 100,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'score',
        headerName: 'Sim Score',
        width: 120,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-block',
            border: '1px solid #FDE68A'
          }}>
            {params.value}%
          </div>
        ),
      },
      {
        field: 'estTime',
        headerName: 'Est. Time',
        width: 120,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'dueDate',
        headerName: 'Due Date',
        width: 150,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: '#374151',
              fontWeight: 400
            }}
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'attemptType',
        headerName: 'Attempt Type',
        width: 140,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'attemptNumber',
        headerName: 'Attempt Number',
        width: 150,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'timeTaken',
        headerName: 'Time Taken',
        width: 130,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <div style={{
            backgroundColor: '#F3F4F6',
            color: '#374151',
            padding: '4px 12px',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'inline-block',
            border: '1px solid #E5E7EB'
          }}>
            {params.value}
          </div>
        ),
      },
      {
        field: 'latestAttemptDate',
        headerName: 'Latest Attempt Date',
        width: 180,
        resizable: true,
        headerClassName: 'table-header',
        renderCell: (params) => (
          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '14px',
              color: '#374151',
              fontWeight: 400
            }}
          >
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
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <TextField
          placeholder="Search by ID or Name"
          size="small"
          sx={{ 
            width: 280,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              '& fieldset': {
                borderColor: '#D1D5DB',
              },
              '&:hover fieldset': {
                borderColor: '#9CA3AF',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#3B82F6',
                borderWidth: '1px',
              },
            },
            '& .MuiInputBase-input': {
              padding: '8px 12px',
              fontSize: '14px',
              color: '#374151',
            }
          }}
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
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#9CA3AF', fontSize: '20px' }} />
              </InputAdornment>
            ),
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
            displayEmpty
            sx={{ 
              minWidth: 140,
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D1D5DB',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#9CA3AF',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3B82F6',
                borderWidth: '1px',
              },
              '& .MuiSelect-select': {
                padding: '8px 12px',
                fontSize: '14px',
                color: '#374151',
              }
            }}
          >
            <MenuItem value="all">All Sim Type</MenuItem>
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
            displayEmpty
            sx={{ 
              minWidth: 120,
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              fontSize: '14px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#D1D5DB',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#9CA3AF',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#3B82F6',
                borderWidth: '1px',
              },
              '& .MuiSelect-select': {
                padding: '8px 12px',
                fontSize: '14px',
                color: '#374151',
              }
            }}
          >
            <MenuItem value="all">All levels</MenuItem>
            <MenuItem value="1">Level 01</MenuItem>
            <MenuItem value="2">Level 02</MenuItem>
            <MenuItem value="3">Level 03</MenuItem>
          </Select>
        </Stack>
      </Stack>

      <Paper
        sx={{
          boxShadow: 'none',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <DataGridPremium
          autoHeight
          rowHeight={68}
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
          scrollbarSize={8}
          sx={{
            border: 'none',
            width: '100%',
            '& .MuiDataGrid-main': {
              border: 'none',
            },
            '& .table-header': {
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #E5E7EB',
              fontSize: '14px',
              fontWeight: 500,
              color: '#6B7280',
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280',
              },
            },
            '& .MuiDataGrid-columnHeaders': {
              borderBottom: '1px solid #E5E7EB',
              minHeight: '56px !important',
              maxHeight: '56px !important',
            },
            '& .MuiDataGrid-columnHeader': {
              padding: '0 16px',
              '&:focus, &:focus-within': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #F3F4F6',
              padding: '12px 16px',
              fontSize: '14px',
              color: '#374151',
              minHeight: '68px !important',
              maxHeight: '68px !important',
              display: 'flex',
              alignItems: 'center',
              '&:focus, &:focus-within': {
                outline: 'none',
              },
            },
            '& .MuiDataGrid-row': {
              cursor: 'pointer',
              backgroundColor: '#ffffff',
              minHeight: '68px !important',
              maxHeight: '68px !important',
              '&:nth-of-type(even)': {
                backgroundColor: '#F9FAFB',
              },
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
              '&.Mui-selected': {
                backgroundColor: '#EBF8FF',
                '&:hover': {
                  backgroundColor: '#DBEAFE',
                },
              },
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid #E5E7EB',
              backgroundColor: '#ffffff',
              minHeight: '60px',
              '& .MuiTablePagination-root': {
                fontSize: '14px',
                color: '#6B7280',
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '14px',
                color: '#6B7280',
              },
            },
            '& .MuiDataGrid-selectedRowCount': {
              display: 'none',
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: '#ffffff',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#F3F4F6',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#D1D5DB',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: '#9CA3AF',
                },
              },
            },
            '& .MuiDataGrid-scrollbar--horizontal': {
              height: '8px',
            },
            '& .MuiDataGrid-scrollbar--vertical': {
              display: 'none',
            },
          }}
        />
      </Paper>
    </Stack>
  );
};

export default PlaybackTable;