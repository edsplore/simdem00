import React, { useState, useRef, useEffect } from "react";
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
  Chip,
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
  AccessTime as AccessTimeIcon,
  SignalCellularAlt as SignalIcon,
  SentimentSatisfiedAlt as SatisfiedIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
  SmartToy as SmartToyIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../../context/AuthContext";
import {
  startVisualChatAttempt,
  endVisualChatAttempt,
  StartVisualChatResponse,
  EndVisualChatResponse,
} from "../../../../services/simulation_visual_chat_attempts";
import { AttemptInterface } from "../../../../types/attempts";

interface ChatMessage {
  id: string;
  role: "customer" | "trainee";
  text: string;
  timestamp: string;
}

interface ImageData {
  image_id: string;
  image_data: string;
}

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
      settings?: any;
      role?: string;
      text?: string;
      options?: string[];
      tipText?: string;
    }>;
  }>;
}

interface VisualChatSimulationPageProps {
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

const VisualChatSimulationPage: React.FC<VisualChatSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  assignmentId,
}) => {
  // Get authenticated user
  const { user } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  // Basic simulation state
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingChat, setIsEndingChat] = useState(false);
  const [simulationProgressId, setSimulationProgressId] = useState<
    string | null
  >(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [scores, setScores] = useState<EndVisualChatResponse["scores"] | null>(
    null
  );
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [callStatus, setCallStatus] = useState("Online");

  // Visual-chat specific state
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null
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
  const [timeoutActive, setTimeoutActive] = useState(false);

  // Chat specific state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [waitingForUserInput, setWaitingForUserInput] = useState(false);
  const [expectedTraineeResponse, setExpectedTraineeResponse] = useState("");

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.sim_accuracy >= MIN_PASSING_SCORE : false;

  // Get current slide and sequence data
  const slidesData = simulationData?.slidesData || [];
  const currentSlide = slidesData[currentSlideIndex] || {};
  const currentSequence = currentSlide.sequence || [];
  const currentItem = currentSequence[currentSequenceIndex];

  // Function to get the appropriate level settings
  const getLevelSettings = () => {
    // If no simulation data yet, return a default
    if (!simulationData) {
      return {
        hideHighlights: false,
        hideCoachingTips: false,
      };
    }

    // Get settings based on selected level
    if (level === "Level 01") {
      return simulationData.lvl1;
    } else if (level === "Level 02") {
      return simulationData.lvl2;
    } else if (level === "Level 03") {
      return simulationData.lvl3;
    }

    // Default to level 1 if level not recognized
    return simulationData.lvl1;
  };

  const levelSettings = getLevelSettings();

  // Function to check if a hotspot should be skipped based on settings
  const shouldSkipHotspot = () => {
    if (!currentItem || currentItem.type !== "hotspot") return false;

    // Skip highlight hotspots if hideHighlights is enabled
    if (
      currentItem.hotspotType === "highlight" &&
      levelSettings.hideHighlights
    ) {
      return true;
    }

    // Skip coaching tip hotspots if hideCoachingTips is enabled
    if (
      (currentItem.hotspotType === "coaching" ||
        currentItem.hotspotType === "coachingtip") &&
      levelSettings.hideCoachingTips
    ) {
      return true;
    }

    return false;
  };
  // user attempt sequence data
  const [attemptSequenceData, setAttemptSequenceData] = useState<
    AttemptInterface[]
  >([]);

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
      if (!isPaused && isStarted) {
        setElapsedTime((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, isStarted]);

  useEffect(() => {
    console.log("simulation Data ---- ", simulationData);
    console.log("Attempt simulation Data ---- ", attemptSequenceData);
    console.log("Chat Messages Data ---- ", chatMessages);
  }, [simulationData, attemptSequenceData, chatMessages]);

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
    setHighlightHotspot(false);
    setWaitingForUserInput(false);
    setExpectedTraineeResponse("");

    // Show coaching tip immediately if it's that type and not hidden by settings
    if (
      currentItem?.type === "hotspot" &&
      (currentItem?.hotspotType === "coaching" ||
        currentItem?.hotspotType === "coachingtip") &&
      !levelSettings.hideCoachingTips
    ) {
      setShowCoachingTip(true);
    }
  }, [currentSequenceIndex, currentSlideIndex, levelSettings.hideCoachingTips]);

  // Process current sequence item
  useEffect(() => {
    if (!currentItem || isProcessing || !imageLoaded || isPaused || !isStarted)
      return;

    console.log("Processing current item:", {
      type: currentItem.type,
      role: currentItem.role,
      hotspotType: currentItem.hotspotType,
      text: currentItem.text?.substring(0, 30) + "...",
    });

    const processItem = async () => {
      setIsProcessing(true);

      // Check if current hotspot should be skipped based on settings
      if (shouldSkipHotspot()) {
        console.log(
          "Skipping hotspot due to level settings:",
          currentItem.hotspotType
        );
        moveToNextItem(); // Skip to the next item
        setIsProcessing(false);
        return;
      }

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
          setAttemptSequenceData((prevState) => [
            ...prevState,
            {
              ...currentItem,
              userMessageId: newMessage.id,
              userText: newMessage.text,
              timestamp: newMessage.timestamp,
            },
          ]);
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

          // Focus the input field
          setTimeout(() => {
            if (chatInputRef.current) {
              chatInputRef.current.focus();
            }
          }, 100);
        }
      } else if (currentItem.type === "hotspot") {
        // For hotspots, highlight and wait for click
        setHighlightHotspot(true);

        // Setup timeout based on hotspot settings
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
    isStarted,
  ]);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Clean up timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hotspotTimeoutRef.current) {
        clearTimeout(hotspotTimeoutRef.current);
        hotspotTimeoutRef.current = null;
      }
    };
  }, []);

  // Check for end of simulation
  useEffect(() => {
    if (
      isStarted &&
      currentSlideIndex >= slidesData.length - 1 &&
      currentSequenceIndex >= currentSequence.length - 1 &&
      currentSequence.length > 0 &&
      !isEndingChat &&
      !waitingForUserInput
    ) {
      // We've reached the end of the last slide's sequence
      console.log("Reached end of simulation content");
      // Wait a moment for any final animations/transitions
      setTimeout(() => {
        handleEndChat();
      }, 1000);
    }
  }, [
    currentSlideIndex,
    currentSequenceIndex,
    slidesData.length,
    currentSequence.length,
    isStarted,
    isEndingChat,
    waitingForUserInput,
  ]);

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

  // Format time for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
        `Image loaded with scales - width: ${widthScale}, height: ${heightScale}`
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

    console.log(
      "Moving to next item from",
      currentSequenceIndex,
      "in slide",
      currentSlideIndex
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
      handleEndChat();
    }
  };

  // Handle hotspot click based on type
  const handleHotspotClick = () => {
    if (
      !isStarted ||
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
    console.log("Hotspot clicked:", hotspotType);
    setAttemptSequenceData((prevData) => {
      const existingItem = prevData.find((item) => item.id === currentItem.id);
      if (existingItem) {
        return [
          ...prevData.filter((item) => item.id !== currentItem.id),
          {
            ...existingItem,
            isClicked: true,
          },
        ];
      } else {
        return [
          ...prevData,
          {
            ...currentItem,
            isClicked: true,
          },
        ];
      }
    });

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
    coords: { x: number; y: number; width: number; height: number } | undefined
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
    setAttemptSequenceData((prevData) => {
      const existingItem = prevData.find((item) => item.id === currentItem.id);
      if (existingItem) {
        return [
          ...prevData.filter((item) => item.id !== currentItem.id),
          {
            ...existingItem,
            isClicked: true,
            userInput: option,
          },
        ];
      } else {
        return [
          ...prevData,
          {
            ...currentItem,
            isClicked: true,
            userInput: option,
          },
        ];
      }
    });

    if (currentItem?.settings?.advanceOnSelect) {
      setTimeout(() => moveToNextItem(), 500);
    }
  };

  // Handle text input submission
  const handleTextInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setAttemptSequenceData((prevData) => {
        const existingItem = prevData.find(
          (item) => item.id === currentItem.id
        );
        if (existingItem) {
          return [
            ...prevData.filter((item) => item.id !== currentItem.id),
            {
              ...existingItem,
              isClicked: true,
              userInput: textInputValue,
            },
          ];
        } else {
          return [
            ...prevData,
            {
              ...currentItem,
              isClicked: true,
              userInput: textInputValue,
            },
          ];
        }
      });
      moveToNextItem();
    }
  };

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
    setAttemptSequenceData((prevState) => [
      ...prevState,
      {
        ...currentItem,
        userMessageId: newMessage.id,
        userText: newMessage.text,
        timestamp: newMessage.timestamp,
      },
    ]);

    // Clear input and waiting state
    setUserInput("");
    setWaitingForUserInput(false);
    setExpectedTraineeResponse("");

    // Move to next sequence item
    setTimeout(() => {
      moveToNextItem();
    }, 500);
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

  const handleStart = async () => {
    if (!userId) {
      console.error("Error: User ID is required to start simulation");
      return;
    }

    setIsStarting(true);
    setIsLoadingVisuals(true);
    try {
      setIsStarted(true);
      setCallStatus("Loading visual-chat simulation...");

      // Use the startVisualChatAttempt function instead of direct axios call
      const response = await startVisualChatAttempt(
        userId,
        simulationId,
        assignmentId
      );

      console.log("Start visual-chat response:", response);

      if (response.simulation) {
        console.log("Setting simulation data");
        setSimulationData(response.simulation);
        setSimulationProgressId(response.id);
        setCallStatus("Online");
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
      console.error("Error starting visual-chat simulation:", error);
      setIsStarted(false);
      setCallStatus("Error loading simulation. Please try again.");
    } finally {
      setIsStarting(false);
      setIsLoadingVisuals(false);
    }
  };

  // Handle end chat implementation
  const handleEndChat = async () => {
    console.log("🔴 END CHAT BUTTON PRESSED");

    // Prevent multiple simultaneous end call attempts
    if (isEndingChat) {
      console.log("Already ending chat, ignoring duplicate request");
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingChat(true);

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }

    // Clear any active timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    // Update UI state
    setIsStarted(false);

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end chat API");
      setIsEndingChat(false);
      return;
    }

    try {
      console.log("Executing end-visual-chat API call");
      // Use the endVisualChatAttempt function instead of direct axios call
      const response = await endVisualChatAttempt(
        userId,
        simulationId,
        simulationProgressId,
        attemptSequenceData
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
      console.error("Failed to end visual-chat simulation:", error);
      // Show an error message to the user if needed
    } finally {
      console.log("End chat flow completed");
      setIsEndingChat(false);
    }
  };

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsStarted(false);
    setElapsedTime(0);
    setScores(null);
    setCurrentSlideIndex(0);
    setCurrentSequenceIndex(0);
    setImageLoaded(false);
    setChatMessages([]);
  };

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

  // to  check if user is clicking outside the hubspot
  useEffect(() => {
    if (currentItem?.type !== "hotspot") return;

    const handleClick = (event: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container) return;

      // Get click position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const {
        x: boxX,
        y: boxY,
        width,
        height,
      } = currentItem.coordinates || { x: 0, y: 0, width: 0, height: 0 };

      // Check if the click is outside the currentItem box
      const isOutside =
        x < boxX || x > boxX + width || y < boxY || y > boxY + height;

      if (isOutside) {
        console.log(`Clicked outside currentItem at x=${x}, y=${y}`);
        setAttemptSequenceData((prevData) => {
          const existingItem = prevData.find(
            (item) => item.id === currentItem.id
          );
          if (existingItem) {
            return [
              ...prevData.filter((item) => item.id !== currentItem.id),
              {
                ...existingItem,
                wrong_clicks: [
                  ...(existingItem.wrong_clicks || []),
                  { x_cordinates: x, y_cordinates: y },
                ],
              },
            ];
          } else {
            return [
              ...prevData,
              {
                ...currentItem,
                wrong_clicks: [{ x_cordinates: x, y_cordinates: y }],
              },
            ];
          }
        });
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
  }, [currentItem]);

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
          height: "calc(100vh - 40px)",
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
                  {scores ? `${Math.round(scores.sim_accuracy)}%` : "86%"}
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
    <Box sx={{ height: "calc(100vh - 30px)", bgcolor: "white", py: 0, px: 0 }}>
      {/* Pause Overlay */}
      <Modal
        open={isPaused && isStarted}
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
        <Fade in={isPaused && isStarted}>
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
            p: 1.5,
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

      {!isStarted ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "350px",
            width: "50%",
            mx: "auto",
            my: 6,
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
            <ChatIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
          </Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
          >
            Start Simulation
          </Typography>
          <Typography sx={{ color: "#666", mb: 3 }}>
            Press start to attempt the Visual-Chat Simulation
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
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
            height: "calc(100vh - 80px)",
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
              mt: 1,
            }}
          >
            {/* Left side - Visual interface */}
            <Box sx={{ flex: 1, p: 1.5 }} ref={imageContainerRef}>
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
                        maxHeight: "calc(100vh - 150px)",
                        display: "block",
                        margin: "0 auto",
                      }}
                      onLoad={handleImageLoad}
                    />

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
                      currentItem.coordinates &&
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
                                left: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.left
                                }px`,
                                top: `${
                                  scaleCoordinates(currentItem.coordinates)?.top
                                }px`,
                                width: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.width
                                }px`,
                                height: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.height
                                }px`,
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
                                left: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.left
                                }px`,
                                top: `${
                                  scaleCoordinates(currentItem.coordinates)?.top
                                }px`,
                                width: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.width
                                }px`,
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
                                    height: `${
                                      scaleCoordinates(currentItem.coordinates)
                                        ?.height
                                    }px`,
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
                                left: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.left
                                }px`,
                                top: `${
                                  scaleCoordinates(currentItem.coordinates)?.top
                                }px`,
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
                                left: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.left
                                }px`,
                                top: `${
                                  scaleCoordinates(currentItem.coordinates)?.top
                                }px`,
                                width: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.width
                                }px`,
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

                          {/* Highlight hotspot - only render if not hidden by settings */}
                          {currentItem.hotspotType === "highlight" &&
                            !levelSettings.hideHighlights && (
                              <Box
                                onClick={() => {
                                  console.log("Highlight hotspot clicked");
                                  handleHotspotClick();
                                }}
                                sx={{
                                  position: "absolute",
                                  cursor: "pointer",
                                  left: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.left
                                  }px`,
                                  top: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
                                  }px`,
                                  width: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.width
                                  }px`,
                                  height: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.height
                                  }px`,
                                  border: "4px solid",
                                  borderColor: getHighlightColor(),
                                  boxShadow: highlightHotspot
                                    ? `0 0 12px 3px ${getHighlightColor()}`
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
                                left: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.left
                                }px`,
                                top: `${
                                  scaleCoordinates(currentItem.coordinates)?.top
                                }px`,
                                width: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.width
                                }px`,
                                height: `${
                                  scaleCoordinates(currentItem.coordinates)
                                    ?.height
                                }px`,
                                zIndex: 50,
                              }}
                            >
                              <Button
                                fullWidth
                                variant="contained"
                                sx={{
                                  position: "absolute",
                                  cursor: "pointer",
                                  left: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.left
                                  }px`,
                                  top: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
                                  }px`,
                                  width: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.width
                                  }px`,
                                  height: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.height
                                  }px`,
                                  border: "4px solid",
                                  borderColor: getHighlightColor(),
                                  boxShadow: highlightHotspot
                                    ? `0 0 12px 3px ${getHighlightColor()}`
                                    : "none",
                                  borderRadius: "4px",
                                  backgroundColor: "transparent",
                                  transition: "box-shadow 0.3s",
                                  zIndex: 10,
                                }}
                              />
                            </Box>
                          )}

                          {/* Coaching tip button - only render if not hidden by settings */}
                          {(currentItem.hotspotType === "coaching" ||
                            currentItem.hotspotType === "coachingtip") &&
                            !levelSettings.hideCoachingTips && (
                              <Box
                                onClick={handleHotspotClick}
                                sx={{
                                  position: "absolute",
                                  cursor: "pointer",
                                  left: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.left
                                  }px`,
                                  top: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
                                  }px`,
                                  width: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.width
                                  }px`,
                                  height: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.height
                                  }px`,
                                  zIndex: 50,
                                }}
                              >
                                <Button
                                  fullWidth
                                  variant="contained"
                                  sx={{
                                    height: "100%",
                                    backgroundColor:
                                      currentItem.settings?.buttonColor ||
                                      "#1e293b",
                                    color:
                                      currentItem.settings?.textColor ||
                                      "#FFFFFF",
                                    "&:hover": {
                                      backgroundColor: currentItem.settings
                                        ?.buttonColor
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
                        </>
                      )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Right side - Chat panel */}
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
                  p: 1.5,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: "50px", // Reduced from 60px
                  flexShrink: 0, // Prevent shrinking
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
                    onClick={handleEndChat}
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

              {/* Chat messages area */}
              <Box
                ref={chatContainerRef}
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  p: 1.5,
                  bgcolor: "#F5F7FF",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  minHeight: "80px", // Reduced from 100px
                  maxHeight: "calc(100% - 90px)", // Adjusted to prevent input being pushed off-screen
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
                      py: 4, // Reduced from py: 8
                    }}
                  >
                    <ChatIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">
                      {isLoadingVisuals
                        ? "Loading simulation..."
                        : "Beginning of conversation"}
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
                          width: 28, // Reduced from 32
                          height: 28, // Reduced from 32
                          bgcolor: "primary.light",
                        }}
                      >
                        <SupportAgentIcon fontSize="small" />
                      </Avatar>
                    )}

                    <Paper
                      sx={{
                        p: 1.5, // Reduced from p: 2
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
                          width: 28, // Reduced from 32
                          height: 28, // Reduced from 32
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
                        px: 1.5, // Reduced from px: 2
                        py: 0.75, // Reduced from py: 1
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
                  p: 1.5, // Reduced from p: 2
                  borderTop: 1,
                  borderColor: "divider",
                  bgcolor: "white",
                  maxHeight: "25%", // Reduced from 30%
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
                <Stack spacing={1.5}>
                  {" "}
                  {/* Reduced from spacing: 2 */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      inputRef={chatInputRef}
                      fullWidth
                      multiline
                      maxRows={2} // Reduced from maxRows: 3
                      placeholder={
                        waitingForUserInput
                          ? "Type your response..."
                          : "Waiting for customer..."
                      }
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!waitingForUserInput || isEndingChat}
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
                      disabled={
                        !waitingForUserInput ||
                        !userInput.trim() ||
                        isEndingChat
                      }
                      sx={{
                        alignSelf: "flex-end",
                        bgcolor: waitingForUserInput
                          ? "primary.main"
                          : "grey.300",
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
                        p: 1.5, // Reduced from p: 2
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
                        sx={{
                          fontStyle: "italic",
                          color: "text.secondary",
                          mb: 0.5, // Reduced from mb: 1
                        }}
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
      )}
    </Box>
  );
};

export default VisualChatSimulationPage;
