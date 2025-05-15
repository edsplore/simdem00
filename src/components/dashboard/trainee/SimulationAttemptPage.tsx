import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Stack,
  Container,
  Typography,
  Button,
  Box,
  Card,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  SmartToy as SmartToyIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import DashboardContent from "../DashboardContent";
import ChatSimulationPage from "./simulation/ChatSimulationPage";
import AudioSimulationPage from "./simulation/AudioSimulationPage";
import VisualAudioSimulationPage from "./simulation/VisualAudioSimulationPage";
import VisualChatSimulationPage from "./simulation/VisualChatSimulationPage";
import VisualSimulationPage from "./simulation/VisualSimulationPage";
import { fetchSimulationById } from "../../../services/simulations";
import { fetchTrainingData } from "../../../services/training";
import { useAuth } from "../../../context/AuthContext";
import type { Simulation, TrainingData } from "../../../types/training";

interface SimulationItem {
  simulation_id: string;
  name: string;
  type: string;
  status: string;
  assignment_id: string;
}

const SimulationAttemptPage = () => {
  const { id: simulationId, assignment_id: assignmentId } = useParams<{
    id: string;
    assignment_id: string;
  }>();
  const navigate = useNavigate();
  const { user, currentWorkspaceId } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<
    "Test" | "Practice" | null
  >(null);
  const [showStartPage, setShowStartPage] = useState(false);
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingData, setTrainingData] = useState<TrainingData | null>(null);
  const [allSimulations, setAllSimulations] = useState<SimulationItem[]>([]);
  const [currentSimIndex, setCurrentSimIndex] = useState(0);

  // Fetch training data and extract all simulations
  useEffect(() => {
    const loadTrainingData = async () => {
      if (!user?.id) return;

      try {
        const data = await fetchTrainingData(user.id);
        setTrainingData(data);

        // Use a Map to track unique simulation + assignment combinations
        const simulationMap = new Map<string, SimulationItem>();

        // Helper function to add simulation to map
        const addSimulation = (sim: any) => {
          const key = `${sim.simulation_id}-${sim.assignment_id}`;

          // Only add if this exact combination doesn't exist yet
          if (!simulationMap.has(key)) {
            simulationMap.set(key, {
              simulation_id: sim.simulation_id,
              name: sim.name,
              type: sim.type,
              status: sim.status,
              assignment_id: sim.assignment_id,
            });
          }
        };

        // From training plans (both modules and direct simulations)
        if (data.training_plans) {
          data.training_plans.forEach((plan) => {
            // Simulations from modules within training plans
            plan.modules.forEach((module) => {
              module.simulations.forEach((sim) => {
                addSimulation(sim);
              });
            });

            // Direct simulations in training plans
            plan.simulations.forEach((sim) => {
              addSimulation(sim);
            });
          });
        }

        // From standalone modules
        if (data.modules) {
          data.modules.forEach((module) => {
            module.simulations.forEach((sim) => {
              addSimulation(sim);
            });
          });
        }

        // From standalone simulations
        if (data.simulations) {
          data.simulations.forEach((sim) => {
            addSimulation(sim);
          });
        }

        // Convert Map to array
        const uniqueSimulations = Array.from(simulationMap.values());

        // Sort simulations by name for consistent ordering
        uniqueSimulations.sort((a, b) => a.name.localeCompare(b.name));

        setAllSimulations(uniqueSimulations);

        // Find the current simulation index
        const currentIndex = uniqueSimulations.findIndex(
          (sim) =>
            sim.simulation_id === simulationId &&
            sim.assignment_id === assignmentId,
        );

        if (currentIndex !== -1) {
          setCurrentSimIndex(currentIndex);
        }
      } catch (error) {
        console.error("Error loading training data:", error);
      }
    };

    loadTrainingData();
  }, [user?.id, simulationId, assignmentId]);

  useEffect(() => {
    const loadSimulation = async () => {
      if (!simulationId) return;

      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchSimulationById(simulationId);
        setSimulation(data);

        // Don't automatically select any level - let user choose
      } catch (err) {
        console.error("Error loading simulation:", err);
        setError("Failed to load simulation");
      } finally {
        setIsLoading(false);
      }
    };

    loadSimulation();
  }, [simulationId]);

  // Navigate to different simulation
  const navigateToSimulation = (index: number) => {
    if (index < 0 || index >= allSimulations.length) return;

    const sim = allSimulations[index];
    const workspaceParam = currentWorkspaceId
      ? `?workspace_id=${currentWorkspaceId}`
      : "";
    navigate(
      `/simulation/${sim.simulation_id}/${sim.assignment_id}/attempt${workspaceParam}`,
    );
  };

  const navigatePrevious = () => {
    if (currentSimIndex > 0) {
      navigateToSimulation(currentSimIndex - 1);
    }
  };

  const navigateNext = () => {
    if (currentSimIndex < allSimulations.length - 1) {
      navigateToSimulation(currentSimIndex + 1);
    }
  };

  // Handle navigation from simulation back to list
  const handleBackToSimList = () => {
    setShowStartPage(false);
    // Reset selection states
    setSelectedLevel(null);
    setSelectedAttempt(null);
  };

  // Handle navigation to next simulation
  const handleGoToNextSim = () => {
    if (currentSimIndex < allSimulations.length - 1) {
      navigateToSimulation(currentSimIndex + 1);
    }
  };

  // Check if there's a next simulation available
  const hasNextSimulation = currentSimIndex < allSimulations.length - 1;

  // Get status color for simulation status chips
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#ECFDF3", color: "#027A48" };
      case "ongoing":
      case "in_progress":
        return { bg: "#EEF4FF", color: "#3538CD" };
      default:
        return { bg: "#FFFAEB", color: "#B54708" };
    }
  };

  // Check if practice is enabled for the selected level
  const isPracticeEnabled = () => {
    if (!simulation || !selectedLevel) return false;

    if (selectedLevel === "Level 01") {
      return simulation.lvl1?.enablePractice === true;
    } else if (selectedLevel === "Level 02") {
      return simulation.lvl2?.enablePractice === true;
    } else if (selectedLevel === "Level 03") {
      return simulation.lvl3?.enablePractice === true;
    }
    return false;
  };

  // Update selectedLevel and reset selectedAttempt if needed
  const handleLevelChange = (level: string) => {
    setSelectedLevel(level);

    // If practice is not enabled for the new level and practice was selected,
    // reset to null (unselected state)
    if (selectedAttempt === "Practice") {
      const practiceEnabled =
        (level === "Level 01" && simulation?.lvl1?.enablePractice) ||
        (level === "Level 02" && simulation?.lvl2?.enablePractice) ||
        (level === "Level 03" && simulation?.lvl3?.enablePractice);

      if (!practiceEnabled) {
        setSelectedAttempt(null);
      }
    }
  };

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
        assignmentId={assignmentId}
        onBackToList={handleBackToSimList}
        onGoToNextSim={handleGoToNextSim}
        hasNextSimulation={hasNextSimulation}
      />
    );
  }

  return (
    <DashboardContent>
      <Container maxWidth="lg" sx={{ py: 2, bgcolor: "#F3F5F5" }}>
        {/* Simulation Navigation Bar */}
        {allSimulations.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={navigatePrevious}
                disabled={currentSimIndex === 0}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid #E0E0E0",
                  "&:disabled": { opacity: 0.5 },
                }}
              >
                <ChevronLeftIcon />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  overflow: "auto",
                  maxWidth: "calc(100vw - 200px)",
                  pb: 1,
                  "&::-webkit-scrollbar": { height: 6 },
                  "&::-webkit-scrollbar-track": { bgcolor: "#f1f1f1" },
                  "&::-webkit-scrollbar-thumb": {
                    bgcolor: "#888",
                    borderRadius: "3px",
                  },
                }}
              >
                {allSimulations.map((sim, index) => (
                  <Card
                    key={`${sim.simulation_id}-${sim.assignment_id}`}
                    sx={{
                      minWidth: 300,
                      p: 2,
                      cursor: "pointer",
                      border:
                        index === currentSimIndex
                          ? "2px solid #001EEE"
                          : "1px solid #E0E0E0",
                      bgcolor: index === currentSimIndex ? "#FAFAFF" : "white",
                      "&:hover": {
                        bgcolor:
                          index === currentSimIndex ? "#FAFAFF" : "#F5F5F5",
                      },
                    }}
                    onClick={() => navigateToSimulation(index)}
                  >
                    <Stack spacing={1}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          color:
                            index === currentSimIndex
                              ? "#001EEE"
                              : "text.primary",
                        }}
                      >
                        {index + 1}. {sim.name}
                      </Typography>
                      <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="body2" color="text.secondary">
                          Sim Type: {sim.type}
                        </Typography>
                        <Chip
                          label={
                            sim.status === "not_started"
                              ? "Not Started"
                              : sim.status === "completed"
                                ? "Completed"
                                : "In Progress"
                          }
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(sim.status).bg,
                            color: getStatusColor(sim.status).color,
                            fontWeight: 500,
                            fontSize: "0.75rem",
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Box>

              <IconButton
                onClick={navigateNext}
                disabled={currentSimIndex === allSimulations.length - 1}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid #E0E0E0",
                  "&:disabled": { opacity: 0.5 },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Stack>
          </Box>
        )}

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
                        onClick={() => handleLevelChange(level.label)}
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
                        subtitle: "Limited attempts with real-time coaching and scoring.",
                      },
                      {
                        key: "Practice",
                        icon: <PlayArrowIcon />,
                        title: "Practice",
                        subtitle: "Unlimited practice with real-time coaching and feedback.",
                        disabled: !isPracticeEnabled(),
                      },
                    ].map((option) => (
                      <Card
                        key={option.key}
                        onClick={() => {
                          if (!option.disabled) {
                            setSelectedAttempt(
                              option.key as "Test" | "Practice",
                            );
                          }
                        }}
                        sx={{
                          flex: 1,
                          p: 2,
                          cursor: option.disabled ? "not-allowed" : "pointer",
                          border:
                            selectedAttempt === option.key
                              ? "2px solid #001EEE"
                              : "1px solid #0F174F99",
                          bgcolor:
                            selectedAttempt === option.key
                              ? "#FAFAFF"
                              : "white",
                          opacity: option.disabled ? 0.5 : 1,
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
                            {option.disabled && (
                              <Typography variant="caption" color="error">
                                Not available for this level
                              </Typography>
                            )}
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
