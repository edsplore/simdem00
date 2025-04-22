// components/AudioRecorder.tsx
import React, { useState, useEffect } from "react";
import { IconButton, Box, CircularProgress, Tooltip } from "@mui/material";
import { Mic, Stop, Close } from "@mui/icons-material";
import { useAudioRecorder } from "./useAudioRecorder";

interface AudioRecorderProps {
  onTranscriptionReceived: (text: string) => void;
  apiEndpoint?: string;
  userId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptionReceived,
  apiEndpoint = "/api/convert/audio-to-text",
  userId = "user123",
}) => {
  const {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder({
    onTranscriptionReceived,
    apiEndpoint,
    userId,
  });

  // Visual recording indicator
  const [recordingTime, setRecordingTime] = useState(0);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Format recording time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isRecording ? (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              bgcolor: "error.light",
              color: "white",
              borderRadius: 4,
              px: 1.5,
              py: 0.5,
              fontSize: "0.75rem",
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { opacity: 0.7 },
                "50%": { opacity: 1 },
                "100%": { opacity: 0.7 },
              },
            }}
          >
            Recording {formatTime(recordingTime)}
          </Box>
          <Tooltip title="Stop Recording">
            <IconButton
              onClick={stopRecording}
              color="primary"
              sx={{
                bgcolor: "error.main",
                color: "white",
                "&:hover": { bgcolor: "error.dark" },
              }}
            >
              <Stop />
            </IconButton>
          </Tooltip>
          <Tooltip title="Cancel Recording">
            <IconButton
              onClick={cancelRecording}
              sx={{
                color: "text.secondary",
              }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </>
      ) : isProcessing ? (
        <Tooltip title="Processing audio...">
          <CircularProgress size={24} />
        </Tooltip>
      ) : (
        <Tooltip title="Start Recording">
          <IconButton
            onClick={startRecording}
            sx={{
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Mic />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default AudioRecorder;
