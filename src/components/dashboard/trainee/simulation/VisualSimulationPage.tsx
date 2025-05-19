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
  Chip,
} from "@mui/material";
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
  // Get authenticated user
  const { user } = useAuth();
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

  const minPassingScore = simulation?.minimum_passing_score || 85;

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
    console.log("attempt Simulation page ------- ", attemptSequenceData);
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
      console.log("Current simulation data:", {
        slidesCount: simulationData.slidesData?.length || 0,
        currentSlideIndex,
        currentSequenceIndex,
        currentSlide: currentSlide?.imageId || "none",
        currentSequenceLength: currentSequence?.length || 0,
      });
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
      console.log(
        "Skipping hotspot due to level settings:",
        currentItem.hotspotType,
      );
      // Skip to the next item
      moveToNextItem();
      return;
    }

    console.log("Processing current item:", {
      type: currentItem.type,
      hotspotType: currentItem.hotspotType,
    });

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
      console.log("Reached end of simulation content");
      // Wait a moment for any final animations/transitions
      setTimeout(() => {
        handleEndSimulation();
      }, 1000);
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

      // Convert to percentages for more stable storage
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;

      // Get hotspot coordinates
      const coords = currentItem.coordinates ||
        currentItem.percentageCoordinates || {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

      // Scale hotspot coordinates
      const scaledCoords = scaleCoordinates(coords);

      if (!scaledCoords) return;

      // Check if the click is outside the hotspot
      const { left, top, width, height } = scaledCoords;
      const isOutside =
        x < left || x > left + width || y < top || y > top + height;

      if (isOutside) {
        console.log(`Clicked outside currentItem at x=${x}, y=${y}`);
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

    // Only set isClicked and handle wrong_clicks for specific hotspot types
    if (["button", "highlight", "checkbox"].includes(hotspotType)) {
      setAttemptSequenceData((prevData) => {
        const existingItemIndex = prevData.findIndex(
          (item) => item.id === currentItem.id,
        );

        if (existingItemIndex >= 0) {
          const newData = [...prevData];
          newData[existingItemIndex] = {
            ...newData[existingItemIndex],
            isClicked: true,
            wrong_clicks:
              newData[existingItemIndex].wrong_clicks?.slice(0, -1) || [],
          };
          return newData;
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
    } else {
      // For other hotspot types, set wrong_clicks to empty array and don't set isClicked
      setAttemptSequenceData((prevData) => {
        const existingItemIndex = prevData.findIndex(
          (item) => item.id === currentItem.id,
        );

        if (existingItemIndex >= 0) {
          const newData = [...prevData];
          newData[existingItemIndex] = {
            ...newData[existingItemIndex],
            wrong_clicks: [], // Set to empty array for other types
          };
          return newData;
        } else {
          return [
            ...prevData,
            {
              ...currentItem,
              wrong_clicks: [], // Set to empty array for other types
            },
          ];
        }
      });
    }

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
      );

      console.log("Start visual simulation response:", response);

      if (response.simulation) {
        console.log("Setting simulation data");
        setSimulationData(response.simulation);
        setSimulationProgressId(response.id);
        setSimulationStatus("Active");
      }

      // Process image data - store raw base64 for just-in-time URL creation
      if (response.images && response.images.length > 0) {
        console.log(`Processing ${response.images.length} images`);
        for (const image of response.images) {
          // Store raw base64 data in the ref
          slideDataRef.current[image.image_id] = image.image_data;
          console.log(`Stored base64 data for image ${image.image_id}`);
        }
        console.log(`Stored ${response.images.length} image data items`);
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
      handleEndSimulation();
    }
  };

  // Handle end simulation implementation
  const handleEndSimulation = async () => {
    console.log("🔴 END SIMULATION BUTTON PRESSED");

    // Prevent multiple simultaneous end simulation attempts
    if (isEndingSimulation) {
      console.log("Already ending simulation, ignoring duplicate request");
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
      console.log("Timer stopped");
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
      console.log("Executing end-visual API call");

      // Final cleanup: Clean any wrong clicks for items that have been successfully clicked
      const cleanedAttemptSequenceData = attemptSequenceData.map((item) => {
        // If the item was successfully clicked, keep wrong_clicks as is
        return item;
      });

      // Use the endVisualSimulation function from simulation_visual_attempts
      const response = await endVisualSimulation(
        userId,
        simulationId,
        simulationProgressId,
        cleanedAttemptSequenceData,
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
      console.error("Failed to end visual simulation:", error);
      // Show an error message to the user if needed
      // Still show completion screen to avoid stuck state
      setShowCompletionScreen(true);
    } finally {
      console.log("End simulation flow completed");
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

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

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
              <VisibilityIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
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
                        (currentItem.coordinates ||
                          currentItem.percentageCoordinates) &&
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
                                  onClick={handleHotspotClick}
                                  sx={{
                                    position: "absolute",
                                    cursor: "pointer",
                                    left: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.left}px`,
                                    top: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.top}px`,
                                    width: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.width}px`,
                                    height: `${scaleCoordinates(currentItem.percentageCoordinates || currentItem.coordinates)?.height}px`,
                                    border: "7px solid", // INCREASED from 4px
                                    borderColor: getHighlightColor(), // Maintain user color
                                    boxShadow: highlightHotspot
                                      ? `0 0 16px 8px ${getHighlightColor()}` // Use same color for shadow
                                      : "none",
                                    borderRadius: "5px", // Slightly increased
                                    transition: "box-shadow 0.3s",
                                    zIndex: 10,
                                  }}
                                />
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

              {/* Coaching tip button - only render if not hidden by settings */}
              {imageLoaded &&
                currentItem?.type === "hotspot" &&
                currentItem.hotspotType === "coaching" &&
                (currentItem.coordinates ||
                  currentItem.percentageCoordinates) &&
                !levelSettings.hideCoachingTips && (
                  <Box
                    onClick={(e) => handleHotspotClick(e)}
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

// Get highlight color from settings or use default
const getHighlightColor = () => {
  return "rgba(68, 76, 231, 0.7)"; // Default color
};

export default VisualSimulationPage;
