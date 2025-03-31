import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Avatar,
  IconButton,
  TextField,
} from "@mui/material";
import {
  HeadsetMic,
  PlayArrow,
  CallEnd,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { RetellWebClient } from "retell-client-js-sdk";
import VisualAudioPreview from "./VisualAudioPreview";
import VisualChatPreview from "./VisualChatPreview";
import VisualPreview from "./VisualPreview";

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
  const previousTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (simulationType === "audio") {
      webClient.on("conversationStarted", () => {
        console.log("Conversation started");
      });

      webClient.on("conversationEnded", ({ code, reason }) => {
        console.log("Conversation ended:", code, reason);
        setIsCallActive(false);
      });

      webClient.on("error", (error) => {
        console.error("WebRTC error:", error);
        setIsCallActive(false);
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

  const handleStart = async () => {
    setIsStarting(true);
    try {
      if (
        simulationType === "visual-audio" ||
        simulationType === "visual-chat" ||
        simulationType === "visual"
      ) {
        await fetchSimulationData();
        setIsCallActive(true);
        setMessages([
          {
            speaker: "customer",
            text:
              simulationType === "visual-chat"
                ? "Initializing visual chat..."
                : simulationType === "visual"
                  ? "Initializing visual simulation..."
                  : "",
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

        const response = await axios.post(
          "/api/simulations/start-audio-preview",
          {
            user_id: "user123",
            sim_id: simulationId,
          },
        );

        if (response.data.access_token) {
          await webClient.startCall({
            accessToken: response.data.access_token,
          });
        }
      } else {
        setIsCallActive(true);
        const response = await axios.post(
          "/api/simulations/start-chat-preview",
          {
            user_id: "user123",
            sim_id: simulationId,
            message: "",
          },
        );

        if (response.data.response) {
          setMessages([
            {
              speaker: "customer",
              text: response.data.response,
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
      const response = await axios.post("/api/simulations/start-chat-preview", {
        user_id: "user123",
        sim_id: simulationId,
        message: inputMessage.trim(),
      });

      if (response.data.response) {
        setMessages((prev) => [
          ...prev,
          {
            speaker: "customer",
            text: response.data.response,
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

  const handleEndCall = () => {
    if (simulationType === "audio" || simulationType === "visual-audio") {
      webClient.stopCall();
    }
    setIsCallActive(false);
  };

  // If it's a visual-audio simulation and we have data, render the VisualAudioPreview
  if (simulationType === "visual-audio" && simulationData && slides.size > 0) {
    return (
      <VisualAudioPreview simulationData={simulationData} slides={slides} />
    );
  }

  // If it's a visual-chat simulation and we have data, render the VisualChatPreview
  if (simulationType === "visual-chat" && simulationData && slides.size > 0) {
    return (
      <VisualChatPreview simulationData={simulationData} slides={slides} />
    );
  }

  // If it's a visual simulation and we have data, render the VisualPreview
  if (simulationType === "visual" && simulationData && slides.size > 0) {
    return <VisualPreview simulationData={simulationData} slides={slides} />;
  }

  return (
    <Box sx={{ height: "100vh", bgcolor: "white", py: 0, px: 0 }}>
      <Card
        sx={{
          maxWidth: "900px",
          minHeight: "600px",
          mx: "auto",
          borderRadius: "16px",
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
                border: "1px solid #ccc",
                borderRadius: "16px",
                mx: "auto",
                maxWidth: "80%",
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

              {simulationType === "chat" ? (
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
                    disabled={isLoading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
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
              ) : (
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
                    justifyContent: "center",
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
        </Box>
      </Card>
    </Box>
  );
};

export default PreviewTab;
