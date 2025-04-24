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
} from "../../../../../services/simulation_operations";

interface TabState {
  script: boolean;
  visuals: boolean;
  settings: boolean;
  preview: boolean;
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
  };
  sim_practice?: {
    is_unlimited?: boolean;
    pre_requisite_limit?: number;
  };
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

const GenerateScriptContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        // Updated endpoint to match the actual API
        const response = await axios.get(`/api/simulations/fetch/${id}`);

        // Check if we have at least some data to work with
        if (response.data) {
          // Handle both response formats - with or without document wrapper
          const responseData = response.data.document || response.data;

          // Extract simulation data from the response
          const simulation = responseData.simulation || responseData || {};

          console.log("API Response simulation data:", simulation);

          // Map level settings from the response format to our internal format
          const mappedLevels = {
            lvl1: simulation.lvl1 || {},
            lvl2: simulation.lvl2 || {},
            lvl3: simulation.lvl3 || {},
          };

          // Always proceed with whatever data we have - use defaults for missing parts
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
            est_time: simulation.est_time || "15",
            estimated_time_to_attempt_in_mins:
              simulation.estimated_time_to_attempt_in_mins || 15,
            key_objectives: simulation.key_objectives || [
              "Learn basic customer service",
              "Understand refund process",
            ],
            quick_tips: simulation.quick_tips || [
              "Listen to the customer carefully",
              "Be polite and empathetic",
              "Provide accurate information",
            ],
            overviewVideo: simulation.overview_video || "",
            overview_video: simulation.overview_video || "",
            voice_id: simulation.voice_id || "",
            language: simulation.language || "English",
            voice_speed: simulation.voice_speed || "Normal",
            mood: simulation.mood || "Neutral",
            simulation_completion_repetition:
              simulation.simulation_completion_repetition || 3,
            simulation_max_repetition:
              simulation.simulation_max_repetition || 5,
            final_simulation_score_criteria:
              simulation.final_simulation_score_criteria || "Best of three",
            simulation_scoring_metrics:
              simulation.simulation_scoring_metrics || {
                is_enabled: true,
                keyword_score: 20,
                click_score: 80,
              },
            sim_practice: simulation.sim_practice || {
              is_unlimited: false,
              pre_requisite_limit: 3,
            },
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
                id: `script-${Date.now()}-${index}`,
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

          // Check if we have slidesData
          if (
            simulation.slidesData &&
            Array.isArray(simulation.slidesData) &&
            simulation.slidesData.length > 0
          ) {
            console.log("Processing slidesData:", simulation.slidesData);

            // Create a map of image data by id for quick lookup if images array exists
            const imageDataMap = new Map();

            if (responseData.images && Array.isArray(responseData.images)) {
              responseData.images.forEach((img) => {
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

              // First check if we have a valid API URL in slide.imageUrl
              if (
                slide.imageUrl &&
                (slide.imageUrl.startsWith("/api/") ||
                  slide.imageUrl.startsWith("http"))
              ) {
                // Use the API URL directly
                blobUrl = slide.imageUrl;
              }
              // If no valid URL but we have image data, process it
              else if (imageData) {
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
                      // Create a proper hotspot sequence item
                      return {
                        id: `hotspot-${item.id}`,
                        type: "hotspot",
                        content: {
                          id: item.id,
                          name: item.name || "Untitled hotspot",
                          type: "hotspot",
                          hotspotType: item.hotspotType || "button",
                          coordinates: item.coordinates
                            ? {
                                x: Number(item.coordinates.x || 0),
                                y: Number(item.coordinates.y || 0),
                                width: Number(item.coordinates.width || 0),
                                height: Number(item.coordinates.height || 0),
                              }
                            : undefined,
                          settings: item.settings || {},
                          options: item.options || [],
                          text: item.text,
                        },
                        timestamp: Date.now(),
                      };
                    }
                    // For message type items
                    else if (item.type === "message") {
                      // Create a proper message sequence item
                      return {
                        id: `message-${item.id}`,
                        type: "message",
                        content: {
                          id: item.id,
                          role: item.role || "Customer", // Preserve the original role
                          text: item.text || "",
                          visualId: slide.imageId,
                          order: 0, // Default order
                        },
                        timestamp: Date.now(),
                      };
                    }
                    // Return as is for unknown types
                    return item;
                  })
                : [];

              // Add to processed images with validated data
              processedImages.push({
                id: slide.imageId,
                url: blobUrl,
                name: slide.imageName || `Image ${slide.imageId}`,
                sequence: sequence,
                file: undefined, // No file reference for loaded images
              });

              console.log(
                `Processed image ${slide.imageId} with URL:`,
                blobUrl,
              );
            }
          }
          // If no slidesData but we have images array
          else if (responseData.images && Array.isArray(responseData.images)) {
            console.log("Processing just images array:", responseData.images);

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
                file: undefined,
              });
            }
          }

          // Update visual images state
          if (processedImages.length > 0) {
            console.log("Setting processed visual images:", processedImages);
            setVisualImages(processedImages);
          } else {
            setVisualImages([]);
          }

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
          settings: true, // Always enable settings tab
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
        keywords: msg.keywords || [],
      }));

      // Use updateSimulation from simulation_operations instead of direct axios call
      const response = await updateSimulation(id, {
        user_id: "user123", // This should come from your auth context
        sim_name: loadedSimulation.name, // Changed 'name' to 'sim_name' to match API
        division_id: loadedSimulation.division || "",
        department_id: loadedSimulation.department || "",
        sim_type: loadedSimulation.simulationType.toLowerCase(), // Changed 'type' to 'sim_type' to match API
        script: formattedScript,
        tags: loadedSimulation.tags,
      });

      console.log("API update request sent with:", {
        sim_name: loadedSimulation.name,
        sim_type: loadedSimulation.simulationType.toLowerCase(),
      });

      if (response) {
        // Extract data from response
        const responseStatus = response.status || "draft";
        const responseId = response.id || id;
        const responsePrompt = response.prompt || "";

        // Log the prompt received from API response
        console.log("Received prompt from API:", responsePrompt);
        console.log("Full API response:", response);

        // Update simulation response with all available data
        setSimulationResponse({
          id: responseId,
          status: responseStatus,
          prompt: responsePrompt,
        });

        console.log(
          "Updated simulationResponse state with prompt:",
          responsePrompt,
        );
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
      console.log(
        "FormData entries:",
        [...formData.entries()].map((entry) => {
          // Don't log file contents, just their presence
          if (entry[1] instanceof File) {
            return [entry[0], `File: ${(entry[1] as File).name}`];
          }
          return entry;
        }),
      );

      // Transform script data to match API format if not visual-only type
      const formattedScript = !isVisualOnly
        ? scriptData.map((msg) => ({
            script_sentence: msg.message,
            role:
              msg.role.toLowerCase() === "trainee"
                ? "assistant"
                : msg.role.toLowerCase(),
            keywords: msg.keywords || [],
          }))
        : [];

      // Add script data and other required fields to formData
      formData.append("user_id", "user123"); // This should come from your auth context
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

      console.log("Sent visual update with fields:", {
        sim_name: loadedSimulation.name,
        sim_type: loadedSimulation.simulationType.toLowerCase(),
      });

      // Use updateSimulationWithFormData from simulation_operations
      const response = await updateSimulationWithFormData(id, formData);

      // Handle response
      if (response) {
        // Extract the relevant information
        const responseStatus = response.status || "draft";
        const responseId = response.id || id;
        const responsePrompt = response.prompt || "";

        // Log the prompt received from API response
        console.log("Received prompt from visual update API:", responsePrompt);
        console.log("Full visual update API response:", response);

        // Update simulation response with all available data
        setSimulationResponse({
          id: responseId,
          status: responseStatus,
          prompt: responsePrompt,
        });

        console.log(
          "Updated simulationResponse state with prompt from slides update:",
          responsePrompt,
        );
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
            onClick={() => navigate("/manage-simulations")}
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
          onClick={() => navigate("/manage-simulations")}
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
