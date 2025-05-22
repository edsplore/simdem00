import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Avatar,
  TextField,
  IconButton,
  CircularProgress,
  Paper,
  Chip,
  SvgIcon,
} from "@mui/material";
import {
  SmartToy as SmartToyIcon,
  PlayArrow as PlayArrowIcon,
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
  SignalCellularAlt as SignalIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
  CallEnd as CallEndIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../../context/AuthContext"; // Update path as needed
import {
  startChatSimulation,
  sendChatMessage,
  endChatSimulation,
  ChatResponse,
  EndChatResponse,
} from "../../../../services/simulation_chat_attempts";
import SimulationCompletionScreen from "./SimulationCompletionScreen";

interface Message {
  speaker: "customer" | "trainee";
  text: string;
  timestamp?: Date;
}

interface ChatSimulationPageProps {
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

const HeadsetIcon = ({ size = 64, color = "#DEE2FD" }) => (
  <SvgIcon viewBox="0 0 64 64" sx={{ width: size, height: size }}>
    <path
      d="M20.0013 48C17.068 48 14.5569 46.9556 12.468 44.8667C10.3791 42.7778 9.33464 40.2667 9.33464 37.3333V26.4667C9.33464 24.2 10.0457 22.2111 11.468 20.5C12.8902 18.7889 14.7124 17.7333 16.9346 17.3333C19.468 16.8444 21.9791 16.5 24.468 16.3C26.9569 16.1 29.468 16 32.0013 16C34.5346 16 37.0569 16.1 39.568 16.3C42.0791 16.5 44.5791 16.8444 47.068 17.3333C49.2902 17.7778 51.1124 18.8444 52.5346 20.5333C53.9569 22.2222 54.668 24.2 54.668 26.4667V37.3333C54.668 40.2667 53.6235 42.7778 51.5346 44.8667C49.4457 46.9556 46.9346 48 44.0013 48H41.3346C40.7569 48 40.1791 47.9667 39.6013 47.9C39.0235 47.8333 38.468 47.6889 37.9346 47.4667L33.668 46C33.1346 45.7778 32.5791 45.6667 32.0013 45.6667C31.4235 45.6667 30.868 45.7778 30.3346 46L26.068 47.4667C25.5346 47.6889 24.9791 47.8333 24.4013 47.9C23.8235 47.9667 23.2457 48 22.668 48H20.0013ZM20.0013 42.6667H22.668C22.9791 42.6667 23.2791 42.6444 23.568 42.6C23.8569 42.5556 24.1346 42.4889 24.4013 42.4C25.6902 42 26.9457 41.5778 28.168 41.1333C29.3902 40.6889 30.668 40.4667 32.0013 40.4667C33.3346 40.4667 34.6235 40.6778 35.868 41.1C37.1124 41.5222 38.3569 41.9556 39.6013 42.4C39.868 42.4889 40.1457 42.5556 40.4346 42.6C40.7235 42.6444 41.0235 42.6667 41.3346 42.6667H44.0013C45.468 42.6667 46.7235 42.1444 47.768 41.1C48.8124 40.0556 49.3346 38.8 49.3346 37.3333V26.4667C49.3346 25.4889 49.0235 24.6444 48.4013 23.9333C47.7791 23.2222 47.0013 22.7556 46.068 22.5333C43.7569 22.0444 41.4346 21.7222 39.1013 21.5667C36.768 21.4111 34.4013 21.3333 32.0013 21.3333C29.6013 21.3333 27.2457 21.4222 24.9346 21.6C22.6235 21.7778 20.2902 22.0889 17.9346 22.5333C17.0013 22.7111 16.2235 23.1667 15.6013 23.9C14.9791 24.6333 14.668 25.4889 14.668 26.4667V37.3333C14.668 38.8 15.1902 40.0556 16.2346 41.1C17.2791 42.1444 18.5346 42.6667 20.0013 42.6667ZM4.66797 37.3333C4.09019 37.3333 3.61241 37.1444 3.23464 36.7667C2.85686 36.3889 2.66797 35.9111 2.66797 35.3333V28.6667C2.66797 28.0889 2.85686 27.6111 3.23464 27.2333C3.61241 26.8556 4.09019 26.6667 4.66797 26.6667C5.24575 26.6667 5.72352 26.8556 6.1013 27.2333C6.47908 27.6111 6.66797 28.0889 6.66797 28.6667V35.3333C6.66797 35.9111 6.47908 36.3889 6.1013 36.7667C5.72352 37.1444 5.24575 37.3333 4.66797 37.3333ZM59.3346 37.3333C58.7569 37.3333 58.2791 37.1444 57.9013 36.7667C57.5235 36.3889 57.3346 35.9111 57.3346 35.3333V28.6667C57.3346 28.0889 57.5235 27.6111 57.9013 27.2333C58.2791 26.8556 58.7569 26.6667 59.3346 26.6667C59.9124 26.6667 60.3902 26.8556 60.768 27.2333C61.1457 27.6111 61.3346 28.0889 61.3346 28.6667V35.3333C61.3346 35.9111 61.1457 36.3889 60.768 36.7667C60.3902 37.1444 59.9124 37.3333 59.3346 37.3333Z"
      fill={color}
    />
  </SvgIcon>
);

const ChatSimulationPage: React.FC<ChatSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  onGoToNextSim,
  hasNextSimulation,
  assignmentId,
  simulation,
  onRestartSim,
}) => {
  // Get authenticated user
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [simulationProgressId, setSimulationProgressId] = useState<
    string | null
  >(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [scores, setScores] = useState<EndChatResponse["scores"] | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Input container height - used for spacing calculations
  const inputContainerHeight = 70;

  const minPassingScore = simulation?.minimum_passing_score || 85;

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.FinalScore >= minPassingScore : false;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isStarted && !timerRef.current) {
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
  }, [isStarted]);

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

    setIsStarted(true);
    try {
      console.log("Starting chat simulation...");

      // Make a single API call to start the simulation
      const response = await startChatSimulation(
        userId,
        simulationId,
        assignmentId,
        attemptType,
      );

      console.log("Start chat response:", response);

      if (response.id) {
        setSimulationProgressId(response.id);

        // If there's an initial response, add it to messages
        if (response.response) {
          setMessages([
            {
              speaker: "customer",
              text: response.response,
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      setIsStarted(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !simulationProgressId || !userId) return;

    const newMessage: Message = {
      speaker: "trainee",
      text: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      console.log("Sending message:", inputMessage);

      // Use the sendChatMessage function instead of direct axios call
      const response = await sendChatMessage(
        userId,
        simulationId,
        assignmentId,
        inputMessage.trim(),
        simulationProgressId,
      );

      console.log("Message response:", response);

      if (response.response) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "customer",
            text: response.response || "",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = async () => {
    if (!simulationProgressId || !userId) {
      console.error("Missing required IDs to end chat");
      return;
    }

    setIsEndingChat(true);

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      // Format chat history for API
      const chatHistory = messages.map((msg) => ({
        sentence: msg.text,
        role: msg.speaker === "customer" ? "Customer" : "Trainee",
      }));

      console.log("Ending chat with history:", chatHistory);

      // Use the endChatSimulation function instead of direct axios call
      const response = await endChatSimulation(
        userId,
        simulationId,
        simulationProgressId,
        chatHistory,
      );

      console.log("End chat response:", response);

      if (response.scores) {
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
        // Even without scores, only show completion for Test attempts
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          onBackToList();
        }
      }
    } catch (error) {
      console.error("Error ending chat:", error);
      // On error, still check attempt type
      if (attemptType === "Test") {
        setShowCompletionScreen(true);
      } else {
        onBackToList();
      }
    } finally {
      setIsEndingChat(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
        onRestartSim={onRestartSim} // Chat doesn't have restart
        onViewPlayback={undefined} // Chat doesn't have playback
        hasNextSimulation={hasNextSimulation}
        minPassingScore={minPassingScore}
      />

      {/* Only render the chat interface when completion screen is NOT showing */}
      {!showCompletionScreen && (
        <Box
          sx={{
            height: "calc(100vh - 20px)",
            bgcolor: "white",
            py: 0,
            px: 0,
            position: "relative",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              maxWidth: "900px",
              mx: "auto",
              borderRadius: "16px",
              mb: 0.5,
            }}
          >
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
              height: isStarted ? "calc(100vh - 200px)" : "450px",
              mx: "auto",
              mt: 0.5,
              borderRadius: "16px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
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

            {!isStarted ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  width: "50%",
                  mx: "auto",
                  my: 2,
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
                  <HeadsetIcon size={96} color="#DEE2FD" />
                </Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
                >
                  Start Simulation
                </Typography>
                <Typography sx={{ color: "#666", mb: 4 }}>
                  Press start to attempt the Chat Simulation
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                  disabled={!userId}
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
                  Start Simulation
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
              <>
                <Box
                  ref={chatContainerRef}
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    px: 1,
                    py: 0.5,
                    "&::-webkit-scrollbar": { width: "8px" },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#E2E8F0",
                      borderRadius: "4px",
                    },
                    marginBottom: 0,
                  }}
                >
                  <Stack spacing={0.5}>
                    {messages.map((message, index) => (
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
                          <Typography variant="body1">
                            {message.text}
                          </Typography>
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

                {/* Sticky input area at bottom */}
                <Box
                  sx={{
                    position: "sticky",
                    bottom: 0,
                    p: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    bgcolor: "white",
                    display: "flex",
                    gap: 2,
                    zIndex: 100,
                    boxShadow: "0px -2px 10px rgba(0,0,0,0.05)",
                    marginTop: "auto",
                    borderBottomLeftRadius: "16px",
                    borderBottomRightRadius: "16px",
                  }}
                >
                  <TextField
                    fullWidth
                    multiline
                    maxRows={2}
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || isEndingChat}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      onClick={handleSendMessage}
                      disabled={
                        isLoading || !inputMessage.trim() || isEndingChat
                      }
                      sx={{
                        bgcolor: "#444CE7",
                        color: "white",
                        "&:hover": {
                          bgcolor: "#3538CD",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "#F5F6FF",
                          color: "#444CE7",
                        },
                      }}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <SendIcon />
                      )}
                    </IconButton>
                    <IconButton
                      onClick={handleEndChat}
                      disabled={isEndingChat || messages.length < 2}
                      sx={{
                        bgcolor: "#E6352B",
                        color: "white",
                        "&:hover": {
                          bgcolor: "#C82333",
                        },
                        "&.Mui-disabled": {
                          bgcolor: "#FFD1CF",
                        },
                      }}
                    >
                      {isEndingChat ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        <CallEndIcon />
                      )}
                    </IconButton>
                  </Stack>
                </Box>
              </>
            )}
          </Card>
        </Box>
      )}

      {/* Loading overlay for ending chat - moved outside the main content */}
      {isEndingChat && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255, 255, 255, 0.95)",
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Analyzing Attempt
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Evaluating your responses and calculating performance scores...
          </Typography>
        </Box>
      )}
    </>
  );
};

export default ChatSimulationPage;
