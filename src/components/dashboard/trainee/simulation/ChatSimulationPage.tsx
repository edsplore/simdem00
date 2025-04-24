import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
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
  assignmentId: string;
}

interface ChatResponse {
  id: string;
  status: string;
  access_token: string | null;
  response: string | null;
}

interface EndChatResponse {
  id: string;
  status: string;
  scores: {
    "Sim Accuracy": number;
    "Keyword Score": number;
    "Click Score": number;
    Confidence: number;
    Energy: number;
    Concentration: number;
  };
  duration: number;
  transcript: string;
  audio_url: string;
}

// Minimum passing score threshold
const MIN_PASSING_SCORE = 85;

const ChatSimulationPage: React.FC<ChatSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  assignmentId,
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

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores["Sim Accuracy"] >= MIN_PASSING_SCORE : false;

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

    setIsStarted(true);
    try {
      console.log("Starting chat simulation...");
      // Initial API call to start chat simulation
      const response = await axios.post<ChatResponse>(
        "/api/simulations/start-chat",
        {
          user_id: userId,
          sim_id: simulationId,
          assignment_id: assignmentId,
        },
      );

      console.log("Start chat response:", response.data);

      if (response.data.id) {
        setSimulationProgressId(response.data.id);
        // Wait for initial response
        const initialResponse = await axios.post<ChatResponse>(
          "/api/simulations/start-chat",
          {
            user_id: userId,
            sim_id: simulationId,
            assignment_id: "679fc6ffcbee8fef61c99eb1",
            message: "",
            usersimulationprogress_id: response.data.id,
          },
        );

        console.log("Initial message response:", initialResponse.data);

        if (initialResponse.data.response) {
          setMessages([
            {
              speaker: "customer",
              text: initialResponse.data.response,
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
      const response = await axios.post<ChatResponse>(
        "/api/simulations/start-chat",
        {
          user_id: userId,
          sim_id: simulationId,
          assignment_id: "679fc6ffcbee8fef61c99eb1",
          message: inputMessage.trim(),
          usersimulationprogress_id: simulationProgressId,
        },
      );

      console.log("Message response:", response.data);

      if (response.data.response) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "customer",
            text: response.data.response || "",
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

      const response = await axios.post<EndChatResponse>(
        "/api/simulations/end-chat",
        {
          user_id: userId,
          simulation_id: simulationId,
          usersimulationprogress_id: simulationProgressId,
          chat_history: chatHistory,
        },
      );

      console.log("End chat response:", response.data);

      if (response.data.scores) {
        setScores(response.data.scores);
        setDuration(response.data.duration || elapsedTime);
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

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsStarted(false);
    setMessages([]);
    setElapsedTime(0);
    setScores(null);
    setSimulationProgressId(null);
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
          {!isStarted ? (
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
                  height: "calc(100% - 70px)", // Reduced from 80px to 70px
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

              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "white",
                  display: "flex",
                  gap: 2,
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
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
        </Box>

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
              bgcolor: "rgba(255, 255, 255, 0.8)",
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

export default ChatSimulationPage;
