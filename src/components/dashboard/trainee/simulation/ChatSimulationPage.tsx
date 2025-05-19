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
} from "@mui/material";
import {
  SmartToy as SmartToyIcon,
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

      // Use the startChatSimulation function instead of direct axios call
      const response = await startChatSimulation(
        userId,
        simulationId,
        assignmentId,
        attemptType, // Pass the attemptType
      );

      console.log("Start chat response:", response);

      if (response.id) {
        setSimulationProgressId(response.id);
        // Wait for initial response
        const initialResponse = await sendChatMessage(
          userId,
          simulationId,
          assignmentId,
          "",
          response.id,
        );

        console.log("Initial message response:", initialResponse);

        if (initialResponse.response) {
          setMessages([
            {
              speaker: "customer",
              text: initialResponse.response,
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
        setShowCompletionScreen(true);
      }
    } catch (error) {
      console.error("Error ending chat:", error);
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
          sx={{ maxWidth: "900px", mx: "auto", borderRadius: "16px", mb: 0.5 }}
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
                <SmartToyIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
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
                startIcon={<SmartToyIcon />}
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
                    disabled={isLoading || !inputMessage.trim() || isEndingChat}
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

          {/* Loading overlay for ending chat */}
          {isEndingChat && (
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
                Evaluating your responses and calculating performance scores...
              </Typography>
            </Box>
          )}
        </Card>
      </Box>
    </>
  );
};

export default ChatSimulationPage;
