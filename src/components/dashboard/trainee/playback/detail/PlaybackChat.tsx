import React, { useEffect } from "react";
import { Stack, Paper, Typography, Box, Avatar, Chip } from "@mui/material";

interface PlaybackChatProps {
  messages: {
    type: "agent" | "customer";
    text: string;
    originalText?: string;
    scores?: {
      keywordScore: string;
      symAccuracy: string;
    };
  }[];
}

const PlaybackChat = ({ messages }: PlaybackChatProps) => {
  useEffect(() => {
  }, [messages]);

  console.log("messages", messages);

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
                  p: message.type === "agent" ? "12px" : 2,
                  bgcolor: message.type === "agent" ? "#FAFBFF" : "#FAFAFF",
                  border: message.type === "agent" ? "1px solid #0F174F99" : "2px solid #6D7295",
                  borderRadius: message.type === "agent" ? "16px 2px 16px 16px" : "0px 16px 16px 16px",
                  color: message.type === "agent" ? "#fff" : "primary.dark",
                  boxShadow: message.type === "agent" ? "0px 12px 24px -4px #343F8A1F" : "none",
                  width: message.type === "agent" ? 492 : undefined,
                  // height: message.type === "agent" ? 206 : 'auto',
                  maxWidth: message.type === "agent" ? 600 : undefined,
                  gap: message.type === "agent" ? "12px" : undefined,
                  // background: message.type === "agent"
                  //   ? "linear-gradient(180deg, #0072E5 17.97%, #08519A 100%), linear-gradient(0deg, #FFFFFF, #FFFFFF), linear-gradient(0deg, rgba(0, 30, 238, 0.02), rgba(0, 30, 238, 0.02))"
                  //   : undefined,
                }}
              >
                {/* AGENT (TRAINEE) MESSAGE DESIGN */}
                {message.type === "agent" ? (
                  <Stack spacing={2}>
                    {/* Main Text (with highlights if available) */}
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        color: "#23254C",
                        fontWeight: 400,
                        mb: 0,
                        fontSize: "16px",
                      }}
                    >
                      {message.text}
                    </Typography>

                    {/* Reference Text (bold, with highlights if available) */}
                    {message.originalText && (
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: "pre-wrap",
                          color: "text.primary",
                          fontWeight: 700,
                          mb: 1,
                        }}
                      >
                        {message.originalText}
                      </Typography>
                    )}

                    {/* Scores Row */}
                    {message.scores && (
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Chip
                          label={<><span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 100,
                            background: '#0F174F0A',
                            fontWeight: 700,
                          }}>{message.scores.keywordScore}</span> Keyword Score</>}
                          size="small"
                          sx={{
                            minWidth: 170,
                            maxWidth: 'none',
                            height: 36,
                            gap: '8px',
                            padding: 0,
                            borderRadius: '100px',
                            border: '1px solid #0F174F66',
                            bgcolor: '#fff',
                            color: '#1C2358',
                            fontSize: '14px',
                            lineHeight: '20px',
                            letterSpacing: 0,
                            fontWeight: 500,
                            transition: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            textOverflow: 'unset',
                            '&:hover': {
                              bgcolor: '#E6EAF5',
                              cursor: 'pointer',
                            },
                          }}
                        />
                        <Chip
                          label={<><span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: 100,
                            background: '#0F174F0A',
                            fontWeight: 700,
                          }}>{message.scores.symAccuracy}</span> Sym Accuracy</>}
                          size="small"
                          sx={{
                            minWidth: 170,
                            maxWidth: 'none',
                            height: 36,
                            gap: '8px',
                            padding: 0,
                            borderRadius: '100px',
                            border: '1px solid #0F174F66',
                            bgcolor: '#fff',
                            color: '#1C2358',
                            fontFamily: 'Inter',
                            fontSize: '14px',
                            lineHeight: '20px',
                            letterSpacing: 0,
                            fontWeight: 500,
                            transition: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            textOverflow: 'unset',
                            '&:hover': {
                              bgcolor: '#E6EAF5',
                              cursor: 'pointer',
                            },
                          }}
                        />
                      </Stack>
                    )}
                  </Stack>
                ) : (
                  // CUSTOMER MESSAGE DESIGN
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
                sx={{ width: 40, height: 40, alignSelf: "center" }}
              />
            )}
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

export default PlaybackChat;