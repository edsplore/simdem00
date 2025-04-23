import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Stack,
  Container,
  Typography,
  Button,
  Box,
  Card,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import DashboardContent from "../DashboardContent";
import ChatSimulationPage from "./simulation/ChatSimulationPage";
import AudioSimulationPage from "./simulation/AudioSimulationPage";
import VisualAudioSimulationPage from "./simulation/VisualAudioSimulationPage";
import VisualChatSimulationPage from "./simulation/VisualChatSimulationPage";
import VisualSimulationPage from "./simulation/VisualSimulationPage";
import { fetchSimulationById } from "../../../services/simulations";
import type { Simulation } from "../../../types/training";

const SimulationAttemptPage = () => {
  const { id: simulationId, assignment_id: assignmentId } = useParams<{
    id: string;
    assignment_id: string;
  }>();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<"Test" | "Practice">(
    "Test",
  );
  const [showStartPage, setShowStartPage] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSimulation = async () => {
      if (!simulationId) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSimulationById(simulationId);
        setSimulation(data);

        // Automatically select the first enabled level
        if (data?.lvl1?.isEnabled) {
          setSelectedLevel("Level 01");
        } else if (data?.lvl2?.isEnabled) {
          setSelectedLevel("Level 02");
        } else if (data?.lvl3?.isEnabled) {
          setSelectedLevel("Level 03");
        }
      } catch (err) {
        console.error("Error loading simulation:", err);
        setError("Failed to load simulation");
      } finally {
        setIsLoading(false);
      }
    };

    loadSimulation();
  }, [simulationId]);

  const handleContinue = () => {
    if (!simulation) return;
    setShowStartPage(true);
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <Container>
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </DashboardContent>
    );
  }

  if (error || !simulation) {
    return (
      <DashboardContent>
        <Container>
          <Alert severity="error" sx={{ mt: 4 }}>
            {error || "Simulation not found"}
          </Alert>
        </Container>
      </DashboardContent>
    );
  }

  if (showStartPage) {
    let SimulationComponent;

    // Determine which simulation component to use based on sim_type
    if (simulation.sim_type === "chat") {
      SimulationComponent = ChatSimulationPage;
    } else if (simulation.sim_type === "visual-chat") {
      SimulationComponent = VisualChatSimulationPage;
    } else if (simulation.sim_type === "visual") {
      SimulationComponent = VisualSimulationPage;
    } else if (simulation.sim_type === "visual-audio") {
      SimulationComponent = VisualAudioSimulationPage;
    } else {
      SimulationComponent = AudioSimulationPage;
    }

    return (
      <SimulationComponent
        simulationId={simulation.id}
        simulationName={simulation.sim_name}
        level={selectedLevel}
        simType={simulation.sim_type}
        attemptType={selectedAttempt}
        assignmentId={assignmentId} // Add this line
        onBackToList={() => setShowStartPage(false)}
      />
    );
  }

  return (
    <DashboardContent>
      <Container maxWidth="lg" sx={{ py: 2, bgcolor: "#F3F5F5" }}>
        <Card sx={{ p: 2, borderRadius: 3 }}>
          <Box
            sx={{ display: "flex", justifyContent: "center", height: "100vh" }}
          >
            <Stack spacing={1.5} maxWidth="md" sx={{ width: "100%" }}>
              <Box
                sx={{ border: "1px solid #0F174F99", borderRadius: 5, p: 2 }}
              >
                {/* Title and Actions */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="h2" sx={{ fontWeight: "bold" }}>
                    {simulation.sim_name}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {simulation.overview_video && (
                      <Button
                        startIcon={<PlayArrowIcon />}
                        variant="text"
                        sx={{ color: "#3A4170", bgcolor: "#F6F6FF", px: 2 }}
                        onClick={() =>
                          window.open(simulation.overview_video, "_blank")
                        }
                      >
                        Overview Video
                      </Button>
                    )}
                  </Stack>
                </Stack>

                {/* Level Selection */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#0F174F99" }}
                    gutterBottom
                  >
                    Select Level:
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    {[
                      {
                        label: "Level 01",
                        enabled: simulation?.lvl1?.isEnabled,
                      },
                      {
                        label: "Level 02",
                        enabled: simulation?.lvl2?.isEnabled,
                      },
                      {
                        label: "Level 03",
                        enabled: simulation?.lvl3?.isEnabled,
                      },
                    ].map((level) => (
                      <Button
                        key={level.label}
                        disabled={!level.enabled}
                        onClick={() => setSelectedLevel(level.label)}
                        sx={{
                          border:
                            selectedLevel === level.label
                              ? "2px solid #001EEE"
                              : "1px solid #0F174F99",
                          color:
                            selectedLevel === level.label
                              ? "#001EEE"
                              : level.enabled
                                ? "black"
                                : "#999",
                          fontWeight:
                            selectedLevel === level.label ? "bold" : "normal",
                          backgroundColor:
                            selectedLevel === level.label ? "#FAFAFF" : "white",
                          borderRadius: "20px",
                          px: 3,
                          opacity: level.enabled ? 1 : 0.5,
                          cursor: level.enabled ? "pointer" : "not-allowed",
                        }}
                      >
                        {level.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                {/* Attempt Type Selection */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#0F174F99" }}
                    gutterBottom
                  >
                    Attempt as:
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    {[
                      {
                        key: "Test",
                        icon: <SmartToyIcon />,
                        title: "Test",
                        subtitle: "Subtitle goes here",
                      },
                      {
                        key: "Practice",
                        icon: <PlayArrowIcon />,
                        title: "Practice",
                        subtitle: "Subtitle goes here",
                      },
                    ].map((option) => (
                      <Card
                        key={option.key}
                        onClick={() =>
                          setSelectedAttempt(option.key as "Test" | "Practice")
                        }
                        sx={{
                          flex: 1,
                          p: 2,
                          cursor: "pointer",
                          border:
                            selectedAttempt === option.key
                              ? "2px solid #001EEE"
                              : "1px solid #0F174F99",
                          bgcolor:
                            selectedAttempt === option.key
                              ? "#FAFAFF"
                              : "white",
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            sx={{
                              width: 58,
                              height: 58,
                              borderRadius: "50%",
                              bgcolor: "#F5F6FE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {option.icon}
                          </Box>
                          <Stack spacing={0.5}>
                            <Typography variant="h4">{option.title}</Typography>
                            <Typography variant="body2">
                              {option.subtitle}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                {/* Learning Objectives */}
                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "#0F174F99" }}
                    gutterBottom
                  >
                    You will learn
                  </Typography>
                  <Box
                    sx={{
                      border: "1px solid #0F174F99",
                      borderRadius: "8px",
                      p: 1,
                      width: "28%",
                    }}
                  >
                    <Stack spacing={0}>
                      {simulation?.key_objectives?.map((objective, index) => (
                        <Typography
                          key={index}
                          variant="body2"
                          sx={{ fontSize: "13px" }}
                          color="text.secondary"
                        >
                          {index + 1}. {objective}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                {/* Continue Button */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleContinue}
                  disabled={!selectedLevel || !selectedAttempt}
                  sx={{
                    bgcolor: "#444CE7",
                    mt: 3,
                    borderRadius: 1.5,
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
                  Continue
                </Button>
              </Box>

              {/* Quick Tips */}
              <Box sx={{ border: "1px solid grey", borderRadius: 3, p: 1.5 }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{
                    bgcolor: "#F9FAFB",
                    display: "flex",
                    alignItems: "center",
                    p: "4px 12px",
                    width: "100%",
                    mt: "-3px",
                    borderRadius: "3px 3px 0 0",
                  }}
                >
                  Quick Tips
                </Typography>
                <Stack spacing={0}>
                  {simulation?.quick_tips?.map((tip, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "13px" }}
                    >
                      {index + 1}. {tip}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Card>
      </Container>
    </DashboardContent>
  );
};

export default SimulationAttemptPage;
