import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  Avatar,
  IconButton,
  Chip,
  Paper,
  Fade,
  Modal,
  Checkbox,
  TextField,
  FormControl,
  MenuItem,
  Select,
  CircularProgress,
} from "@mui/material";
import {
  PlayArrow as PlayArrowIcon,
  SmartToy as SmartToyIcon,
  Phone,
  PlayArrow,
  Pause,
  CallEnd,
  ArrowForward,
  Mic,
  VolumeUp,
  AccessTime as AccessTimeIcon,
  SignalCellularAlt as SignalIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../../context/AuthContext";
import {
  startVisualAudioAttempt,
  endVisualAudioAttempt,
  SimulationData,
  ImageData,
  EndVisualAudioResponse,
} from "../../../../services/simulation_visual_audio_attempts";

interface Message {
  speaker: "customer" | "trainee";
  text: string;
}

interface VisualAudioSimulationPageProps {
  simulationId: string;
  simulationName: string;
  level: string;
  simType: string;
  attemptType: string;
  onBackToList: () => void;
  assignmentId: string;
}

// Minimum passing score threshold
const MIN_PASSING_SCORE = 85;

const VisualAudioSimulationPage: React.FC<VisualAudioSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  assignmentId,
}) => {
  // Get authenticated user using useAuth hook
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  // Basic simulation state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [simulationProgressId, setSimulationProgressId] = useState<
    string | null
  >(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [scores, setScores] = useState<EndVisualAudioResponse["scores"] | null>(
    null,
  );
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [callStatus, setCallStatus] = useState("Ringing...");

  // Visual-audio specific state
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null,
  );
  const [slides, setSlides] = useState<Map<string, string>>(new Map());
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Update to track both width and height scales
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVisuals, setIsLoadingVisuals] = useState(false);

  // Interactive elements state
  const [highlightHotspot, setHighlightHotspot] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [showCoachingTip, setShowCoachingTip] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speaking, setSpeaking] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const speechSynthRef = useRef(window.speechSynthesis);

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.sim_accuracy >= MIN_PASSING_SCORE : false;

  // Get current slide and sequence data
  const slidesData = simulationData?.slidesData || [];
  const currentSlide = slidesData[currentSlideIndex] || {};
  const currentSequence = currentSlide.sequence || [];
  const currentItem = currentSequence[currentSequenceIndex];

  // Debug current slide and sequence
  useEffect(() => {
    if (simulationData) {
      console.log("Current simulation data:", {
        slidesCount: simulationData.slidesData?.length || 0,
        currentSlideIndex,
        currentSequenceIndex,
        currentSlide: currentSlide?.imageId || "none",
        currentSequenceLength: currentSequence?.length || 0,
        slidesMapSize: slides.size,
      });
    }
  }, [
    simulationData,
    currentSlideIndex,
    currentSequenceIndex,
    currentSlide,
    currentSequence,
    slides.size,
  ]);

  // Initialize timer for simulation
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused && isCallActive) {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      speechSynthRef.current.cancel();
    };
  }, [isPaused, isCallActive]);

  // Reset states when moving to a new item
  useEffect(() => {
    // Clear any existing timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    // Clean up any previous state
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setDropdownOpen(false);
    setDropdownValue("");
    setCheckboxChecked(false);
    setTextInputValue("");
    setShowCoachingTip(false);
    setIsRecording(false);
    setRecordingTime(0);
    setHighlightHotspot(false);

    // Show coaching tip immediately if it's that type
    if (
      currentItem?.type === "hotspot" &&
      (currentItem?.hotspotType === "coaching" ||
        currentItem?.hotspotType === "coachingtip")
    ) {
      setShowCoachingTip(true);
    }
  }, [currentSequenceIndex, currentSlideIndex]);

  // Auto-start recording for trainee messages and speaking for customer messages
  useEffect(() => {
    if (!currentItem || isPaused || !isCallActive) return;

    // Handle message-specific behaviors
    if (currentItem.type === "message") {
      // For trainee/assistant messages - start recording
      if (currentItem.role === "Trainee" || currentItem.role === "assistant") {
        console.log("Auto-starting recording for trainee message");
        setIsRecording(true);
        setRecordingTime(0);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      }

      // For customer messages - start speaking
      if (currentItem.role === "Customer" || currentItem.role === "customer") {
        console.log("Auto-speaking customer message");
        setSpeaking(true);

        speakText(currentItem.text || "")
          .then(() => {
            setSpeaking(false);
            setCallStatus("Connected");
          })
          .catch((error) => {
            console.error("Speech synthesis error:", error);
            setSpeaking(false);
          });
      }
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [currentItem, isPaused, isCallActive]);

  // Process current sequence item
  useEffect(() => {
    if (
      !currentItem ||
      isProcessing ||
      !imageLoaded ||
      isPaused ||
      !isCallActive
    )
      return;

    console.log("Processing current item:", {
      type: currentItem.type,
      role: currentItem.role,
      hotspotType: currentItem.hotspotType,
      text: currentItem.text?.substring(0, 30) + "...",
    });

    const processItem = async () => {
      setIsProcessing(true);

      if (currentItem.type === "hotspot") {
        // For hotspots, highlight and wait for click
        setHighlightHotspot(true);

        // Setup timeout based on hotspot settings - applicable to all hotspot types now
        const timeout = currentItem.settings?.timeoutDuration;

        if (timeout && timeout > 0) {
          // Clear any existing timeout
          if (hotspotTimeoutRef.current) {
            clearTimeout(hotspotTimeoutRef.current);
          }

          // Set a new timeout that will advance if no interaction occurs
          hotspotTimeoutRef.current = setTimeout(() => {
            console.log(`Timeout of ${timeout} seconds reached for hotspot`);
            moveToNextItem();
            setHighlightHotspot(false);
            setIsProcessing(false);
          }, timeout * 1000);
        }

        setIsProcessing(false);
      } else {
        setIsProcessing(false);
      }
    };

    processItem();
  }, [
    currentItem,
    currentSequenceIndex,
    currentSlideIndex,
    imageLoaded,
    isPaused,
    isProcessing,
    isCallActive,
  ]);

  // Check for end of simulation
  useEffect(() => {
    if (
      isCallActive &&
      currentSlideIndex >= slidesData.length - 1 &&
      currentSequenceIndex >= currentSequence.length - 1 &&
      currentSequence.length > 0 &&
      !isEndingCall
    ) {
      // We've reached the end of the last slide's sequence
      console.log("Reached end of simulation content");
      // Wait a moment for any final animations/transitions
      setTimeout(() => {
        handleEndCall();
      }, 1000);
    }
  }, [
    currentSlideIndex,
    currentSequenceIndex,
    slidesData.length,
    currentSequence.length,
    isCallActive,
    isEndingCall,
  ]);

  // Function to speak text
  const speakText = (text: string) => {
    return new Promise((resolve, reject) => {
      try {
        // Ensure any ongoing speech is cancelled
        speechSynthRef.current.cancel();

        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);

        utterance.onend = () => {
          speechSynthRef.current.cancel();
          resolve(true);
        };

        utterance.onerror = (error) => {
          console.error("Speech synthesis error:", error);
          speechSynthRef.current.cancel();
          reject(error);
        };

        speechSynthRef.current.speak(utterance);
      } catch (error) {
        console.error("Failed to initialize speech:", error);
        reject(error);
      }
    });
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Format completion time as Xm Ys
  const formatCompletionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Updated to calculate both width and height scales
  const handleImageLoad = () => {
    if (imageRef.current && imageContainerRef.current) {
      const imageNaturalWidth = imageRef.current.naturalWidth;
      const imageNaturalHeight = imageRef.current.naturalHeight;

      // Get the actual rendered dimensions of the image
      const rect = imageRef.current.getBoundingClientRect();
      const renderedWidth = rect.width;
      const renderedHeight = rect.height;

      // Calculate the scale based on the actual rendered dimensions
      const widthScale = renderedWidth / imageNaturalWidth;
      const heightScale = renderedHeight / imageNaturalHeight;

      // Store both scales for proper coordinate transformation
      setImageScale({
        width: widthScale,
        height: heightScale,
      });

      setImageLoaded(true);
      console.log(
        `Image loaded with scales - width: ${widthScale}, height: ${heightScale}`,
      );
    }
  };

  // Move to next item in sequence
  const moveToNextItem = () => {
    // Clear any active timeout when manually moving to next item
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    console.log(
      "Moving to next item from",
      currentSequenceIndex,
      "in slide",
      currentSlideIndex,
    );
    if (currentSequenceIndex < currentSequence.length - 1) {
      // Next item in current slide
      setCurrentSequenceIndex((prevIndex) => prevIndex + 1);
    } else if (currentSlideIndex < slidesData.length - 1) {
      // First item in next slide
      setCurrentSlideIndex((prevIndex) => prevIndex + 1);
      setCurrentSequenceIndex(0);
      console.log("Moving to next slide:", currentSlideIndex + 1);
      setImageLoaded(false);
    } else {
      // End of slideshow
      setHighlightHotspot(false);
      console.log("Simulation complete");
      handleEndCall();
    }
  };

  // Handle hotspot click based on type
  const handleHotspotClick = () => {
    if (
      !isCallActive ||
      !currentItem ||
      currentItem.type !== "hotspot" ||
      isProcessing ||
      isPaused
    )
      return;

    // Clear the timeout when user interacts with a hotspot
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    const hotspotType = currentItem.hotspotType || "button";
    console.log("Hotspot clicked:", hotspotType);

    switch (hotspotType) {
      case "button":
      case "highlight":
        // For button and highlight, simply advance
        setHighlightHotspot(false);
        moveToNextItem();
        break;

      case "dropdown":
        // Toggle dropdown state
        setDropdownOpen(!dropdownOpen);
        break;

      case "checkbox":
        // Toggle checkbox state and advance after delay
        setCheckboxChecked(true);

        setTimeout(() => {
          moveToNextItem();
          setCheckboxChecked(false);
        }, 800);
        break;

      case "coaching":
      case "coachingtip":
        // For coaching tips, clicking anywhere dismisses it
        setShowCoachingTip(false);
        moveToNextItem();
        break;

      default:
        console.log("Unknown hotspot type:", hotspotType);
    }
  };

  // Updated to use both width and height scales
  const scaleCoordinates = (
    coords: { x: number; y: number; width: number; height: number } | undefined,
  ) => {
    if (!coords) return null;

    return {
      left: coords.x * imageScale.width,
      top: coords.y * imageScale.height,
      width: coords.width * imageScale.width,
      height: coords.height * imageScale.height,
    };
  };

  // Handle dropdown option selection
  const handleDropdownSelect = (option: string) => {
    setDropdownValue(option);
    setDropdownOpen(false);

    if (currentItem?.settings?.advanceOnSelect) {
      setTimeout(() => moveToNextItem(), 500);
    }
  };

  // Handle text input submission
  const handleTextInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      moveToNextItem();
    }
  };

  // Toggle pause/play
  const togglePause = () => {
    setIsPaused(!isPaused);

    // When pausing, clear any active timeout
    if (!isPaused && hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    if (speaking && !isPaused) {
      speechSynthRef.current.pause();
    } else if (speaking && isPaused) {
      speechSynthRef.current.resume();
    }

    // Also handle pausing of recording
    if (isRecording && !isPaused) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    } else if (isRecording && isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    }
  };

  const handleStart = async () => {
    if (!userId) {
      console.error("Error: User ID is required to start simulation");
      return;
    }

    setIsStarting(true);
    setIsLoadingVisuals(true);
    try {
      setIsCallActive(true);
      setCallStatus("Loading visual-audio simulation...");

      // Use the startVisualAudioAttempt function instead of direct axios call
      const response = await startVisualAudioAttempt(
        userId,
        simulationId,
        assignmentId,
      );

      console.log("Start visual-audio response:", response);

      if (response.simulation) {
        console.log("Setting simulation data");
        setSimulationData(response.simulation);
        setSimulationProgressId(response.id);
        setCallStatus("Connected");
      }

      // Process image data
      if (response.images && response.images.length > 0) {
        const newSlides = new Map();
        console.log(`Processing ${response.images.length} images`);
        for (const image of response.images) {
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
          console.log(`Created blob URL for image ${image.image_id}`);
          newSlides.set(image.image_id, blobUrl);
        }
        setSlides(newSlides);
        console.log(`Set ${newSlides.size} slides`);
      }
    } catch (error) {
      console.error("Error starting visual-audio simulation:", error);
      setIsCallActive(false);
      setCallStatus("Error loading simulation. Please try again.");
    } finally {
      setIsStarting(false);
      setIsLoadingVisuals(false);
    }
  };

  // Handle end call implementation
  const handleEndCall = async () => {
    console.log("🔴 END CALL BUTTON PRESSED");

    // Prevent multiple simultaneous end call attempts
    if (isEndingCall) {
      console.log("Already ending call, ignoring duplicate request");
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingCall(true);

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    // Stop recording if active
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecording(false);
    }

    // Update UI state
    setIsCallActive(false);

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end call API");
      setIsEndingCall(false);
      return;
    }

    try {
      console.log("Executing end-visual-audio API call");
      const response = await endVisualAudioAttempt(
        userId,
        simulationId,
        simulationProgressId,
      );

      if (response && response.scores) {
        console.log("Setting scores and showing completion screen");
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);
        setShowCompletionScreen(true);
      } else {
        console.warn("No scores received in response");
      }
    } catch (error) {
      console.error("Failed to end visual-audio simulation:", error);
      // Show an error message to the user if needed
    } finally {
      console.log("End call flow completed");
      setIsEndingCall(false);
    }
  };

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsCallActive(false);
    setElapsedTime(0);
    setScores(null);
    setCurrentSlideIndex(0);
    setCurrentSequenceIndex(0);
    setImageLoaded(false);
  };

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      slides.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [slides]);

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
                  {scores ? `${Math.round(scores.sim_accuracyxs)}%` : "86%"}
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
                  {scores && scores.confidence >= 80
                    ? "High"
                    : scores && scores.confidence >= 60
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
                  {scores && scores.concentration >= 80
                    ? "High"
                    : scores && scores.concentration >= 60
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
                  {scores && scores.energy >= 80
                    ? "High"
                    : scores && scores.energy >= 60
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
      {/* Pause Overlay */}
      <Modal
        open={isPaused && isCallActive}
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
        <Fade in={isPaused && isCallActive}>
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

      {!isCallActive ? (
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
            <VisibilityIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
          >
            Start Simulation
          </Typography>
          <Typography sx={{ color: "#666", mb: 4 }}>
            Press start to attempt the Visual-Audio Simulation
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={isStarting || !userId}
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
            {isStarting ? "Starting..." : "Start Simulation"}
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
        <Box
          sx={{
            height: "100vh",
            bgcolor: "background.default",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Main content */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              maxWidth: "1200px",
              mx: "auto",
              mt: 2,
            }}
          >
            {/* Left side - Visual interface */}
            <Box sx={{ flex: 1, p: 2 }} ref={imageContainerRef}>
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  bgcolor: "background.paper",
                  borderRadius: 1,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isLoadingVisuals ? (
                  <Box sx={{ textAlign: "center", p: 4 }}>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography>Loading simulation visuals...</Typography>
                  </Box>
                ) : !currentSlide || !slides.get(currentSlide.imageId) ? (
                  <Box sx={{ textAlign: "center", p: 4 }}>
                    <Typography color="text.secondary">
                      No visual content available
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: "relative",
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={slides.get(currentSlide.imageId)}
                      alt={currentSlide.imageName || "Simulation slide"}
                      style={{
                        maxWidth: "100%",
                        maxHeight: "calc(100vh - 200px)",
                        display: "block",
                        margin: "0 auto",
                      }}
                      onLoad={handleImageLoad}
                    />

                    {/* Render hotspots directly on the image */}
                    {imageLoaded &&
                      currentItem?.type === "hotspot" &&
                      currentItem.coordinates && (
                        <>
                          {/* Button hotspot */}
                          {(currentItem.hotspotType === "button" ||
                            !currentItem.hotspotType) && (
                            <Box
                              onClick={handleHotspotClick}
                              sx={{
                                position: "absolute",
                                cursor: "pointer",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                height: `${scaleCoordinates(currentItem.coordinates)?.height}px`,
                                zIndex: 10,
                              }}
                            >
                              <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                  height: "100%",
                                  backgroundColor:
                                    currentItem.settings?.buttonColor ||
                                    "#444CE7",
                                  color:
                                    currentItem.settings?.textColor ||
                                    "#FFFFFF",
                                  "&:hover": {
                                    backgroundColor:
                                      currentItem.settings?.buttonColor ||
                                      "#444CE7",
                                  },
                                  boxShadow: highlightHotspot ? 4 : 0,
                                  border: highlightHotspot
                                    ? `2px solid ${currentItem.settings?.highlightColor || "white"}`
                                    : "none",
                                }}
                              >
                                {currentItem.name || "Click here"}
                              </Button>
                            </Box>
                          )}

                          {/* Dropdown hotspot */}
                          {currentItem.hotspotType === "dropdown" && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                zIndex: 10,
                              }}
                            >
                              <FormControl fullWidth>
                                <Select
                                  value={dropdownValue}
                                  displayEmpty
                                  onClick={handleHotspotClick}
                                  open={dropdownOpen}
                                  onClose={() => setDropdownOpen(false)}
                                  sx={{
                                    height: `${scaleCoordinates(currentItem.coordinates)?.height}px`,
                                    bgcolor: "white",
                                    border: highlightHotspot
                                      ? `2px solid ${currentItem.settings?.highlightColor || "#444CE7"}`
                                      : "1px solid #ddd",
                                    boxShadow: highlightHotspot ? 2 : 0,
                                  }}
                                >
                                  <MenuItem value="" disabled>
                                    {currentItem.settings?.placeholder ||
                                      "Select an option"}
                                  </MenuItem>
                                  {(
                                    currentItem.options || [
                                      "Option 1",
                                      "Option 2",
                                      "Option 3",
                                    ]
                                  ).map((option, idx) => (
                                    <MenuItem
                                      key={idx}
                                      value={option}
                                      onClick={() =>
                                        handleDropdownSelect(option)
                                      }
                                    >
                                      {option}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          )}

                          {/* Checkbox hotspot */}
                          {currentItem.hotspotType === "checkbox" && (
                            <Box
                              onClick={handleHotspotClick}
                              sx={{
                                position: "absolute",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                zIndex: 10,
                              }}
                            >
                              <Checkbox
                                checked={checkboxChecked}
                                sx={{
                                  padding: 0,
                                  "& .MuiSvgIcon-root": {
                                    fontSize: `${
                                      scaleCoordinates(currentItem.coordinates)
                                        ?.height
                                    }px`,
                                  },
                                  color: highlightHotspot
                                    ? currentItem.settings?.highlightColor ||
                                      "#444CE7"
                                    : "action.active",
                                  "&.Mui-checked": {
                                    color: "#444CE7",
                                  },
                                }}
                              />
                              {currentItem.name && (
                                <Typography
                                  variant="body2"
                                  sx={{ ml: 1, color: "text.primary" }}
                                >
                                  {currentItem.name}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* Text field hotspot */}
                          {currentItem.hotspotType === "textfield" && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                zIndex: 10,
                              }}
                            >
                              <TextField
                                fullWidth
                                value={textInputValue}
                                onChange={(e) =>
                                  setTextInputValue(e.target.value)
                                }
                                onKeyDown={handleTextInputSubmit}
                                placeholder={
                                  currentItem.settings?.placeholder ||
                                  "Type and press Enter"
                                }
                                variant="outlined"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    height: `${
                                      scaleCoordinates(currentItem.coordinates)
                                        ?.height
                                    }px`,
                                    bgcolor: "white",
                                    "& fieldset": {
                                      borderColor: highlightHotspot
                                        ? currentItem.settings
                                            ?.highlightColor || "#444CE7"
                                        : "rgba(0, 0, 0, 0.23)",
                                      borderWidth: highlightHotspot ? 2 : 1,
                                    },
                                    "&:hover fieldset": {
                                      borderColor: "#444CE7",
                                    },
                                    "&.Mui-focused fieldset": {
                                      borderColor: "#444CE7",
                                    },
                                  },
                                }}
                                autoFocus
                              />
                            </Box>
                          )}

                          {/* Highlight hotspot */}
                          {currentItem.hotspotType === "highlight" && (
                            <Box
                              onClick={() => {
                                console.log("Highlight hotspot clicked");
                                handleHotspotClick();
                              }}
                              sx={{
                                position: "absolute",
                                cursor: "pointer",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                height: `${scaleCoordinates(currentItem.coordinates)?.height}px`,
                                border: "4px solid",
                                borderColor:
                                  currentItem.settings?.highlightColor ||
                                  "rgba(68, 76, 231, 0.7)",
                                boxShadow: highlightHotspot
                                  ? "0 0 12px 3px rgba(68, 76, 231, 0.6)"
                                  : "none",
                                borderRadius: "4px",
                                backgroundColor: "transparent",
                                transition: "box-shadow 0.3s",
                                zIndex: 10,
                              }}
                            />
                          )}

                          {/* Coaching tip button */}
                          {(currentItem.hotspotType === "coaching" ||
                            currentItem.hotspotType === "coachingtip") && (
                            <Box
                              onClick={handleHotspotClick}
                              sx={{
                                position: "absolute",
                                cursor: "pointer",
                                left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                height: `${scaleCoordinates(currentItem.coordinates)?.height}px`,
                                zIndex: 50,
                                border: highlightHotspot
                                  ? `2px solid ${currentItem.settings?.highlightColor || "#1e293b"}`
                                  : "none",
                                boxShadow: highlightHotspot ? 3 : 0,
                                transition: "all 0.3s ease",
                              }}
                            >
                              <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                  height: "100%",
                                  backgroundColor: "#1e293b",
                                  color: "white",
                                  "&:hover": {
                                    backgroundColor: "#0f172a",
                                  },
                                  boxShadow: highlightHotspot ? 4 : 0,
                                }}
                              >
                                {currentItem.settings?.tipText ||
                                  currentItem.name ||
                                  "Coaching Tip"}
                              </Button>
                            </Box>
                          )}
                        </>
                      )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right side - Message display panel */}
            <Box
              sx={{
                width: 320,
                borderLeft: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.paper",
              }}
            >
              {/* Status + top controls */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="subtitle2" color="text.secondary">
                  {callStatus}
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

              {/* Current message display area */}
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {currentItem?.type === "message" ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      // Removed height: '100%' so everything stays right below the message
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        bgcolor:
                          currentItem.role === "customer"
                            ? "blue.50"
                            : "green.50",
                        borderLeft: 4,
                        borderColor:
                          currentItem.role === "customer"
                            ? "primary.main"
                            : "success.main",
                        borderRadius: 1,
                        // Removed mb: "auto" so it doesn't push controls to the bottom
                        mb: 2,
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor:
                              currentItem.role === "Customer" ||
                              currentItem.role === "customer"
                                ? "primary.light"
                                : "success.light",
                          }}
                        >
                          {currentItem.role === "Customer" ||
                          currentItem.role === "customer"
                            ? "C"
                            : "T"}
                        </Avatar>
                        <Typography variant="subtitle2">
                          {currentItem.role === "Customer" ||
                          currentItem.role === "customer"
                            ? "Customer"
                            : "Trainee"}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {currentItem.text}
                      </Typography>
                    </Paper>

                    {/* Interaction controls / Next Button */}
                    {/* Placed directly below message bubble (and separated by small margin). */}
                    <Box>
                      {/* Trainee recording indicator */}
                      {(currentItem.role === "Trainee" ||
                        currentItem.role === "assistant") &&
                        isRecording && (
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: "grey.100",
                              borderRadius: 1,
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Box sx={{ position: "relative", mr: 2 }}>
                              <Avatar
                                sx={{
                                  bgcolor: "error.main",
                                  animation: "pulse 1.5s infinite",
                                  "@keyframes pulse": {
                                    "0%": { opacity: 0.7 },
                                    "50%": { opacity: 1 },
                                    "100%": { opacity: 0.7 },
                                  },
                                }}
                              >
                                <Mic />
                              </Avatar>
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -2,
                                  right: -2,
                                  width: 10,
                                  height: 10,
                                  bgcolor: "error.main",
                                  borderRadius: "50%",
                                  animation: "ping 1.5s infinite",
                                  "@keyframes ping": {
                                    "75%, 100%": {
                                      transform: "scale(2)",
                                      opacity: 0,
                                    },
                                  },
                                }}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                Listening...
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatTime(recordingTime)}
                              </Typography>
                            </Box>
                          </Paper>
                        )}

                      {/* Customer speech indicator */}
                      {(currentItem.role === "Customer" ||
                        currentItem.role === "customer") &&
                        speaking && (
                          <Paper
                            sx={{
                              p: 2,
                              bgcolor: "grey.100",
                              borderRadius: 1,
                              mb: 2,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: "primary.main",
                                animation: "pulse 1.5s infinite",
                                "@keyframes pulse": {
                                  "0%": { opacity: 0.7 },
                                  "50%": { opacity: 1 },
                                  "100%": { opacity: 0.7 },
                                },
                                mr: 2,
                              }}
                            >
                              <VolumeUp />
                            </Avatar>
                            <Typography variant="body2" fontWeight="medium">
                              Speaking...
                            </Typography>
                          </Paper>
                        )}

                      {/* Next button */}
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        endIcon={<ArrowForward />}
                        disabled={
                          (currentItem.role === "Customer" ||
                            currentItem.role === "customer") &&
                          speaking
                        }
                        onClick={() => {
                          // For customer messages
                          if (
                            currentItem.role === "Customer" ||
                            currentItem.role === "customer"
                          ) {
                            speechSynthRef.current.cancel();
                            setSpeaking(false);
                          }
                          // For trainee messages
                          else {
                            if (recordingTimerRef.current) {
                              clearInterval(recordingTimerRef.current);
                              recordingTimerRef.current = null;
                            }
                            setIsRecording(false);
                          }
                          moveToNextItem();
                        }}
                      >
                        Next
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Phone sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                    <Typography variant="body2">
                      Interact with the interface to continue the simulation
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {/* Call controls */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              maxWidth: 900,
              margin: "10px auto",
              p: 2,
              bgcolor: "#F9FAFB",
              border: "1px solid #E5E7EB",
              borderRadius: 3,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: "black", flexGrow: 1 }}
            >
              <span style={{ fontWeight: "normal" }}>
                Visual-Audio Simulation -{" "}
              </span>
              <span style={{ fontWeight: "bold" }}>
                {formatTime(elapsedTime)}
              </span>
            </Typography>

            <Button
              variant="contained"
              color="error"
              startIcon={<CallEnd />}
              onClick={handleEndCall}
              disabled={isEndingCall}
            >
              End Simulation
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default VisualAudioSimulationPage;
