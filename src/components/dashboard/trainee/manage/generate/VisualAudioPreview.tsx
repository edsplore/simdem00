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
  // Component state for navigation and progress
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [callStatus, setCallStatus] = useState("Ringing...");

  // State for image handling
  const [imageLoaded, setImageLoaded] = useState(false);
  // Update to track both width and height scales
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
  const currentItem = currentSequence[currentSequenceIndex];

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
  }, [currentItem, isPaused]);

  // Process current sequence item
  useEffect(() => {
    if (!currentItem || isProcessing || !imageLoaded || isPaused) return;

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
                          left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                          top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                          width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
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
                          left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                          top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
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
                                scaleCoordinates(currentItem.coordinates)
                                  ?.height
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

                    {/* Highlight hotspot */}
                    {currentItem.hotspotType === "highlight" && (
                      <Box
                        onClick={handleHotspotClick}
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
                        }}
                      />
                    )}
                  </>
                )}
            </Box>

            {/* Coaching tip button */}
            {imageLoaded &&
              currentItem?.type === "hotspot" &&
              (currentItem.hotspotType === "coaching" ||
                currentItem.hotspotType === "coachingtip") &&
              currentItem.coordinates && (
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
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor:
                      currentItem.role === "customer" ? "blue.50" : "green.50",
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
