import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
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
// Import useAuth hook from your context
import { useAuth } from "../../../../context/AuthContext";
import {
  startVisualAudioAttempt,
  endVisualAudioAttempt,
  SimulationData,
  ImageData,
  EndVisualAudioResponse,
} from "../../../../services/simulation_visual_audio_attempts";
import { convertAudioToText } from "../../../../services/simulation_script";
import { textToSpeech } from "../../../../services/text_to_speech";
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
  onGoToNextSim?: () => void;
  onRestartSim?: () => void;
  hasNextSimulation?: boolean;
  assignmentId: string;
  simulation?: any;
}

const VisualAudioSimulationPage: React.FC<VisualAudioSimulationPageProps> = ({
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
  // CHANGED: Remove slides map, we'll store raw base64 data instead
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  // Update to track both width and height scales
  const [imageScale, setImageScale] = useState({ width: 1, height: 1 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVisuals, setIsLoadingVisuals] = useState(false);

  // NEW: Keep raw image data instead of blob URLs
  const slideDataRef = useRef<Record<string, string>>({});
  // NEW: Current slide URL state (created just-in-time)
  const [frameUrl, setFrameUrl] = useState<string>("");

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

  // New audio recording state
  const [recordingInstance, setRecordingInstance] =
    useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);
  const [messageTranscriptions, setMessageTranscriptions] = useState<
    Map<string, string>
  >(new Map());
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState<string>("");

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hotspotTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  // Get level settings based on selected level
  const getLevelSettings = () => {
    if (!simulationData) return null;

    if (level === "Level 01") {
      return simulationData.lvl1;
    } else if (level === "Level 02") {
      return simulationData.lvl2;
    } else if (level === "Level 03") {
      return simulationData.lvl3;
    }

    return simulationData.lvl1; // Default to level 1 if not specified
  };

  const levelSettings = getLevelSettings();

  // Function to check if a hotspot should be skipped based on settings
  const shouldSkipHotspot = () => {
    if (!currentItem || currentItem.type !== "hotspot" || !levelSettings)
      return false;

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
    console.log("Attempt Sequence Data:", attemptSequenceData);
  }, [attemptSequenceData]);

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

  // NEW: Create just-in-time URL for current slide
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
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
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
    setCurrentTranscription("");

    // Show coaching tip immediately if it's that type and not hidden by settings
    if (
      currentItem?.type === "hotspot" &&
      currentItem?.hotspotType === "coaching" &&
      levelSettings &&
      !levelSettings.hideCoachingTips
    ) {
      setShowCoachingTip(true);
    }
  }, [currentSequenceIndex, currentSlideIndex, levelSettings]);

  // Auto-start recording for trainee messages and speaking for customer messages
  useEffect(() => {
    if (!currentItem || isPaused || !isCallActive) return;

    // Handle message-specific behaviors
    if (currentItem.type === "message") {
      // For trainee/assistant messages - start recording
      if (currentItem.role === "Trainee" || currentItem.role === "assistant") {
        console.log("Auto-starting recording for trainee message");

        // Check if this is the only item in the simulation (edge case)
        const isSingleItem =
          slidesData.length === 1 && currentSequence.length === 1;

        // Set recording state
        setIsRecording(true);
        setRecordingTime(0);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }

        recordingTimerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        // Start actual audio recording
        startAudioRecording();
      }

      // For customer messages - start speaking
      if (currentItem.role === "Customer" || currentItem.role === "customer") {
        console.log("Auto-speaking customer message");
        setSpeaking(true);

        speakText(currentItem.text || "")
          .then(() => {
            setAttemptSequenceData((prevState) => [...prevState, currentItem]);
            setSpeaking(false);
            setCallStatus("Connected");

            // Check if this is the last item
            const isLastItem =
              currentSlideIndex >= slidesData.length - 1 &&
              currentSequenceIndex >= currentSequence.length - 1;

            // If it's the last item and it's a customer message, auto-advance to end
            if (isLastItem) {
              console.log(
                "Last item is a customer message, ending after speech",
              );
              setTimeout(() => handleEndCall(), 500);
            }
          })
          .catch((error) => {
            console.error("Speech synthesis error:", error);
            setSpeaking(false);
          });
      }
    }

    return () => {
      // Cleanup recording resources
      if (recordingInstance) {
        try {
          recordingInstance.stop();
        } catch (e) {
          // Ignore error if recorder is already stopped
        }
        setRecordingInstance(null);
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [currentItem, isPaused, isCallActive]);

  // Function to start audio recording
  const startAudioRecording = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Media devices API not supported in this browser.");
      return;
    }

    // Stop any existing recording
    if (recordingInstance) {
      try {
        recordingInstance.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
      setRecordingInstance(null);
    }

    // Reset audio chunks
    setAudioChunks([]);

    // Request microphone access
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        setRecordingInstance(recorder);

        // Add data handler
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setAudioChunks((prev) => [...prev, e.data]);
          }
        };

        // Start recording
        recorder.start(1000); // Collect data every second for continuous chunks
        console.log("Audio recording started");
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        alert(
          "Microphone access is required for this simulation. Please allow microphone access and try again.",
        );
      });
  };

  // Function to stop and process audio recording
  const stopAndProcessRecording = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!recordingInstance) {
        console.log("No recording instance to stop");
        resolve("");
        return;
      }

      // Set up onstop handler before stopping
      recordingInstance.onstop = async () => {
        console.log("Recording stopped, processing audio...");
        if (audioChunks.length === 0) {
          console.log("No audio chunks to process");
          resolve("");
          return;
        }

        try {
          setIsTranscribing(true);
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

          // Convert audio to text
          console.log("Sending audio for transcription, size:", audioBlob.size);
          const response = await convertAudioToText(userId, audioBlob);
          const transcribedText = response.text.replace(/\n/g, "");
          console.log("Transcription result:", transcribedText);

          setIsTranscribing(false);
          // Set current transcription for UI feedback
          setCurrentTranscription(transcribedText);
          setAttemptSequenceData((prevState) => [
            ...prevState,
            {
              ...currentItem,
              userText: transcribedText.replace(/\n/g, ""),
            },
          ]);
          resolve(transcribedText);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          setIsTranscribing(false);
          reject(error);
        }
      };

      try {
        // Only try to stop if it's in the recording state
        if (
          recordingInstance.state === "recording" ||
          recordingInstance.state === "paused"
        ) {
          // Stop recording - this will trigger onstop handler
          console.log("Stopping recorder in state:", recordingInstance.state);
          recordingInstance.stop();

          // Release microphone
          if (recordingInstance.stream) {
            console.log("Releasing microphone tracks");
            recordingInstance.stream
              .getTracks()
              .forEach((track) => track.stop());
          }
        } else {
          console.log(
            "Recorder not in recording state:",
            recordingInstance.state,
          );
          resolve("");
        }

        // Clear recording state
        setRecordingInstance(null);
        setIsRecording(false);
      } catch (error) {
        console.error("Error stopping recorder:", error);
        // Even if there's an error, try to clear state
        setRecordingInstance(null);
        setIsRecording(false);
        reject(error);
      }
    });
  };

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
    isCallActive,
  ]);

  // Check for end of simulation
  useEffect(() => {
    if (
      isCallActive &&
      currentSlideIndex >= slidesData.length - 1 &&
      currentSequenceIndex >= currentSequence.length - 1 &&
      currentSequence.length > 0 &&
      !isEndingCall &&
      !isRecording && // Don't auto-end if we're recording
      !isTranscribing // Don't auto-end if we're transcribing
    ) {
      // Only auto-end if the last item is NOT a trainee message
      // const lastItem = currentSequence[currentSequenceIndex];
      // const isLastItemTraineeMessage =
      //   lastItem?.type === "message" &&
      //   (lastItem.role === "Trainee" || lastItem.role === "assistant");
      // if (!isLastItemTraineeMessage) {
      //   // We've reached the end of the last slide's sequence and it's not a trainee message
      //   console.log("Reached end of simulation content");
      //   // Wait a moment for any final animations/transitions
      //   setTimeout(() => {
      //     handleEndCall();
      //   }, 30000);
      // } else {
      //   console.log(
      //     "Last item is a trainee message, waiting for user to click Next",
      //   );
      // }
    }
  }, [
    currentSlideIndex,
    currentSequenceIndex,
    slidesData.length,
    currentSequence.length,
    isCallActive,
    isEndingCall,
    isRecording,
    isTranscribing,
  ]);

  // New function to handle end call with direct transcriptions
  const handleEndCallWithTranscriptions = async (
    directTranscriptions: Map<string, string>,
  ) => {
    console.log("🔴 END CALL BUTTON PRESSED WITH DIRECT TRANSCRIPTIONS");

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

    // Set flag to prevent duplicate ending
    setIsEndingCall(true);
    console.log("Setting isEndingCall to true");

    // Stop any active recording (though it should already be stopped)
    if (recordingInstance) {
      try {
        recordingInstance.stop();
        recordingInstance.stream?.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // Ignore errors if already stopped
      }
      setRecordingInstance(null);
    }

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }

      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

    // Stop recording if active
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecording(false);
    }

    // Update UI state
    setIsCallActive(false);
    console.log("Set isCallActive to false, call should now be inactive");

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end call API");
      setIsEndingCall(false);
      return;
    }

    try {
      console.log(
        "Preparing modified simulation data with direct transcriptions",
      );

      // Create a deep copy of the slides data to modify
      const modifiedSlidesData = simulationData?.slidesData
        ? JSON.parse(JSON.stringify(simulationData.slidesData))
        : [];

      // Replace trainee messages with transcriptions and simplify hotspots
      modifiedSlidesData.forEach((slide) => {
        if (slide.sequence) {
          slide.sequence = slide.sequence.map((item) => {
            // Create a copy we can modify
            const newItem = { ...item };

            // For message items, replace trainee messages with transcriptions
            if (
              newItem.type === "message" &&
              (newItem.role === "Trainee" || newItem.role === "assistant") &&
              newItem.id &&
              directTranscriptions.has(newItem.id)
            ) {
              // Replace the original text with the transcription
              newItem.text = directTranscriptions.get(newItem.id);
              console.log(
                `Replacing text for ${newItem.id} with direct transcription:`,
                newItem.text,
              );
            }

            // For hotspots, just keep the ID and type
            if (newItem.type === "hotspot") {
              // Keep only essential properties
              return {
                id: newItem.id,
                type: newItem.type,
                hotspotType: newItem.hotspotType,
              };
            }

            return newItem;
          });
        }
      });

      console.log("Executing end-visual-audio API call with modified data");
      const response = await endVisualAudioAttempt(
        userId,
        simulationId,
        simulationProgressId,
        attemptSequenceData,
        modifiedSlidesData, // Send modified slides data with direct transcriptions
      );

      console.log("End API call completed with response:", response);

      if (response && response.scores) {
        console.log("Setting scores and showing completion screen");
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);
        // Force update to completion screen
        setShowCompletionScreen(true);
        console.log(
          "Set showCompletionScreen to true, should show completion screen now",
        );
      } else {
        console.warn("No scores received in response");
        // Even without scores, show completion screen
        setShowCompletionScreen(true);
      }
    } catch (error) {
      console.error("Failed to end visual-audio simulation:", error);
      // Show an error message to the user if needed
      // Still show completion screen to avoid stuck state
      setShowCompletionScreen(true);
    } finally {
      console.log("End call flow completed");
      setIsEndingCall(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Function to speak text using backend text-to-speech
  const speakText = async (text: string, voice_id: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

      const blob = await textToSpeech({ text, voice_id });
      const url = URL.createObjectURL(blob);

      return new Promise<boolean>((resolve, reject) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url);
          audioRef.current = null;
          resolve(true);
        };
        audio.onerror = (e) => {
          console.error("Audio playback error", e);
          URL.revokeObjectURL(url);
          audioRef.current = null;
          reject(e);
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error("Failed to play speech:", error);
      return Promise.reject(error);
    }
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

    // Check if this is the last item in the entire simulation
    const isLastItem =
      currentSlideIndex >= slidesData.length - 1 &&
      currentSequenceIndex >= currentSequence.length - 1;

    if (currentSequenceIndex < currentSequence.length - 1) {
      // Next item in current slide
      setCurrentSequenceIndex((prevIndex) => prevIndex + 1);
    } else if (currentSlideIndex < slidesData.length - 1) {
      // First item in next slide
      setCurrentSlideIndex((prevIndex) => prevIndex + 1);
      setCurrentSequenceIndex(0);
      console.log("Moving to next slide:", currentSlideIndex + 1);
      setImageLoaded(false);
    } else if (isLastItem) {
      // End of slideshow
      setHighlightHotspot(false);
      console.log("Simulation complete - last item reached and acknowledged");

      // Double check we're not in the middle of recording or transcribing
      if (!isRecording && !isTranscribing) {
        handleEndCall();
      } else {
        console.log("Delaying end call until recording is complete");
        // We'll wait for the recording to finish and user to click next
      }
    }
  };

  // Simplified approach: Record clicks for click tracking
  useEffect(() => {
    if (currentItem?.type !== "hotspot") return;

    const handleClick = (event: MouseEvent) => {
      const container = imageContainerRef.current;
      if (!container) return;

      // Get click position relative to the container
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Record all clicks as wrong clicks initially
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

  // Handle hotspot click based on type
  const handleHotspotClick = (event?: React.MouseEvent) => {
    // Prevent event bubbling to container
    event?.stopPropagation();

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

    // MODIFIED: Only set isClicked and handle wrong_clicks for specific hotspot types
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
            wrong_clicks: newData[existingItemIndex].wrong_clicks.slice(0, -1),
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
            // isClicked: true,
            userInput: option,
          },
        ];
      } else {
        return [
          ...prevData,
          {
            ...currentItem,
            // isClicked: true,
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
              // isClicked: true, // Correctly commented out
              userInput: textInputValue,
              wrong_clicks: [], // Add this line to set wrong_clicks to empty array
            },
          ];
        } else {
          return [
            ...prevData,
            {
              ...currentItem,
              // isClicked: true, // Correctly commented out
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

    if (speaking && !isPaused) {
      audioRef.current?.pause();
    } else if (speaking && isPaused) {
      audioRef.current?.play();
    }

    // Also handle pausing of recording
    if (isRecording && !isPaused) {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Pause recording if supported
      if (recordingInstance && recordingInstance.state === "recording") {
        try {
          recordingInstance.pause();
        } catch (e) {
          // Some browsers might not support pause
          console.log("Recording pause not supported");
        }
      }
    } else if (isRecording && isPaused) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      // Resume recording if supported
      if (recordingInstance && recordingInstance.state === "paused") {
        try {
          recordingInstance.resume();
        } catch (e) {
          // Some browsers might not support resume
          console.log("Recording resume not supported");
        }
      }
    }
  };

  // Helper function to render message content based on settings
  const renderMessageContent = () => {
    if (!currentItem || currentItem.type !== "message" || !levelSettings)
      return null;

    // For customer messages
    if (currentItem.role === "Customer" || currentItem.role === "customer") {
      if (levelSettings.hideCustomerScript) {
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
      if (levelSettings.hideAgentScript) {
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
              {/* Show a message indicating recording is in progress */}
              Your turn to respond...
            </Typography>
            {currentTranscription && (
              <Typography
                variant="body2"
                sx={{ fontStyle: "italic", color: "text.secondary" }}
              >
                Current transcription: {currentTranscription}
              </Typography>
            )}
          </Paper>
        );
      }
    }

    // If no hiding is required, render the original message
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
          {currentItem.text
            ? currentItem.text.replace(/<.*?>/g, "")
            : currentItem.text}
        </Typography>
        {(currentItem.role === "Trainee" || currentItem.role === "assistant") &&
          currentTranscription && (
            <Typography
              variant="body2"
              sx={{ fontStyle: "italic", color: "text.secondary" }}
            >
              Current transcription: {currentTranscription}
            </Typography>
          )}
      </Paper>
    );
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
        attemptType, // Pass the attemptType
      );

      console.log("Start visual-audio response:", response);

      if (response.simulation) {
        console.log("Setting simulation data");
        setSimulationData(response.simulation);
        setSimulationProgressId(response.id);
        setCallStatus("Connected");
      }

      // CHANGED: Store base64 data instead of creating blob URLs
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
      console.error("Error starting visual-audio simulation:", error);
      setIsCallActive(false);
      setCallStatus("Error loading simulation. Please try again.");
    } finally {
      setIsStarting(false);
      setIsLoadingVisuals(false);
    }
  };

  // Handle trainee next button click - process recording
  const handleTraineeNext = async () => {
    if (isRecording) {
      try {
        // First, stop recording and get transcription
        const transcribedText = await stopAndProcessRecording();

        // Store transcription with current item ID
        let updatedTranscriptions = new Map(messageTranscriptions); // Create a local copy

        if (currentItem && currentItem.id) {
          // Update local copy immediately
          updatedTranscriptions.set(currentItem.id!, transcribedText);
          console.log(
            `Stored transcription for item ${currentItem.id}:`,
            transcribedText,
          );

          // Update state (though this might not be available immediately)
          setMessageTranscriptions(updatedTranscriptions);
        }

        // Check if this is the last item
        const isLastItem =
          currentSlideIndex >= slidesData.length - 1 &&
          currentSequenceIndex >= currentSequence.length - 1;

        if (isLastItem) {
          console.log(
            "Last trainee message completed, ending simulation directly",
          );
          // For the last trainee message, pass the updated transcriptions directly
          setTimeout(() => {
            handleEndCallWithTranscriptions(updatedTranscriptions);
          }, 300);
        } else {
          // Move to next item for non-final messages
          moveToNextItem();
        }
      } catch (error) {
        console.error("Error processing recording:", error);

        // Stop recording timers
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);

        // Check if this is the last item and handle accordingly
        const isLastItem =
          currentSlideIndex >= slidesData.length - 1 &&
          currentSequenceIndex >= currentSequence.length - 1;

        if (isLastItem) {
          handleEndCall();
        } else {
          moveToNextItem();
        }
      }
    } else {
      // If we're not recording (user pressed Next without speaking)
      // Check if this is the last item
      const isLastItem =
        currentSlideIndex >= slidesData.length - 1 &&
        currentSequenceIndex >= currentSequence.length - 1;

      if (isLastItem) {
        console.log(
          "Last item acknowledged without recording, ending simulation",
        );
        handleEndCall();
      } else {
        moveToNextItem();
      }
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

    // Safety check: Don't end call if we're in a trainee message recording state
    // with auto-end (not from user button) unless the recorder has finished
    const isCalledFromTraineeNext = new Error().stack?.includes(
      "handleTraineeNext",
    );
    const isCalledFromButton =
      new Error().stack?.includes("handleEndCall") &&
      !new Error().stack?.includes("moveToNextItem") &&
      !new Error().stack?.includes("handleTraineeNext");

    const isTraineeMessageActive =
      currentItem?.type === "message" &&
      (currentItem.role === "Trainee" || currentItem.role === "assistant");

    // Skip safety check if called from traineeNext (recording is already processed)
    // or if explicitly called from button press
    if (
      !isCalledFromTraineeNext &&
      !isCalledFromButton &&
      isTraineeMessageActive &&
      isRecording
    ) {
      console.log(
        "Cannot auto-end during trainee recording, waiting for user input",
      );
      return;
    }

    // Set flag to prevent duplicate ending
    setIsEndingCall(true);
    console.log("Setting isEndingCall to true");

    // Stop current recording if active
    if (isRecording && recordingInstance) {
      try {
        console.log("Stopping active recording before ending call");
        const transcribedText = await stopAndProcessRecording();

        // Store transcription with current item ID if we have one
        if (currentItem && currentItem.id) {
          setMessageTranscriptions((prev) => {
            const newMap = new Map(prev);
            newMap.set(currentItem.id!, transcribedText);
            return newMap;
          });
        }
      } catch (error) {
        console.error("Error processing final recording:", error);
      }
    }

    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer stopped");
    }

      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }

    // Stop recording if active
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
      setIsRecording(false);
    }

    // Update UI state
    setIsCallActive(false);
    console.log("Set isCallActive to false, call should now be inactive");

    // Ensure we have the required IDs
    if (!simulationProgressId) {
      console.error("⚠️ Missing simulationProgressId for end call API");
      setIsEndingCall(false);
      return;
    }

    try {
      console.log("Preparing modified simulation data with transcriptions");

      // Create a deep copy of the slides data to modify
      const modifiedSlidesData = simulationData?.slidesData
        ? JSON.parse(JSON.stringify(simulationData.slidesData))
        : [];

      // Replace trainee messages with transcriptions and simplify hotspots
      modifiedSlidesData.forEach((slide) => {
        if (slide.sequence) {
          slide.sequence = slide.sequence.map((item) => {
            // Create a copy we can modify
            const newItem = { ...item };

            // For message items, replace trainee messages with transcriptions
            if (
              newItem.type === "message" &&
              (newItem.role === "Trainee" || newItem.role === "assistant") &&
              newItem.id &&
              messageTranscriptions.has(newItem.id)
            ) {
              // Replace the original text with the transcription
              newItem.text = messageTranscriptions.get(newItem.id);
              console.log(
                `Replacing text for ${newItem.id} with transcription:`,
                newItem.text,
              );
            }

            // For hotspots, just keep the ID and type
            if (newItem.type === "hotspot") {
              // Keep only essential properties
              return {
                id: newItem.id,
                type: newItem.type,
                hotspotType: newItem.hotspotType,
              };
            }

            return newItem;
          });
        }
      });

      // Final cleanup: Clear any wrong clicks for items that have been successfully clicked
      const cleanedAttemptSequenceData = attemptSequenceData.map((item) => {
        // If the item was successfully clicked, keep the current state
        // We're not removing wrong_clicks anymore as we need to track all interactions
        return item;
      });

      console.log("Executing end-visual-audio API call with modified data");
      const response = await endVisualAudioAttempt(
        userId,
        simulationId,
        simulationProgressId,
        cleanedAttemptSequenceData,
        modifiedSlidesData, // Send modified slides data with transcriptions
      );

      console.log("End API call completed with response:", response);

      if (response && response.scores) {
        console.log("Setting scores and showing completion screen");
        setScores(response.scores);
        setDuration(response.duration || elapsedTime);
        // Force update to completion screen
        setShowCompletionScreen(true);
        console.log(
          "Set showCompletionScreen to true, should show completion screen now",
        );
      } else {
        console.warn("No scores received in response");
        // Even without scores, show completion screen
        setShowCompletionScreen(true);
      }
    } catch (error) {
      console.error("Failed to end visual-audio simulation:", error);
      // Show an error message to the user if needed
      // Still show completion screen to avoid stuck state
      setShowCompletionScreen(true);
    } finally {
      console.log("End call flow completed");
      setIsEndingCall(false);
    }
  };

  // Navigation handlers for completion screen
  const handleRestartSim = () => {
    console.log("Restarting simulation");
    // Reset state but preserve simulation data
    setShowCompletionScreen(false);
    setIsCallActive(false);
    setElapsedTime(0);
    setScores(null);
    setCurrentSlideIndex(0);
    setCurrentSequenceIndex(0);
    setImageLoaded(false);
    setMessageTranscriptions(new Map());
    setSimulationProgressId(null);
    setIsPaused(false);
    setCallStatus("Restarting simulation...");
    setCurrentTranscription("");
    // Clear frame URL
    setFrameUrl("");

    // Small delay before automatically starting the simulation again
    setTimeout(() => {
      console.log("Auto-starting simulation after restart");
      handleStart();
    }, 500);
  };

  const handleViewPlayback = () => {
    // Handle playback view action
    console.log("View playback clicked");
    // For now, just close the completion screen
    setShowCompletionScreen(false);
  };

  // New navigation handlers
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

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      // Stop any active recording
      if (recordingInstance) {
        try {
          recordingInstance.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        recordingInstance.stream?.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Revoke any blob URLs created for frames
      if (frameUrl) {
        URL.revokeObjectURL(frameUrl);
      }
    };
  }, [recordingInstance, frameUrl]);

  // Check for audio chunks to update live transcription
  useEffect(() => {
    // If we have at least 3 seconds of audio chunks, get a live transcription
    if (
      audioChunks.length > 3 &&
      isRecording &&
      !isTranscribing &&
      currentItem?.type === "message" &&
      (currentItem.role === "Trainee" || currentItem.role === "assistant")
    ) {
      const getLiveTranscription = async () => {
        try {
          setIsTranscribing(true);
          // Create a copy of current chunks for processing
          const currentChunks = [...audioChunks];
          const audioBlob = new Blob(currentChunks, { type: "audio/webm" });

          // Only process if we have sufficient audio data
          if (audioBlob.size > 1000) {
            // Minimum size threshold
            const response = await convertAudioToText(userId, audioBlob);
            setCurrentTranscription(response.text);
          }
        } catch (error) {
          console.error("Error getting live transcription:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      getLiveTranscription();
    }
  }, [audioChunks, isRecording, isTranscribing, currentItem, userId]);

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

        {!isCallActive ? (
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
              <VisibilityIcon sx={{ fontSize: 48, color: "#DEE2FD" }} />
            </Box>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, color: "#1a1a1a", mb: 1 }}
            >
              Start Simulation
            </Typography>
            <Typography sx={{ color: "#666", mb: 3 }}>
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
                  ) : !currentSlide || !frameUrl ? (
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
                        src={frameUrl} // CHANGED: Use frameUrl instead of slides.get()
                        alt={currentSlide.imageName || "Simulation slide"}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "calc(100vh - 150px)",
                          display: "block",
                          margin: "0 auto",
                        }}
                        onLoad={handleImageLoad}
                      />

                      {/* Render hotspots directly on the image - don't render if it should be skipped */}
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
                                      ? `2px solid ${
                                          currentItem.settings
                                            ?.highlightColor || "white"
                                        }`
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
                                        ? `2px solid ${
                                            currentItem.settings
                                              ?.highlightColor || "#444CE7"
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
                                      ? currentItem.settings?.highlightColor ||
                                        "#444CE7"
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

                            {/* Highlight hotspot - only render if not hidden by settings */}
                            {currentItem.hotspotType === "highlight" &&
                              !levelSettings?.hideHighlights && (
                                <Box
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    console.log("Highlight hotspot clicked");
                                    handleHotspotClick(e);
                                  }}
                                  sx={{
                                    position: "absolute",
                                    cursor: "pointer",
                                    left: `${scaleCoordinates(currentItem.coordinates)?.left}px`,
                                    top: `${scaleCoordinates(currentItem.coordinates)?.top}px`,
                                    width: `${scaleCoordinates(currentItem.coordinates)?.width}px`,
                                    height: `${scaleCoordinates(currentItem.coordinates)?.height}px`,
                                    border: "8px solid", // INCREASED from 4px to 8px
                                    borderColor:
                                      currentItem.settings?.highlightColor ||
                                      "rgba(68, 76, 231, 0.7)", // Keep original color
                                    boxShadow: highlightHotspot
                                      ? `0 0 15px 8px ${currentItem.settings?.highlightColor || "rgba(68, 76, 231, 0.7)"}` // Use same color
                                      : "none",
                                    borderRadius: "4px",
                                    transition: "box-shadow 0.3s",
                                    zIndex: 10,
                                  }}
                                />
                              )}
                          </>
                        )}

                      {/* Coaching tip button - only render if not hidden by settings */}
                      {imageLoaded &&
                        currentItem?.type === "hotspot" &&
                        currentItem.hotspotType === "coaching" &&
                        currentItem.coordinates &&
                        levelSettings &&
                        !levelSettings.hideCoachingTips && (
                          <Box
                            onClick={(e) => {
                              e.stopPropagation();
                              handleHotspotClick(e);
                            }}
                            sx={{
                              position: "absolute",
                              cursor: "pointer",
                              left: `${
                                scaleCoordinates(currentItem.coordinates)?.left
                              }px`,
                              top: `${
                                scaleCoordinates(currentItem.coordinates)?.top
                              }px`,
                              width: `${
                                scaleCoordinates(currentItem.coordinates)?.width
                              }px`,
                              height: `${
                                scaleCoordinates(currentItem.coordinates)
                                  ?.height
                              }px`,
                              zIndex: 50,
                              border: highlightHotspot
                                ? `2px solid ${
                                    currentItem.settings?.highlightColor ||
                                    "#1e293b"
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
                                  currentItem.settings?.buttonColor ||
                                  "#1e293b",
                                color:
                                  currentItem.settings?.textColor || "#FFFFFF",
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

                      {imageLoaded &&
                        currentMasking &&
                        currentMasking.map(
                          (item, index) =>
                            item?.content && (
                              <Box
                                key={index}
                                // onClick={handleHotspotClick}
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
                                    ? "blur(5px)"
                                    : "none",
                                }}
                              />
                            ),
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
                    p: 1.5,
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
                    p: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "calc(100vh - 180px)",
                    overflowY: "auto",
                  }}
                >
                  {currentItem?.type === "message" ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      {/* Use the renderMessageContent function to apply script hiding rules */}
                      {renderMessageContent()}

                      {/* Interaction controls / Next Button */}
                      <Box>
                        {/* Trainee recording indicator */}
                        {(currentItem.role === "Trainee" ||
                          currentItem.role === "assistant") &&
                          isRecording && (
                            <Paper
                              sx={{
                                p: 1.5,
                                bgcolor: "grey.100",
                                borderRadius: 1,
                                mb: 2,
                                display: "flex",
                                alignItems: "center",
                                position: "relative", // Added for loading indicator
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

                              {/* Loading indicator for transcription */}
                              {isTranscribing && (
                                <CircularProgress
                                  size={20}
                                  sx={{
                                    position: "absolute",
                                    right: 10,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                  }}
                                />
                              )}
                            </Paper>
                          )}

                        {/* Customer speech indicator */}
                        {(currentItem.role === "Customer" ||
                          currentItem.role === "customer") &&
                          speaking && (
                            <Paper
                              sx={{
                                p: 1.5,
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
                              if (audioRef.current) {
                                audioRef.current.pause();
                                audioRef.current.src = "";
                                audioRef.current = null;
                              }
                              setSpeaking(false);
                              moveToNextItem();
                            }
                            // For trainee messages, use the new handler
                            else {
                              handleTraineeNext();
                            }
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
        )}

        {/* Loading overlay for ending simulation */}
        {isEndingCall && (
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
              Processing interactions and audio responses...
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default VisualAudioSimulationPage;
