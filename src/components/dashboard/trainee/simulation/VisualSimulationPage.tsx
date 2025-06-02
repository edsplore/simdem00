import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Chip,
  SvgIcon,
} from "@mui/material";
import { withAlpha } from "../../../../utils/color";
import {
  PlayArrow,
  Pause,
  CallEnd,
  ArrowForward,
  Visibility as VisibilityIcon,
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
  startVisualSimulation,
  endVisualSimulation,
  VisualSimulationResponse,
  EndVisualSimulationResponse,
  SimulationData,
  ImageData,
} from "../../../../services/simulation_visual_attempts";
import { AttemptInterface } from "../../../../types/attempts";
import SimulationCompletionScreen from "./SimulationCompletionScreen";
import { buildPathWithWorkspace } from "../../../../utils/navigation";
import { mapLevelToCode } from "../../../../utils/simulation";

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

const HeadsetIcon = ({ size = 64, color = "#DEE2FD" }) => (
  <SvgIcon viewBox="0 0 64 64" sx={{ width: size, height: size }}>
    <path
      d="M20.0013 48C17.068 48 14.5569 46.9556 12.468 44.8667C10.3791 42.7778 9.33464 40.2667 9.33464 37.3333V26.4667C9.33464 24.2 10.0457 22.2111 11.468 20.5C12.8902 18.7889 14.7124 17.7333 16.9346 17.3333C19.468 16.8444 21.9791 16.5 24.468 16.3C26.9569 16.1 29.468 16 32.0013 16C34.5346 16 37.0569 16.1 39.568 16.3C42.0791 16.5 44.5791 16.8444 47.068 17.3333C49.2902 17.7778 51.1124 18.8444 52.5346 20.5333C53.9569 22.2222 54.668 24.2 54.668 26.4667V37.3333C54.668 40.2667 53.6235 42.7778 51.5346 44.8667C49.4457 46.9556 46.9346 48 44.0013 48H41.3346C40.7569 48 40.1791 47.9667 39.6013 47.9C39.0235 47.8333 38.468 47.6889 37.9346 47.4667L33.668 46C33.1346 45.7778 32.5791 45.6667 32.0013 45.6667C31.4235 45.6667 30.868 45.7778 30.3346 46L26.068 47.4667C25.5346 47.6889 24.9791 47.8333 24.4013 47.9C23.8235 47.9667 23.2457 48 22.668 48H20.0013ZM20.0013 42.6667H22.668C22.9791 42.6667 23.2791 42.6444 23.568 42.6C23.8569 42.5556 24.1346 42.4889 24.4013 42.4C25.6902 42 26.9457 41.5778 28.168 41.1333C29.3902 40.6889 30.668 40.4667 32.0013 40.4667C33.3346 40.4667 34.6235 40.6778 35.868 41.1C37.1124 41.5222 38.3569 41.9556 39.6013 42.4C39.868 42.4889 40.1457 42.5556 40.4346 42.6C40.7235 42.6444 41.0235 42.6667 41.3346 42.6667H44.0013C45.468 42.6667 46.7235 42.1444 47.768 41.1C48.8124 40.0556 49.3346 38.8 49.3346 37.3333V26.4667C49.3346 25.4889 49.0235 24.6444 48.4013 23.9333C47.7791 23.2222 47.0013 22.7556 46.068 22.5333C43.7569 22.0444 41.4346 21.7222 39.1013 21.5667C36.768 21.4111 34.4013 21.3333 32.0013 21.3333C29.6013 21.3333 27.2457 21.4222 24.9346 21.6C22.6235 21.7778 20.2902 22.0889 17.9346 22.5333C17.0013 22.7111 16.2235 23.1667 15.6013 23.9C14.9791 24.6333 14.668 25.4889 14.668 26.4667V37.3333C14.668 38.8 15.1902 40.0556 16.2346 41.1C17.2791 42.1444 18.5346 42.6667 20.0013 42.6667ZM4.66797 37.3333C4.09019 37.3333 3.61241 37.1444 3.23464 36.7667C2.85686 36.3889 2.66797 35.9111 2.66797 35.3333V28.6667C2.66797 28.0889 2.85686 27.6111 3.23464 27.2333C3.61241 26.8556 4.09019 26.6667 4.66797 26.6667C5.24575 26.6667 5.72352 26.8556 6.1013 27.2333C6.47908 27.6111 6.66797 28.0889 6.66797 28.6667V35.3333C6.66797 35.9111 6.47908 36.3889 6.1013 36.7667C5.72352 37.1444 5.24575 37.3333 4.66797 37.3333ZM59.3346 37.3333C58.7569 37.3333 58.2791 37.1444 57.9013 36.7667C57.5235 36.3889 57.3346 35.9111 57.3346 35.3333V28.6667C57.3346 28.0889 57.5235 27.6111 57.9013 27.2333C58.2791 26.8556 58.7569 26.6667 59.3346 26.6667C59.9124 26.6667 60.3902 26.8556 60.768 27.2333C61.1457 27.6111 61.3346 28.0889 61.3346 28.6667V35.3333C61.3346 35.9111 61.1457 36.3889 60.768 36.7667C60.3902 37.1444 59.9124 37.3333 59.3346 37.3333Z"
      fill={color}
    />
  </SvgIcon>
);

// Calculate rendered coordinates for display (with scaling)
const calculateRenderedCoordinates = (
  coords: any,
  imageElement: HTMLImageElement,
): { left: number; top: number; width: number; height: number } | null => {
  if (!coords || !imageElement) return null;

  // Get ONLY the image's bounding rectangle
  const imgRect = imageElement.getBoundingClientRect();

  // For percentage-based coordinates (preferred approach)
  if (coords.xPercent !== undefined) {
    return {
      // Apply percentages to the IMAGE dimensions only
      left: (coords.xPercent * imgRect.width) / 100,
      top: (coords.yPercent * imgRect.height) / 100,
      width: (coords.widthPercent * imgRect.width) / 100,
      height: (coords.heightPercent * imgRect.height) / 100,
    };
  }

  // For absolute coordinates (fallback for older data)
  if (coords.x !== undefined) {
    const naturalWidth = imageElement.naturalWidth || imgRect.width;
    const naturalHeight = imageElement.naturalHeight || imgRect.height;

    return {
      left: (coords.x / naturalWidth) * imgRect.width,
      top: (coords.y / naturalHeight) * imgRect.height,
      width: (coords.width / naturalWidth) * imgRect.width,
      height: (coords.height / naturalHeight) * imgRect.height,
    };
  }

  return null;
};

interface VisualSimulationPageProps {
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

const VisualSimulationPage: React.FC<VisualSimulationPageProps> = ({
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
  // Get authenticated user and workspace info
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const userId = user?.id || "";
  const userName = user?.name || "User";

  // Basic simulation state
  const [isStarted, setIsStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEndingSimulation, setIsEndingSimulation] = useState(false);
  const [simulationProgressId, setSimulationProgressId] = useState<
    string | null
  >(null);
  const [showCompletionScreen, setShowCompletionScreen] = useState(false);
  const [scores, setScores] = useState<
    EndVisualSimulationResponse["scores"] | null
  >(null);
  const [duration, setDuration] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState("Active");

  // Visual-specific state
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null,
  );
  // NEW: Keep raw image data instead of blob URLs
  const slideDataRef = useRef<Record<string, string>>({});
  // NEW: Current slide URL state (created just-in-time)
  const [frameUrl, setFrameUrl] = useState<string>("");

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Track both width and height scales
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

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const originalImageSizeRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  // NEW: Ref to store wrong clicks immediately
  const wrongClicksRef = useRef<Record<string, any[]>>({});

  const minPassingScore = simulation?.minimum_passing_score || 85;

  const showFeedbackButton =
    (level === "Level 01" && simulation?.lvl1?.enablePostSimulationSurvey) ||
    (level === "Level 02" && simulation?.lvl2?.enablePostSimulationSurvey) ||
    (level === "Level 03" && simulation?.lvl3?.enablePostSimulationSurvey) ||
    false;

  // Check if simulation was passed based on scores
  const isPassed = scores ? scores.FinalScore >= minPassingScore : false;

  // Get current slide and sequence data
  const slidesData = simulationData?.slidesData || [];
  const currentSlide = slidesData[currentSlideIndex] || {};
  const currentSequence = currentSlide.sequence || [];
  const currentMasking = currentSlide.masking || [];
  const currentItem = currentSequence[currentSequenceIndex];

  // Get level settings based on the selected level
  const getLevelSettings = () => {
    if (!simulationData) return {};

    if (level === "Level 01") {
      return simulationData.lvl1 || {};
    } else if (level === "Level 02") {
      return simulationData.lvl2 || {};
    } else if (level === "Level 03") {
      return simulationData.lvl3 || {};
    }
    return {};
  };

  const levelSettings = getLevelSettings();

  // Check if the current hotspot should be skipped based on settings
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

  useEffect(() => {
  }, [attemptSequenceData]);

  // Create just-in-time URL for current slide
  useEffect(() => {
    if (!currentSlide?.imageId) {
      setFrameUrl("");
      return;
    }

    const b64 = slideDataRef.current[currentSlide.imageId];
    if (!b64) {
      setFrameUrl("");
      return;
    }

    // Convert base64 to blob URL just-in-time
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: "image/png" }));
    setFrameUrl(url);

    // Clean up URL when we leave this slide
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentSlideIndex, currentSlide?.imageId]);

  // Debug current slide and sequence
  useEffect(() => {
    if (simulationData) {
    }
  }, [
    simulationData,
    currentSlideIndex,
    currentSequenceIndex,
    currentSlide,
    currentSequence,
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

    // Show coaching tip immediately if it's that type and not skipped by settings
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

    // Check if this hotspot should be skipped based on settings
    if (shouldSkipHotspot()) {
      // Skip to the next item
      moveToNextItem();
      return;
    }


    const processItem = async () => {
      setIsProcessing(true);

      if (currentItem.type === "hotspot") {
        // For hotspots, highlight and wait for click
        setHighlightHotspot(true);

        // Setup timeout based on hotspot settings
        const timeout = currentItem.settings?.timeoutDuration;

        if (timeout && timeout > 0) {
          // Clear any existing timeout
          if (hotspotTimeoutRef.current) {
            clearTimeout(hotspotTimeoutRef.current);
          }

          // Capture current item in closure to ensure we have the right reference
          const capturedItem = { ...currentItem };
          const capturedItemId = currentItem.id;

          setTimeoutActive(true);

          // Set a new timeout that will advance if no interaction occurs
          hotspotTimeoutRef.current = setTimeout(() => {

            // Add this hotspot to attemptSequenceData WITHOUT setting isClicked to true
            setAttemptSequenceData((prevData) => {

              const existingItemIndex = prevData.findIndex(
                (item) => item.id === capturedItemId,
              );

              // Get existing wrong clicks from state or ref
              let existingWrongClicks: any[] = [];
              if (existingItemIndex >= 0) {
                existingWrongClicks =
                  prevData[existingItemIndex].wrong_clicks || [];
              }

              // Also check the ref for any wrong clicks that might not be in state yet
              if (capturedItemId && wrongClicksRef.current[capturedItemId]) {
                existingWrongClicks = wrongClicksRef.current[capturedItemId];
              }


              // Create a clean timeout record with timedOut=true and NO isClicked property
              const timeoutRecord = {
                ...capturedItem,
                timedOut: true,
                wrong_clicks: existingWrongClicks, // Preserve existing wrong clicks
              };

              // Explicitly REMOVE isClicked property if it exists
              if ("isClicked" in timeoutRecord) {
                delete timeoutRecord.isClicked;
              }


              let newData: AttemptInterface[];
              if (existingItemIndex >= 0) {
                // Replace existing item with timeout version
                newData = [...prevData];
                newData[existingItemIndex] = timeoutRecord;
              } else {
                // Add new timeout record
                newData = [...prevData, timeoutRecord];
              }

              // Clear the ref data for this item
              if (capturedItemId && wrongClicksRef.current[capturedItemId]) {
                delete wrongClicksRef.current[capturedItemId];
              }

              // Pass the updated data to moveToNextItem
              setTimeout(() => {
                moveToNextItem(newData);
                setHighlightHotspot(false);
                setTimeoutActive(false);
                setIsProcessing(false);
              }, 0);

              return newData;
            });
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

  // Clean up timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hotspotTimeoutRef.current) {
        clearTimeout(hotspotTimeoutRef.current);
        hotspotTimeoutRef.current = null;
      }

      // Clean up any blob URLs
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
    };
  }, [frameUrl]);

  // Check for end of simulation
  useEffect(() => {
    if (
      isStarted &&
      currentSlideIndex >= slidesData.length - 1 &&
      currentSequenceIndex >= currentSequence.length - 1 &&
      currentSequence.length > 0 &&
      !isEndingSimulation
    ) {
      // We've reached the end of the last slide's sequence
      // Wait a moment for any final animations/transitions
      // setTimeout(() => {
      //   handleEndSimulation();
      // }, 1000);
    }
  }, [
    currentSlideIndex,
    currentSequenceIndex,
    slidesData.length,
    currentSequence.length,
    isStarted,
    isEndingSimulation,
  ]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
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

  // Check for clicks outside of active hotspot areas
  useEffect(() => {
    if (currentItem?.type !== "hotspot") return;

    const handleClick = (event: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container) return;

      // Skip tracking wrong clicks for dropdown, textfield and coaching hotspots
      const hotspotType = currentItem.hotspotType || "button";
      if (["dropdown", "textfield", "coaching"].includes(hotspotType)) {
        return;
      }

      // Check if the click is actually on the hotspot element
      const target = event.target as HTMLElement;
      const hotspotElement = target.closest('[data-hotspot="true"]');
      if (hotspotElement) {
        // This click is on the actual hotspot, don't record as wrong click
        return;
      }

      // Get click position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is within the hotspot bounds
      const coords = scaleCoordinates(
        currentItem.coordinates || currentItem.percentageCoordinates,
      );
      if (coords) {
        const clickWithinHotspot =
          x >= coords.left &&
          x <= coords.left + coords.width &&
          y >= coords.top &&
          y <= coords.top + coords.height;

        if (clickWithinHotspot) {
          // Click is within hotspot bounds, don't record as wrong click
          return;
        }
      }

      // Record as wrong click

      // Convert to percentages for more stable storage
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      const newWrongClick = {
        x_cordinates: x,
        y_cordinates: y,
        x_percent: xPercent,
        y_percent: yPercent,
      };

      // Store in ref immediately
      if (currentItem.id) {
        if (!wrongClicksRef.current[currentItem.id]) {
          wrongClicksRef.current[currentItem.id] = [];
        }
        wrongClicksRef.current[currentItem.id].push(newWrongClick);
      }

      // Also update state
      setAttemptSequenceData((prevData) => {
        const existingItem = prevData.find(
          (item) => item.id === currentItem.id,
        );

        if (existingItem) {
          const updatedItem = {
            ...existingItem,
            wrong_clicks: [...(existingItem.wrong_clicks || []), newWrongClick],
          };
          return [
            ...prevData.filter((item) => item.id !== currentItem.id),
            updatedItem,
          ];
        } else {
          const newItem = {
            ...currentItem,
            wrong_clicks: [newWrongClick],
          };
          return [...prevData, newItem];
        }
      });
    };

    const container = imageContainerRef.current;
    // Use capture phase to ensure we get the event before any child handlers
    container?.addEventListener("click", handleClick, true);

    return () => {
      container?.removeEventListener("click", handleClick, true);
    };
  }, [currentItem]);

  // MODIFIED: Handle hotspot click based on type
  const handleHotspotClick = (event?: React.MouseEvent) => {
    // Prevent event bubbling if event is provided
    event?.stopPropagation();

    if (
      !isStarted ||
      !currentItem ||
      currentItem.type !== "hotspot" ||
      isProcessing ||
      isPaused ||
      isEndingSimulation // Add guard to prevent clicks during end simulation
    )
      return;

    // Clear the timeout when user interacts with a hotspot
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

    const hotspotType = currentItem.hotspotType || "button";

    // For coaching tips, handle differently - they don't need to be tracked
    if (hotspotType === "coaching") {
      setShowCoachingTip(false);

      // Add a processing flag to prevent double-clicks
      setIsProcessing(true);

      // Simply move to next item without tracking the coaching tip
      // Don't pass any data - let it use the default path
      setTimeout(() => {
        moveToNextItem();
        setIsProcessing(false);
      }, 100);
      return;
    }

    // Only set isClicked for certain hotspot types (button, highlight, checkbox)
    const shouldSetIsClicked = ["button", "highlight", "checkbox"].includes(
      hotspotType,
    );

    // Create a clean clicked hotspot record
    const clickRecord = {
      ...currentItem,
      timedOut: false,
      wrong_clicks: [],
    };

    // Only add isClicked property for clickable hotspot types
    if (shouldSetIsClicked) {
      clickRecord.isClicked = true;
    }


    // Variable to store the updated data
    let updatedData: AttemptInterface[] = [];

    // Update the attempt sequence data
    setAttemptSequenceData((prevData) => {
      // Find if this item already exists in our data
      const existingItemIndex = prevData.findIndex(
        (item) => item.id === currentItem.id,
      );

      if (existingItemIndex >= 0) {
        // Make a copy of the data
        const newData = [...prevData];

        // Update the existing item with our click record
        // Keep existing wrong clicks as they are now properly filtered
        newData[existingItemIndex] = {
          ...clickRecord,
          wrong_clicks: newData[existingItemIndex].wrong_clicks || [],
        };

        updatedData = newData;
        return newData;
      } else {
        // If item doesn't exist, add it with empty wrong clicks
        // (wrong clicks will be added separately by container handler)
        updatedData = [...prevData, { ...clickRecord, wrong_clicks: [] }];
        return updatedData;
      }
    });


    switch (hotspotType) {
      case "button":
        // For button, simply advance
        setHighlightHotspot(false);
        setTimeout(() => {
          moveToNextItem(updatedData);
        }, 100);
        break;

      case "dropdown":
        // Toggle dropdown state
        setDropdownOpen(!dropdownOpen);
        break;

      case "checkbox":
        // Toggle checkbox state and advance after delay
        setCheckboxChecked(true);

        setTimeout(() => {
          moveToNextItem(updatedData);
          setCheckboxChecked(false);
        }, 800);
        break;

      case "highlight":
        // For highlight, clicking also dismisses it
        setHighlightHotspot(false);
        setTimeout(() => {
          moveToNextItem(updatedData);
        }, 100);
        break;

      default:
    }
  };

  // MODIFIED: Handle dropdown option selection
  const handleDropdownSelect = (option: string) => {
    setDropdownValue(option);
    setDropdownOpen(false);

    setTimeout(() => {
      setAttemptSequenceData((prevData) => {
        const existingItem = prevData.find(
          (item) => item.id === currentItem.id,
        );

        const dropdownRecord = {
          ...currentItem,
          userInput: option,
          wrong_clicks: [],
          timedOut: false,
        };

        // Do NOT add isClicked for dropdown type

        let newData: AttemptInterface[];
        if (existingItem) {
          newData = [
            ...prevData.filter((item) => item.id !== currentItem.id),
            dropdownRecord,
          ];
        } else {
          newData = [...prevData, dropdownRecord];
        }

        // If advanceOnSelect is true, move to next item
        if (currentItem?.settings?.advanceOnSelect) {
          setTimeout(() => moveToNextItem(newData), 400);
        }

        return newData;
      });
    }, 100);
  };

  // MODIFIED: Handle text input submission
  const handleTextInputSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const textInputRecord = {
        ...currentItem,
        userInput: textInputValue,
        wrong_clicks: [],
        timedOut: false,
      };

      // Do NOT add isClicked for text input

      setAttemptSequenceData((prevData) => {
        const existingItemIndex = prevData.findIndex(
          (item) => item.id === currentItem.id,
        );

        let newData: AttemptInterface[];
        if (existingItemIndex >= 0) {
          newData = [...prevData];
          newData[existingItemIndex] = textInputRecord;
        } else {
          newData = [...prevData, textInputRecord];
        }

        // Move to next item with the updated data
        moveToNextItem(newData);
        return newData;
      });
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
      setSimulationStatus("Loading visual simulation...");

      // Use the startVisualSimulation function from simulation_visual_attempts
      const response = await startVisualSimulation(
        userId,
        simulationId,
        assignmentId,
        attemptType, // Pass the attemptType
        mapLevelToCode(level),
      );


      if (response.simulation) {
        setSimulationData(response.simulation);
        setSimulationProgressId(response.id);
        setSimulationStatus("Active");
      }

      // Process image data - store raw base64 for just-in-time URL creation
      if (response.images && response.images.length > 0) {
        for (const image of response.images) {
          // Store raw base64 data in the ref
          slideDataRef.current[image.image_id] = image.image_data;
        }
      }
    } catch (error) {
      console.error("Error starting visual simulation:", error);
      setIsStarted(false);
      setSimulationStatus("Error loading simulation. Please try again.");
    } finally {
      setIsStarting(false);
      setIsLoadingVisuals(false);
    }
  };

  // MODIFIED: Move to next item in sequence with optional updated data
  const moveToNextItem = (updatedAttemptData?: AttemptInterface[]) => {
    // Clear any active timeout when manually moving to next item
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }
    setTimeoutActive(false);

    // Safety check - ensure we have valid data
    if (!slidesData || slidesData.length === 0) {
      console.error("No slides data available");
      return;
    }

    if (!currentSequence || currentSequence.length === 0) {
      console.error("No sequence data available");
      return;
    }


    // Check if this is the last item in the entire simulation
    const isLastSlide = currentSlideIndex >= slidesData.length - 1;
    const isLastItemInSequence =
      currentSequenceIndex >= currentSequence.length - 1;
    const isLastItem = isLastSlide && isLastItemInSequence;


    if (currentSequenceIndex < currentSequence.length - 1) {
      // Next item in current slide
      setCurrentSequenceIndex((prevIndex) => prevIndex + 1);
    } else if (currentSlideIndex < slidesData.length - 1) {
      // First item in next slide
      setCurrentSlideIndex((prevIndex) => prevIndex + 1);
      setCurrentSequenceIndex(0);
      setImageLoaded(false);
    } else if (isLastItem) {
      // End of slideshow
      setHighlightHotspot(false);

      // Use the updated data if provided
      if (updatedAttemptData !== undefined && updatedAttemptData.length > 0) {
        handleEndSimulationWithUpdatedData(updatedAttemptData);
      } else {
        handleEndSimulation();
      }
    } else {
      console.error("Unexpected state - no valid navigation path");
    }
  };

  // NEW: Handle end simulation with direct data
  const handleEndSimulationWithUpdatedData = async (
    updatedAttemptData: AttemptInterface[],
  ) => {

    // Prevent multiple simultaneous end simulation attempts
    if (isEndingSimulation) {
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingSimulation(true);

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear any active timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    // Update UI state
    setIsStarted(false);
    setSimulationStatus("Ended");

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end simulation API");
      setIsEndingSimulation(false);
      return;
    }

    try {
      // Use the updated data directly passed to this function
      const finalAttemptData = updatedAttemptData;


      // Use the endVisualSimulation function from simulation_visual_attempts
      const response = await endVisualSimulation(
        userId,
        simulationId,
        simulationProgressId,
        finalAttemptData,
      );

      if (response && response.scores) {
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);

        // Only show completion screen for Test attempts
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          // For Practice attempts, go back to list
          onBackToList();
        }
      } else {
        console.warn("No scores received in response");
        // Even without scores, only show completion for Test attempts
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          onBackToList();
        }
      }
    } catch (error) {
      console.error("Failed to end visual simulation:", error);
      // Even on error, check attempt type
      if (attemptType === "Test") {
        setShowCompletionScreen(true);
      } else {
        onBackToList();
      }
    } finally {
      setIsEndingSimulation(false);
    }
  };

  // Handle end simulation implementation
  const handleEndSimulation = async () => {

    // Prevent multiple simultaneous end simulation attempts
    if (isEndingSimulation) {
      return;
    }

    // Verify user ID exists
    if (!userId) {
      console.error("Error: User ID is required to end simulation");
      return;
    }

    setIsEndingSimulation(true);

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Clear any active timeout
    if (hotspotTimeoutRef.current) {
      clearTimeout(hotspotTimeoutRef.current);
      hotspotTimeoutRef.current = null;
    }

    // Update UI state
    setIsStarted(false);
    setSimulationStatus("Ended");

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end simulation API");
      setIsEndingSimulation(false);
      return;
    }

    try {
      // IMPORTANT: Make a direct copy of the current data that we can manipulate synchronously
      // This avoids relying on asynchronous state updates
      let finalAttemptData = JSON.parse(JSON.stringify(attemptSequenceData));

      // Process the current item if it's a hotspot
      if (currentItem && currentItem.type === "hotspot") {
        // Check if this item already exists in the data
        const itemIndex = finalAttemptData.findIndex(
          (item) => item.id === currentItem.id,
        );

        // Determine if this hotspot has timed out or should be considered clicked
        const hasTimeoutSetting = currentItem.settings?.timeoutDuration > 0;
        const existingRecord =
          itemIndex >= 0 ? finalAttemptData[itemIndex] : null;
        const isTimedOut =
          timeoutActive ||
          (hasTimeoutSetting &&
            !currentItem.isClicked &&
            !(existingRecord && (existingRecord as any).isClicked));


        if (isTimedOut) {
          // Get existing wrong clicks if any
          const existingWrongClicks = existingRecord
            ? existingRecord.wrong_clicks || []
            : [];

          // Create a clean timeout record WITHOUT isClicked property
          const timeoutRecord = {
            ...currentItem,
            timedOut: true,
            wrong_clicks: existingWrongClicks, // Preserve existing wrong clicks
          };

          if ("isClicked" in timeoutRecord) {
            delete timeoutRecord.isClicked;
          }

          // Update or add the record
          if (itemIndex >= 0) {
            finalAttemptData[itemIndex] = timeoutRecord;
          } else {
            finalAttemptData.push(timeoutRecord);
          }
        } else {
          // Normal clicked hotspot
          const hotspotType = currentItem.hotspotType || "";
          const shouldBeClicked = ["button", "highlight", "checkbox"].includes(
            hotspotType,
          );

          if (itemIndex >= 0) {
            // Update existing record based on hotspot type
            if (shouldBeClicked) {
              finalAttemptData[itemIndex] = {
                ...finalAttemptData[itemIndex],
                isClicked: true,
                timedOut: false,
              };
            }
          } else {
            // Add new record with appropriate properties
            const newRecord = {
              ...currentItem,
              wrong_clicks: [],
            };

            if (shouldBeClicked) {
              newRecord.isClicked = true;
              newRecord.timedOut = false;
            }

            finalAttemptData.push(newRecord);
          }
        }
      }

      // Final validation pass - ensure any hotspot with a timeout setting and timedOut=true
      // does NOT have an isClicked property
      finalAttemptData = finalAttemptData.map((item) => {
        if (item.type === "hotspot" && item.settings?.timeoutDuration > 0) {
          if (item.timedOut === true && "isClicked" in item) {
            // Create a clean copy without the isClicked property
            const { isClicked, ...cleanItem } = item;
            return cleanItem;
          }
        }
        return item;
      });


      // Use the endVisualSimulation function from simulation_visual_attempts
      const response = await endVisualSimulation(
        userId,
        simulationId,
        simulationProgressId,
        finalAttemptData,
      );

      if (response && response.scores) {
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);

        // Only show completion screen for Test attempts
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          // For Practice attempts, go back to list
          onBackToList();
        }
      } else {
        console.warn("No scores received in response");
        // Even without scores, only show completion for Test attempts
        if (attemptType === "Test") {
          setShowCompletionScreen(true);
        } else {
          onBackToList();
        }
      }
    } catch (error) {
      console.error("Failed to end visual simulation:", error);
      // Even on error, check attempt type
      if (attemptType === "Test") {
        setShowCompletionScreen(true);
      } else {
        onBackToList();
      }
    } finally {
      setIsEndingSimulation(false);
    }
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

  const handleRestartSim = () => {
    setShowCompletionScreen(false);
    setIsStarted(false);
    setElapsedTime(0);
    setScores(null);
    setCurrentSlideIndex(0);
    setCurrentSequenceIndex(0);
    setImageLoaded(false);
  };

  const navigate = useNavigate();

  const handleViewPlayback = () => {
    if (!simulationProgressId) return;
    const path = buildPathWithWorkspace(
      `/playback/${simulationProgressId}`,
      currentWorkspaceId,
      currentTimeZone,
    );
    navigate(path);
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

  return (
    <>
      <SimulationCompletionScreen
        showCompletionScreen={showCompletionScreen}
        userName={userName}
        simulationName={simulationName}
        simulationId={simulationId}
        attemptId={simulationProgressId || ""}
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
        showFeedbackButton={showFeedbackButton}
      />

      <Box sx={{ height: "100%", bgcolor: "white", py: 0, px: 0 }}>
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
        <Box
          sx={{ maxWidth: "900px", mx: "auto", borderRadius: "16px", mt: 1 }}
        >
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
              minHeight: "360px",
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
              <HeadsetIcon size={96} color="#DEE2FD" />
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
            >
              Start Simulation
            </Typography>
            <Typography sx={{ color: "#666", mb: 3 }}>
              Press start to attempt the Visual Simulation
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
                width: "80%",
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
                width: "80%",
              }}
            >
              Back to Sim List
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              height: "calc(100vh - 130px)",
              bgcolor: "background.default",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Main content - Modified to be more compact vertically */}
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
              <Box sx={{ flex: 1, p: 1 }} ref={imageContainerRef}>
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
                  ) : !currentSlide || !frameUrl ? (
                    <Box sx={{ textAlign: "center", p: 4 }}>
                      <Typography color="text.secondary">
                        No visual content available
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: "relative" }}>
                      <img
                        ref={imageRef}
                        src={frameUrl}
                        alt={currentSlide.imageName || "Simulation slide"}
                        style={{
                          width: "100%",
                          height: "auto",
                          objectFit: "contain",
                          display: "block",
                          maxHeight: "calc(100vh - 180px)",
                        }}
                        onLoad={handleImageLoad}
                      />

                      {/* Timeout indicator */}
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
                          >
                            <AccessTimeIcon fontSize="small" />
                            <Typography variant="caption">
                              Auto-advance in{" "}
                              {currentItem.settings?.timeoutDuration}s
                            </Typography>
                          </Box>
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
                                onClick={(e) => handleHotspotClick(e)}
                                data-hotspot="true"
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
                                data-hotspot="true"
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
                                          currentItem.percentageCoordinates ||
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
                                data-hotspot="true"
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
                                          currentItem.percentageCoordinates ||
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
                              </Box>
                            )}

                            {/* Text field hotspot */}
                            {currentItem.hotspotType === "textfield" && (
                              <Box
                                data-hotspot="true"
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
                                          currentItem.percentageCoordinates ||
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

                            {/* Highlight hotspot - Only render if hideHighlights is false */}
                            {currentItem.hotspotType === "highlight" &&
                              !levelSettings.hideHighlights && (
                                <Box
                                  onClick={(e) => handleHotspotClick(e)}
                                  data-hotspot="true"
                                  sx={{
                                    position: "absolute",
                                    cursor: "pointer",
                                    left: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.left}px`,
                                    top: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.top}px`,
                                    width: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.width}px`,
                                    height: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.height}px`,
                                    border: "8px solid", // INCREASED from 4px to 8px
                                    borderColor: getHighlightColor(), // Use the function already defined that respects user settings
                                    boxShadow: highlightHotspot
                                      ? `0 0 18px 8px ${getHighlightColor()}` // Use same user-defined color
                                      : "none",
                                    borderRadius: "6px", // Slightly increased from 4px
                                    transition: "all 0.3s ease",
                                    zIndex: 10,
                                  }}
                                />
                              )}

                            {/* Coaching tip hotspot */}
                            {currentItem.hotspotType === "coaching" &&
                              !levelSettings.hideCoachingTips && (
                                <Box
                                  onClick={(e) => handleHotspotClick(e)}
                                  data-hotspot="true"
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
                                      ? `2px solid ${getHighlightColor()}`
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

                      {/* Render maskings directly on the image */}
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
                                  border: item.content.settings?.blur_mask
                                    ? "none"
                                    : "4px solid",
                                  borderColor: item.content.settings?.blur_mask
                                    ? "transparent"
                                    : item.content.settings?.color ||
                                      "rgba(68, 76, 231, 0.7)",
                                  boxShadow: item.content.settings?.blur_mask
                                    ? `0 0 12px 3px ${item.content.settings?.color}`
                                    : "none",
                                  borderRadius: "4px",
                                  backgroundColor: item.content.settings
                                    ?.blur_mask
                                    ? withAlpha(
                                        item.content.settings?.color ||
                                          "rgba(0,0,0,1)",
                                        0.4,
                                      )
                                    : item.content.settings?.color,
                                  transition: "box-shadow 0.3s",
                                  zIndex: 10,
                                  filter: "none",
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
                    p: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "50px",
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Visual Mode ({simulationStatus})
                  </Typography>
                  <Box>
                    <IconButton
                      onClick={togglePause}
                      sx={{ bgcolor: "grey.100", mr: 1 }}
                      size="small"
                    >
                      {isPaused ? (
                        <PlayArrow fontSize="small" />
                      ) : (
                        <Pause fontSize="small" />
                      )}
                    </IconButton>

                    <IconButton
                      onClick={handleEndSimulation}
                      sx={{
                        bgcolor: "error.main",
                        color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                      }}
                      size="small"
                    >
                      <CallEnd fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Empty content area - made more compact */}
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    color: "text.secondary",
                    textAlign: "center",
                  }}
                >
                  <VisibilityIcon
                    sx={{ fontSize: 36, color: "grey.400", mb: 1 }}
                  />
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Visual Mode
                  </Typography>
                  <Typography variant="caption">
                    Interact with the interface on the left to navigate through
                    the simulation
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Loading overlay for ending simulation */}
        {isEndingSimulation && (
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
              Processing your interactions and calculating performance...
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default VisualSimulationPage;
