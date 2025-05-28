import React, { useState } from "react";
import {
  Stack,
  Card,
  IconButton,
  Typography,
  Divider,
  Button,
  Chip,
  Grid,
  Box,
  Paper,
} from "@mui/material";
import SimIcon from "@mui/icons-material/SimCard";
import TimerIcon from "@mui/icons-material/AccessTime";
import MouseIcon from "@mui/icons-material/Mouse";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import PowerIcon from "@mui/icons-material/Power";
import PsychologyIcon from "@mui/icons-material/Psychology";

import CompletionTime from "./ScoreDetailsCard";
import Label from "../../../../common/StatusLabel";
import { 
  FetchPlaybackByIdRowDataResponse, 
  fetchPlaybackInsights, 
  FetchPlaybackInsightsResponse 
} from "../../../../../services/playback";
import InsightsDialog from "./InsightsDialog";
import { useAuth } from "../../../../../context/AuthContext";

interface PlaybackDetailsProps {
  playbackData: FetchPlaybackByIdRowDataResponse;
}
const PlaybackDetails = (props: PlaybackDetailsProps) => {
  const { user } = useAuth();
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);
  const [insights, setInsights] = useState<FetchPlaybackInsightsResponse | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  const handleViewInsights = async () => {
    if (!user?.id) return;

    setIsLoadingInsights(true);
    try {
      const insightsData = await fetchPlaybackInsights({
        user_id: user.id,
        attempt_id: props.playbackData.id,
        simulation_id: props.playbackData.id.split('-')[0], // Extracting simulation ID from attempt ID
        simulation_type: props.playbackData.type
      });

      setInsights(insightsData);
      setIsInsightsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          width: 480,
          p: 2,
          borderRadius: 2,
          maxHeight: "620px",
          overflowY: "auto",
          paddingRight: "8px",
          "&::-webkit-scrollbar": {
            display: "none", // Hide the scrollbar
          },
          scrollbarWidth: "none", // For Firefox
        }}
      >
        <Stack spacing={3}>
          {/* Simulation Details Section */}
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <Typography variant="h6">Simulation Details</Typography>
              <IconButton size="small">
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Stack>

            <Box sx={{ maxHeight: "350px", overflowY: "auto" }}>
              <Stack
                spacing={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                {/* Headers */}
                <Grid
                  container
                  sx={{
                    p: 1.5,
                    bgcolor: "#F9FAFB",
                  }}
                >
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontSize: "12px", color: "text.secondary" }}
                    >
                      Sim Name & ID
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontSize: "12px", color: "text.secondary" }}
                    >
                      Completion Date
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                {/* Data Row */}
                <Box>
                  <Grid container sx={{ p: 1.5 }}>
                    <Grid item xs={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">
                          {props.playbackData.name}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "12px", color: "text.secondary" }}
                        >
                          {props.playbackData.id}
                        </Typography>
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">Dec 20, 2024</Typography>
                        <Typography
                          sx={{ fontSize: "12px", color: "text.secondary" }}
                        >
                          {props.playbackData.completedAt}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Second Headers */}
                <Grid
                  container
                  sx={{
                    p: 1.5,
                    bgcolor: "#F9FAFB",
                  }}
                >
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontSize: "12px", color: "text.secondary" }}
                    >
                      Sim Type
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography
                      sx={{ fontSize: "12px", color: "text.secondary" }}
                    >
                      Attempt Type
                    </Typography>
                  </Grid>
                </Grid>

                <Divider />

                {/* Second Data Row */}
                <Box>
                  <Grid container sx={{ p: 1.5 }}>
                    <Grid item xs={6}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {props.playbackData.type ? (
                          <Chip
                            label={props.playbackData.type}
                            size="small"
                            sx={{
                              bgcolor: "grey.200",
                              height: 24,
                              "& .MuiChip-label": {
                                px: 1,
                                fontSize: "14px",
                              },
                            }}
                          />
                        ) : (
                          <></>
                        )}

                        {props.playbackData.simLevel ? (
                          <Chip
                            label={props.playbackData.simLevel}
                            size="small"
                            sx={{
                              bgcolor: "grey.200",
                              height: 24,
                              "& .MuiChip-label": {
                                px: 1,
                                fontSize: "14px",
                              },
                            }}
                          />
                        ) : (
                          <></>
                        )}
                      </Stack>
                    </Grid>
                    <Grid item xs={6}>
                      <Chip
                        label="Test"
                        size="small"
                        sx={{
                          bgcolor: "grey.200",
                          height: 24,
                          "& .MuiChip-label": {
                            px: 1,
                            fontSize: "14px",
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Box>
          </Stack>

          <Divider />

          {/* Score Details Section */}
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h6">Score Details</Typography>
              <Label color="secondary">Min Passing Score: 86%</Label>
              <Label color="success">Passed</Label>
            </Stack>
            <Divider />

            <Paper
              elevation={1}
              sx={{
                padding: 2,
                borderRadius: "8px",
              }}
            >
              <Stack
                direction="row"
                spacing={4}
                alignItems="center"
                justifyContent="space-between"
              >
                <CompletionTime
                  time="86%"
                  label="Sim Score"
                  icon={<SimIcon fontSize="small" />}
                />
                <CompletionTime
                  time="26m 54s"
                  label="Completion Time"
                  icon={<TimerIcon fontSize="small" />}
                />
              </Stack>
            </Paper>

            <Paper
              elevation={1}
              sx={{
                padding: 2,
                borderRadius: "8px",
              }}
            >
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  spacing={4}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <CompletionTime
                    time={`${props.playbackData.clickScore.toFixed(2)}%`}
                    label="Click Score"
                    icon={<MouseIcon fontSize="small" />}
                  />
                  <CompletionTime
                    time={`${props.playbackData.keywordScore}%`}
                    label="Keyword Score"
                    icon={<TextFieldsIcon fontSize="small" />}
                  />
                </Stack>
                <Stack
                  direction="row"
                  spacing={4}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <CompletionTime
                    time={`${props.playbackData.textFieldKeywordScore}%`}
                    label="Text Field Keyword Score"
                    icon={<TextFieldsIcon fontSize="small" />}
                  />
                  <CompletionTime
                    time={`${props.playbackData.simAccuracyScore}%`}
                    label="Sim Accuracy Score"
                    icon={<CheckCircleIcon fontSize="small" />}
                  />
                </Stack>
              </Stack>
            </Paper>

            <Paper
              elevation={3}
              sx={{
                padding: 2,
                borderRadius: "8px",
              }}
            >
              <Stack spacing={1}>
                <Stack
                  direction="row"
                  spacing={4}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <CompletionTime
                    time="High"
                    label="Confidence"
                    icon={<VisibilityIcon fontSize="small" />}
                  />
                  <CompletionTime
                    time="High"
                    label="Concentration"
                    icon={<PsychologyIcon fontSize="small" />}
                  />
                </Stack>
                <Stack
                  direction="row"
                  spacing={4}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <CompletionTime
                    time="High"
                    label="Energy"
                    icon={<PowerIcon fontSize="small" />}
                  />
                </Stack>
              </Stack>
            </Paper>
          </Stack>

          {/* View Insights Button */}
          <Button
            variant="text"
            sx={{
              color: "#001EEE",
              p: 1,
              minWidth: "auto",
              width: "100%", // Full width
              textAlign: "center", // Center the button
              display: "block", // Block level element
              mt: 2, // Optional: space from content above
              backgroundColor: "#F6F6FF", // Set background color
              "&:hover": {
                backgroundColor: "#F6F6FF", // Keep the same background color on hover
              },
              fontWeight: "bold", // Ensure normal font weight
              fontFamily: "Arial, sans-serif", // Use a specific font family
              textTransform: "none", // Prevent uppercase text
            }}
            onClick={handleViewInsights}
            disabled={isLoadingInsights}
          >
            {isLoadingInsights ? "Loading Insights..." : "View Insights"}
          </Button>
        </Stack>
      </Card>

      {/* Insights Dialog */}
      <InsightsDialog
        open={isInsightsDialogOpen}
        onClose={() => setIsInsightsDialogOpen(false)}
        insights={insights}
        isLoading={isLoadingInsights}
      />
    </>
  );
};

export default PlaybackDetails;