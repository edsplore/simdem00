import React, { useEffect } from "react";
import {
  Stack,
  Paper,
  Typography,
  Box,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";

interface Message {
  type: "agent" | "customer";
  text: string;
  originalText?: string;
  scores?: {
    keywordScore: string;
    symAccuracy: string;
  };
}

interface PlaybackChatProps {
  messages: any[];
}

const PlaybackChat = ({ messages }: PlaybackChatProps) => {
  useEffect(() => {
  }, [messages]);

  return (
    <Box
      sx={{
        padding: 2,
        paddingBottom: 4, // Extra padding at bottom
      }}
    >
      <Stack spacing={2}>
        {messages.map((message, index) => (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            justifyContent={
              message.type === "customer" ? "flex-start" : "flex-end"
            }
          >
            {message.type === "customer" && (
              <Avatar sx={{ width: 32, height: 32 }}>C</Avatar>
            )}
            <Box sx={{ maxWidth: "80%" }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  bgcolor:
                    message.type === "customer" ? "#FAFAFF" : "#FAFAFF",
                  border:
                    message.type === "agent"
                      ? "2px solid #6D7295"
                      : "2px solid #6D7295",
                  borderColor:
                    message.type === "agent" ? "#6D7295" : "#6D7295",
                  borderRadius:
                    message.type === "agent"
                      ? "16px 0px 16px 16px"
                      : "0px 16px 16px 16px",
                  color:
                    message.type === "agent"
                      ? "primary.dark"
                      : "primary.dark",
                }}
              >
                {message.type === "agent" && (
                  <Stack spacing={2}>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        color: "text.primary",
                      }}
                    >
                      {message.text}
                    </Typography>

                    <Divider sx={{ borderColor: "divider" }} />

                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        color: "text.primary",
                      }}
                    >
                      {message.originalText}
                    </Typography>

                    {message.scores && (
                      <>
                        <Divider sx={{ borderColor: "divider" }} />
                        <Stack direction="row" spacing={2}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                bgcolor: "white",
                                border: "2px solid #6D7295",
                                borderRadius: 5,
                                color: "primary.dark",
                                p: 1.1,
                              }}
                            >
                              <Chip
                                label={message.scores.keywordScore}
                                size="small"
                                sx={{
                                  height: 20,
                                  bgcolor: "#F1F1F8",
                                  color: "primary.dark",
                                  borderRadius: "16px",
                                  "& .MuiChip-label": {
                                    px: 1,
                                    fontSize: "0.75rem",
                                    color: "primary.dark",
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ ml: 1, color: "primary.dark" }}
                              >
                                Keyword Score
                              </Typography>
                            </Box>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                bgcolor: "white",
                                border: "2px solid #6D7295",
                                color: "primary.dark",
                                borderRadius: 5,
                                p: 1.1,
                              }}
                            >
                              <Chip
                                label={message.scores.symAccuracy}
                                size="small"
                                sx={{
                                  height: 20,
                                  bgcolor: "#F1F1F8",
                                  color: "primary.dark",
                                  borderRadius: "16px",
                                  "& .MuiChip-label": {
                                    px: 1,
                                    fontSize: "0.75rem",
                                    color: "primary.dark",
                                  },
                                }}
                              />
                              <Typography
                                variant="caption"
                                sx={{ ml: 1, color: "primary.dark" }}
                              >
                                Sim Accuracy
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </>
                    )}
                  </Stack>
                )}
                {message.type === "customer" && (
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      color: "text.primary",
                    }}
                  >
                    {message.text}
                  </Typography>
                )}
              </Paper>
            </Box>
            {message.type === "agent" && (
              <Avatar
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&h=256&q=80"
                sx={{ width: 32, height: 32 }}
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default PlaybackChat;