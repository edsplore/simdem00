import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Stack,
  Avatar,
  IconButton,
  TextField,
  Modal,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  HeadsetMic,
  PlayArrow,
  Pause,
  CallEnd,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import axios from "axios";
import { RetellWebClient } from "retell-client-js-sdk";
import SimulationEndAnimation from "./SimulationEndAnimation";
import VisualAudioPreview from "./VisualAudioPreview";
import VisualChatPreview from "./VisualChatPreview";
import VisualPreview from "./VisualPreview";
import {
  startAudioPreview,
  startChatPreview,
  startVisualAudioPreview,
  startVisualChatPreview,
  startVisualPreview,
  createImageMap,
} from "../../../../../services/simulation_previews";

interface Message {
  speaker: "customer" | "trainee";
  text: string;
}

interface ImageData {
  image_id: string;
  image_data: string;
}

interface SimulationData {
  id: string;
  sim_name: string;
  version: string;
  lvl1: {
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
  };
  lvl2: {
    isEnabled: boolean;
  };
  lvl3: {
    isEnabled: boolean;
  };
  sim_type: string;
  status: string;
  tags: string[];
  est_time: string;
  script: Array<{
    script_sentence: string;
    role: string;
    keywords: string[];
  }>;
  slidesData: Array<{
    imageId: string;
    imageName: string;
    imageUrl: string;
    sequence: Array<{
      type: string;
      id: string;
      name?: string;
      hotspotType?: string;
      coordinates?: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      settings?: any;
      role?: string;
      text?: string;
      options?: string[];
    }>;
  }>;
}

interface PreviewTabProps {
  simulationId: string;
  simulationType?: "audio" | "chat" | "visual-audio" | "visual-chat" | "visual";
}

const webClient = new RetellWebClient();

const PreviewTab: React.FC<PreviewTabProps> = ({
  simulationId,
  simulationType = "audio",
}) => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null,
  );
  const [slides, setSlides] = useState<Map<string, string>>(new Map());
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const previousTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Input container height - used for spacing calculations
  const inputContainerHeight = 80;

  // New state for simulation ending animation
  const [showEndAnimation, setShowEndAnimation] = useState(false);

  useEffect(() => {
    if (simulationType === "audio") {
      webClient.on("conversationStarted", () => {
        console.log("Conversation started");
      });

      webClient.on("conversationEnded", ({ code, reason }) => {
        console.log("Conversation ended:", code, reason);
        handleEndSimulation();
      });

      webClient.on("error", (error) => {
        console.error("WebRTC error:", error);
        handleEndSimulation();
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
        webClient.stopCall();
      };
    }
  }, [simulationType]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchSimulationData = async () => {
    try {
      // Use different API endpoints based on simulation type
      let endpoint = "";

      if (simulationType === "visual-chat") {
        endpoint = "/api/simulations/start-visual-chat-preview";
      } else if (simulationType === "visual-audio") {
        endpoint = "/api/simulations/start-visual-audio-preview";
      } else if (simulationType === "visual") {
        endpoint = "/api/simulations/start-visual-preview";
      }

      const response = await axios.post(endpoint, {
        user_id: "user123",
        sim_id: simulationId,
      });

      console.log("Simulation data received:", response.data);

      if (response.data.simulation) {
        setSimulationData(response.data.simulation);
      }

      // Process image data
      if (response.data.images) {
        const newSlides = new Map();
        for (const image of response.data.images) {
          // Convert base64 string to Uint8Array
          const binaryString = atob(image.image_data);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Create blob from Uint8Array
          const blob = new Blob([bytes], { type: "image/png" });
          const blobUrl = URL.createObjectURL(blob);
          newSlides.set(image.image_id, blobUrl);
        }
        setSlides(newSlides);
      }
    } catch (error) {
      console.error("Error fetching simulation data:", error);
      throw error;
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      slides.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [slides]);

  // Handle simulation end - unified method for all simulation types
  const handleEndSimulation = () => {
    // Show ending animation
    setShowEndAnimation(true);

    // If audio or visual-audio, stop the client
    if (simulationType === "audio" || simulationType === "visual-audio") {
      webClient.stopCall();
    }
  };

  // Handle the completion of the ending animation
  const handleEndAnimationComplete = () => {
    // Reset all states to initial
    setShowEndAnimation(false);
    setIsCallActive(false);
    setMessages([]);
    // Clear any data that should be reset
    setSimulationData(null);
    setSlides(new Map());
  };

  const handleStart = async () => {
    setIsStarting(true);
    try {
      if (simulationType === "visual-audio") {
        const response = await startVisualAudioPreview("user123", simulationId);

        setSimulationData(response.simulation);
        setSlides(createImageMap(response.images));
        setIsCallActive(true);
        setMessages([
          {
            speaker: "customer",
            text: "",
          },
        ]);
      } else if (simulationType === "visual-chat") {
        const response = await startVisualChatPreview("user123", simulationId);

        setSimulationData(response.simulation);
        setSlides(createImageMap(response.images));
        setIsCallActive(true);
        setMessages([
          {
            speaker: "customer",
            text: "Initializing visual chat...",
          },
        ]);
      } else if (simulationType === "visual") {
        const response = await startVisualPreview("user123", simulationId);

        setSimulationData(response.simulation);
        setSlides(createImageMap(response.images));
        setIsCallActive(true);
        setMessages([
          {
            speaker: "customer",
            text: "Initializing visual simulation...",
          },
        ]);
      } else if (simulationType === "audio") {
        setIsCallActive(true);
        setMessages([
          {
            speaker: "customer",
            text: "Connecting...",
          },
        ]);

        const response = await startAudioPreview("user123", simulationId);

        if (response.access_token) {
          await webClient.startCall({
            accessToken: response.access_token,
          });
        }
      } else {
        // Chat type
        setIsCallActive(true);
        const response = await startChatPreview("user123", simulationId);

        if (response.response) {
          setMessages([
            {
              speaker: "customer",
              text: response.response,
            },
          ]);
        }
      }
    } catch (error) {
      console.error(`Error starting ${simulationType} preview:`, error);
      setIsCallActive(false);
      setMessages([]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      speaker: "trainee",
      text: inputMessage.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await startChatPreview(
        "user123",
        simulationId,
        inputMessage.trim(),
      );

      if (response.response) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "customer",
            text: response.response,
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Toggle pause/play
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Original end call function now just calls our unified handler
  const handleEndCall = () => {
    handleEndSimulation();
  };

  // If it's a visual-audio simulation and we have data, render the VisualAudioPreview
  if (simulationType === "visual-audio" && simulationData && slides.size > 0) {
    return (
      <>
        {showEndAnimation && (
          <SimulationEndAnimation onComplete={handleEndAnimationComplete} />
        )}
        <VisualAudioPreview
          simulationData={simulationData}
          slides={slides}
          onEndSimulation={handleEndSimulation}
        />
      </>
    );
  }

  // If it's a visual-chat simulation and we have data, render the VisualChatPreview
  if (simulationType === "visual-chat" && simulationData && slides.size > 0) {
    return (
      <>
        {showEndAnimation && (
          <SimulationEndAnimation onComplete={handleEndAnimationComplete} />
        )}
        <VisualChatPreview
          simulationData={simulationData}
          slides={slides}
          onEndSimulation={handleEndSimulation}
        />
      </>
    );
  }

  // If it's a visual simulation and we have data, render the VisualPreview
  if (simulationType === "visual" && simulationData && slides.size > 0) {
    return (
      <>
        {showEndAnimation && (
          <SimulationEndAnimation onComplete={handleEndAnimationComplete} />
        )}
        <VisualPreview
          simulationData={simulationData}
          slides={slides}
          onEndSimulation={handleEndSimulation}
        />
      </>
    );
  }

  return (
    <Box
      sx={{
        height: "calc(100vh - 20px)",
        bgcolor: "white",
        py: 0,
        px: 0,
        position: "relative",
      }}
    >
      {/* Ending Animation */}
      {showEndAnimation && (
        <SimulationEndAnimation onComplete={handleEndAnimationComplete} />
      )}

      {/* Pause Modal - Add for chat type */}
      {simulationType === "chat" && (
        <Modal
          open={isPaused}
          onClose={togglePause}
          closeAfterTransition
          slotProps={{
            backdrop: {
              timeout: 500,
            },
          }}
          sx={{
            backdropFilter: "blur(5px)",
          }}
        >
          <Fade in={isPaused}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "background.paper",
                borderRadius: 2,
                boxShadow: 24,
                p: 4,
                textAlign: "center",
              }}
            >
              <PlayArrow sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
              <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                Simulation Paused
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Click anywhere or press the play button to continue
              </Typography>
              <Button
                variant="contained"
                onClick={togglePause}
                startIcon={<PlayArrow />}
              >
                Resume Simulation
              </Button>
            </Box>
          </Fade>
        </Modal>
      )}

      <Card
        sx={{
          maxWidth: "900px",
          height: isCallActive ? `calc(100vh - 200px)` : "450px",
          mx: "auto",
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

        {!isCallActive ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              border: "1px solid #ccc",
              borderRadius: "16px",
              mx: "auto",
              width: "60%",
              my: 4,
            }}
          >
            <Box
              sx={{
                bgcolor: "#f5f7ff",
                borderRadius: "50%",
                p: 3,
                mb: 3,
              }}
            >
              {simulationType === "audio" ||
              simulationType === "visual-audio" ? (
                <HeadsetMic sx={{ fontSize: 48, color: "#4c6ef5" }} />
              ) : simulationType === "visual" ? (
                <VisibilityIcon sx={{ fontSize: 48, color: "#4c6ef5" }} />
              ) : (
                <SmartToyIcon sx={{ fontSize: 48, color: "#4c6ef5" }} />
              )}
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "#1a1a1a", mb: 1 }}
            >
              Preview Simulation
            </Typography>
            <Typography sx={{ color: "#666", mb: 2 }}>
              Press start to preview the simulation
            </Typography>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={handleStart}
              disabled={isStarting}
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
              {isStarting ? "Starting..." : "Start"}
            </Button>
          </Box>
        ) : (
          <>
            {/* Modified chat container for chat type */}
            <Box
              ref={chatContainerRef}
              sx={{
                flex: 1,
                overflowY: "auto",
                px: 1,
                py: 0.75,
                "&::-webkit-scrollbar": { width: "8px" },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#E2E8F0",
                  borderRadius: "4px",
                },
              }}
            >
              <Stack spacing={0.75}>
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
                        p: 1,
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

            {simulationType === "chat" ? (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  padding: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  zIndex: 100,
                  boxShadow: "0px -2px 10px rgba(0,0,0,0.05)",
                  marginTop: "auto",
                  borderBottomLeftRadius: "16px",
                  borderBottomRightRadius: "16px",
                }}
              >
                {/* Controls Row */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {isCallActive
                      ? isPaused
                        ? "Paused"
                        : "Connected"
                      : "Offline"}
                  </Typography>
                  <Box>
                    <IconButton
                      onClick={togglePause}
                      sx={{ bgcolor: "grey.100", mr: 1 }}
                    >
                      {isPaused ? <PlayArrow /> : <Pause />}
                    </IconButton>

                    <IconButton
                      onClick={handleEndCall}
                      sx={{
                        bgcolor: "error.main",
                        color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                      }}
                    >
                      <CallEnd />
                    </IconButton>
                  </Box>
                </Box>

                {/* Input Row */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={2}
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading || isPaused}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={isLoading || isPaused || !inputMessage.trim()}
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
                    <SendIcon />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  position: "sticky",
                  bottom: 0,
                  padding: 1,
                  borderTop: "1px solid",
                  borderColor: "divider",
                  bgcolor: "white",
                  display: "flex",
                  justifyContent: "center",
                  zIndex: 100,
                  boxShadow: "0px -2px 10px rgba(0,0,0,0.05)",
                  marginTop: "auto",
                  borderBottomLeftRadius: "16px",
                  borderBottomRightRadius: "16px",
                }}
              >
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CallEnd />}
                  onClick={handleEndCall}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    px: 4,
                  }}
                >
                  End Call
                </Button>
              </Box>
            )}
          </>
        )}
      </Card>
    </Box>
  );
};

export default PreviewTab;
