import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  SvgIcon,
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
import { buildPathWithWorkspace } from "../../../../utils/navigation";
import { mapLevelToCode } from "../../../../utils/simulation";

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
  onRestartSim?: () => void;
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

const HeadsetIcon = ({ size = 64, color = "#DEE2FD" }) => (
  <SvgIcon viewBox="0 0 64 64" sx={{ width: size, height: size }}>
    <path
      d="M20.0013 48C17.068 48 14.5569 46.9556 12.468 44.8667C10.3791 42.7778 9.33464 40.2667 9.33464 37.3333V26.4667C9.33464 24.2 10.0457 22.2111 11.468 20.5C12.8902 18.7889 14.7124 17.7333 16.9346 17.3333C19.468 16.8444 21.9791 16.5 24.468 16.3C26.9569 16.1 29.468 16 32.0013 16C34.5346 16 37.0569 16.1 39.568 16.3C42.0791 16.5 44.5791 16.8444 47.068 17.3333C49.2902 17.7778 51.1124 18.8444 52.5346 20.5333C53.9569 22.2222 54.668 24.2 54.668 26.4667V37.3333C54.668 40.2667 53.6235 42.7778 51.5346 44.8667C49.4457 46.9556 46.9346 48 44.0013 48H41.3346C40.7569 48 40.1791 47.9667 39.6013 47.9C39.0235 47.8333 38.468 47.6889 37.9346 47.4667L33.668 46C33.1346 45.7778 32.5791 45.6667 32.0013 45.6667C31.4235 45.6667 30.868 45.7778 30.3346 46L26.068 47.4667C25.5346 47.6889 24.9791 47.8333 24.4013 47.9C23.8235 47.9667 23.2457 48 22.668 48H20.0013ZM20.0013 42.6667H22.668C22.9791 42.6667 23.2791 42.6444 23.568 42.6C23.8569 42.5556 24.1346 42.4889 24.4013 42.4C25.6902 42 26.9457 41.5778 28.168 41.1333C29.3902 40.6889 30.668 40.4667 32.0013 40.4667C33.3346 40.4667 34.6235 40.6778 35.868 41.1C37.1124 41.5222 38.3569 41.9556 39.6013 42.4C39.868 42.4889 40.1457 42.5556 40.4346 42.6C40.7235 42.6444 41.0235 42.6667 41.3346 42.6667H44.0013C45.468 42.6667 46.7235 42.1444 47.768 41.1C48.8124 40.0556 49.3346 38.8 49.3346 37.3333V26.4667C49.3346 25.4889 49.0235 24.6444 48.4013 23.9333C47.7791 23.2222 47.0013 22.7556 46.068 22.5333C43.7569 22.0444 41.4346 21.7222 39.1013 21.5667C36.768 21.4111 34.4013 21.3333 32.0013 21.3333C29.6013 21.3333 27.2457 21.4222 24.9346 21.6C22.6235 21.7778 20.2902 22.0889 17.9346 22.5333C17.0013 22.7111 16.2235 23.1667 15.6013 23.9C14.9791 24.6333 14.668 25.4889 14.668 26.4667V37.3333C14.668 38.8 15.1902 40.0556 16.2346 41.1C17.2791 42.1444 18.5346 42.6667 20.0013 42.6667ZM4.66797 37.3333C4.09019 37.3333 3.61241 37.1444 3.23464 36.7667C2.85686 36.3889 2.66797 35.9111 2.66797 35.3333V28.6667C2.66797 28.0889 2.85686 27.6111 3.23464 27.2333C3.61241 26.8556 4.09019 26.6667 4.66797 26.6667C5.24575 26.6667 5.72352 26.8556 6.1013 27.2333C6.47908 27.6111 6.66797 28.0889 6.66797 28.6667V35.3333C6.66797 35.9111 6.47908 36.3889 6.1013 36.7667C5.72352 37.1444 5.24575 37.3333 4.66797 37.3333ZM59.3346 37.3333C58.7569 37.3333 58.2791 37.1444 57.9013 36.7667C57.5235 36.3889 57.3346 35.9111 57.3346 35.3333V28.6667C57.3346 28.0889 57.5235 27.6111 57.9013 27.2333C58.2791 26.8556 58.7569 26.6667 59.3346 26.6667C59.9124 26.6667 60.3902 26.8556 60.768 27.2333C61.1457 27.6111 61.3346 28.0889 61.3346 28.6667V35.3333C61.3346 35.9111 61.1457 36.3889 60.768 36.7667C60.3902 37.1444 59.9124 37.3333 59.3346 37.3333Z"
      fill={color}
    />
  </SvgIcon>
);

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
  // Get authenticated user and workspace info using useAuth hook
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
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

  const showFeedbackButton =
    (level === "Level 01" && simulation?.lvl1?.enablePostSimulationSurvey) ||
    (level === "Level 02" && simulation?.lvl2?.enablePostSimulationSurvey) ||
    (level === "Level 03" && simulation?.lvl3?.enablePostSimulationSurvey) ||
    false;

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

    // Only update settings if we have simulation details
    if (!simulationDetails) {
      // Don't reset settings if we don't have simulation details
      return;
    }

    let settings = null;

    if (level === "Level 01") {
      settings = simulationDetails.lvl1;
    } else if (level === "Level 02") {
      settings = simulationDetails.lvl2;
    } else if (level === "Level 03") {
      settings = simulationDetails.lvl3;
    }

    if (!settings) {
      return;
    }

    // Update the ref values with the current settings
    hideAgentScriptRef.current = settings.hideAgentScript || false;
    hideCustomerScriptRef.current = settings.hideCustomerScript || false;

    // Mark that settings have been properly initialized at least once
    settingsInitializedRef.current = true;

  };

  // Update the settings whenever simulation details or level changes
  useEffect(() => {
    updateLevelSettings();
  }, [simulationDetails, level]);

  useEffect(() => {
    webClient.on("conversationStarted", (event) => {
      if (event.call_id) {
        setCallId(event.call_id);
      }
    });

    webClient.on("conversationEnded", ({ code, reason }) => {
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


        setAllMessages((prevMessages) => {
          // Clone the current messages
          const updatedMessages = [...prevMessages];
          const newTranscriptLength = newTranscript.length;
          const prevTranscriptLength = previousTranscript.length;

          if (newTranscriptLength === 0) return updatedMessages;

          if (newTranscriptLength > prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            const isSpeakerCustomer = newMsg.role === "agent"; // "agent" in Retell maps to "customer" in our UI


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
        simulation_level: mapLevelToCode(level),
      });


      // Log detailed info about the simulation details, especially level settings
      if (response.simulation_details) {

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

    // Prevent multiple simultaneous end call attempts
    if (isEndingCall) {
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingCall(true);

    // Stop the WebRTC call first
    webClient.stopCall();

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Update UI state
    setIsCallActive(false);

    // Log current state to help with debugging

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


    // Use a timeout to ensure the API call runs even if there are issues with the state updates
    setTimeout(async () => {
      try {
        // Use the endAudioSimulation function instead of direct axios call
        const response = await endAudioSimulation(apiParams);

        if (response && response.scores) {
          setScores(response.scores);
          setDuration(response.duration || elapsedTime);

          // Only show completion screen for Test attempts
          if (attemptType === "Test") {
            setShowCompletionScreen(true);
          } else {
            // For Practice attempts, go back to list
            onBackToList();
          }
        } else {
          console.warn("No scores received in response");
          // Only show completion screen for Test attempts
          if (attemptType === "Test") {
            setShowCompletionScreen(true);
          } else {
            onBackToList();
          }
        }
      } catch (error) {
        console.error("Failed to end audio simulation:", error);
        // Show an error message to the user if needed
        // Only show completion screen for Test attempts, even on error
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          onBackToList();
        }
      } finally {
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

  const navigate = useNavigate();

  const handleViewPlayback = () => {
    if (!simulationProgressId) return;
    const path = buildPathWithWorkspace(
      `/playback/${simulationProgressId}`,
      currentWorkspaceId,
      currentTimeZone,
    );
    navigate(path);
  };

  // Log current state of hide settings when visible messages changes
  useEffect(() => {
  }, [visibleMessages, allMessages]);

  return (
    <>
      <SimulationCompletionScreen
        showCompletionScreen={showCompletionScreen}
        userName={userName}
        simulationName={simulationName}
        simulationId={simulationId}
        attemptId={simulationProgressId || ""}
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
        showFeedbackButton={showFeedbackButton}
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
                    p: 4,
                    mb: 3,
                    width: 120,
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <HeadsetIcon size={96} color="#DEE2FD" />
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
                    width: "80%",
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
                    width: "80%",
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
                <span style={{ fontWeight: "bold" }}>Customer</span>
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
