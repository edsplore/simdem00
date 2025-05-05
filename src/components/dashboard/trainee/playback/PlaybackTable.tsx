import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPlaybackRowData,
  FetchPlaybackRowDataResponse,
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

const simulationData: SimulationRecord[] = [
  {
    id: "1",
    trainingPlan: "New Training Plan 01",
    module: "Module_name_01",
    simId: "82840",
    simName: "Humana_MS_PCP Change",
    simType: "Visual-Audio",
    level: "Lvl 02",
    score: "56%",
    status: "Finished",
  },
  {
    id: "2",
    trainingPlan: "New Training Plan 01",
    module: "Module_name_01",
    simId: "82841",
    simName: "Humana_MS_PCP Change",
    simType: "Visual-Audio",
    level: "Lvl 02",
    score: "56%",
    status: "Finished",
  },
  {
    id: "3",
    trainingPlan: "New Training Plan 01",
    module: "Module_name_01",
    simId: "82842",
    simName: "Humana_MS_PCP Change",
    simType: "Visual-Audio",
    level: "Lvl 02",
    score: "56%",
    status: "Finished",
  },
  {
    id: "4",
    trainingPlan: "New Training Plan 01",
    module: "Module_name_01",
    simId: "82843",
    simName: "Humana_MS_PCP Change",
    simType: "Visual-Audio",
    level: "Lvl 02",
    score: "56%",
    status: "Finished",
  },
];

const PlaybackTable = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rowsPerPage, setRowsPerPage] = useState("50");
  const [playbackData, setPlaybackData] = useState<
    FetchPlaybackRowDataResponse[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleRowClick = (id: string) => {
    navigate(`/playback/${id}`);
  };

  useEffect(() => {
    const loadPlaybackData = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          // In a real implementation, we would fetch data from the API
          const data = await fetchPlaybackRowData({
            user_id: user.id,
          });
          setPlaybackData(data);
        } catch (error) {
          console.error("Error loading playback data:", error);
          setError("Failed to load playback data");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadPlaybackData();
  }, []);

  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <TextField placeholder="Search" size="small" sx={{ maxWidth: 300 }} />
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

        {playbackData?.map((playback: FetchPlaybackRowDataResponse) => (
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

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Rows per page:
          </Typography>
          <Select
            value={rowsPerPage}
            onChange={(e) => setRowsPerPage(e.target.value)}
            size="small"
            sx={{ minWidth: 80 }}
          >
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="20">20</MenuItem>
            <MenuItem value="50">50</MenuItem>
            <MenuItem value="100">100</MenuItem>
          </Select>
        </Stack>
        <Pagination count={10} shape="rounded" size="small" />
      </Stack>
    </Stack>
  );
};

export default PlaybackTable;
