import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Paper,
  TextField,
  Typography,
  Chip,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  TablePagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DateRange } from "@mui/x-date-pickers-pro/models";
import dayjs, { Dayjs } from "dayjs";
import { useAuth } from "../../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../../utils/navigation";
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
      if (simTypeFilter !== "all" && row.simType !== simTypeFilter) {
        return false;
      }
      if (levelFilter !== "all" && row.simLevel !== levelFilter) {
        return false;
      }
      if (!isDateInRange((row as any).completedAt)) {
        return false;
      }
      return true;
    });
  }, [playbackData, searchQuery, simTypeFilter, levelFilter, dateRange]);

  const loadPlaybackData = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);

        const payload: FetchPlaybackRowDataPayload = { user_id: user.id };

        if (paginationParams) {
          payload["pagination"] = paginationParams;
        }

        // In a real implementation, we would fetch data from the API
        const data = await fetchPlaybackRowData(payload);
        setPlaybackData(data);
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
  }, [user?.id, paginationParams]);

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

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ width: 200 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Training Plan & Module
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 250 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sim Name
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 150 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Sim Type
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Attempt Type
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 80 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Level
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 80 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Score
                </Typography>
              </TableCell>
              <TableCell sx={{ width: 120 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((playback: AttemptsResponse) => (
                <TableRow
                  key={playback.id}
                  hover
                  onClick={() => handleRowClick(playback.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Stack>
                      <Typography variant="body2" fontWeight="medium">
                        {playback.trainingPlan}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {playback.moduleName}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{playback.simName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={playback.simType}
                      size="small"
                      sx={{ bgcolor: "purple.50", color: "purple.main" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{playback.attemptType}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{playback.simLevel}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={
                        playback.score >= 80
                          ? "success.main"
                          : playback.score >= 60
                          ? "warning.main"
                          : "error.main"
                      }
                    >
                      {playback.score}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={playback.status}
                      size="small"
                      sx={{ bgcolor: "success.50", color: "success.main" }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredData.length}
        page={paginationParams.page - 1}
        onPageChange={(_: unknown, newPage: number) =>
          setPaginationParams((prevState) => ({
            ...prevState,
            page: newPage + 1,
          }))
        }
        rowsPerPage={paginationParams.pagesize}
        onRowsPerPageChange={(e) =>
          setPaginationParams((prevState) => ({
            ...prevState,
            pagesize: Number(e.target.value),
          }))
        }
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Stack>
  );
};

export default PlaybackTable;
