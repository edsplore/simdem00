import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Fade,
  Modal,
  Checkbox,
  TextField,
  FormControl,
  MenuItem,
  Select,
  CircularProgress,
  IconButton,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  ArrowForward,
  CheckCircle,
  Visibility as VisibilityIcon,
  Timer as TimerIcon,
  CallEnd,
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
      tipText?: string;
    }>;
  }>;
}

interface VisualPreviewProps {
  simulationData: SimulationData;
  slides: Map<string, string>;
  onEndSimulation: () => void; // New prop for ending simulation
}

const VisualPreview: React.FC<VisualPreviewProps> = ({
  simulationData,
  slides,
  onEndSimulation,
}) => {
  // Component state for navigation and progress
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [simulationStatus, setSimulationStatus] = useState("Active");

  // State for image handling
  const [imageLoaded, setImageLoaded] = useState(false);
  // Updated to track both width and height scales
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [isProcessing, setIsProcessing] = useState(false);

  // State for interactive elements
  const [highlightHotspot, setHighlightHotspot] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [showCoachingTip, setShowCoachingTip] = useState(false);
  const [timeoutActive, setTimeoutActive] = useState(false);

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
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
    };
  }, [isPaused]);

  // Reset states when moving to a new item
  useEffect(() => {
    // Clear any existing timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

    setDropdownOpen(false);
    setDropdownValue("");
    setCheckboxChecked(false);
    setTextInputValue("");
    setShowCoachingTip(false);

    // Show coaching tip immediately if it's that type
    if (
      currentItem?.type === "hotspot" &&
      (currentItem?.hotspotType === "coaching" ||
        currentItem?.hotspotType === "coachingtip")
    ) {
      setShowCoachingTip(true);
    }
  }, [currentSequenceIndex, currentSlideIndex]);

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

          setTimeoutActive(true);

          // Set a new timeout that will advance if no interaction occurs
          hotspotTimeoutRef.current = setTimeout(() => {
            console.log(`Timeout of ${timeout} seconds reached for hotspot`);
            moveToNextItem();
            setHighlightHotspot(false);
            setTimeoutActive(false);
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

  // Clean up hotspot timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hotspotTimeoutRef.current) {
        clearTimeout(hotspotTimeoutRef.current);
        hotspotTimeoutRef.current = null;
      }
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Updated handleImageLoad to calculate both width and height scales
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

  // Get highlight color from settings or use default
  const getHighlightColor = () => {
    if (
      currentItem?.type === "hotspot" &&
      currentItem.settings?.highlightColor
    ) {
      return currentItem.settings.highlightColor;
    }
    return "rgba(68, 76, 231, 0.7)"; // Default color
  };

  // Move to next item in sequence
  const moveToNextItem = () => {
    // Clear any active timeout when manually moving to next item
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

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
      setSimulationStatus("Completed");
      // Call the onEndSimulation prop
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
    setTimeoutActive(false);

    const hotspotType = currentItem.hotspotType || "button";

    switch (hotspotType) {
      case "button":
        // For button, simply advance
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

      case "highlight":
        // For highlight, clicking also dismisses it
        setHighlightHotspot(false);
        moveToNextItem();
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

  // Updated scaleCoordinates to use both width and height scales
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

    // When resuming, restart timeout if needed
    if (isPaused && currentItem?.type === "hotspot" && timeoutActive) {
      const timeout = currentItem.settings?.timeoutDuration;
      if (timeout && timeout > 0) {
        hotspotTimeoutRef.current = setTimeout(() => {
          moveToNextItem();
          setHighlightHotspot(false);
          setTimeoutActive(false);
        }, timeout * 1000);
      }
    }
  };

  // End simulation function - updated to use the onEndSimulation prop
  const endSimulation = () => {
    // Clear any active timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

    setSimulationStatus("Ended");

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
          height: "600px", // Fixed height for loading state
          width: "100%",
          maxWidth: "1200px", // Maximum width
          mx: "auto", // Center horizontally
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
        height: "calc(100vh - 40px)", // Slightly reduced from full viewport height
        maxHeight: "900px", // Maximum height to prevent overflow on large screens
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        mx: "auto", // Center horizontally
        boxShadow: 3,
        borderRadius: 2,
        overflow: "hidden", // Hide any overflow from internal components
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
      <Box
        sx={{ p: 2, borderBottom: 1, borderColor: "divider", flexShrink: 0 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" noWrap>
            {simulationData.sim_name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ bgcolor: "grey.100", px: 1, py: 0.5, borderRadius: 1 }}
            noWrap
          >
            Level {simulationData.version}
          </Typography>
          <Typography
            variant="body2"
            sx={{ bgcolor: "grey.100", px: 1, py: 0.5, borderRadius: 1 }}
            noWrap
          >
            {simulationData.sim_type}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "primary.main", ml: "auto" }}
          >
            {formatTime(elapsedTime)}
          </Typography>
          <IconButton onClick={togglePause} sx={{ bgcolor: "grey.100", mr: 1 }}>
            {isPaused ? <PlayArrow /> : <Pause />}
          </IconButton>
          <IconButton
            onClick={endSimulation}
            sx={{
              bgcolor: "error.main",
              color: "white",
              "&:hover": { bgcolor: "error.dark" },
            }}
          >
            <CallEnd />
          </IconButton>
        </Stack>
      </Box>

      {/* Main content - Modified to match the layout of other components */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left side - Visual interface (same positioning as in other components) */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            overflow: "hidden",
          }}
          ref={imageContainerRef}
        >
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

              {/* Timeout indicator (simplified, without text) */}
              {timeoutActive &&
                currentItem?.type === "hotspot" &&
                currentItem.settings?.timeoutDuration &&
                !isPaused && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      bgcolor: "rgba(0, 0, 0, 0.6)",
                      color: "white",
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      zIndex: 100,
                    }}
                  ></Box>
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
                              ? `2px solid ${getHighlightColor()}`
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
                                ? `2px solid ${getHighlightColor()}`
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
                              ? getHighlightColor()
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
                                  ? getHighlightColor()
                                  : "rgba(0, 0, 0, 0.23)",
                                borderWidth: highlightHotspot ? 2 : 1,
                              },
                              "&:hover fieldset": {
                                borderColor: getHighlightColor(),
                              },
                              "&.Mui-focused fieldset": {
                                borderColor: getHighlightColor(),
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
                          borderColor: getHighlightColor(),
                          boxShadow: highlightHotspot
                            ? `0 0 12px 3px ${getHighlightColor()}`
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
                      border: highlightHotspot
                        ? `2px solid ${getHighlightColor()}`
                        : "none",
                    }}
                  >
                    {currentItem.settings?.tipText ||
                      currentItem.name ||
                      "Coaching Tip"}
                  </Button>
                </Box>
              )}

            {/* Navigation Controls removed as requested */}
          </Box>
        </Box>

        {/* Right side - Empty sidebar (to match layout of other components) */}
        <Box
          sx={{
            width: 320,
            borderLeft: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Empty sidebar with status header to match other components */}
          <Box
            sx={{
              p: 2,
              borderBottom: 1,
              borderColor: "divider",
              height: "60px",
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Visual Mode ({simulationStatus})
            </Typography>
          </Box>

          {/* Empty content area */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            <VisibilityIcon sx={{ fontSize: 40, color: "grey.400", mb: 2 }} />
            <Typography variant="body2" sx={{ mb: 1 }}>
              Visual Mode
            </Typography>
            <Typography variant="caption">
              Interact with the interface on the left to navigate through the
              simulation
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VisualPreview;
