import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Avatar,
  IconButton,
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
  PlayArrow,
  Pause,
  Phone,
  CallEnd,
  ArrowForward,
  Mic,
  VolumeUp,
  CheckCircle,
} from "@mui/icons-material";

// Utility function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // Create a temporary DOM element to safely extract text content
  if (typeof window !== "undefined") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  // Fallback regex method for server-side or when DOM is not available
  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&") // Replace escaped ampersands
    .replace(/&lt;/g, "<") // Replace escaped less-than
    .replace(/&gt;/g, ">") // Replace escaped greater-than
    .replace(/&quot;/g, '"') // Replace escaped quotes
    .trim();
};

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
  lvl3: {
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
      percentageCoordinates?: {
        xPercent: number;
        yPercent: number;
        widthPercent: number;
        heightPercent: number;
      };
      settings?: any;
      role?: string;
      text?: string;
      options?: string[];
    }>;
    masking: Array<{
      id: string;
      type: string;
      content: {
        id: string;
        type: string;
        coordinates?: {
          x: number;
          y: number;
          width: number;
          height: number;
        };
        percentageCoordinates?: {
          xPercent: number;
          yPercent: number;
          widthPercent: number;
          heightPercent: number;
        };
        settings?: {
          color: string;
          solid_mask: boolean;
          blur_mask: boolean;
        };
      };
      timestamp?: number;
    }>;
  }>;
}

interface VisualAudioPreviewProps {
  simulationData: SimulationData;
  slides: Map<string, string>;
  onEndSimulation: () => void; // New prop for handling simulation end
}

const VisualAudioPreview: React.FC<VisualAudioPreviewProps> = ({
  simulationData,
  slides,
  onEndSimulation,
}) => {
  // Preview mode - always use level 1 settings
  const levelSettings = simulationData?.lvl1;

  // Component state for navigation and progress
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [callStatus, setCallStatus] = useState("Ringing...");

  // State for image handling
  const [imageLoaded, setImageLoaded] = useState(false);
  // Update to track both width and height scales - used for backward compatibility
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [isProcessing, setIsProcessing] = useState(false);

  // State for speech synthesis
  const [speaking, setSpeaking] = useState(false);

  // State for interactive elements
  const [highlightHotspot, setHighlightHotspot] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [showCoachingTip, setShowCoachingTip] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const speechSynthRef = useRef(window.speechSynthesis);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current slide and sequence data
  const slidesData = simulationData?.slidesData || [];
  const currentSlide = slidesData[currentSlideIndex] || {};
  const currentSequence = currentSlide.sequence || [];
  const currentMasking = currentSlide.masking || [];
  const currentItem = currentSequence[currentSequenceIndex];
  const [attemptSequenceData, setAttemptSequenceData] = useState<any[]>([]);

  // Function to check if a hotspot should be skipped based on settings
  const shouldSkipHotspot = () => {
    if (!currentItem || currentItem.type !== "hotspot") return false;

    // Skip highlight hotspots if hideHighlights is enabled
    if (
      currentItem.hotspotType === "highlight" &&
      levelSettings?.hideHighlights
    ) {
      return true;
    }

    // Skip coaching tip hotspots if hideCoachingTips is enabled
    if (
      (currentItem.hotspotType === "coaching" ||
        currentItem.hotspotType === "coachingtip") &&
      levelSettings?.hideCoachingTips
    ) {
      return true;
    }

    return false;
  };

  // Initialize timer for simulation
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      speechSynthRef.current.cancel();
    };
  }, [isPaused]);

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

    // Show coaching tip immediately if it's that type and not being skipped
    if (
      currentItem?.type === "hotspot" &&
      (currentItem?.hotspotType === "coaching" ||
        currentItem?.hotspotType === "coachingtip") &&
      !levelSettings?.hideCoachingTips
    ) {
      setShowCoachingTip(true);
    }
  }, [currentSequenceIndex, currentSlideIndex, levelSettings]);

  // Auto-start recording for trainee messages and speaking for customer messages
  useEffect(() => {
    if (!currentItem || isPaused) return;

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

        // Strip HTML before speaking
        const cleanText = stripHtmlTags(currentItem.text || "");
        speakText(cleanText)
          .then(() => {
            setAttemptSequenceData((prevState) => [
              ...prevState,
              {
                ...currentItem,
                length: 0,
              },
            ]);
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
  }, [currentItem, isPaused]);

  // Process current sequence item
  useEffect(() => {
    if (!currentItem || isProcessing || !imageLoaded || isPaused) return;

    const processItem = async () => {
      setIsProcessing(true);

      if (currentItem.type === "hotspot") {
        // Check if this hotspot should be skipped based on settings
        if (shouldSkipHotspot()) {
          console.log(
            "Skipping hotspot due to level settings:",
            currentItem.hotspotType,
          );
          moveToNextItem();
          setIsProcessing(false);
          return;
        }

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

  // Updated to use more reliable coordinate calculation
  const handleImageLoad = () => {
    if (!imageRef.current) return;

    // Use requestAnimationFrame to ensure the image is fully rendered
    requestAnimationFrame(() => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (naturalWidth === 0 || naturalHeight === 0) {
        console.warn("Image natural dimensions not available yet");
        return;
      }

      // Get the rendered dimensions
      const rect = img.getBoundingClientRect();
      const renderedWidth = rect.width;
      const renderedHeight = rect.height;

      // Calculate the scale for backward compatibility
      const widthScale = renderedWidth / naturalWidth;
      const heightScale = renderedHeight / naturalHeight;

      setImageScale({
        width: widthScale,
        height: heightScale,
      });

      setImageLoaded(true);
      console.log(
        `Image loaded with dimensions ${naturalWidth}x${naturalHeight}, scaled to ${renderedWidth}x${renderedHeight}`,
      );
      console.log(`Scale factors: width=${widthScale}, height=${heightScale}`);
    });
  };

  // Improved resize observer to update coordinates when container or image size changes
  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return;

    // Function to update image scale factors
    const updateImageScales = () => {
      if (!imageRef.current) return;

      const img = imageRef.current;
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        return; // Image not fully loaded yet
      }

      const rect = img.getBoundingClientRect();
      const renderedWidth = rect.width;
      const renderedHeight = rect.height;

      const widthScale = renderedWidth / img.naturalWidth;
      const heightScale = renderedHeight / img.naturalHeight;

      setImageScale({
        width: widthScale,
        height: heightScale,
      });

      console.log(
        `Updated scales - width: ${widthScale}, height: ${heightScale}`,
      );
    };

    // Create resize observer for real-time updates
    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to batch updates
      requestAnimationFrame(() => {
        updateImageScales();
      });
    });

    // Observe both container and image
    resizeObserver.observe(imageContainerRef.current);
    if (imageRef.current) {
      resizeObserver.observe(imageRef.current);
    }

    // Also listen for window resize events
    window.addEventListener("resize", updateImageScales);

    // Initial update
    updateImageScales();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateImageScales);
    };
  }, [imageRef.current, imageContainerRef.current]);

  // Move to next item in sequence
  const moveToNextItem = () => {
    // Clear any active timeout when manually moving to next item
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    if (currentSequenceIndex < currentSequence.length - 1) {
      // Next item in current slide
      setCurrentSequenceIndex((prevIndex) => prevIndex + 1);
    } else if (currentSlideIndex < slidesData.length - 1) {
      // First item in next slide
      setCurrentSlideIndex((prevIndex) => prevIndex + 1);
      setCurrentSequenceIndex(0);
      setImageLoaded(false);
    } else {
      // End of slideshow
      console.log("Simulation complete");
      // Call the end simulation function
      onEndSimulation();
    }
  };

  useEffect(() => {
    if (currentItem?.type !== "hotspot") return;

    const handleClick = (event) => {
      const container = imageContainerRef.current;
      if (!container) return;

      // Get click position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Get the coordinates for the current hotspot
      let hotspotRect;
      if (currentItem.percentageCoordinates && imageRef.current) {
        const imgRect = imageRef.current.getBoundingClientRect();
        hotspotRect = {
          left:
            (currentItem.percentageCoordinates.xPercent * imgRect.width) / 100,
          top:
            (currentItem.percentageCoordinates.yPercent * imgRect.height) / 100,
          width:
            (currentItem.percentageCoordinates.widthPercent * imgRect.width) /
            100,
          height:
            (currentItem.percentageCoordinates.heightPercent * imgRect.height) /
            100,
        };
      } else if (currentItem.coordinates) {
        // Fallback to scaled coordinates
        hotspotRect = {
          left: currentItem.coordinates.x * imageScale.width,
          top: currentItem.coordinates.y * imageScale.height,
          width: currentItem.coordinates.width * imageScale.width,
          height: currentItem.coordinates.height * imageScale.height,
        };
      } else {
        return;
      }

      // Check if the click is outside the currentItem box
      const isOutside =
        x < hotspotRect.left ||
        x > hotspotRect.left + hotspotRect.width ||
        y < hotspotRect.top ||
        y > hotspotRect.top + hotspotRect.height;

      if (isOutside) {
        console.log(`Clicked outside currentItem at x=${x}, y=${y}`);
        setAttemptSequenceData((prevData) => [
          ...prevData,
          {
            type: "wrong_click",
            x_cordinates: x,
            y_cordinates: y,
          },
        ]);
        // Your custom logic for outside click
      } else {
        console.log("Clicked inside currentItem box — ignoring");
      }
    };

    const container = imageContainerRef.current;
    container?.addEventListener("click", handleClick);

    return () => {
      container?.removeEventListener("click", handleClick);
    };
  }, [currentItem, imageScale]);

  // Handle hotspot click based on type
  const handleHotspotClick = () => {
    if (
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

    setAttemptSequenceData((prevData) => [...prevData, currentItem]);
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

  const scaleCoordinates = (coords) => {
    if (!coords || !imageRef.current) return null;

    const img = imageRef.current;
    // Use ONLY the image's bounding rectangle, NOT the container's
    const imgRect = img.getBoundingClientRect();

    // For percentage-based coordinates
    if (coords.xPercent !== undefined) {
      return {
        // Apply percentages to the IMAGE dimensions only, not the container
        left: (coords.xPercent * imgRect.width) / 100,
        top: (coords.yPercent * imgRect.height) / 100,
        width: (coords.widthPercent * imgRect.width) / 100,
        height: (coords.heightPercent * imgRect.height) / 100,
      };
    }

    // Similar approach for absolute coordinates
    if (coords.x !== undefined) {
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      return {
        left: (coords.x / naturalWidth) * imgRect.width,
        top: (coords.y / naturalHeight) * imgRect.height,
        width: (coords.width / naturalWidth) * imgRect.width,
        height: (coords.height / naturalHeight) * imgRect.height,
      };
    }

    return null;
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

  // End call - updated to use the onEndSimulation prop
  const endCall = () => {
    // Clear any active timeout when ending the call
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    speechSynthRef.current.cancel();

    if (isRecording && recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecording(false);
    }

    setCallStatus("Call Ended");

    // Call the parent's end simulation handler
    onEndSimulation();
  };

  // Helper function to render message content based on settings
  const renderMessageContent = () => {
    if (!currentItem || currentItem.type !== "message") return null;

    // For customer messages
    if (currentItem.role === "Customer" || currentItem.role === "customer") {
      if (levelSettings?.hideCustomerScript) {
        return (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "blue.50",
              borderLeft: 4,
              borderColor: "primary.main",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.light" }}>
                C
              </Avatar>
              <Typography variant="subtitle2">Customer</Typography>
            </Stack>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {/* Hide the text but show a message indicating audio is playing */}
              {speaking ? "Customer is speaking..." : ""}
            </Typography>
          </Paper>
        );
      }
    }

    // For trainee messages
    if (currentItem.role === "Trainee" || currentItem.role === "assistant") {
      if (levelSettings?.hideAgentScript) {
        return (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "green.50",
              borderLeft: 4,
              borderColor: "success.main",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: "success.light" }}>
                T
              </Avatar>
              <Typography variant="subtitle2">Trainee</Typography>
            </Stack>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {/* Hide the text but show a message indicating recording is in progress */}
              Your turn to respond...
            </Typography>
          </Paper>
        );
      }
    }

    // If no hiding is required, render the original message BUT STRIP HTML TAGS
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: currentItem.role === "customer" ? "blue.50" : "green.50",
          borderLeft: 4,
          borderColor:
            currentItem.role === "customer" ? "primary.main" : "success.main",
          borderRadius: 1,
          mb: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
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
            {currentItem.role === "Customer" || currentItem.role === "customer"
              ? "C"
              : "T"}
          </Avatar>
          <Typography variant="subtitle2">
            {currentItem.role === "Customer" || currentItem.role === "customer"
              ? "Customer"
              : "Trainee"}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {stripHtmlTags(currentItem.text || "")}
        </Typography>
      </Paper>
    );
  };

  // Show loading state if no data
  if (!simulationData || !slides) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading simulation data...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Pause Overlay */}
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

      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1">{simulationData.sim_name}</Typography>
          <Typography
            variant="body2"
            sx={{ bgcolor: "grey.100", px: 1, py: 0.5, borderRadius: 1 }}
          >
            Level {simulationData.version}
          </Typography>
          <Typography
            variant="body2"
            sx={{ bgcolor: "grey.100", px: 1, py: 0.5, borderRadius: 1 }}
          >
            {simulationData.sim_type}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "primary.main", ml: "auto" }}
          >
            {formatTime(elapsedTime)}
          </Typography>
        </Stack>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex" }}>
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
            }}
          >
            <Box sx={{ position: "relative" }}>
              {currentSlide && (
                <img
                  ref={imageRef}
                  src={slides.get(currentSlide.imageId)}
                  alt={currentSlide.imageName}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                  }}
                  onLoad={handleImageLoad}
                />
              )}

              {/* Render hotspots directly on the image */}
              {imageLoaded &&
                currentItem?.type === "hotspot" &&
                (currentItem.coordinates ||
                  currentItem.percentageCoordinates) &&
                !shouldSkipHotspot() && (
                  <>
                    {/* Button hotspot */}
                    {(currentItem.hotspotType === "button" ||
                      !currentItem.hotspotType) && (
                      <Box
                        onClick={handleHotspotClick}
                        sx={{
                          position: "absolute",
                          cursor: "pointer",
                          // Basic positioning remains the same
                          left: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.left
                          }px`,
                          top: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.top
                          }px`,

                          // DIRECT FIX FOR WIDTH - explicitly calculate the width using percentages
                          width: `${(() => {
                            if (!imageRef.current) return 0;
                            const img = imageRef.current;
                            const imgRect = img.getBoundingClientRect();

                            // Directly calculate width based on percentage of image width
                            if (currentItem.percentageCoordinates) {
                              return (
                                (currentItem.percentageCoordinates
                                  .widthPercent *
                                  imgRect.width) /
                                100
                              );
                            }
                            // Fall back to absolute coordinates scaled by the ratio of rendered to natural width
                            else if (currentItem.coordinates) {
                              const scaleRatio =
                                imgRect.width / img.naturalWidth;
                              return currentItem.coordinates.width * scaleRatio;
                            }
                            return 0;
                          })()}px`,

                          // HEIGHT calculation remains the same as it's working correctly
                          height: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.height
                          }px`,
                        }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            height: "100%",
                            backgroundColor:
                              currentItem.settings?.buttonColor || "#444CE7",
                            color: currentItem.settings?.textColor || "#FFFFFF",
                            "&:hover": {
                              backgroundColor:
                                currentItem.settings?.buttonColor || "#444CE7",
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
                          left: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.left
                          }px`,
                          top: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.top
                          }px`,
                          width: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.width
                          }px`,
                          zIndex: 1,
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
                              height: `${
                                scaleCoordinates(
                                  currentItem.percentageCoordinates ||
                                    currentItem.coordinates,
                                )?.height
                              }px`,
                              bgcolor: "white",
                              border: highlightHotspot
                                ? `2px solid ${
                                    currentItem.settings?.highlightColor ||
                                    "#444CE7"
                                  }`
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
                                onClick={() => handleDropdownSelect(option)}
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
                          left: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.left
                          }px`,
                          top: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.top
                          }px`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Checkbox
                          checked={checkboxChecked}
                          sx={{
                            padding: 0,
                            "& .MuiSvgIcon-root": {
                              fontSize: `${
                                scaleCoordinates(
                                  currentItem.percentageCoordinates ||
                                    currentItem.coordinates,
                                )?.height
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
                          left: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.left
                          }px`,
                          top: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.top
                          }px`,
                          width: `${
                            scaleCoordinates(
                              currentItem.percentageCoordinates ||
                                currentItem.coordinates,
                            )?.width
                          }px`,
                        }}
                      >
                        <TextField
                          fullWidth
                          value={textInputValue}
                          onChange={(e) => setTextInputValue(e.target.value)}
                          onKeyDown={handleTextInputSubmit}
                          placeholder={
                            currentItem.settings?.placeholder ||
                            "Type and press Enter"
                          }
                          variant="outlined"
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              height: `${
                                scaleCoordinates(
                                  currentItem.percentageCoordinates ||
                                    currentItem.coordinates,
                                )?.height
                              }px`,
                              bgcolor: "white",
                              "& fieldset": {
                                borderColor: highlightHotspot
                                  ? currentItem.settings?.highlightColor ||
                                    "#444CE7"
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

                    {/* Highlight hotspot - only render if not hidden by settings */}
                    {currentItem.hotspotType === "highlight" &&
                      !levelSettings?.hideHighlights && (
                        <Box
                          onClick={handleHotspotClick}
                          sx={{
                            position: "absolute",
                            cursor: "pointer",
                            left: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.left}px`,
                            top: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.top}px`,
                            width: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.width}px`,
                            height: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.height}px`,
                            border: "7px solid", // INCREASED from 4px
                            borderColor:
                              currentItem.settings?.highlightColor ||
                              "rgba(68, 76, 231, 0.7)", // Keep original color intact
                            boxShadow: highlightHotspot
                              ? `0 0 18px 10px ${currentItem.settings?.highlightColor || "rgba(68, 76, 231, 0.7)"}` // Same color as border
                              : "none",
                            borderRadius: "5px", // Slightly increased
                            transition: "box-shadow 0.3s",
                          }}
                        />
                      )}
                  </>
                )}

              {imageLoaded &&
                currentMasking &&
                currentMasking.map(
                  (item, index) =>
                    item?.content &&
                    (item.content.coordinates ||
                      item.content.percentageCoordinates) && (
                      <Box
                        key={index}
                        sx={{
                          position: "absolute",
                          cursor: "pointer",
                          left: `${
                            scaleCoordinates(
                              item.content.percentageCoordinates ||
                                item.content.coordinates,
                            )?.left
                          }px`,
                          top: `${
                            scaleCoordinates(
                              item.content.percentageCoordinates ||
                                item.content.coordinates,
                            )?.top
                          }px`,
                          width: `${
                            scaleCoordinates(
                              item.content.percentageCoordinates ||
                                item.content.coordinates,
                            )?.width
                          }px`,
                          height: `${
                            scaleCoordinates(
                              item.content.percentageCoordinates ||
                                item.content.coordinates,
                            )?.height
                          }px`,
                          border: "4px solid",
                          borderColor: item.content.settings?.blur_mask
                            ? "gray"
                            : item.content.settings?.color ||
                              "rgba(68, 76, 231, 0.7)",
                          boxShadow: item.content.settings?.blur_mask
                            ? `0 0 12px 3px ${item.content.settings?.color}`
                            : "none",
                          borderRadius: "4px",
                          backgroundColor: item.content.settings?.color,
                          transition: "box-shadow 0.3s",
                          zIndex: 10,
                          filter: item.content.settings?.blur_mask
                            ? "blur(8px)"
                            : "none",
                          backdropFilter: item.content.settings?.blur_mask
                            ? "blur(8px)"
                            : "none",
                        }}
                      />
                    ),
                )}
            </Box>

            {/* Coaching tip button - only render if not hidden by settings */}
            {imageLoaded &&
              currentItem?.type === "hotspot" &&
              (currentItem.hotspotType === "coaching" ||
                currentItem.hotspotType === "coachingtip") &&
              (currentItem.coordinates || currentItem.percentageCoordinates) &&
              !levelSettings?.hideCoachingTips && (
                <Box
                  onClick={handleHotspotClick}
                  sx={{
                    position: "absolute",
                    cursor: "pointer",
                    left: `${
                      scaleCoordinates(
                        currentItem.percentageCoordinates ||
                          currentItem.coordinates,
                      )?.left
                    }px`,
                    top: `${
                      scaleCoordinates(
                        currentItem.percentageCoordinates ||
                          currentItem.coordinates,
                      )?.top
                    }px`,
                    width: `${
                      scaleCoordinates(
                        currentItem.percentageCoordinates ||
                          currentItem.coordinates,
                      )?.width
                    }px`,
                    height: `${
                      scaleCoordinates(
                        currentItem.percentageCoordinates ||
                          currentItem.coordinates,
                      )?.height
                    }px`,
                    zIndex: 50,
                    border: highlightHotspot
                      ? `2px solid ${
                          currentItem.settings?.highlightColor || "#1e293b"
                        }`
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
                      backgroundColor:
                        currentItem.settings?.buttonColor || "#1e293b",
                      color: currentItem.settings?.textColor || "#FFFFFF",
                      "&:hover": {
                        backgroundColor: currentItem.settings?.buttonColor
                          ? `${currentItem.settings.buttonColor}dd` // Slightly darker on hover
                          : "#0f172a",
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
                onClick={endCall}
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
                {/* Use the renderMessageContent function to apply script hiding rules */}
                {renderMessageContent()}

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
                          <Typography variant="caption" color="text.secondary">
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
    </Box>
  );
};

export default VisualAudioPreview;
