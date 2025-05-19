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
  HeadsetMic,
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
import { useAuth } from "../../../../context/AuthContext";
// Import audio simulation API functions
import {
  startAudioSimulation,
  endAudioSimulation,
  StartAudioSimulationResponse,
  EndAudioSimulationResponse,
} from "../../../../services/simulation_audio_attempts";
import SimulationCompletionScreen from "./SimulationCompletionScreen";

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
  onGoToNextSim?: () => void;
  onRestartSim?: () => void
  hasNextSimulation?: boolean;
  assignmentId: string;
  simulation?: any;
}

interface LevelSettings {
  isEnabled: boolean;
  enablePractice: boolean;
  hideAgentScript: boolean;
  hideCustomerScript: boolean;
  hideKeywordScores: boolean;
  hideSentimentScores: boolean;
  hideHighlights: boolean;
  hideCoachingTips: boolean;
  enablePostSimulationSurvey: boolean;
  aiPoweredPausesAndFeedback: boolean;
}

interface SimulationDetails {
  sim_name: string;
  version: number;
  lvl1: LevelSettings;
  lvl2: LevelSettings;
  lvl3: LevelSettings;
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  script: Array<{
    script_sentence: string;
    role: string;
    keywords: string[];
  }>;
  slidesData: any;
  prompt: string;
  [key: string]: any;
}

const webClient = new RetellWebClient();

const AudioSimulationPage: React.FC<AudioSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  onGoToNextSim,
  onRestartSim,
  hasNextSimulation,
  assignmentId,
  simulation,
}) => {
  // Get authenticated user using useAuth hook
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  const [isCallActive, setIsCallActive] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
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
  const [simulationDetails, setSimulationDetails] =
    useState<SimulationDetails | null>(null);
  const previousTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Add refs to store hide settings - this will ensure they're available during the update callback
  const hideAgentScriptRef = useRef(false);
  const hideCustomerScriptRef = useRef(false);

  // Add a flag to track if settings have ever been properly initialized
  const settingsInitializedRef = useRef(false);

  const minPassingScore = simulation?.minimum_passing_score || 85;

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.FinalScore >= minPassingScore : false;

  // Return the filtered messages based on the hide settings
  // This is a critical change - we filter the messages at render time, not when adding to state
  const getVisibleMessages = () => {
    return allMessages.filter((message) => {
      if (message.speaker === "customer" && hideCustomerScriptRef.current) {
        return false; // Hide customer messages
      }
      if (message.speaker === "trainee" && hideAgentScriptRef.current) {
        return false; // Hide trainee messages
      }
      return true; // Show all other messages
    });
  };

  // Get the visible messages for rendering
  const visibleMessages = getVisibleMessages();

  // FIXED: Update the level settings and log detailed information
  const updateLevelSettings = () => {
    console.log("📋 Updating level settings...");
    console.log("Current level:", level);
    console.log("Simulation details available:", !!simulationDetails);
    console.log(
      "Settings previously initialized:",
      settingsInitializedRef.current,
    );

    // Only update settings if we have simulation details
    if (!simulationDetails) {
      console.log("⚠️ No simulation details available for level settings");
      // Don't reset settings if we don't have simulation details
      return;
    }

    let settings = null;

    if (level === "Level 01") {
      settings = simulationDetails.lvl1;
      console.log("🔍 Using Level 01 settings:", settings);
    } else if (level === "Level 02") {
      settings = simulationDetails.lvl2;
      console.log("🔍 Using Level 02 settings:", settings);
    } else if (level === "Level 03") {
      settings = simulationDetails.lvl3;
      console.log("🔍 Using Level 03 settings:", settings);
    }

    if (!settings) {
      console.log("⚠️ Could not find settings for level:", level);
      return;
    }

    // Update the ref values with the current settings
    hideAgentScriptRef.current = settings.hideAgentScript || false;
    hideCustomerScriptRef.current = settings.hideCustomerScript || false;

    // Mark that settings have been properly initialized at least once
    settingsInitializedRef.current = true;

    console.log("🔄 Updated hide settings:");
    console.log("Hide agent script:", hideAgentScriptRef.current);
    console.log("Hide customer script:", hideCustomerScriptRef.current);
  };

  // Update the settings whenever simulation details or level changes
  useEffect(() => {
    updateLevelSettings();
  }, [simulationDetails, level]);

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

        console.log("🔄 Transcript update received.");
        console.log("Current hide settings from refs:");
        console.log(
          "- Hide agent (trainee) messages:",
          hideAgentScriptRef.current,
        );
        console.log("- Hide customer messages:", hideCustomerScriptRef.current);

        setAllMessages((prevMessages) => {
          // Clone the current messages
          const updatedMessages = [...prevMessages];
          const newTranscriptLength = newTranscript.length;
          const prevTranscriptLength = previousTranscript.length;

          if (newTranscriptLength === 0) return updatedMessages;

          if (newTranscriptLength > prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            const isSpeakerCustomer = newMsg.role === "agent"; // "agent" in Retell maps to "customer" in our UI

            console.log(
              `📝 NEW MESSAGE: ${
                isSpeakerCustomer ? "CUSTOMER" : "TRAINEE"
              } says: "${newMsg.content.substring(0, 30)}${
                newMsg.content.length > 30 ? "..." : ""
              }"`,
            );

            // Always add the message to allMessages
            // We'll filter them out when rendering, not when adding to state
            updatedMessages.push({
              speaker: isSpeakerCustomer ? "customer" : "trainee",
              text: newMsg.content,
            });
          } else if (newTranscriptLength === prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            const lastMsgIndex = updatedMessages.length - 1;
            const isSpeakerCustomer = newMsg.role === "agent"; // "agent" in Retell maps to "customer" in our UI

            if (lastMsgIndex >= 0) {
              const lastMsg = updatedMessages[lastMsgIndex];
              if (
                lastMsg.speaker === (isSpeakerCustomer ? "customer" : "trainee")
              ) {
                // This is updating an existing message that's already shown, so update it
                updatedMessages[lastMsgIndex].text = newMsg.content;
              } else {
                // Always add the message to allMessages
                updatedMessages.push({
                  speaker: isSpeakerCustomer ? "customer" : "trainee",
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

  // Scroll to bottom when visible messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [visibleMessages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleStart = async () => {
    if (!userId) {
      console.error("Error: User ID is required to start simulation");
      return;
    }

    setIsStarting(true);
    try {
      setIsCallActive(true);
      setAllMessages([
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
        attempt_type: attemptType, // Pass the attemptType
      });

      console.log("Start audio response:", response);

      // Log detailed info about the simulation details, especially level settings
      if (response.simulation_details) {
        console.log("📊 SIMULATION DETAILS RECEIVED");
        console.log("Level 1 settings:", response.simulation_details.lvl1);
        console.log("Level 2 settings:", response.simulation_details.lvl2);
        console.log("Level 3 settings:", response.simulation_details.lvl3);
        console.log("Selected level:", level);

        // Store simulation details
        setSimulationDetails(response.simulation_details);

        // Immediately update hide settings based on the selected level
        setTimeout(() => {
          updateLevelSettings();
        }, 0);
      } else {
        console.warn("⚠️ No simulation details in response");
      }

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
      setAllMessages([]);
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

  // Updated navigation handlers
  const handleBackToSimList = () => {
    setShowCompletionScreen(false);
    onBackToList();
  };

  const handleGoToNextSim = () => {
    if (onGoToNextSim && hasNextSimulation) {
      setShowCompletionScreen(false);
      onGoToNextSim();
    }
  };

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsCallActive(false);
    setAllMessages([]);
    setElapsedTime(0);
    setScores(null);
    // Don't reset settingsInitializedRef.current here, as we want to keep our settings
  };

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

  // Log current state of hide settings when visible messages changes
  useEffect(() => {
    console.log("⚠️ RENDER: Visible messages count:", visibleMessages.length);
    console.log("⚠️ RENDER: All messages count:", allMessages.length);
    console.log(
      "⚠️ RENDER: Hide settings - Agent:",
      hideAgentScriptRef.current,
      "Customer:",
      hideCustomerScriptRef.current,
    );
  }, [visibleMessages, allMessages]);

  return (
    <>
      <SimulationCompletionScreen
        showCompletionScreen={showCompletionScreen}
        userName={userName}
        simulationName={simulationName}
        level={level}
        simType={simType}
        attemptType={attemptType}
        scores={scores}
        duration={duration}
        isPassed={isPassed}
        onBackToList={handleBackToSimList}
        onGoToNextSim={hasNextSimulation ? handleGoToNextSim : undefined}
        onRestartSim={onRestartSim}
        onViewPlayback={handleViewPlayback}
        hasNextSimulation={hasNextSimulation}
        minPassingScore={minPassingScore}
      />

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
                  {/* Key change: Instead of rendering all messages, render only visibleMessages */}
                  {visibleMessages.map((message, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={2}
                      justifyContent={
                        message.speaker === "customer"
                          ? "flex-start"
                          : "flex-end"
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
                          src={user?.profileImageUrl || undefined}
                          sx={{ width: 32, height: 32 }}
                        >
                          {!user?.profileImageUrl &&
                            (user?.name
                              ? user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                              : "T")}
                        </Avatar>
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
                bgcolor: "rgba(255, 255, 255, 0.95)",
                zIndex: 10,
              }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Analyzing Attempt
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processing your performance and calculating scores...
              </Typography>
            </Box>
          )}
        </Card>
      </Box>
    </>
  );
};

export default AudioSimulationPage;
