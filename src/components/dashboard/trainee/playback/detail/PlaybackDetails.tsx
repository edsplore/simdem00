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
  CircularProgress,
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
import dayjs from "dayjs";

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
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const formattedCompletionDate = dayjs(props.playbackData.completedAt).format(
    "MMM D, YYYY"
  );
  const isPassed =
    props.playbackData.simAccuracyScore >= props.playbackData.minPassingScore;

  const handleViewInsights = async () => {
    if (!user?.id) return;

    setIsLoadingInsights(true);
    setInsightsError(null);
    try {
      // Get simulation ID from the attempt ID or use the ID directly
      const simulationId = props.playbackData.id.includes('-') 
        ? props.playbackData.id.split('-')[0] 
        : props.playbackData.id;

      // Convert simulation type to expected format (e.g., visual-audio to visual_audio)
      const simulationType = props.playbackData.type?.replace(/-/g, '_');

      const insightsData = await fetchPlaybackInsights({
        user_id: user.id,
        attempt_id: props.playbackData.id,
        simulation_id: simulationId,
        simulation_type: simulationType
      });

      setInsights(insightsData);
      setIsInsightsDialogOpen(true);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setInsightsError("Failed to load insights. Please try again.");
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          width: 480,
          borderRadius: 2,          
          height: 'calc(100vh - 130px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Scrollable Content Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            paddingBottom: '100px', // Space for fixed button
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
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

              <Box>
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
                          <Typography variant="body2">
                            {formattedCompletionDate}
                          </Typography>
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
                          {props.playbackData.type && (
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
                          )}

                          {props.playbackData.simLevel && (
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
                          )}
                        </Stack>
                      </Grid>
                      <Grid item xs={6}>
                        <Chip
                          label={props.playbackData.attemptType}
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
                <Label color="secondary">
                  Min Passing Score: {props.playbackData.minPassingScore}%
                </Label>
                <Label color={isPassed ? "success" : "error"}>
                  {isPassed ? "Passed" : "Failed"}
                </Label>
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
                    time={`${props.playbackData.finalScore}%`}
                    label="Sim Score"
                    icon={<SimIcon fontSize="small" />}
                  />
                  <CompletionTime
                    time={props.playbackData.timeTakenSeconds}
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
                      time={`${props.playbackData.confidence}%`}
                      label="Confidence"
                      icon={<VisibilityIcon fontSize="small" />}
                    />
                    <CompletionTime
                      time={`${props.playbackData.concentration}%`}
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
                      time={`${props.playbackData.energy}%`}
                      label="Energy"
                      icon={<PowerIcon fontSize="small" />}
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Stack>
        </Box>

        {/* Fixed Button Container */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e0e0e0',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Button
            variant="text"
            sx={{
              color: "#001EEE",
              p: 1,
              minWidth: "auto",
              width: "100%",
              textAlign: "center",
              display: "block",
              backgroundColor: "#F6F6FF",
              "&:hover": {
                backgroundColor: "#F6F6FF",
              },
              fontWeight: "bold",
              fontFamily: "Arial, sans-serif",
              textTransform: "none",
            }}
            onClick={handleViewInsights}
            disabled={isLoadingInsights}
          >
            {isLoadingInsights ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading Insights...
              </Box>
            ) : (
              "View Insights"
            )}
          </Button>

          {insightsError && (
            <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {insightsError}
            </Typography>
          )}
        </Box>
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