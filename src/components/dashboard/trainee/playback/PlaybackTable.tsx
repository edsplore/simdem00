import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Grid,
  Paper,
  TextField,
  IconButton,
  Typography,
  Chip,
  Select,
  MenuItem,
  Pagination,
  Box,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import { useAuth } from "../../../../context/AuthContext";
import {
  AttemptsResponse,
  fetchPlaybackRowData,
  FetchPlaybackRowDataPayload,
  FetchPlaybackRowDataResponse,
  PlaybackRowPaginationParams,
} from "../../../../services/playback";

interface SimulationRecord {
  id: string;
  trainingPlan: string;
  module: string;
  simId: string;
  simName: string;
  simType: string;
  level: string;
  score: string;
  status: string;
}

const PlaybackTable = () => {
  const { user } = useAuth();
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
  const [error, setError] = useState<string | null>(null);
  const handleRowClick = (id: string) => {
    navigate(`/playback/${id}`);
  };
  const filteredData = useMemo(() => {
    if (!playbackData) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return playbackData;

    return playbackData.filter((row) =>
      row.trainingPlan.toLowerCase().includes(q)
    );
  }, [playbackData, searchQuery]);

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
          onChange={(e) =>
            setPaginationParams((prevState) => ({
              ...prevState,
              search: e.target.value,
            }))
          }
        />
        <Stack direction="row" spacing={1}>
          <IconButton>
            <FilterListIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <IconButton>
            <SortIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Stack>

      <Paper variant="outlined">
        <Grid container sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Grid item xs={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Training Plan & Module
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Sim ID
            </Typography>
          </Grid>
          <Grid item xs={3}>
            <Typography variant="subtitle2" color="text.secondary">
              Sim Name
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Sim Type
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Level
            </Typography>
          </Grid>
          <Grid item xs={1}>
            <Typography variant="subtitle2" color="text.secondary">
              Score
            </Typography>
          </Grid>
          <Grid item xs={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
          </Grid>
        </Grid>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <></>
        )}

        {playbackData?.attempts?.map((playback: AttemptsResponse) => (
          <Grid
            key={playback.id}
            container
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              "&:hover": {
                bgcolor: "action.hover",
                cursor: "pointer",
              },
            }}
            onClick={() => handleRowClick(playback.id)}
            alignItems="center"
          >
            <Grid item xs={2}>
              <Stack>
                <Typography variant="body2" fontWeight="medium">
                  {playback.trainingPlan}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {playback.moduleName}
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={1}>
              <Typography variant="body2">
                {playback.simId.substring(0, 5) + "..."}
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="body2">{playback.simName}</Typography>
            </Grid>
            <Grid item xs={2}>
              <Chip
                label={playback.simType}
                size="small"
                sx={{
                  bgcolor: "purple.50",
                  color: "purple.main",
                }}
              />
            </Grid>
            <Grid item xs={1}>
              <Typography variant="body2">{playback.simLevel}</Typography>
            </Grid>
            <Grid item xs={1}>
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
            </Grid>
            <Grid item xs={2}>
              <Chip
                label={playback.status}
                size="small"
                sx={{
                  bgcolor: "success.50",
                  color: "success.main",
                }}
              />
            </Grid>
          </Grid>
        ))}
      </Paper>

      <TablePagination
        component="div"
        count={playbackData?.total_attempts || 1000}
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
