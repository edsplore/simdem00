import React, { useState, useRef, useEffect, useCallback } from "react";
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
import SimulationCompletionScreen from "./SimulationCompletionScreen";

// Utility interfaces for percentage-based coordinate system
interface PercentageCoordinates {
  xPercent: number; // 0-100% of image width
  yPercent: number; // 0-100% of image height
  widthPercent: number; // Width as percentage of image width
  heightPercent: number; // Height as percentage of image height
}

interface AbsoluteCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Utility functions for coordinate conversions
const absoluteToPercentage = (
  coords: AbsoluteCoordinates,
  imageWidth: number,
  imageHeight: number,
): PercentageCoordinates => {
  return {
    xPercent: (coords.x / imageWidth) * 100,
    yPercent: (coords.y / imageHeight) * 100,
    widthPercent: (coords.width / imageWidth) * 100,
    heightPercent: (coords.height / imageHeight) * 100,
  };
};

const percentageToAbsolute = (
  coords: PercentageCoordinates,
  imageWidth: number,
  imageHeight: number,
): AbsoluteCoordinates => {
  return {
    x: (coords.xPercent * imageWidth) / 100,
    y: (coords.yPercent * imageHeight) / 100,
    width: (coords.widthPercent * imageWidth) / 100,
    height: (coords.heightPercent * imageHeight) / 100,
  };
};

// Calculate rendered coordinates for display (with scaling)
const calculateRenderedCoordinates = (
  coords: any,
  imageElement: HTMLImageElement,
): { left: number; top: number; width: number; height: number } => {
  // Get the rendered dimensions of the image
  const rect = imageElement.getBoundingClientRect();
  const renderedWidth = rect.width;
  const renderedHeight = rect.height;

  // Check if we have percentage-based coordinates
  if (coords.xPercent !== undefined) {
    // Use percentage-based calculation
    return {
      left: (coords.xPercent * renderedWidth) / 100,
      top: (coords.yPercent * renderedHeight) / 100,
      width: (coords.widthPercent * renderedWidth) / 100,
      height: (coords.heightPercent * renderedHeight) / 100,
    };
  } else if (coords.x !== undefined) {
    // Use natural dimensions for scaling absolute coordinates
    const naturalWidth = imageElement.naturalWidth || renderedWidth;
    const naturalHeight = imageElement.naturalHeight || renderedHeight;

    return {
      left: (coords.x / naturalWidth) * renderedWidth,
      top: (coords.y / naturalHeight) * renderedHeight,
      width: (coords.width / naturalWidth) * renderedWidth,
      height: (coords.height / naturalHeight) * renderedHeight,
    };
  }

  // Fallback in case no valid coordinates
  return { left: 0, top: 0, width: 0, height: 0 };
};

// Utility function to remove any HTML tags from incoming text. This prevents
// elements like <p>, <i> or header tags from showing up in the chat display.
const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // If we have access to the DOM (browser environment) use it for more
  // reliable sanitising of the text. Fall back to a simple regex otherwise.
  if (typeof window !== "undefined") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
};

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

interface VisualChatSimulationPageProps {
  simulationId: string;
  simulationName: string;
  level: string;
  simType: string;
  attemptType: string;
  onBackToList: () => void;
  onGoToNextSim?: () => void;
  onRestartSim?: () => void;
  hasNextSimulation?: boolean;
  assignmentId: string;
  simulation?: any;
}

const VisualChatSimulationPage: React.FC<VisualChatSimulationPageProps> = ({
  simulationId,
  simulationName,
  level,
  simType,
  attemptType,
  onBackToList,
  onGoToNextSim,
  hasNextSimulation,
  assignmentId,
  simulation,
  onRestartSim,
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
    null,
  );
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [callStatus, setCallStatus] = useState("Online");

  // Visual-chat specific state
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
  const originalImageSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const minPassingScore = simulation?.minimum_passing_score || 85;

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.FinalScore >= minPassingScore : false;

  // Get current slide and sequence data
  const slidesData = simulationData?.slidesData || [];
  const currentSlide = slidesData[currentSlideIndex] || {};
  const currentSequence = currentSlide.sequence || [];
  const currentMasking = currentSlide.masking || [];
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
      currentItem.hotspotType === "coaching" &&
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
      currentItem?.hotspotType === "coaching" &&
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
          currentItem.hotspotType,
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
            text: stripHtmlTags(currentItem.text || ""),
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
          setExpectedTraineeResponse(stripHtmlTags(currentItem.text || ""));
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
      // console.log("Reached end of simulation content");
      // // Wait a moment for any final animations/transitions
      // setTimeout(() => {
      //   handleEndChat();
      // }, 1000);
    }
    // Note: Similar to Visual Audio version, we're not auto-ending when waiting for user input
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

  // Format time for messages
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Improved implementation for more accurate scaling
  const handleImageLoad = () => {
    if (!imageRef.current) return;

    // Use requestAnimationFrame to ensure image dimensions are available
    requestAnimationFrame(() => {
      if (!imageRef.current) return;

      const img = imageRef.current;

      // Store original/natural image dimensions for future reference
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      // Store these values in a ref for access across renders
      originalImageSizeRef.current = {
        width: naturalWidth,
        height: naturalHeight,
      };

      // Calculate and update scale factors
      updateImageScales();

      // Mark image as loaded
      setImageLoaded(true);

      console.log(
        `Image loaded with natural dimensions: ${naturalWidth}x${naturalHeight}`,
      );
    });
  };

  // Function to update image scales based on current dimensions
  const updateImageScales = useCallback(() => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // Get the rendered dimensions
    const renderedWidth = rect.width;
    const renderedHeight = rect.height;

    // Get the natural dimensions (or use stored values if naturalWidth is not available)
    const naturalWidth = img.naturalWidth || originalImageSizeRef.current.width;
    const naturalHeight =
      img.naturalHeight || originalImageSizeRef.current.height;

    // Only update if we have valid dimensions to avoid division by zero
    if (naturalWidth > 0 && naturalHeight > 0) {
      const newScales = {
        width: renderedWidth / naturalWidth,
        height: renderedHeight / naturalHeight,
      };

      // Only update if scales have actually changed
      if (
        Math.abs(newScales.width - imageScale.width) > 0.001 ||
        Math.abs(newScales.height - imageScale.height) > 0.001
      ) {
        setImageScale(newScales);
        console.log(
          `Image scales updated: width=${newScales.width.toFixed(4)}, height=${newScales.height.toFixed(4)}`,
        );
      }
    }
  }, [imageScale.width, imageScale.height]);

  // Add a robust ResizeObserver implementation
  useEffect(() => {
    if (!imageRef.current || !imageContainerRef.current) return;

    // Create resize observer
    const resizeObserver = new ResizeObserver(() => {
      // Call update function when container or image size changes
      updateImageScales();
    });

    // Observe both container and image element
    resizeObserver.observe(imageContainerRef.current);
    resizeObserver.observe(imageRef.current);

    // Also listen for window resize events
    window.addEventListener("resize", updateImageScales);

    // Add a MutationObserver to detect DOM changes affecting layout
    const mutationObserver = new MutationObserver(() => {
      updateImageScales();
    });

    // Observe parent elements for attribute changes
    if (imageContainerRef.current.parentElement) {
      mutationObserver.observe(imageContainerRef.current.parentElement, {
        attributes: true,
        childList: false,
        subtree: false,
      });
    }

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateImageScales);
    };
  }, [updateImageScales]);

  // Improved and unified coordinate scaling function
  const scaleCoordinates = (coords: any) => {
    if (!coords || !imageRef.current) return null;

    // Use the utility function for consistent scaling
    try {
      return calculateRenderedCoordinates(coords, imageRef.current);
    } catch (error) {
      console.error("Error scaling coordinates:", error);

      // Fallback to old method if needed
      if (coords.x !== undefined) {
        return {
          left: coords.x * imageScale.width,
          top: coords.y * imageScale.height,
          width: coords.width * imageScale.width,
          height: coords.height * imageScale.height,
        };
      }

      return { left: 0, top: 0, width: 0, height: 0 };
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
      // Add a short delay to ensure state updates are processed
      setTimeout(() => {
        handleEndChat();
      }, 300); // 300ms should be enough for state to update
    }
  };

  // Handle hotspot click based on type
  const handleHotspotClick = (event?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    event?.stopPropagation();

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
    console.log("Hotspot clicked:", hotspotType, "ID:", currentItem.id);

    // Simpler approach: find the item in our data and update its properties
    setAttemptSequenceData((prevData) => {
      // Find if this item already exists in our data
      const existingItemIndex = prevData.findIndex(
        (item) => item.id === currentItem.id,
      );

      if (existingItemIndex >= 0) {
        // Make a copy of the data
        const newData = [...prevData];
        const existingItem = newData[existingItemIndex];

        // Set isClicked to true and remove the last wrong click (if any)
        let updatedWrongClicks = [...(existingItem.wrong_clicks || [])];
        if (updatedWrongClicks.length > 0) {
          // Remove the last wrong click
          updatedWrongClicks.pop();
        }

        // Update the item
        newData[existingItemIndex] = {
          ...existingItem,
          isClicked: true,
          wrong_clicks: updatedWrongClicks,
        };

        console.log(
          `Updated hotspot ${currentItem.id}, removed last wrong click`,
          updatedWrongClicks,
        );
        return newData;
      } else {
        // If item doesn't exist yet, add it with isClicked=true
        return [
          ...prevData,
          {
            ...currentItem,
            isClicked: true,
            wrong_clicks: [], // Start with empty wrong_clicks
          },
        ];
      }
    });

    switch (hotspotType) {
      case "button":
      case "highlight":
        // For button and highlight, add delay before moving to next item
        setHighlightHotspot(false);
        setTimeout(() => {
          moveToNextItem();
        }, 100); // Small delay to allow state update
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
        // For coaching tips, clicking anywhere dismisses it
        setShowCoachingTip(false);
        moveToNextItem();
        break;

      default:
        console.log("Unknown hotspot type:", hotspotType);
    }
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
            userInput: option,
          },
        ];
      } else {
        return [
          ...prevData,
          {
            ...currentItem,
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
          (item) => item.id === currentItem.id,
        );
        if (existingItem) {
          return [
            ...prevData.filter((item) => item.id !== currentItem.id),
            {
              ...existingItem,
              userInput: textInputValue,
              wrong_clicks: [], // Add this line to set wrong_clicks to empty array
            },
          ];
        } else {
          return [
            ...prevData,
            {
              ...currentItem,
              userInput: textInputValue,
              wrong_clicks: [], // Add this line to set wrong_clicks to empty array
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
      text: stripHtmlTags(userInput),
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
        assignmentId,
        attemptType, // Pass the attemptType
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

      // Make a copy of the current data
      let finalAttemptData = [...attemptSequenceData];

      // Check if current item is a hotspot that should be marked as clicked
      if (currentItem && currentItem.type === "hotspot") {
        // Find if this item is already in our data
        const itemIndex = finalAttemptData.findIndex(
          (item) => item.id === currentItem.id,
        );

        if (itemIndex >= 0) {
          // Ensure it's marked as clicked and has the last wrong click removed
          const existingItem = finalAttemptData[itemIndex];
          let updatedWrongClicks = [...(existingItem.wrong_clicks || [])];
          if (updatedWrongClicks.length > 0) {
            // Remove the last wrong click (which would be the correct click on the hotspot)
            updatedWrongClicks.pop();
          }

          finalAttemptData[itemIndex] = {
            ...existingItem,
            isClicked: true,
            wrong_clicks: updatedWrongClicks,
          };
          console.log(
            "Final data updated for last hotspot:",
            finalAttemptData[itemIndex],
          );
        } else {
          // Add it if not found
          finalAttemptData.push({
            ...currentItem,
            isClicked: true,
            wrong_clicks: [],
          });
        }
      }

      // Use the endVisualChatAttempt function instead of direct axios call
      const response = await endVisualChatAttempt(
        userId,
        simulationId,
        simulationProgressId,
        finalAttemptData,
      );

      if (response && response.scores) {
        console.log("Setting scores and showing completion screen");
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);
        setShowCompletionScreen(true);
      } else {
        console.warn("No scores received in response");
        // Show completion screen even without scores
        setShowCompletionScreen(true);
      }
    } catch (error) {
      console.error("Failed to end visual-chat simulation:", error);
      // Show an error message to the user if needed
      // Still show completion screen to avoid stuck state
      setShowCompletionScreen(true);
    } finally {
      console.log("End chat flow completed");
      setIsEndingChat(false);
    }
  };

  // to check if user is clicking outside the hotspot
  useEffect(() => {
    if (currentItem?.type !== "hotspot") return;

    const handleClick = (event: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container) return;

      // Get click position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Record every click on the container
      // We'll remove it later if it turns out to be a correct click on the hotspot
      console.log(`Recording click at x=${x}, y=${y}`);

      // Convert to percentages for more stable storage
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      setAttemptSequenceData((prevData) => {
        const existingItem = prevData.find(
          (item) => item.id === currentItem.id,
        );
        if (existingItem) {
          return [
            ...prevData.filter((item) => item.id !== currentItem.id),
            {
              ...existingItem,
              wrong_clicks: [
                ...(existingItem.wrong_clicks || []),
                {
                  x_cordinates: x,
                  y_cordinates: y,
                  x_percent: xPercent,
                  y_percent: yPercent,
                },
              ],
            },
          ];
        } else {
          return [
            ...prevData,
            {
              ...currentItem,
              wrong_clicks: [
                {
                  x_cordinates: x,
                  y_cordinates: y,
                  x_percent: xPercent,
                  y_percent: yPercent,
                },
              ],
            },
          ];
        }
      });
    };

    const container = imageContainerRef.current;
    container?.addEventListener("click", handleClick);

    return () => {
      container?.removeEventListener("click", handleClick);
    };
  }, [currentItem]);

  // Original handlers (kept for existing functionality)
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

  // Updated navigation handlers
  const handleBackToSimList = () => {
    setShowCompletionScreen(false);
    onBackToList();
  };

  const handleGoToNextSim = () => {
    if (onGoToNextSim && hasNextSimulation) {
      setShowCompletionScreen(false);
      onGoToNextSim();
    }
  };

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      slides.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, [slides]);

  return (
    <>
      <SimulationCompletionScreen
        showCompletionScreen={showCompletionScreen}
        userName={userName}
        simulationName={simulationName}
        level={level}
        simType={simType}
        attemptType={attemptType}
        scores={scores}
        duration={duration}
        isPassed={isPassed}
        onBackToList={handleBackToSimList}
        onGoToNextSim={hasNextSimulation ? handleGoToNextSim : undefined}
        onRestartSim={onRestartSim}
        onViewPlayback={handleViewPlayback}
        hasNextSimulation={hasNextSimulation}
        minPassingScore={minPassingScore}
      />

      <Box
        sx={{ height: "calc(100vh - 30px)", bgcolor: "white", py: 0, px: 0 }}
      >
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
                    <Box sx={{ position: "relative" }}>
                      <img
                        ref={imageRef}
                        src={slides.get(currentSlide.imageId)}
                        alt={currentSlide.imageName || "Simulation slide"}
                        style={{
                          width: "100%",
                          height: "auto",
                          objectFit: "contain",
                          display: "block",
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
                                onClick={(e) => handleHotspotClick(e)}
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
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleHotspotClick(e);
                                    }}
                                    open={dropdownOpen}
                                    onClose={() => setDropdownOpen(false)}
                                    sx={{
                                      height: `${
                                        scaleCoordinates(
                                          currentItem.coordinates,
                                        )?.height
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
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDropdownSelect(option);
                                        }}
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
                                onClick={(e) => handleHotspotClick(e)}
                                sx={{
                                  position: "absolute",
                                  left: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.left
                                  }px`,
                                  top: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
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
                                        scaleCoordinates(
                                          currentItem.coordinates,
                                        )?.height
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
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.top
                                  }px`,
                                  width: `${
                                    scaleCoordinates(currentItem.coordinates)
                                      ?.width
                                  }px`,
                                  zIndex: 10,
                                }}
                                onClick={(e) => e.stopPropagation()}
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
                                        scaleCoordinates(
                                          currentItem.coordinates,
                                        )?.height
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
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Highlight hotspot clicked");
                                    handleHotspotClick(e);
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

                            {/* Coaching tip button - only render if not hidden by settings */}
                            {currentItem.hotspotType === "coaching" &&
                              !levelSettings.hideCoachingTips && (
                                <Box
                                  onClick={(e) => handleHotspotClick(e)}
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

                      {imageLoaded &&
                        currentMasking &&
                        currentMasking.map(
                          (item, index) =>
                            item?.content && (
                              <Box
                                key={index}
                                sx={{
                                  position: "absolute",
                                  cursor: "pointer",
                                  left: `${
                                    scaleCoordinates(item.content.coordinates)
                                      ?.left
                                  }px`,
                                  top: `${
                                    scaleCoordinates(item.content.coordinates)
                                      ?.top
                                  }px`,
                                  width: `${
                                    scaleCoordinates(item.content.coordinates)
                                      ?.width
                                  }px`,
                                  height: `${
                                    scaleCoordinates(item.content.coordinates)
                                      ?.height
                                  }px`,
                                  border: "4px solid",
                                  borderColor:
                                    item.content.settings?.color ||
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
                                  backdropFilter: item.content.settings
                                    ?.blur_mask
                                    ? "blur(8px)"
                                    : "none",
                                }}
                              />
                            ),
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
                        <Typography variant="body2">
                          {stripHtmlTags(message.text)}
                        </Typography>
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

        {/* Loading overlay for ending chat */}
        {isEndingChat && (
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
              bgcolor: "rgba(255, 255, 255, 0.95)",
              zIndex: 9999,
            }}
          >
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Analyzing Attempt
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluating interactions and chat responses...
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default VisualChatSimulationPage;
