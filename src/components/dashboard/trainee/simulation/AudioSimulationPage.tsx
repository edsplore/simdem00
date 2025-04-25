import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Avatar,
  IconButton,
  Chip,
  Paper,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  SmartToy as SmartToyIcon,
  Phone,
  Pause,
  CallEnd,
  AccessTime as AccessTimeIcon,
  SignalCellularAlt as SignalIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
} from "@mui/icons-material";
import { RetellWebClient } from "retell-client-js-sdk";
// Import useAuth hook from your context
import { useAuth } from "../../../../context/AuthContext"; // Update this path based on your project structure
// Import audio simulation API functions
import {
  startAudioSimulation,
  endAudioSimulation,
  StartAudioSimulationResponse,
  EndAudioSimulationResponse,
} from "../../../../services/simulation_audio_attempts";

interface Message {
  speaker: "customer" | "trainee";
  text: string;
}

interface AudioSimulationPageProps {
  simulationId: string;
  simulationName: string;
  level: string;
  simType: string;
  attemptType: string;
  onBackToList: () => void;
  assignmentId: string;
}

const webClient = new RetellWebClient();

// Minimum passing score threshold
const MIN_PASSING_SCORE = 85;

const AudioSimulationPage: React.FC<AudioSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  assignmentId,
}) => {
  // Get authenticated user using useAuth hook
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [simulationProgressId, setSimulationProgressId] = useState<
    string | null
  >(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [scores, setScores] = useState<
    EndAudioSimulationResponse["scores"] | null
  >(null);
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const previousTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores["Sim Accuracy"] >= MIN_PASSING_SCORE : false;

  useEffect(() => {
    webClient.on("conversationStarted", (event) => {
      console.log("Conversation started:", event);
      if (event.call_id) {
        setCallId(event.call_id);
      }
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
      console.log("Conversation ended:", code, reason);
      // Only call handleEndCall if not already ending the call
      if (!isEndingCall) {
        handleEndCall();
      }
    });

    webClient.on("error", (error) => {
      console.error("WebRTC error:", error);
      handleEndCall();
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const newTranscript = update.transcript;
        const previousTranscript = previousTranscriptRef.current || [];

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const newTranscriptLength = newTranscript.length;
          const prevTranscriptLength = previousTranscript.length;

          if (newTranscriptLength === 0) return updatedMessages;

          if (newTranscriptLength > prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            updatedMessages.push({
              speaker: newMsg.role === "agent" ? "customer" : "trainee",
              text: newMsg.content,
            });
          } else if (newTranscriptLength === prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            const lastMsgIndex = updatedMessages.length - 1;

            if (lastMsgIndex >= 0) {
              const lastMsg = updatedMessages[lastMsgIndex];
              if (
                lastMsg.speaker ===
                (newMsg.role === "agent" ? "customer" : "trainee")
              ) {
                updatedMessages[lastMsgIndex].text = newMsg.content;
              } else {
                updatedMessages.push({
                  speaker: newMsg.role === "agent" ? "customer" : "trainee",
                  text: newMsg.content,
                });
              }
            }
          }

          return updatedMessages;
        });

        previousTranscriptRef.current = newTranscript;
      }
    });

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      webClient.stopCall();
    };
  }, [isEndingCall]); // Added isEndingCall as a dependency

  useEffect(() => {
    if (isCallActive && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isCallActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const formatCompletionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleStart = async () => {
    if (!userId) {
      console.error("Error: User ID is required to start simulation");
      return;
    }

    setIsStarting(true);
    try {
      setIsCallActive(true);
      setMessages([
        {
          speaker: "customer",
          text: "Connecting...",
        },
      ]);

      // Use the startAudioSimulation function instead of direct axios call
      const response = await startAudioSimulation({
        user_id: userId,
        sim_id: simulationId,
        assignment_id: assignmentId,
      });

      console.log("Start audio response:", response);

      if (response.access_token) {
        setSimulationProgressId(response.id);
        setCallId(response.call_id);
        await webClient.startCall({
          accessToken: response.access_token,
        });
      }
    } catch (error) {
      console.error("Error starting simulation:", error);
      setIsCallActive(false);
      setMessages([]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndCall = async () => {
    console.log("🔴 END CALL BUTTON PRESSED");

    // Prevent multiple simultaneous end call attempts
    if (isEndingCall) {
      console.log("Already ending call, ignoring duplicate request");
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingCall(true);

    // Stop the WebRTC call first
    console.log("Stopping WebRTC call");
    webClient.stopCall();

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }

    // Update UI state
    setIsCallActive(false);

    // Log current state to help with debugging
    console.log("Call end state:", {
      simulationId,
      simulationProgressId,
      callId,
      userId,
      isCallActive: false,
    });

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end call API");
      setIsEndingCall(false);
      return;
    }

    if (!callId) {
      console.error("⚠️ Missing callId for end call API");
      setIsEndingCall(false);
      return;
    }

    const apiParams = {
      user_id: userId,
      simulation_id: simulationId,
      usersimulationprogress_id: simulationProgressId,
      call_id: callId,
    };

    console.log("API Parameters prepared:", apiParams);

    // Use a timeout to ensure the API call runs even if there are issues with the state updates
    setTimeout(async () => {
      try {
        console.log("Executing end-audio API call");
        // Use the endAudioSimulation function instead of direct axios call
        const response = await endAudioSimulation(apiParams);

        if (response && response.scores) {
          console.log("Setting scores and showing completion screen");
          setScores(response.scores);
          setDuration(response.duration || elapsedTime);
          setShowCompletionScreen(true);
        } else {
          console.warn("No scores received in response");
        }
      } catch (error) {
        console.error("Failed to end audio simulation:", error);
        // Show an error message to the user if needed
      } finally {
        console.log("End call flow completed");
        setIsEndingCall(false);
      }
    }, 500); // Small delay to ensure state updates have propagated
  };

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsCallActive(false);
    setMessages([]);
    setElapsedTime(0);
    setScores(null);
  };

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

  // Render the completion screen based on the image provided
  if (showCompletionScreen) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f7fa",
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
                  {MIN_PASSING_SCORE}%
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

            {/* Metrics */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {/* Sim Score */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
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
                  Sim Score
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {scores ? `${Math.round(scores["Sim Accuracy"])}%` : "86%"}
                </Typography>
              </Box>

              {/* Completion Time */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
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

              {/* Confidence */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
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
                  {scores && scores["Confidence"] >= 80
                    ? "High"
                    : scores && scores["Confidence"] >= 60
                      ? "Medium"
                      : "Low"}
                </Typography>
              </Box>

              {/* Concentration */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
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
                  {scores && scores["Concentration"] >= 80
                    ? "High"
                    : scores && scores["Concentration"] >= 60
                      ? "Medium"
                      : "Low"}
                </Typography>
              </Box>

              {/* Energy */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "100px",
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
                  {scores && scores["Energy"] >= 80
                    ? "High"
                    : scores && scores["Energy"] >= 60
                      ? "Medium"
                      : "Low"}
                </Typography>
              </Box>
            </Box>

            {/* Buttons */}
            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleRestartSim}
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
              <Button
                fullWidth
                variant="contained"
                onClick={handleViewPlayback}
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
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", bgcolor: "white", py: 0, px: 0 }}>
      {/* Header */}
      <Box sx={{ maxWidth: "900px", mx: "auto", borderRadius: "16px" }}>
        <Stack
          direction="row"
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "#F9FAFB",
            borderRadius: "16px",
            gap: "20px",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="body2"
            color="text.main"
            sx={{ borderRadius: "8px", padding: "4px 8px" }}
          >
            {simulationName}
          </Typography>
          <Typography
            variant="body2"
            color="text.main"
            sx={{
              backgroundColor: "#ECEFF3",
              borderRadius: "12px",
              padding: "4px 8px",
            }}
          >
            {level}
          </Typography>
          <Typography
            variant="body2"
            color="text.main"
            sx={{
              backgroundColor: "#ECEFF3",
              borderRadius: "12px",
              padding: "4px 8px",
            }}
          >
            Sim Type: {simType}
          </Typography>
          <Typography
            variant="body2"
            color="text.main"
            sx={{
              backgroundColor: "#ECEFF3",
              borderRadius: "12px",
              padding: "4px 8px",
            }}
          >
            {attemptType} Attempt
          </Typography>
          <Typography
            variant="body2"
            color="text.main"
            sx={{
              backgroundColor: "#ECEFF3",
              borderRadius: "12px",
              padding: "4px 8px",
              ml: "auto",
              color: "#0037ff",
            }}
          >
            {formatTime(elapsedTime)}
          </Typography>
        </Stack>
      </Box>

      <Card
        sx={{
          maxWidth: "900px",
          minHeight: "600px",
          mx: "auto",
          mt: 1,
          borderRadius: "16px",
          position: "relative",
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Customer
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Trainee
          </Typography>
        </Box>

        <Box sx={{ position: "relative", height: "calc(100vh - 200px)" }}>
          {!isCallActive ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                width: "50%",
                mx: "auto",
                my: 10,
                border: "1px solid #DEE2FD",
                borderRadius: 4,
              }}
            >
              <Box
                sx={{
                  bgcolor: "#f5f7ff",
                  borderRadius: "50%",
                  p: 2,
                  mb: 2,
                }}
              >
                <SmartToyIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
              </Box>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
              >
                Start Simulation
              </Typography>
              <Typography sx={{ color: "#666", mb: 4 }}>
                Press start to attempt the Audio Simulation
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleStart}
                disabled={isStarting || !userId}
                sx={{
                  bgcolor: "#0037ff",
                  color: "white",
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "16px",
                  "&:hover": {
                    bgcolor: "#002ed4",
                  },
                }}
              >
                {isStarting ? "Starting..." : "Start Simulation"}
              </Button>
              <Button
                variant="text"
                onClick={onBackToList}
                sx={{
                  mt: 2,
                  color: "#666",
                  textTransform: "none",
                  border: "1px solid #DEE2FD",
                  px: 8,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: "16px",
                }}
              >
                Back to Sim List
              </Button>
            </Box>
          ) : (
            <Box
              ref={chatContainerRef}
              sx={{
                height: "calc(100% - 80px)",
                overflowY: "auto",
                px: 3,
                py: 2,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              <Stack spacing={2}>
                {messages.map((message, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={2}
                    justifyContent={
                      message.speaker === "customer" ? "flex-start" : "flex-end"
                    }
                    alignItems="flex-start"
                  >
                    {message.speaker === "customer" && (
                      <Avatar sx={{ width: 32, height: 32 }}>C</Avatar>
                    )}
                    <Box
                      sx={{
                        maxWidth: "70%",
                        bgcolor: "#FAFAFF",
                        p: 2,
                        borderRadius: 3,
                        border: "2px solid #6D7295",
                        borderTopLeftRadius:
                          message.speaker === "customer" ? 0 : 3,
                        borderTopRightRadius:
                          message.speaker === "trainee" ? 0 : 3,
                      }}
                    >
                      <Typography variant="body1">{message.text}</Typography>
                    </Box>
                    {message.speaker === "trainee" && (
                      <Avatar
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                        sx={{ width: 32, height: 32 }}
                      />
                    )}
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
        {isCallActive && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              maxWidth: 900,
              margin: "0 auto",
              p: 2,
              bgcolor: "#F9FAFB",
              borderTop: "1px solid #E5E7EB",
              borderRadius: 3,
            }}
          >
            <IconButton
              sx={{
                bgcolor: "#D8F3D2",
                "&:hover": { bgcolor: "#D8F3D2" },
                mr: 1,
              }}
            >
              <Phone sx={{ color: "#2E7D16" }} />
            </IconButton>

            <Typography
              variant="subtitle1"
              sx={{ color: "black", flexGrow: 1 }}
            >
              <span style={{ fontWeight: "normal" }}>Call with </span>
              <span style={{ fontWeight: "bold" }}>Lewis Simmons</span>
              <span style={{ fontWeight: "normal" }}>
                {" "}
                {formatTime(elapsedTime)}
              </span>
            </Typography>

            <IconButton
              onClick={handleEndCall}
              disabled={isEndingCall}
              sx={{
                bgcolor: "#E6352B",
                "&:hover": { bgcolor: "#E6352B" },
                "&.Mui-disabled": {
                  bgcolor: "#FFD1CF",
                },
              }}
            >
              <CallEnd sx={{ color: "white" }} />
            </IconButton>
          </Stack>
        )}

        {/* Loading overlay for ending call */}
        {isEndingCall && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#FFFFFF",
              zIndex: 10,
            }}
          >
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Processing Simulation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calculating your performance scores...
            </Typography>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default AudioSimulationPage;
