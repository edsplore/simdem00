import React from "react";
import { Box, Typography, Button, Avatar, Chip, Paper } from "@mui/material";
import {
  AccessTime as AccessTimeIcon,
  SignalCellularAlt as SignalIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
  SmartToy as SmartToyIcon,
  PlayArrow as PlayArrowIcon,
} from "@mui/icons-material";

interface ScoresType {
  FinalScore: number;
  ContextualAccuracy?: number;
  KeywordScore?: number;
  ClickScore?: number;
  DataAccuracy?: number;
  Confidence?: number;
  Energy?: number;
  Concentration?: number;
  [key: string]: any; // For any additional scores
}

interface SimulationCompletionScreenProps {
  showCompletionScreen: boolean;
  userName: string;
  simulationName: string;
  level: string;
  simType: string;
  attemptType: string;
  scores: ScoresType | null;
  duration: number;
  isPassed: boolean;
  onBackToList: () => void;
  onGoToNextSim?: () => void;
  onRestartSim?: () => void;
  onViewPlayback?: () => void;
  hasNextSimulation?: boolean;
  minPassingScore: number;
}

const SimulationCompletionScreen: React.FC<SimulationCompletionScreenProps> = ({
  showCompletionScreen,
  userName,
  simulationName,
  level,
  simType,
  attemptType,
  scores,
  duration,
  isPassed,
  onBackToList,
  onGoToNextSim,
  onRestartSim,
  onViewPlayback,
  hasNextSimulation = false,
  minPassingScore,
}) => {
  // Format completion time as Xm Ys
  const formatCompletionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (!showCompletionScreen) {
    return null;
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f7fa",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "650px",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderBottom: "1px solid #eaedf0",
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              bgcolor: "#F0F3F5",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <Avatar sx={{ width: 40, height: 40, bgcolor: "transparent" }}>
              <SmartToyIcon sx={{ color: "#A3AED0" }} />
            </Avatar>
          </Box>
          <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
            Great work,
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {userName}
          </Typography>
        </Box>

        {/* Simulation details */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            p: 2,
            borderBottom: "1px solid #eaedf0",
          }}
        >
          <Chip
            label={simulationName}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#4A5568",
              bgcolor: "#f7fafc",
              border: "none",
              fontSize: "13px",
            }}
          />
          <Chip
            label={level}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#4A5568",
              bgcolor: "#f7fafc",
              border: "none",
              fontSize: "13px",
            }}
          />
          <Chip
            label={`Sim Type: ${simType}`}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#4A5568",
              bgcolor: "#f7fafc",
              border: "none",
              fontSize: "13px",
            }}
          />
          <Chip
            label={`${attemptType} Attempt`}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              color: "#4A5568",
              bgcolor: "#f7fafc",
              border: "none",
              fontSize: "13px",
            }}
          />
        </Box>

        {/* Score details */}
        <Box sx={{ px: 4, py: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Score Details
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" sx={{ color: "#718096" }}>
                Min passing score:
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#6366F1", fontWeight: 600 }}
              >
                {minPassingScore}%
              </Typography>
              <Chip
                label={isPassed ? "Passed" : "Failed"}
                size="small"
                sx={{
                  bgcolor: isPassed ? "#E6FFFA" : "#FFF5F5",
                  color: isPassed ? "#319795" : "#E53E3E",
                  fontSize: "12px",
                  height: "22px",
                }}
              />
            </Box>
          </Box>

          {/* Metrics Grid - Updated to show all scores */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 3,
            }}
          >
            {/* Overall Score (FinalScore) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "#EBF4FF",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <SignalIcon sx={{ color: "#3182CE" }} />
              </Box>
              <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                Overall Score
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {scores ? `${Math.round(scores.FinalScore)}%` : "N/A"}
              </Typography>
            </Box>

            {/* Contextual Accuracy */}
            {scores?.ContextualAccuracy !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <PsychologyIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Contextual Accuracy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.ContextualAccuracy)}%`}
                </Typography>
              </Box>
            )}

            {/* Keyword Score */}
            {scores?.KeywordScore !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <SignalIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Keyword Score
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.KeywordScore)}%`}
                </Typography>
              </Box>
            )}

            {/* Click Score */}
            {scores?.ClickScore !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <SignalIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Click Score
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.ClickScore)}%`}
                </Typography>
              </Box>
            )}

            {/* Data Accuracy */}
            {scores?.DataAccuracy !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <PsychologyIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Data Accuracy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.DataAccuracy)}%`}
                </Typography>
              </Box>
            )}

            {/* Completion Time */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "#EBF4FF",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <AccessTimeIcon sx={{ color: "#3182CE" }} />
              </Box>
              <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                Completion Time
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatCompletionTime(duration)}
              </Typography>
            </Box>

            {/* Confidence - Show exact score */}
            {scores?.Confidence !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <SatisfiedIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Confidence
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.Confidence)}%`}
                </Typography>
              </Box>
            )}

            {/* Energy - Show exact score */}
            {scores?.Energy !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <EnergyIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Energy
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.Energy)}%`}
                </Typography>
              </Box>
            )}

            {/* Concentration - Show exact score */}
            {scores?.Concentration !== undefined && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: "#EBF4FF",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <PsychologyIcon sx={{ color: "#3182CE" }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#718096", mb: 0.5 }}>
                  Concentration
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${Math.round(scores.Concentration)}%`}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
            {/* First row - Navigation buttons */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={onBackToList}
                sx={{
                  borderColor: "#E2E8F0",
                  color: "#4A5568",
                  "&:hover": {
                    borderColor: "#CBD5E0",
                    bgcolor: "#F7FAFC",
                  },
                  py: 1.5,
                  borderRadius: "8px",
                }}
              >
                Back to Sim List
              </Button>
              {onGoToNextSim && (
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onGoToNextSim}
                  disabled={!hasNextSimulation}
                  sx={{
                    bgcolor: hasNextSimulation ? "#4299E1" : "#A0AEC0",
                    "&:hover": {
                      bgcolor: hasNextSimulation ? "#3182CE" : "#A0AEC0",
                    },
                    "&.Mui-disabled": {
                      color: "#718096",
                      bgcolor: "#E2E8F0",
                    },
                    py: 1.5,
                    borderRadius: "8px",
                  }}
                >
                  {hasNextSimulation
                    ? "Go to Next Simulation"
                    : "Last Simulation"}
                </Button>
              )}
            </Box>

            {/* Second row - Action buttons */}
            {(onRestartSim || onViewPlayback) && (
              <Box sx={{ display: "flex", gap: 2 }}>
                {onRestartSim && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={onRestartSim}
                    sx={{
                      borderColor: "#E2E8F0",
                      color: "#4A5568",
                      "&:hover": {
                        borderColor: "#CBD5E0",
                        bgcolor: "#F7FAFC",
                      },
                      py: 1.5,
                      borderRadius: "8px",
                    }}
                  >
                    Restart Sim
                  </Button>
                )}
                {onViewPlayback && (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={onViewPlayback}
                    sx={{
                      bgcolor: "#4299E1",
                      "&:hover": {
                        bgcolor: "#3182CE",
                      },
                      py: 1.5,
                      borderRadius: "8px",
                    }}
                  >
                    View Playback
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SimulationCompletionScreen;
