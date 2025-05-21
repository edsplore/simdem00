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
  SvgIcon,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
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
import { canStartTest } from "../../../services/simulation";
import { fetchTrainingData } from "../../../services/training";
import { useAuth } from "../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../utils/navigation";
import type { Simulation, TrainingData } from "../../../types/training";

// Custom Headset Icon component
const HeadsetIcon = ({ selected }) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
    }}
  >
    <SvgIcon viewBox="0 0 64 64" sx={{ width: 52, height: 52 }}>
      <path
        d="M20.0013 48C17.068 48 14.5569 46.9556 12.468 44.8667C10.3791 42.7778 9.33464 40.2667 9.33464 37.3333V26.4667C9.33464 24.2 10.0457 22.2111 11.468 20.5C12.8902 18.7889 14.7124 17.7333 16.9346 17.3333C19.468 16.8444 21.9791 16.5 24.468 16.3C26.9569 16.1 29.468 16 32.0013 16C34.5346 16 37.0569 16.1 39.568 16.3C42.0791 16.5 44.5791 16.8444 47.068 17.3333C49.2902 17.7778 51.1124 18.8444 52.5346 20.5333C53.9569 22.2222 54.668 24.2 54.668 26.4667V37.3333C54.668 40.2667 53.6235 42.7778 51.5346 44.8667C49.4457 46.9556 46.9346 48 44.0013 48H41.3346C40.7569 48 40.1791 47.9667 39.6013 47.9C39.0235 47.8333 38.468 47.6889 37.9346 47.4667L33.668 46C33.1346 45.7778 32.5791 45.6667 32.0013 45.6667C31.4235 45.6667 30.868 45.7778 30.3346 46L26.068 47.4667C25.5346 47.6889 24.9791 47.8333 24.4013 47.9C23.8235 47.9667 23.2457 48 22.668 48H20.0013ZM20.0013 42.6667H22.668C22.9791 42.6667 23.2791 42.6444 23.568 42.6C23.8569 42.5556 24.1346 42.4889 24.4013 42.4C25.6902 42 26.9457 41.5778 28.168 41.1333C29.3902 40.6889 30.668 40.4667 32.0013 40.4667C33.3346 40.4667 34.6235 40.6778 35.868 41.1C37.1124 41.5222 38.3569 41.9556 39.6013 42.4C39.868 42.4889 40.1457 42.5556 40.4346 42.6C40.7235 42.6444 41.0235 42.6667 41.3346 42.6667H44.0013C45.468 42.6667 46.7235 42.1444 47.768 41.1C48.8124 40.0556 49.3346 38.8 49.3346 37.3333V26.4667C49.3346 25.4889 49.0235 24.6444 48.4013 23.9333C47.7791 23.2222 47.0013 22.7556 46.068 22.5333C43.7569 22.0444 41.4346 21.7222 39.1013 21.5667C36.768 21.4111 34.4013 21.3333 32.0013 21.3333C29.6013 21.3333 27.2457 21.4222 24.9346 21.6C22.6235 21.7778 20.2902 22.0889 17.9346 22.5333C17.0013 22.7111 16.2235 23.1667 15.6013 23.9C14.9791 24.6333 14.668 25.4889 14.668 26.4667V37.3333C14.668 38.8 15.1902 40.0556 16.2346 41.1C17.2791 42.1444 18.5346 42.6667 20.0013 42.6667ZM4.66797 37.3333C4.09019 37.3333 3.61241 37.1444 3.23464 36.7667C2.85686 36.3889 2.66797 35.9111 2.66797 35.3333V28.6667C2.66797 28.0889 2.85686 27.6111 3.23464 27.2333C3.61241 26.8556 4.09019 26.6667 4.66797 26.6667C5.24575 26.6667 5.72352 26.8556 6.1013 27.2333C6.47908 27.6111 6.66797 28.0889 6.66797 28.6667V35.3333C6.66797 35.9111 6.47908 36.3889 6.1013 36.7667C5.72352 37.1444 5.24575 37.3333 4.66797 37.3333ZM59.3346 37.3333C58.7569 37.3333 58.2791 37.1444 57.9013 36.7667C57.5235 36.3889 57.3346 35.9111 57.3346 35.3333V28.6667C57.3346 28.0889 57.5235 27.6111 57.9013 27.2333C58.2791 26.8556 58.7569 26.6667 59.3346 26.6667C59.9124 26.6667 60.3902 26.8556 60.768 27.2333C61.1457 27.6111 61.3346 28.0889 61.3346 28.6667V35.3333C61.3346 35.9111 61.1457 36.3889 60.768 36.7667C60.3902 37.1444 59.9124 37.3333 59.3346 37.3333Z"
        fill={selected ? "#001EEE" : "#001EEE12"}
      />
    </SvgIcon>
  </Box>
);

// Custom Lightbulb Icon component
const LightbulbIcon = () => (
  <SvgIcon viewBox="0 0 24 24" sx={{ width: 20, height: 20, mr: 1 }}>
    <path
      d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 0.55 0.45 1 1 1h6c0.55 0 1-0.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zM9 21c0 0.55 0.45 1 1 1h4c0.55 0 1-0.45 1-1v-1H9v1z"
      fill="#9AA4B2"
    />
  </SvgIcon>
);

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
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
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
  const [canStartTestState, setCanStartTestState] = useState<boolean>(true);
  const [isCheckingTestAvailability, setIsCheckingTestAvailability] =
    useState(false);

  // Check if user can start test
  useEffect(() => {
    const checkTestAvailability = async () => {
      if (!user?.id || !simulationId || !assignmentId) return;

      try {
        setIsCheckingTestAvailability(true);
        const response = await canStartTest(
          user.id,
          simulationId,
          assignmentId,
        );
        setCanStartTestState(response.can_start_test);
      } catch (error) {
        console.error("Error checking test availability:", error);
        // If API fails, default to allowing test (you can change this behavior)
        setCanStartTestState(true);
      } finally {
        setIsCheckingTestAvailability(false);
      }
    };

    checkTestAvailability();
  }, [user?.id, simulationId, assignmentId]);

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
    const path = buildPathWithWorkspace(
      `/simulation/${sim.simulation_id}/${sim.assignment_id}/attempt`,
      currentWorkspaceId,
      currentTimeZone
    );
    navigate(path);
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
  const handleBackToSimList = async () => {
    setShowStartPage(false);
    // Reset selection states
    setSelectedLevel(null);
    setSelectedAttempt(null);

    // Re-check test availability when returning to the list
    if (user?.id && simulationId && assignmentId) {
      try {
        setIsCheckingTestAvailability(true);
        const response = await canStartTest(
          user.id,
          simulationId,
          assignmentId,
        );
        setCanStartTestState(response.can_start_test);
      } catch (error) {
        console.error("Error checking test availability:", error);
        setCanStartTestState(true);
      } finally {
        setIsCheckingTestAvailability(false);
      }
    }
  };

  const handleRestartSim = async () => {
    // Reset the simulation state if needed
    setShowStartPage(false);

    // Re-check test availability when restarting
    if (user?.id && simulationId && assignmentId) {
      try {
        setIsCheckingTestAvailability(true);
        const response = await canStartTest(
          user.id,
          simulationId,
          assignmentId,
        );
        setCanStartTestState(response.can_start_test);
      } catch (error) {
        console.error("Error checking test availability:", error);
        setCanStartTestState(true);
      } finally {
        setIsCheckingTestAvailability(false);
      }
    }

    // After API check, immediately show start page again to restart
    setShowStartPage(true);
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
        simulation={simulation}
        onRestartSim={handleRestartSim}
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
                        icon: (
                          <HeadsetIcon selected={selectedAttempt === "Test"} />
                        ),
                        title: "Test",
                        subtitle:
                          "Limited attempts with real-time coaching and scoring.",
                        disabled:
                          !canStartTestState || isCheckingTestAvailability,
                      },
                      {
                        key: "Practice",
                        icon: (
                          <HeadsetIcon
                            selected={selectedAttempt === "Practice"}
                          />
                        ),
                        title: "Practice",
                        subtitle:
                          "Unlimited practice with real-time coaching and feedback.",
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
                          display: "flex",
                          alignItems: "flex-start",
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
                              flexShrink: 0,
                            }}
                          >
                            {option.icon}
                          </Box>
                          <Stack spacing={0.5}>
                            <Typography variant="h4">{option.title}</Typography>
                            <Typography variant="body2">
                              {option.subtitle}
                            </Typography>
                            {option.disabled &&
                              option.key === "Test" &&
                              !canStartTestState && (
                                <Typography variant="caption" color="error">
                                  Maximum repetitions for this simulation are
                                  over
                                </Typography>
                              )}
                            {option.disabled && option.key === "Practice" && (
                              <Typography variant="caption" color="error">
                                Not available for this level
                              </Typography>
                            )}
                            {option.key === "Test" &&
                              isCheckingTestAvailability && (
                                <Typography variant="caption" color="info">
                                  Checking availability...
                                </Typography>
                              )}
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                  </Stack>
                </Box>

                {/* Learning Objectives - Only show if there are objectives */}
                {simulation?.key_objectives &&
                  simulation.key_objectives.length > 0 && (
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
                          {simulation.key_objectives.map((objective, index) => (
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
                  )}

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

              {/* Quick Tips - Now with custom LightbulbIcon */}
              {simulation?.quick_tips && simulation.quick_tips.length > 0 && (
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
                    <LightbulbIcon />
                    Quick Tips
                  </Typography>
                  <Stack spacing={0}>
                    {simulation.quick_tips.map((tip, index) => (
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
              )}
            </Stack>
          </Box>
        </Card>
      </Container>
    </DashboardContent>
  );
};

export default SimulationAttemptPage;
