import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Stack,
  styled,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";
import { Lock as LockIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  SimulationWizardProvider,
  useSimulationWizard,
} from "../../../../../context/SimulationWizardContext";
import ScriptTab from "./ScriptTab";
import VisualsTab from "./VisualsTab";
import SettingsTab from "./settingTab/SettingTab";
import PreviewTab from "./PreviewTab";
import {
  updateSimulation,
  updateSimulationWithFormData,
  fetchCompleteSimulation,
  CompleteSimulationResponse,
} from "../../../../../services/simulation_operations";
import { useAuth } from "../../../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../../../utils/navigation";

interface TabState {
  script: boolean;
  visuals: boolean;
  settings: boolean;
  preview: boolean;
}

// Updated interface with percentage-based coordinates
interface SimulationHotspotCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// New interface for percentage-based coordinates
interface SimulationHotspotPercentageCoordinates {
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
}

interface SimulationData {
  id: string;
  name: string;
  division: string;
  department: string;
  tags: string[];
  simulationType: "audio" | "chat" | "visual-audio" | "visual-chat" | "visual";
  script?: Array<{
    script_sentence: string;
    role: string;
    keywords: string[];
  }>;
  slidesData?: Array<{
    imageId: string;
    imageName: string;
    imageUrl: string;
    imageData?: string | null;
    sequence: Array<{
      type: string;
      id: string;
      name?: string;
      hotspotType?: string;
      // Original absolute coordinates
      coordinates?: SimulationHotspotCoordinates;
      // New percentage-based coordinates
      percentageCoordinates?: SimulationHotspotPercentageCoordinates;
      settings?: any;
      role?: string;
      text?: string;
      options?: string[];
      keywords: string[];
    }>;
    masking?: Array<{
      id: string;
      type: string;
      content: {
        id: string;
        type: string;
        // Original absolute coordinates
        coordinates?: SimulationHotspotCoordinates;
        // New percentage-based coordinates
        percentageCoordinates?: SimulationHotspotPercentageCoordinates;
        settings?: {
          color: string;
          solid_mask: boolean;
          blur_mask: boolean;
        };
      };
      timestamp?: number;
    }>;
  }>;
  status?: string;
  prompt?: string;
  // Add level settings from the API response
  levels?: {
    lvl1?: {
      isEnabled?: boolean;
      enablePractice?: boolean;
      hideAgentScript?: boolean;
      hideCustomerScript?: boolean;
      hideKeywordScores?: boolean;
      hideSentimentScores?: boolean;
      hideHighlights?: boolean;
      hideCoachingTips?: boolean;
      enablePostSimulationSurvey?: boolean;
      aiPoweredPausesAndFeedback?: boolean;
    };
    lvl2?: {
      isEnabled?: boolean;
      enablePractice?: boolean;
      hideAgentScript?: boolean;
      hideCustomerScript?: boolean;
      hideKeywordScores?: boolean;
      hideSentimentScores?: boolean;
      hideHighlights?: boolean;
      hideCoachingTips?: boolean;
      enablePostSimulationSurvey?: boolean;
      aiPoweredPausesAndFeedback?: boolean;
    };
    lvl3?: {
      isEnabled?: boolean;
      enablePractice?: boolean;
      hideAgentScript?: boolean;
      hideCustomerScript?: boolean;
      hideKeywordScores?: boolean;
      hideSentimentScores?: boolean;
      hideHighlights?: boolean;
      hideCoachingTips?: boolean;
      enablePostSimulationSurvey?: boolean;
      aiPoweredPausesAndFeedback?: boolean;
    };
  };
  est_time?: string;
  estimated_time_to_attempt_in_mins?: number;
  key_objectives?: string[];
  quick_tips?: string[];
  overviewVideo?: string;
  overview_video?: string;
  voice_id?: string;
  language?: string;
  voice_speed?: string;
  mood?: string;
  simulation_completion_repetition?: number;
  simulation_max_repetition?: number;
  final_simulation_score_criteria?: string;
  simulation_scoring_metrics?: {
    is_enabled?: boolean;
    keyword_score?: number;
    click_score?: number;
    points_per_keyword?: number;
    points_per_click?: number;
  };
  // FIXED: Add metric_weightage field that was missing
  metric_weightage?: {
    click_accuracy?: number;
    keyword_accuracy?: number;
    data_entry_accuracy?: number;
    contextual_accuracy?: number;
    sentiment_measures?: number;
  };
  sim_practice?: {
    is_unlimited?: boolean;
    pre_requisite_limit?: number;
  };
  minimum_passing_score?: number;
}

interface Message {
  id: string;
  role: "Customer" | "Trainee";
  message: string;
  keywords: string[];
}

interface SimulationResponse {
  id: string;
  status: string;
  prompt: string;
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: "44px",
  "& .MuiTabs-indicator": {
    display: "none",
  },
  "& .MuiTabs-flexContainer": {
    marginBottom: "-1px",
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: "44px",
  padding: "10px 20px",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  marginRight: "4px",
  color: theme.palette.text.secondary,
  boxShadow: "0 -1px 2px rgba(0,0,0,0.05)",
  "&.Mui-selected": {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    fontWeight: 600,
    zIndex: 1,
  },
  "&:not(.Mui-selected)": {
    backgroundColor: "#F3F4F6",
  },
  "&.preview-tab": {
    opacity: 0.5,
    pointerEvents: "none",
  },
}));

/**
 * Attempts to detect the image type from binary data
 * Returns the MIME type or defaults to 'image/png'
 */
const detectImageType = (binaryData: string): string => {
  // Check for JPEG header (FF D8 FF)
  if (
    binaryData.length >= 3 &&
    binaryData.charCodeAt(0) === 0xff &&
    binaryData.charCodeAt(1) === 0xd8 &&
    binaryData.charCodeAt(2) === 0xff
  ) {
    return "image/jpeg";
  }

  // Check for PNG header (89 50 4E 47)
  if (
    binaryData.length >= 4 &&
    binaryData.charCodeAt(0) === 0x89 &&
    binaryData.charCodeAt(1) === 0x50 &&
    binaryData.charCodeAt(2) === 0x4e &&
    binaryData.charCodeAt(3) === 0x47
  ) {
    return "image/png";
  }

  // Default to PNG if can't detect
  return "image/png";
};

// Helper to check if a string is a base64 data
const isBase64String = (str: string): boolean => {
  // More comprehensive check for base64 pattern
  // First check if it's a data URL
  if (str.startsWith("data:image/")) {
    return true;
  }

  // Then check if it looks like a raw base64 string (more permissive)
  try {
    // Check if the string only contains valid base64 characters
    return /^[A-Za-z0-9+/=]+$/.test(str.trim()) && str.length > 20;
  } catch (e) {
    console.error("Error checking base64 string:", e);
    return false;
  }
};

// Helper function to create a blob URL from binary data
const createBlobUrl = (binaryData: string, mimeType = "image/png"): string => {
  try {
    // Check if it's already a URL
    if (
      binaryData.startsWith("data:") ||
      binaryData.startsWith("blob:") ||
      binaryData.startsWith("http") ||
      binaryData.startsWith("/api/")
    ) {
      return binaryData;
    }

    // Check if it's base64 data
    if (isBase64String(binaryData)) {
      try {
        // If it doesn't have a data: prefix, add it
        if (!binaryData.startsWith("data:")) {
          return `data:${mimeType};base64,${binaryData}`;
        }
        return binaryData;
      } catch (e) {
        console.error("Error creating data URL:", e);
      }
    }

    // Process as binary data
    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Create blob and URL
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (e) {
    console.error("Error creating blob URL:", e);
    return "";
  }
};

// New utility function to calculate percentage coordinates from absolute coordinates
const calculatePercentageCoordinates = (
  coordinates: SimulationHotspotCoordinates,
  imageWidth: number,
  imageHeight: number,
): SimulationHotspotPercentageCoordinates => {
  return {
    xPercent: (coordinates.x / imageWidth) * 100,
    yPercent: (coordinates.y / imageHeight) * 100,
    widthPercent: (coordinates.width / imageWidth) * 100,
    heightPercent: (coordinates.height / imageHeight) * 100,
  };
};

// New utility function to calculate absolute coordinates from percentage coordinates
const calculateAbsoluteCoordinates = (
  percentageCoordinates: SimulationHotspotPercentageCoordinates,
  imageWidth: number,
  imageHeight: number,
): SimulationHotspotCoordinates => {
  return {
    x: (percentageCoordinates.xPercent * imageWidth) / 100,
    y: (percentageCoordinates.yPercent * imageHeight) / 100,
    width: (percentageCoordinates.widthPercent * imageWidth) / 100,
    height: (percentageCoordinates.heightPercent * imageHeight) / 100,
  };
};

const GenerateScriptContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();

  const {
    scriptData,
    setScriptData,
    isScriptLocked,
    setIsScriptLocked,
    visualImages,
    setVisualImages,
    isPublished,
    setIsPublished,
    simulationResponse,
    setSimulationResponse,
    setAssignedScriptMessageIds,
  } = useSimulationWizard();

  const [enabledTabs, setEnabledTabs] = useState<TabState>({
    script: true,
    visuals: false,
    settings: false,
    preview: false,
  });

  const [loadedSimulation, setLoadedSimulation] =
    useState<SimulationData | null>(null);

  // Load simulation data on mount
  useEffect(() => {
    const loadSimulationData = async () => {
      if (!id) {
        setError("No simulation ID provided");
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);

        // Use the new fetchCompleteSimulation function instead of axios directly
        const responseData = await fetchCompleteSimulation(id);

        // Check if we have at least some data to work with
        if (responseData) {
          // Handle both response formats - with or without document wrapper
          const simulation =
            responseData.document?.simulation ||
            responseData.simulation ||
            responseData ||
            {};


          // Map level settings from the response format to our internal format
          const mappedLevels = {
            lvl1: simulation.lvl1 || {},
            lvl2: simulation.lvl2 || {},
            lvl3: simulation.lvl3 || {},
          };

          // FIXED: Always proceed with whatever data we have - use defaults for missing parts
          setLoadedSimulation({
            id: simulation.id || simulation._id || id, // Fallback to route ID if API doesn't return it
            name: simulation.sim_name || "New Simulation", // Changed to match API response
            division: simulation.division_id || "",
            department: simulation.department_id || "",
            tags: simulation.tags || [],
            simulationType: simulation.sim_type || "audio", // Changed to match API response
            script: simulation.script || [],
            slidesData: simulation.slidesData || [],
            status: simulation.status || "draft",
            prompt: simulation.prompt || "",
            levels: mappedLevels,
            // Map all other fields from the API response
            est_time: simulation.est_time || "",
            estimated_time_to_attempt_in_mins:
              simulation.estimated_time_to_attempt_in_mins,
            key_objectives: simulation.key_objectives ?? [
              "Learn basic customer service",
              "Understand refund process",
            ],
            quick_tips: simulation.quick_tips ?? [
              "Listen to the customer carefully",
              "Be polite and empathetic",
              "Provide accurate information",
            ],
            overview_video: simulation.overview_video ?? "",
            voice_id: simulation.voice_id ?? "",
            language: simulation.language ?? "English",
            voice_speed: simulation.voice_speed ?? "Normal",
            mood: simulation.mood ?? "Neutral",
            simulation_completion_repetition:
              simulation.simulation_completion_repetition ?? 3,
            simulation_max_repetition:
              simulation.simulation_max_repetition ?? 5,
            final_simulation_score_criteria:
              simulation.final_simulation_score_criteria ?? "Best of three",
            simulation_scoring_metrics:
              simulation.simulation_scoring_metrics ?? {
                is_enabled: true,
                keyword_score: 20,
                click_score: 80,
                points_per_keyword: 1,
                points_per_click: 1,
              },
            metric_weightage: simulation.metric_weightage ?? {
              click_accuracy: 0,
              keyword_accuracy: 0,
              data_entry_accuracy: 0,
              contextual_accuracy: 0,
              sentiment_measures: 0,
            },
            sim_practice: simulation.sim_practice ?? {
              is_unlimited: false,
              pre_requisite_limit: 3,
            },
            minimum_passing_score: simulation.minimum_passing_score ?? 60,
          });

          // Initialize SimulationResponse with defaults for missing fields
          setSimulationResponse({
            id: simulation.id || simulation._id || id,
            status: simulation.status || "draft",
            prompt: simulation.prompt || "",
          });

          // Process script data if it exists
          if (simulation.script && Array.isArray(simulation.script)) {
            const transformedScript = simulation.script.map(
              (scriptItem, index) => ({
                // Use a more stable ID format that's consistent across sessions
                id: scriptItem.id || `script-${index}`,
                role: scriptItem.role === "assistant" ? "Trainee" : "Customer",
                message: scriptItem.script_sentence || "",
                keywords: scriptItem.keywords || [],
              }),
            );
            setScriptData(transformedScript);

            // If script exists and has items, consider it "locked" but still editable
            if (transformedScript.length > 0) {
              setIsScriptLocked(true);
            }
          } else {
            // Set default empty script data
            setScriptData([]);
          }

          // Enhanced processing of visual data (slides, images, sequences)
          const processedImages = [];
          // Track assigned message IDs
          const assignedMessageIds = new Set<string>();

          // Check if we have slidesData
          if (
            simulation.slidesData &&
            Array.isArray(simulation.slidesData) &&
            simulation.slidesData.length > 0
          ) {

            // Create a map of image data by id for quick lookup if images array exists
            const imageDataMap = new Map();

            if (responseData.images && Array.isArray(responseData.images)) {
              responseData.images.forEach((img) => {
                if (img.image_id && img.image_data) {
                  imageDataMap.set(img.image_id, img.image_data);
                }
              });
            } else if (
              responseData.document?.images &&
              Array.isArray(responseData.document.images)
            ) {
              responseData.document.images.forEach((img) => {
                if (img.image_id && img.image_data) {
                  imageDataMap.set(img.image_id, img.image_data);
                }
              });
            }

            // Process each slide
            for (const slide of simulation.slidesData) {
              if (!slide.imageId) continue;

              // Initialize URL
              let blobUrl = "";

              // Try to get image data from the map
              const imageData = imageDataMap.get(slide.imageId);

              // If we have image data, process it
              if (imageData) {
                // Process the binary image data properly - similar to how preview components do it
                if (typeof imageData === "string") {
                  if (
                    imageData.startsWith("/api/") ||
                    imageData.startsWith("http") ||
                    imageData.startsWith("blob:") ||
                    imageData.startsWith("data:")
                  ) {
                    // It's already a URL
                    blobUrl = imageData;
                  } else if (isBase64String(imageData)) {
                    // It's base64 data - convert to data URL
                    if (!imageData.startsWith("data:")) {
                      blobUrl = `data:image/png;base64,${imageData}`;
                    } else {
                      blobUrl = imageData;
                    }
                  } else {
                    // Treat as binary data and create blob URL
                    // Same approach used in visual preview components
                    try {
                      const mimeType = detectImageType(imageData);
                      blobUrl = createBlobUrl(imageData, mimeType);
                    } catch (e) {
                      console.error("Error creating blob URL:", e);
                      blobUrl = "";
                    }
                  }
                }
              }

              // If we still don't have a URL, try fallback to imageUrl
              if (!blobUrl && slide.imageUrl) {
                console.warn(
                  `Using fallback imageUrl for ${slide.imageId}:`,
                  slide.imageUrl,
                );
                blobUrl = slide.imageUrl;
              }

              // Final fallback - use placeholder
              if (!blobUrl) {
                blobUrl = "/api/placeholder/400/320";
              }

              // Make sure sequence is properly initialized and properly formatted
              const sequence = Array.isArray(slide.sequence)
                ? slide.sequence.map((item) => {
                    // For hotspot type items
                    if (item.type === "hotspot") {
                      // Get the image dimensions from imageDataMap
                      let naturalWidth = 800; // Default value
                      let naturalHeight = 600; // Default value

                      // Try to get image dimensions from the DOM if the image is already loaded
                      const img = new Image();
                      img.src = blobUrl;
                      if (img.complete) {
                        naturalWidth = img.naturalWidth;
                        naturalHeight = img.naturalHeight;
                      }

                      // Calculate percentage coordinates if only absolute coordinates exist
                      let percentageCoords;
                      if (item.coordinates && !item.percentageCoordinates) {
                        percentageCoords = calculatePercentageCoordinates(
                          item.coordinates,
                          naturalWidth,
                          naturalHeight,
                        );
                      } else {
                        percentageCoords = item.percentageCoordinates;
                      }

                      // Create a proper hotspot sequence item with both coordinate types
                      return {
                        id: `hotspot-${item.id}`,
                        type: "hotspot",
                        content: {
                          id: item.id || String(Date.now()),
                          name: item.name || "Untitled Hotspot",
                          type: "hotspot",
                          hotspotType: item.hotspotType || "button",
                          // Include original coordinates
                          coordinates: item.coordinates
                            ? {
                                x: Number(item.coordinates.x || 0),
                                y: Number(item.coordinates.y || 0),
                                width: Number(item.coordinates.width || 0),
                                height: Number(item.coordinates.height || 0),
                              }
                            : undefined,
                          // Include percentage coordinates
                          percentageCoordinates: percentageCoords,
                          settings: item.settings || {},
                          options: item.options || [],
                          text: item.text,
                        },
                        timestamp: Date.now(),
                      };
                    }
                    // For message type items
                    else if (item.type === "message") {
                      // Track message IDs that are already assigned to visuals
                      if (item.id) {
                        assignedMessageIds.add(item.id);
                      }

                      // Create a proper message sequence item
                      return {
                        id: `message-${item.id}`,
                        type: "message",
                        content: {
                          id: item.id || String(Date.now()),
                          role: item.role || "Customer", // Preserve the original role
                          text: item.text || "",
                          visualId: slide.imageId,
                          order: item.order || 0,
                          keywords: item.keywords || [],
                        },
                        timestamp: Date.now(),
                      };
                    }
                    // Return as is for unknown types
                    return item;
                  })
                : [];

              // Process masking items if they exist
              const masking = Array.isArray(slide.masking)
                ? slide.masking.map((maskingItem) => {
                    if (maskingItem.type === "masking" && maskingItem.content) {
                      let naturalWidth = 800; // Default value
                      let naturalHeight = 600; // Default value

                      // Try to get image dimensions
                      const img = new Image();
                      img.src = blobUrl;
                      if (img.complete) {
                        naturalWidth = img.naturalWidth;
                        naturalHeight = img.naturalHeight;
                      }

                      // Calculate percentage coordinates if only absolute coordinates exist
                      let percentageCoords;
                      if (
                        maskingItem.content.coordinates &&
                        !maskingItem.content.percentageCoordinates
                      ) {
                        percentageCoords = calculatePercentageCoordinates(
                          maskingItem.content.coordinates,
                          naturalWidth,
                          naturalHeight,
                        );
                      } else {
                        percentageCoords =
                          maskingItem.content.percentageCoordinates;
                      }

                      // Return with both coordinate types
                      return {
                        ...maskingItem,
                        content: {
                          ...maskingItem.content,
                          percentageCoordinates: percentageCoords,
                        },
                      };
                    }
                    return maskingItem;
                  })
                : [];

              // Add to processed images with validated data
              processedImages.push({
                id: slide.imageId,
                url: blobUrl,
                name: slide.imageName || `Image ${slide.imageId}`,
                sequence: sequence,
                masking: masking,
                file: undefined, // No file reference for loaded images
              });

            }
          }
          // If no slidesData but we have images array
          else if (responseData.images && Array.isArray(responseData.images)) {

            // Process each image
            for (let index = 0; index < responseData.images.length; index++) {
              const image = responseData.images[index];
              if (!image.image_id) continue;

              let blobUrl = "";

              // Process image data properly, similar to preview components
              if (image.image_data) {
                if (
                  image.image_data.startsWith("/api/") ||
                  image.image_data.startsWith("http") ||
                  image.image_data.startsWith("blob:") ||
                  image.image_data.startsWith("data:")
                ) {
                  // It's already a URL
                  blobUrl = image.image_data;
                } else if (isBase64String(image.image_data)) {
                  // It's base64 data - ensure it has the proper prefix
                  if (!image.image_data.startsWith("data:")) {
                    blobUrl = `data:image/png;base64,${image.image_data}`;
                  } else {
                    blobUrl = image.image_data;
                  }
                } else {
                  // Treat as binary data and create blob URL
                  try {
                    const mimeType = detectImageType(image.image_data);
                    blobUrl = createBlobUrl(image.image_data, mimeType);
                  } catch (e) {
                    console.error("Error creating blob URL:", e);
                    blobUrl = "";
                  }
                }
              }

              // Add to processed images
              processedImages.push({
                id: image.image_id,
                url: blobUrl,
                name: `Image ${index + 1}`,
                sequence: [], // Empty sequence
                masking: [], // Empty masking array
                file: undefined,
              });
            }
          }
          // Also check for images in the document wrapper
          else if (
            responseData.document?.images &&
            Array.isArray(responseData.document.images)
          ) {

            // Process each image
            for (
              let index = 0;
              index < responseData.document.images.length;
              index++
            ) {
              const image = responseData.document.images[index];
              if (!image.image_id) continue;

              let blobUrl = "";

              // Process image data properly, similar to preview components
              if (image.image_data) {
                if (
                  image.image_data.startsWith("/api/") ||
                  image.image_data.startsWith("http") ||
                  image.image_data.startsWith("blob:") ||
                  image.image_data.startsWith("data:")
                ) {
                  // It's already a URL
                  blobUrl = image.image_data;
                } else if (isBase64String(image.image_data)) {
                  // It's base64 data - ensure it has the proper prefix
                  if (!image.image_data.startsWith("data:")) {
                    blobUrl = `data:image/png;base64,${image.image_data}`;
                  } else {
                    blobUrl = image.image_data;
                  }
                } else {
                  // Treat as binary data and create blob URL
                  try {
                    const mimeType = detectImageType(image.image_data);
                    blobUrl = createBlobUrl(image.image_data, mimeType);
                  } catch (e) {
                    console.error("Error creating blob URL:", e);
                    blobUrl = "";
                  }
                }
              }

              // Add to processed images
              processedImages.push({
                id: image.image_id,
                url: blobUrl,
                name: `Image ${index + 1}`,
                sequence: [], // Empty sequence
                masking: [], // Empty masking array
                file: undefined,
              });
            }
          }

          // Update visual images state
          if (processedImages.length > 0) {
            setVisualImages(processedImages);
          } else {
            setVisualImages([]);
          }

          // Set assigned message IDs to context
          setAssignedScriptMessageIds(assignedMessageIds);

          // If status is published, set isPublished
          if (simulation.status === "published") {
            setIsPublished(true);
          }
        } else {
          // No error - just log that no data was returned and proceed with defaults
          console.warn("API returned no data, using defaults");
        }
      } catch (error) {
        console.error("Error loading simulation:", error);
        // Only show error for complete API failure, not for missing fields
        setError(
          "Failed to connect to the server. Please check your connection and try again.",
        );
      } finally {
        setInitialLoading(false);
      }
    };

    loadSimulationData();
  }, [id]);

  // Check different types of visual simulations
  const simulationType = loadedSimulation?.simulationType || "audio";
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  const isVisualOnly = simulationType === "visual";
  const isVisualType = isVisualAudioOrChat || isVisualOnly;
  const hasScript = simulationType !== "visual"; // Visual type doesn't have script

  // New checks for voice and prompt visibility
  const showVoiceSettings =
    simulationType === "audio" || simulationType === "visual-audio";
  const showPromptSettings =
    simulationType === "audio" || simulationType === "chat";

  // Update enabled tabs based on state changes and simulation type
  useEffect(() => {
    setEnabledTabs((prev) => {
      // For 'visual' type, we skip the script tab and start with visuals
      if (isVisualOnly) {
        return {
          script: false, // Disable script tab for visual type
          visuals: true, // Always enabled for visual type
          settings: visualImages.length > 0,
          preview: isPublished,
        };
      }
      // For visual-audio and visual-chat types
      else if (isVisualAudioOrChat) {
        return {
          script: true,
          visuals: scriptData.length > 0, // Only enable if script is not empty
          settings: scriptData.length > 0, // Only enable if script is not empty
          preview: isPublished,
        };
      }
      // For audio and chat types
      else {
        return {
          script: true,
          visuals: false, // No visuals tab
          settings: true, // Always enable settings tab
          preview: isPublished,
        };
      }
    });
  }, [
    isScriptLocked,
    visualImages.length,
    isPublished,
    isVisualOnly,
    isVisualAudioOrChat,
    isVisualType,
    isLoading,
    scriptData.length, // Added scriptData.length as a dependency
  ]);

  // Initialize the tab value for visual type to skip script tab
  useEffect(() => {
    if (isVisualOnly && tabValue === 0) {
      // Start at visuals tab for visual type
      setTabValue(0);
    }
  }, [isVisualOnly, tabValue]);

  // Get tabs based on simulation type
  const tabs = useMemo(() => {
    if (isVisualOnly) {
      // Skip Script tab for visual-only type
      return [
        { label: "Visuals", value: 0 },
        { label: "Settings", value: 1 },
        { label: "Preview", value: 2 },
      ];
    } else if (isVisualAudioOrChat) {
      return [
        { label: "Script", value: 0 },
        { label: "Visuals", value: 1 },
        { label: "Settings", value: 2 },
        { label: "Preview", value: 3 },
      ];
    } else {
      // For audio and chat, no visuals tab
      return [
        { label: "Script", value: 0 },
        { label: "Settings", value: 1 },
        { label: "Preview", value: 2 },
      ];
    }
  }, [isVisualOnly, isVisualAudioOrChat]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Check if the tab is enabled before allowing the change
    const tabKeys = isVisualOnly
      ? ["visuals", "settings", "preview"]
      : isVisualAudioOrChat
        ? ["script", "visuals", "settings", "preview"]
        : ["script", "settings", "preview"];

    if (!enabledTabs[tabKeys[newValue]]) {
      return;
    }
    setTabValue(newValue);
  };

  const handleScriptLoad = useCallback(
    (script: Message[]) => {
      setScriptData(script);
    },
    [setScriptData],
  );

  // Modified to handle different simulation types and move to settings tab before processing
  const handleContinue = async () => {
    if (!id || !loadedSimulation) return;

    // For visual type, we don't need script data
    if (isVisualOnly) {
      // Move directly to visuals tab, which is index 0 for visual type
      setTabValue(0);
      return;
    }

    if (!loadedSimulation || (!isVisualOnly && !scriptData.length)) return;

    // First, lock the script
    setIsScriptLocked(true);

    // For visual-audio and visual-chat, move to Visuals tab after script
    if (isVisualAudioOrChat) {
      const visualsTabIndex = tabs.findIndex((tab) => tab.label === "Visuals");
      setTabValue(visualsTabIndex);
      return; // Exit early, no API call yet
    }

    // For regular audio and chat, move to settings and start processing
    const settingsTabIndex = tabs.findIndex((tab) => tab.label === "Settings");
    setTabValue(settingsTabIndex);

    // Now set loading to true - this will show the loading indicator in SettingsTab
    setIsLoading(true);

    try {
      // Only for non-visual types (audio, chat)
      // Transform script data to match API format
      const formattedScript = scriptData.map((msg) => ({
        script_sentence: msg.message,
        role:
          msg.role.toLowerCase() === "trainee"
            ? "assistant"
            : msg.role.toLowerCase(),
        keywords: (msg.keywords || []).map((k) => k.main_keyword),
      }));

      // Use updateSimulation from simulation_operations instead of direct axios call
      const response = await updateSimulation(id, {
        user_id: user?.id || "private_user", // This should come from your auth context
        sim_name: loadedSimulation.name, // Changed 'name' to 'sim_name' to match API
        division_id: loadedSimulation.division || "",
        department_id: loadedSimulation.department || "",
        sim_type: loadedSimulation.simulationType.toLowerCase(), // Changed 'type' to 'sim_type' to match API
        script: formattedScript,
        tags: loadedSimulation.tags,
      });


      if (response) {
        // Extract data from response
        const responseStatus = response.status || "draft";
        const responseId = response.id || id;
        const responsePrompt = response.prompt || "";

        // Log the prompt received from API response

        // Update simulation response with all available data
        setSimulationResponse({
          id: responseId,
          status: responseStatus,
          prompt: responsePrompt,
        });

      }
    } catch (error) {
      console.error("Error handling continue:", error);
      setError("Failed to update simulation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update simulation with slides (called from VisualsTab)
  const updateSimulationWithSlides = async (formData: FormData) => {
    if (!id || !loadedSimulation) return null;

    // For visual type, we don't need script data
    if (!isVisualOnly && !scriptData.length) return null;

    // Move to settings tab BEFORE processing starts
    const settingsTabIndex = tabs.findIndex((tab) => tab.label === "Settings");
    setTabValue(settingsTabIndex);

    setIsLoading(true);
    try {
      // Log what's in the FormData for debugging

      // Get slidesData from FormData and add percentage coordinates
      const slidesDataEntry = formData.get("slidesData");
      if (slidesDataEntry) {
        try {
          const slidesData = JSON.parse(slidesDataEntry.toString());

          // Process slides to ensure all hotspots have percentage coordinates
          for (const slide of slidesData) {
            if (slide.sequence) {
              for (const item of slide.sequence) {
                if (
                  item.type === "hotspot" &&
                  item.coordinates &&
                  !item.percentageCoordinates
                ) {
                  // Get image dimensions (this is an approximation - ideally would use actual image)
                  const naturalWidth = 800; // Default fallback width
                  const naturalHeight = 600; // Default fallback height

                  // Calculate and add percentage coordinates
                  item.percentageCoordinates = calculatePercentageCoordinates(
                    item.coordinates,
                    naturalWidth,
                    naturalHeight,
                  );
                }
              }
            }

            // Process masking items
            if (slide.masking) {
              for (const item of slide.masking) {
                if (
                  item.content &&
                  item.content.coordinates &&
                  !item.content.percentageCoordinates
                ) {
                  // Get image dimensions (this is an approximation)
                  const naturalWidth = 800; // Default fallback width
                  const naturalHeight = 600; // Default fallback height

                  // Calculate and add percentage coordinates
                  item.content.percentageCoordinates =
                    calculatePercentageCoordinates(
                      item.content.coordinates,
                      naturalWidth,
                      naturalHeight,
                    );
                }
              }
            }
          }

          // Replace the original slidesData with the updated version
          formData.delete("slidesData");
          formData.append("slidesData", JSON.stringify(slidesData));
        } catch (e) {
          console.error("Error processing slidesData:", e);
        }
      }

      // Transform script data to match API format if not visual-only type
      const formattedScript = !isVisualOnly
        ? scriptData.map((msg) => ({
            script_sentence: msg.message,
            role:
              msg.role.toLowerCase() === "trainee"
                ? "assistant"
                : msg.role.toLowerCase(),
            keywords: (msg.keywords || []).map((k) => k.main_keyword),
          }))
        : [];

      // Add script data and other required fields to formData
      formData.append("user_id", user?.id || "private_user"); // This should come from your auth context
      formData.append("sim_name", loadedSimulation.name); // Changed to sim_name
      formData.append("division_id", loadedSimulation.division || "");
      formData.append("department_id", loadedSimulation.department || "");
      formData.append(
        "sim_type",
        loadedSimulation.simulationType.toLowerCase(),
      ); // Changed to sim_type

      // Only add script for non-visual types
      if (!isVisualOnly) {
        formData.append("script", JSON.stringify(formattedScript));
      }

      formData.append("tags", JSON.stringify(loadedSimulation.tags));


      // Use updateSimulationWithFormData from simulation_operations
      const response = await updateSimulationWithFormData(id, formData);

      // Handle response
      if (response) {
        // Extract the relevant information
        const responseStatus = response.status || "draft";
        const responseId = response.id || id;
        const responsePrompt = response.prompt || "";

        // Log the prompt received from API response

        // Update simulation response with all available data
        setSimulationResponse({
          id: responseId,
          status: responseStatus,
          prompt: responsePrompt,
        });

        return response;
      }
      return null;
    } catch (error) {
      console.error("Error updating simulation:", error);
      setError("Failed to update simulation with slides. Please try again.");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which component to render based on tab value and simulation type
  const renderTabContent = () => {
    if (initialLoading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "400px",
          }}
        >
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading simulation data...</Typography>
        </Box>
      );
    }

    // Only show error if it's a critical failure
    if (error) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() =>
              navigate(
                buildPathWithWorkspace(
                  "/manage-simulations",
                  currentWorkspaceId,
                  currentTimeZone,
                ),
              )
            }
            sx={{ mt: 2 }}
          >
            Back to Manage Simulations
          </Button>
        </Box>
      );
    }

    // For visual type, the first tab is Visuals
    if (isVisualOnly) {
      if (tabValue === 0) {
        return (
          <VisualsTab
            images={visualImages}
            onImagesUpdate={setVisualImages}
            createSimulation={updateSimulationWithSlides}
            simulationType={loadedSimulation?.simulationType}
            onComplete={() => {
              if (visualImages.length > 0) {
                // Move to settings tab
                const settingsTabIndex = tabs.findIndex(
                  (tab) => tab.label === "Settings",
                );
                setTabValue(settingsTabIndex);
              }
            }}
          />
        );
      } else if (tabValue === 1) {
        // Settings tab for visual type
        return (
          <SettingsTab
            simulationId={id}
            prompt={simulationResponse?.prompt || ""} // Ensure we pass the prompt from the simulationResponse
            simulationType={loadedSimulation?.simulationType}
            simulationData={loadedSimulation}
            isLoading={isLoading}
            onPublish={() => {
              setIsPublished(true);
              // Move to preview tab
              const previewTabIndex = tabs.findIndex(
                (tab) => tab.label === "Preview",
              );
              setTabValue(previewTabIndex);
            }}
            script={scriptData}
          />
        );
      } else if (tabValue === 2) {
        // Preview tab for visual type
        return (
          <PreviewTab
            simulationId={id || ""}
            simulationType={loadedSimulation?.simulationType}
          />
        );
      }
    } else if (isVisualAudioOrChat) {
      // For visual-audio and visual-chat types
      if (tabValue === 0) {
        return (
          <ScriptTab
            simulationType={loadedSimulation?.simulationType}
            isLocked={isScriptLocked}
          />
        );
      } else if (tabValue === 1) {
        return (
          <VisualsTab
            images={visualImages}
            onImagesUpdate={setVisualImages}
            createSimulation={updateSimulationWithSlides}
            simulationType={loadedSimulation?.simulationType}
            onComplete={() => {
              if (visualImages.length > 0) {
                // Move to settings tab
                const settingsTabIndex = tabs.findIndex(
                  (tab) => tab.label === "Settings",
                );
                setTabValue(settingsTabIndex);
              }
            }}
          />
        );
      } else if (tabValue === 2) {
        return (
          <SettingsTab
            simulationId={id}
            prompt={simulationResponse?.prompt || ""} // Ensure we pass the prompt from the simulationResponse
            simulationType={loadedSimulation?.simulationType}
            simulationData={loadedSimulation}
            isLoading={isLoading}
            onPublish={() => {
              setIsPublished(true);
              // Move to preview tab
              const previewTabIndex = tabs.findIndex(
                (tab) => tab.label === "Preview",
              );
              setTabValue(previewTabIndex);
            }}
            script={scriptData}
          />
        );
      } else if (tabValue === 3) {
        return (
          <PreviewTab
            simulationId={id || ""}
            simulationType={loadedSimulation?.simulationType}
          />
        );
      }
    } else {
      // For audio and chat types (no visuals tab)
      if (tabValue === 0) {
        return (
          <ScriptTab
            simulationType={loadedSimulation?.simulationType}
            isLocked={isScriptLocked}
            onContinue={handleContinue} //
          />
        );
      } else if (tabValue === 1) {
        return (
          <SettingsTab
            simulationId={id}
            prompt={simulationResponse?.prompt || ""} // Ensure we pass the prompt from the simulationResponse
            simulationType={loadedSimulation?.simulationType}
            simulationData={loadedSimulation}
            isLoading={isLoading}
            onPublish={() => {
              setIsPublished(true);
              // Move to preview tab
              const previewTabIndex = tabs.findIndex(
                (tab) => tab.label === "Preview",
              );
              setTabValue(previewTabIndex);
            }}
            script={scriptData}
          />
        );
      } else if (tabValue === 2) {
        return (
          <PreviewTab
            simulationId={id || ""}
            simulationType={loadedSimulation?.simulationType}
          />
        );
      }
    }

    return null;
  };

  if (!id) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          No simulation ID provided. Please select a simulation to edit.
        </Alert>
        <Button
          variant="contained"
          onClick={() =>
            navigate(
              buildPathWithWorkspace(
                "/manage-simulations",
                currentWorkspaceId,
                currentTimeZone,
              ),
            )
          }
          sx={{ mt: 2 }}
        >
          Back to Manage Simulations
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "#F9FAFB", minHeight: "calc(100vh - 64px)" }}>
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          px: 2,
          py: 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Simulation Name:
          </Typography>
          <Box
            sx={{
              bgcolor: "#F4F7FF",
              px: 2,
              py: 0.75,
              borderRadius: 1.5,
              border: "1px solid #E6EDFF",
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Typography variant="body1" fontWeight={600} color="#1A3CB8">
              {loadedSimulation?.name || "Loading..."}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Type:
          </Typography>
          <Box
            sx={{
              bgcolor: "#F0F4FF",
              px: 1.5,
              py: 0.5,
              borderRadius: 1.5,
              border: "1px solid #E0E7FF",
            }}
          >
            <Typography variant="body2" fontWeight={600} color="#444CE7">
              {loadedSimulation?.simulationType
                .replace("-", " ")
                .toUpperCase() || ""}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: 2, py: 1 }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            {tabs.map((tab, index) => {
              // Determine the appropriate key based on simulation type
              let tabKey;
              if (isVisualOnly) {
                tabKey = ["visuals", "settings", "preview"][index];
              } else if (isVisualAudioOrChat) {
                tabKey = ["script", "visuals", "settings", "preview"][index];
              } else {
                tabKey = ["script", "settings", "preview"][index];
              }

              return (
                <StyledTab
                  key={tab.label}
                  label={tab.label}
                  disabled={!enabledTabs[tabKey]}
                  sx={{
                    opacity: enabledTabs[tabKey] ? 1 : 0.5,
                    cursor: enabledTabs[tabKey] ? "pointer" : "not-allowed",
                  }}
                />
              );
            })}
          </StyledTabs>
          {!isVisualOnly && isScriptLocked && (
            <LockIcon sx={{ color: "success.main", fontSize: 20 }} />
          )}
        </Stack>

        {/* Actions for when we have script data */}
        {scriptData.length > 0 && tabValue === 0 && !isVisualOnly && (
          <Button
            variant="contained"
            onClick={async () => {
              await handleContinue();
            }}
            disabled={isLoading}
            sx={{
              bgcolor: "#444CE7",
              "&:hover": { bgcolor: "#3538CD" },
              borderRadius: 2,
              px: 4,
            }}
          >
            {isLoading ? "Processing..." : "Save Simulation"}
          </Button>
        )}
      </Stack>

      <Box sx={{ px: 2 }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow:
              "0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)",
            position: "relative",
            zIndex: 0,
          }}
        >
          <CardContent sx={{ p: 2 }}>{renderTabContent()}</CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const GenerateScript = () => {
  return (
    <SimulationWizardProvider>
      <GenerateScriptContent />
    </SimulationWizardProvider>
  );
};

export default GenerateScript;
