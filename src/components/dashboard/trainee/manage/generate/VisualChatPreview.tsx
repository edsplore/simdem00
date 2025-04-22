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
  InputAdornment,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
  Phone,
  CallEnd,
  ArrowForward,
  Send as SendIcon,
  VolumeUp,
  CheckCircle,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  Visibility as VisibilityIcon,
  Chat as ChatIcon,
  Timer as TimerIcon,
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

interface ChatMessage {
  id: string;
  role: "customer" | "trainee";
  text: string;
  timestamp: string;
}

interface VisualChatPreviewProps {
  simulationData: SimulationData;
  slides: Map<string, string>;
  onEndSimulation: () => void; // New prop for ending simulation
}

const VisualChatPreview: React.FC<VisualChatPreviewProps> = ({
  simulationData,
  slides,
  onEndSimulation,
}) => {
  // Component state for navigation and progress
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [callStatus, setCallStatus] = useState("Online");

  // State for image handling
  const [imageLoaded, setImageLoaded] = useState(false);
  // Update to track both width and height scales
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [isProcessing, setIsProcessing] = useState(false);

  // State for interactive elements
  const [highlightHotspot, setHighlightHotspot] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownValue, setDropdownValue] = useState("");
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [showCoachingTip, setShowCoachingTip] = useState(false);

  // State for chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [waitingForUserInput, setWaitingForUserInput] = useState(false);
  const [expectedTraineeResponse, setExpectedTraineeResponse] = useState("");

  // State for timeout
  const [timeoutActive, setTimeoutActive] = useState(false);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  // Clean up timeout when component unmounts or when sequence changes
  useEffect(() => {
    return () => {
      if (hotspotTimeoutRef.current) {
        clearTimeout(hotspotTimeoutRef.current);
        hotspotTimeoutRef.current = null;
      }
    };
  }, [currentSequenceIndex, currentSlideIndex]);

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

      if (currentItem.type === "message") {
        // For customer messages, automatically add to chat
        if (
          currentItem.role === "Customer" ||
          currentItem.role === "customer"
        ) {
          // Add to chat history
          const newMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "customer",
            text: currentItem.text || "",
            timestamp: new Date().toISOString(),
          };

          setChatMessages((prev) => [...prev, newMessage]);

          // Auto-advance after a short delay
          setTimeout(() => {
            moveToNextItem();
            setIsProcessing(false);
          }, 800);
        }
        // For trainee messages, wait for user input and provide hint
        else {
          setWaitingForUserInput(true);
          // Store the expected trainee response for the hint
          setExpectedTraineeResponse(currentItem.text || "");
          setIsProcessing(false);
        }
      } else if (currentItem.type === "hotspot") {
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

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle user input submission
  const handleSubmitMessage = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!userInput.trim() || !waitingForUserInput) return;

    // Add the trainee message to chat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "trainee",
      text: userInput,
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, newMessage]);

    // Clear input and waiting state
    setUserInput("");
    setWaitingForUserInput(false);
    setExpectedTraineeResponse("");

    // Move to next sequence item
    moveToNextItem();
  };

  // Format time for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
      // End of slideshow - simulation complete
      console.log("Simulation complete");
      // Call the parent's end simulation handler
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

  // Handle key press in chat input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage();
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

  // End call - updated to use the onEndSimulation prop
  const endCall = () => {
    // Clear any active timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

    setCallStatus("Chat Ended");

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
          <IconButton onClick={togglePause} sx={{ ml: 1 }}>
            {isPaused ? <PlayArrow /> : <Pause />}
          </IconButton>
          <IconButton onClick={endCall} color="error">
            <CallEnd />
          </IconButton>
        </Stack>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left side - Visual interface */}
        <Box sx={{ flex: 1, p: 2, overflow: "hidden" }} ref={imageContainerRef}>
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

              {/* Timeout indicator - show timer when timeout is active */}
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
                      backgroundColor: "#1e293b",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#0f172a",
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
          </Box>
        </Box>

        {/* Right side - Chat panel */}
        <Box
          sx={{
            width: 320,
            height: "100%",
            borderLeft: 1,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            bgcolor: "background.paper",
            overflow: "hidden",
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
              height: "60px", // Fixed height for header
              flexShrink: 0, // Prevent shrinking
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              {callStatus}
            </Typography>
          </Box>

          {/* Chat messages area */}
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: "auto",
              p: 2,
              bgcolor: "#F5F7FF",
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minHeight: "100px", // Minimum height to prevent collapsing
              maxHeight: "calc(100% - 100px)", // Ensure it doesn't push input off-screen
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#a8a8a8",
              },
            }}
          >
            {/* Initial message when chat is empty */}
            {chatMessages.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  textAlign: "center",
                  color: "text.secondary",
                  py: 8,
                }}
              >
                <ChatIcon sx={{ fontSize: 40, mb: 2, opacity: 0.5 }} />
                <Typography variant="body2">
                  Beginning of conversation
                </Typography>
              </Box>
            )}

            {/* Chat message bubbles */}
            {chatMessages.map((message) => (
              <Stack
                key={message.id}
                direction="row"
                spacing={1}
                alignItems="flex-start"
                justifyContent={
                  message.role === "customer" ? "flex-start" : "flex-end"
                }
              >
                {message.role === "customer" && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "primary.light",
                    }}
                  >
                    <SupportAgentIcon fontSize="small" />
                  </Avatar>
                )}

                <Paper
                  sx={{
                    p: 2,
                    maxWidth: "75%",
                    borderRadius: 2,
                    position: "relative",
                    bgcolor:
                      message.role === "customer" ? "#FFFFFF" : "#DCF8C6",
                    borderColor:
                      message.role === "customer"
                        ? "primary.light"
                        : "success.light",
                    "&:hover .timestamp": {
                      opacity: 1,
                    },
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                  <Typography
                    className="timestamp"
                    variant="caption"
                    sx={{
                      display: "block",
                      textAlign: "right",
                      color: "text.secondary",
                      mt: 0.5,
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {formatMessageTime(message.timestamp)}
                  </Typography>
                </Paper>

                {message.role === "trainee" && (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "success.light",
                    }}
                  >
                    <PersonIcon fontSize="small" />
                  </Avatar>
                )}
              </Stack>
            ))}

            {/* "Your turn to respond" indicator */}
            {waitingForUserInput && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  my: 1,
                }}
              >
                <Paper
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 2,
                    py: 1,
                    bgcolor: "warning.light",
                    color: "warning.dark",
                    borderRadius: "20px",
                    border: 1,
                    borderColor: "warning.main",
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "warning.main",
                      mr: 1,
                      animation: "pulse 1.5s infinite",
                      "@keyframes pulse": {
                        "0%": { opacity: 0.6 },
                        "50%": { opacity: 1 },
                        "100%": { opacity: 0.6 },
                      },
                    }}
                  />
                  <Typography variant="caption" fontWeight="medium">
                    Your turn to respond
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>

          {/* Message input area */}
          <Box
            component="form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitMessage();
            }}
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "white",
              maxHeight: "30%", // Reduced from 40% to take less vertical space
              height: "auto",
              overflowY: "auto",
              flexShrink: 0, // Prevent shrinking
              display: "flex",
              flexDirection: "column",
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                background: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "#c1c1c1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                background: "#a8a8a8",
              },
            }}
          >
            <Stack spacing={2}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder={
                    waitingForUserInput
                      ? "Type your response..."
                      : "Waiting for customer..."
                  }
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!waitingForUserInput}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      bgcolor: waitingForUserInput ? "white" : "grey.100",
                      borderColor: waitingForUserInput
                        ? "primary.main"
                        : "grey.300",
                    },
                  }}
                />
                <IconButton
                  type="submit"
                  disabled={!waitingForUserInput || !userInput.trim()}
                  sx={{
                    alignSelf: "flex-end",
                    bgcolor: waitingForUserInput ? "primary.main" : "grey.300",
                    color: waitingForUserInput ? "white" : "grey.500",
                    "&:hover": {
                      bgcolor: waitingForUserInput
                        ? "primary.dark"
                        : "grey.300",
                    },
                    "&.Mui-disabled": {
                      bgcolor: "grey.200",
                      color: "grey.400",
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>

              {/* Expected response hint */}
              {waitingForUserInput && expectedTraineeResponse && (
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: "warning.50",
                    border: 1,
                    borderColor: "warning.100",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "warning.dark", mb: 0.5 }}
                  >
                    Expected Response:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontStyle: "italic", color: "text.secondary", mb: 1 }}
                  >
                    {expectedTraineeResponse}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Type this response (or your own variation) to proceed
                  </Typography>
                </Paper>
              )}

              {/* Next button - alternative to typing exact response */}
              {waitingForUserInput && (
                <Button
                  fullWidth
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  onClick={() => {
                    // Use the expected response as the user's message
                    setUserInput(expectedTraineeResponse);
                    // Submit after a slight delay to show what was "typed"
                    setTimeout(() => {
                      handleSubmitMessage();
                    }, 100);
                  }}
                >
                  Use Suggested Response
                </Button>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VisualChatPreview;
