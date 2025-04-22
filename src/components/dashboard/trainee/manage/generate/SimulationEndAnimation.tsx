import React, { useEffect } from "react";
import { Box, Typography, CircularProgress, Fade } from "@mui/material";
import { CheckCircle, Done } from "@mui/icons-material";

interface SimulationEndAnimationProps {
  onComplete: () => void;
  message?: string;
}

/**
 * Animation component shown when a simulation ends
 */
const SimulationEndAnimation: React.FC<SimulationEndAnimationProps> = ({
  onComplete,
  message = "Simulation Completed",
}) => {
  // Trigger onComplete callback after animation duration
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Fade in={true}>
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
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 1500,
          color: "white",
        }}
      >
        <Box
          sx={{
            bgcolor: "#fff",
            borderRadius: 3,
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 320,
            boxShadow: 3,
          }}
        >
          <CheckCircle
            sx={{
              fontSize: 80,
              color: "#3FAB20",
              mb: 2,
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(0.9)", opacity: 0.8 },
                "50%": { transform: "scale(1.1)", opacity: 1 },
                "100%": { transform: "scale(0.9)", opacity: 0.8 },
              },
            }}
          />
          <Typography variant="h5" gutterBottom sx={{ color: "#222" }}>
            {message}
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default SimulationEndAnimation;
