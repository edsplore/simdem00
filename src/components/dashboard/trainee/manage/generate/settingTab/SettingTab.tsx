import { useState, useEffect, useRef, useMemo } from "react";
import {
  Stack,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Card,
  styled,
  Button,
  CircularProgress,
  Alert,
  ButtonGroup,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import AdvancedSettings from "./AdvancedSetting";
import VoiceAndScoreSettings from "./VoiceScoreSetting";
import PreviewTab from "../PreviewTab";
import { useParams, useNavigate } from "react-router-dom";
import {
  publishSimulation,
  updateSimulation,
  publishSimulationWithFormData,
  updateSimulationWithFormData,
} from "../../../../../../services/simulation_operations";
import { useAuth } from "../../../../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../../../../utils/navigation";
import { useSimulationWizard } from "../../../../../../context/SimulationWizardContext";

const NavItem = styled(ListItem)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#F5F6FF",
  },
}));

const DEFAULT_VOICE_ID = "11labs-Adrian";

interface SettingTabProps {
  simulationId?: string;
  prompt?: string;
  simulationType?: string;
  simulationData?: {
    name: string;
    division: string;
    department: string;
    tags: string[];
    simulationType: string;
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
  };
  isLoading?: boolean;
  onPublish?: () => void;
  script?: any[];
}

interface SimulationSettings {
  simulationType?: string;
  voice?: {
    language?: string;
    accent?: string;
    gender?: string;
    ageGroup?: string;
    voiceId?: string;
  };
  levels?: {
    [key: string]: any;
  };
  scoring?: {
    simulationScore?: "best" | "last" | "average";
    keywordScore?: string;
    clickScore?: string;
    pointsPerKeyword?: string;
    pointsPerClick?: string;
    practiceMode?: "unlimited" | "limited";
    practiceLimit?: string;
    repetitionsAllowed?: string;
    repetitionsNeeded?: string;
    minimumPassingScore?: string;
    scoringMetrics?: {
      enabled?: boolean;
      keywordScore?: string;
      clickScore?: string;
    };
    metricWeightage?: {
      clickAccuracy?: string;
      keywordAccuracy?: string;
      dataEntryAccuracy?: string;
      contextualAccuracy?: string;
      sentimentMeasures?: string;
    };
  };
  estimatedTime?: {
    enabled: boolean;
    value: string;
  };
  objectives?: {
    enabled: boolean;
    text: string;
  };
  quickTips?: {
    enabled: boolean;
    text: string;
  };
  overviewVideo?: {
    enabled: boolean;
  };
}

const SettingTab: React.FC<SettingTabProps> = ({
  simulationId: propSimulationId,
  prompt = "",
  simulationType = "audio",
  simulationData,
  isLoading = false,
  onPublish,
  script,
}) => {
  // Get context data to ensure we have latest changes - now including assignedScriptMessageIds
  const {
    scriptData,
    visualImages,
    setIsScriptLocked,
    assignedScriptMessageIds,
  } = useSimulationWizard();

  // Use ID from URL params if available, fallback to prop
  const { id: urlId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const simulationId = urlId || propSimulationId;

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [publishedSimId, setPublishedSimId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("Simulation Type");
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Add state for weightage validation
  const [isWeightageValid, setIsWeightageValid] = useState(true);

  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  // Add state to track the edited prompt
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  // FIXED: State initialization - don't call createSettingsFromData until we have simulationData
  const [settingsState, setSettingsState] = useState<SimulationSettings | null>(
    null,
  );

  // FIXED: Add state to track if settings have been loaded from API
  const [settingsLoadedFromAPI, setSettingsLoadedFromAPI] = useState(false);

  // Log when simulation data changes
  useEffect(() => {
    console.log("SettingTab received simulationData:", simulationData);
    console.log("=== Simulation Data Debug ===");
    console.log("voice_id:", simulationData?.voice_id);
    console.log(
      "minimum_passing_score:",
      simulationData?.minimum_passing_score,
    );
    console.log(
      "simulation_max_repetition:",
      simulationData?.simulation_max_repetition,
    );
    console.log(
      "simulation_completion_repetition:",
      simulationData?.simulation_completion_repetition,
    );
    console.log(
      "simulation_scoring_metrics:",
      simulationData?.simulation_scoring_metrics,
    );
    console.log("metric_weightage:", simulationData?.metric_weightage);
  }, [simulationData]);

  // Update the edited prompt when prop changes, this is important
  // to ensure the prompt from update API responses is displayed
  useEffect(() => {
    if (prompt) {
      console.log("Prompt received from props:", prompt);
      setEditedPrompt(prompt);
    }
  }, [prompt]); // Dependency includes prompt, runs when prompt changes

  // Check simulation type categories
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  const isVisualOnly = simulationType === "visual";
  const isAnyVisualType = isVisualAudioOrChat || isVisualOnly;
  const hasScript = simulationType !== "visual"; // Visual type doesn't have script

  // New checks for voice and prompt visibility
  const showVoiceSettings =
    simulationType === "audio" || simulationType === "visual-audio";
  const showPromptSettings =
    simulationType === "audio" || simulationType === "chat";

  // Load settings from localStorage if available
  const loadSettingsFromStorage = () => {
    if (!simulationId) return null;

    const storedSettings = localStorage.getItem(
      `simulation_settings_${simulationId}`,
    );
    if (storedSettings) {
      try {
        return JSON.parse(storedSettings);
      } catch (e) {
        console.error("Error parsing stored settings:", e);
      }
    }
    return null;
  };

  // Default settings function
  const getDefaultSettings = (): SimulationSettings => {
    return {
      advancedSettings: {
        simulationType: simulationType || "audio",
        levels: {
          simulationLevels: { lvl1: true, lvl2: false, lvl3: false },
          enablePractice: { lvl1: false, lvl2: false, lvl3: false },
          hideAgentScript: { lvl1: false, lvl2: false, lvl3: false },
          hideCustomerScript: { lvl1: false, lvl2: false, lvl3: false },
          hideKeywordScores: { lvl1: false, lvl2: false, lvl3: false },
          hideSentimentScores: { lvl1: false, lvl2: false, lvl3: false },
          hideHighlights: { lvl1: false, lvl2: false, lvl3: false },
          hideCoachingTips: { lvl1: false, lvl2: false, lvl3: false },
          enablePostSurvey: { lvl1: false, lvl2: false, lvl3: false },
          aiPoweredPauses: { lvl1: false, lvl2: false, lvl3: false },
        },
        estimatedTime: { enabled: false, value: "" },
        objectives: {
          enabled: false,
          text: "Learn basic customer service\nUnderstand refund process",
        },
        quickTips: {
          enabled: false,
          text: "Listen to the customer carefully\nBe polite and empathetic\nProvide accurate information",
        },
        overviewVideo: { enabled: false },
      },
      voiceSettings: {
        voice: {
          language: "English",
          accent: "American",
          gender: "Male",
          ageGroup: "Middle Aged",
          voiceId: DEFAULT_VOICE_ID,
        },
        scoring: {
          simulationScore: "best",
          keywordScore: hasScript ? "20" : "0",
          clickScore: hasScript ? "80" : "100",
          pointsPerKeyword: "1",
          pointsPerClick: "1",
          practiceMode: "limited",
          practiceLimit: "3",
          repetitionsAllowed: "3",
          repetitionsNeeded: "2",
          minimumPassingScore: "60",
          scoringMetrics: {
            enabled: true,
            keywordScore: "20%",
            clickScore: "80%",
          },
          metricWeightage: {
            clickAccuracy: isAnyVisualType ? "30%" : "0%",
            keywordAccuracy: hasScript ? "30%" : "0%",
            dataEntryAccuracy: isAnyVisualType ? "20%" : "0%",
            contextualAccuracy: "10%",
            sentimentMeasures: "10%",
          },
        },
      },
    };
  };

  // FIXED: Enhanced helper function to create settings object from simulationData
  const createSettingsFromData = (): SimulationSettings => {
    console.log("=== Creating Settings from Data ===");
    console.log("simulationData:", simulationData);

    if (!simulationData) {
      console.log("No simulationData available, returning defaults");
      return getDefaultSettings();
    }

    const levels = simulationData?.levels || {};
    console.log("Levels from API:", levels);

    const lvl1 = levels.lvl1 || {};
    const lvl2 = levels.lvl2 || {};
    const lvl3 = levels.lvl3 || {};

    console.log("Individual levels:", { lvl1, lvl2, lvl3 });

    // Convert API format to internal settings format
    const convertedLevels = {
      // This is the top-level setting that controls which levels are enabled
      simulationLevels: {
        lvl1: lvl1.isEnabled !== false, // Default to true if undefined
        lvl2: lvl2.isEnabled === true, // Default to false if undefined
        lvl3: lvl3.isEnabled === true, // Default to false if undefined
      },
      // Setting for enabling practice mode - separate from simulationLevels
      enablePractice: {
        lvl1: lvl1.enablePractice === true,
        lvl2: lvl2.enablePractice === true,
        lvl3: lvl3.enablePractice === true,
      },
      hideAgentScript: {
        lvl1: lvl1.hideAgentScript === true,
        lvl2: lvl2.hideAgentScript === true,
        lvl3: lvl3.hideAgentScript === true,
      },
      hideCustomerScript: {
        lvl1: lvl1.hideCustomerScript === true,
        lvl2: lvl2.hideCustomerScript === true,
        lvl3: lvl3.hideCustomerScript === true,
      },
      hideKeywordScores: {
        lvl1: lvl1.hideKeywordScores === true,
        lvl2: lvl2.hideKeywordScores === true,
        lvl3: lvl3.hideKeywordScores === true,
      },
      hideSentimentScores: {
        lvl1: lvl1.hideSentimentScores === true,
        lvl2: lvl2.hideSentimentScores === true,
        lvl3: lvl3.hideSentimentScores === true,
      },
      hideHighlights: {
        lvl1: lvl1.hideHighlights === true,
        lvl2: lvl2.hideHighlights === true,
        lvl3: lvl3.hideHighlights === true,
      },
      hideCoachingTips: {
        lvl1: lvl1.hideCoachingTips === true,
        lvl2: lvl2.hideCoachingTips === true,
        lvl3: lvl3.hideCoachingTips === true,
      },
      enablePostSurvey: {
        lvl1: lvl1.enablePostSimulationSurvey === true,
        lvl2: lvl2.enablePostSimulationSurvey === true,
        lvl3: lvl3.enablePostSimulationSurvey === true,
      },
      aiPoweredPauses: {
        lvl1: lvl1.aiPoweredPausesAndFeedback === true,
        lvl2: lvl2.aiPoweredPausesAndFeedback === true,
        lvl3: lvl3.aiPoweredPausesAndFeedback === true,
      },
    };

    console.log("Converted levels:", convertedLevels);

    // FIXED: Check if estimated time exists in API response to determine enabled state
    const hasEstimatedTime = !!(
      simulationData?.estimated_time_to_attempt_in_mins ||
      simulationData?.est_time
    );

    const estimatedTime = {
      enabled: hasEstimatedTime, // Enable if API has a value
      value: simulationData?.estimated_time_to_attempt_in_mins
        ? `${simulationData.estimated_time_to_attempt_in_mins} mins`
        : simulationData?.est_time
          ? `${simulationData.est_time} mins`
          : "",
    };

    console.log("Estimated time:", estimatedTime);

    // FIXED: Properly handle objectives from API
    const keyObjectives = simulationData?.key_objectives || [];
    const objectives = {
      enabled: keyObjectives.length > 0, // Enable only if there are actual objectives
      text:
        keyObjectives.length > 0
          ? keyObjectives.join("\n")
          : "Learn basic customer service\nUnderstand refund process", // Default placeholder
    };

    console.log("Objectives:", objectives);

    // FIXED: Properly handle quick tips from API
    const quickTipsArray = simulationData?.quick_tips || [];
    const quickTips = {
      enabled: quickTipsArray.length > 0, // Enable only if there are actual tips
      text:
        quickTipsArray.length > 0
          ? quickTipsArray.join("\n")
          : "Listen to the customer carefully\nBe polite and empathetic\nProvide accurate information", // Default placeholder
    };

    console.log("Quick tips:", quickTips);

    // Get overview video setting
    const overviewVideo = {
      enabled:
        !!simulationData?.overviewVideo || !!simulationData?.overview_video,
    };

    // FIXED: Get metric weightage values with proper type conversion
    const metricWeightage = simulationData?.metric_weightage || {};
    console.log("Metric weightage from API:", metricWeightage);

    // FIXED: Correct the final simulation score criteria mapping
    const getSimulationScore = () => {
      const criteria = simulationData?.final_simulation_score_criteria;
      console.log("Raw score criteria from API:", criteria);

      switch (criteria) {
        case "last":
          return "last";
        case "average":
          return "average";
        case "best":
        default:
          return "best";
      }
    };

    const simulationScore = getSimulationScore();
    console.log("Mapped simulation score:", simulationScore);

    // FIXED: Enhanced voice and scoring settings with proper type conversions
    const voiceSettings = {
      voice: {
        language: simulationData?.language || "English",
        accent: "American", // Default value as it's not in the API
        gender: "Male", // Default value as it's not in the API
        ageGroup: "Middle Aged", // Default value as it's not in the API
        voiceId: simulationData?.voice_id || DEFAULT_VOICE_ID,
      },
      scoring: {
        simulationScore,

        // FIXED: Ensure these are strings for the form
        keywordScore: String(
          simulationData?.simulation_scoring_metrics?.keyword_score ??
            (hasScript ? 20 : 0),
        ),
        clickScore: String(
          simulationData?.simulation_scoring_metrics?.click_score ??
            (hasScript ? 80 : 100),
        ),
        pointsPerKeyword: String(
          simulationData?.simulation_scoring_metrics?.points_per_keyword ?? 1,
        ),
        pointsPerClick: String(
          simulationData?.simulation_scoring_metrics?.points_per_click ?? 1,
        ),

        practiceMode: simulationData?.sim_practice?.is_unlimited
          ? "unlimited"
          : "limited",
        practiceLimit: String(
          simulationData?.sim_practice?.pre_requisite_limit ?? 3,
        ),

        // FIXED: Ensure repetition values are strings
        repetitionsAllowed: String(
          simulationData?.simulation_max_repetition ?? 3,
        ),
        repetitionsNeeded: String(
          simulationData?.simulation_completion_repetition ?? 2,
        ),

        // FIXED: Ensure minimum passing score is a string
        minimumPassingScore: String(
          simulationData?.minimum_passing_score ?? 60,
        ),

        scoringMetrics: {
          enabled:
            simulationData?.simulation_scoring_metrics?.is_enabled !== false, // Default to true

          // FIXED: Ensure these include % sign
          keywordScore: `${simulationData?.simulation_scoring_metrics?.keyword_score ?? (hasScript ? 20 : 0)}%`,
          clickScore: `${simulationData?.simulation_scoring_metrics?.click_score ?? (hasScript ? 80 : 100)}%`,
        },
        metricWeightage: {
          // FIXED: Ensure all weightage values include % sign and are properly converted
          clickAccuracy: `${metricWeightage.click_accuracy ?? (isAnyVisualType ? 30 : 0)}%`,
          keywordAccuracy: `${metricWeightage.keyword_accuracy ?? (hasScript ? 30 : 0)}%`,
          dataEntryAccuracy: `${metricWeightage.data_entry_accuracy ?? (isAnyVisualType ? 20 : 0)}%`,
          contextualAccuracy: `${metricWeightage.contextual_accuracy ?? 10}%`,
          sentimentMeasures: `${metricWeightage.sentiment_measures ?? 10}%`,
        },
      },
    };

    console.log("Final voice settings:", voiceSettings);
    console.log("Voice ID in voice settings:", voiceSettings.voice.voiceId);

    const finalSettings = {
      advancedSettings: {
        simulationType: simulationType || "audio",
        levels: convertedLevels,
        estimatedTime,
        objectives,
        quickTips,
        overviewVideo,
      },
      voiceSettings,
    };

    console.log("Final created settings:", finalSettings);
    return finalSettings;
  };

  // FIXED: Only create settings from data when simulationData is actually available
  // This is the MAIN effect that loads settings - NEVER load from localStorage here
  useEffect(() => {
    console.log("=== Settings Update Effect ===");
    console.log("simulationData available:", !!simulationData);
    console.log("simulationData.voice_id:", simulationData?.voice_id);
    console.log(
      "simulationData.minimum_passing_score:",
      simulationData?.minimum_passing_score,
    );

    if (simulationData) {
      // Create settings from API data - this will override any localStorage
      const newSettings = createSettingsFromData();
      console.log("Created settings from API data:", newSettings);
      console.log(
        "Voice ID in new settings:",
        newSettings.voiceSettings?.voice?.voiceId,
      );
      setSettingsState(newSettings);

      // FIXED: Mark that settings have been loaded from API
      setSettingsLoadedFromAPI(true);

      // IMPORTANT: Don't save to localStorage immediately to avoid override loops
      // Only save when user actually changes something
    } else if (!settingsLoadedFromAPI) {
      // FIXED: Only try localStorage if no simulationData is available yet AND we haven't loaded from API
      const storedSettings = loadSettingsFromStorage();
      if (storedSettings) {
        console.log("Using stored settings as fallback:", storedSettings);
        setSettingsState(storedSettings);
      } else {
        // If no localStorage either, use defaults
        console.log("No stored settings, using defaults");
        setSettingsState(getDefaultSettings());
      }
    }
  }, [simulationData]); // Remove other dependencies to avoid unnecessary re-runs

  // NEW: Validate settings before publishing
  const validateSettings = () => {
    if (!settingsState) return false;

    // Check if at least one level is enabled
    const levels = settingsState.advancedSettings?.levels?.simulationLevels;
    const isAnyLevelEnabled = levels?.lvl1 || levels?.lvl2 || levels?.lvl3;

    // Check if estimated time is specified and enabled
    // CHANGED: Only require time value if toggle is ON
    const estimatedTime = settingsState.advancedSettings?.estimatedTime;
    const isEstimatedTimeValid =
      !estimatedTime?.enabled ||
      (estimatedTime.enabled &&
        estimatedTime.value &&
        estimatedTime.value.trim() !== "");

    // Build validation error message if needed
    let errorMessage = null;

    if (
      !isAnyLevelEnabled &&
      estimatedTime?.enabled &&
      !estimatedTime.value.trim() &&
      !isWeightageValid
    ) {
      errorMessage =
        "At least one level must be enabled, estimated time must be specified when enabled, and score metric weightage must total 100% before publishing.";
    } else if (
      !isAnyLevelEnabled &&
      estimatedTime?.enabled &&
      !estimatedTime.value.trim()
    ) {
      errorMessage =
        "At least one level must be enabled and estimated time must be specified when enabled before publishing.";
    } else if (!isAnyLevelEnabled && !isWeightageValid) {
      errorMessage =
        "At least one level must be enabled and score metric weightage must total 100% before publishing.";
    } else if (
      estimatedTime?.enabled &&
      !estimatedTime.value.trim() &&
      !isWeightageValid
    ) {
      errorMessage =
        "Estimated time must be specified when enabled and score metric weightage must total 100% before publishing.";
    } else if (!isAnyLevelEnabled) {
      errorMessage = "At least one level must be enabled before publishing.";
    } else if (estimatedTime?.enabled && !estimatedTime.value.trim()) {
      errorMessage =
        "Estimated time must be specified when enabled before publishing.";
    } else if (!isWeightageValid) {
      errorMessage =
        "Score metric weightage must total 100% before publishing.";
    }

    setValidationError(errorMessage);
    return errorMessage === null;
  };

  // NEW: Check validation state for UI (disabling buttons, etc.)
  const isPublishDisabled = useMemo(() => {
    if (isPublishing || !simulationId || !settingsState) return true;

    // Check if at least one level is enabled
    const levels = settingsState.advancedSettings?.levels?.simulationLevels;
    const isAnyLevelEnabled = levels?.lvl1 || levels?.lvl2 || levels?.lvl3;

    // Check if estimated time is valid (not enabled OR enabled with a value)
    // CHANGED: Only require time value if toggle is ON
    const estimatedTime = settingsState.advancedSettings?.estimatedTime;
    const isEstimatedTimeValid =
      !estimatedTime?.enabled ||
      (estimatedTime.enabled &&
        estimatedTime.value &&
        estimatedTime.value.trim() !== "");

    return !isAnyLevelEnabled || !isEstimatedTimeValid || !isWeightageValid;
  }, [isPublishing, simulationId, settingsState, isWeightageValid]);

  // FIXED: Save to localStorage only when user makes changes, not on API data load
  // Add delay and check to prevent saving immediately after API load
  useEffect(() => {
    // Only save if we have settings and simulationId, and settings came from user interaction
    // AND enough time has passed since API load to distinguish user changes
    if (settingsState && simulationId && settingsLoadedFromAPI) {
      // Add a delay to distinguish between API updates and user updates
      const timeoutId = setTimeout(() => {
        // Double-check that we still have the same settings (user didn't navigate away)
        if (settingsState && simulationId) {
          console.log("Saving settings to localStorage after user interaction");
          localStorage.setItem(
            `simulation_settings_${simulationId}`,
            JSON.stringify(settingsState),
          );
        }
      }, 2000); // Increased delay to 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [settingsState, simulationId, settingsLoadedFromAPI]);

  // Add handler functions to update settings
  const handleAdvancedSettingsChange = (newSettings: any) => {
    console.log("Advanced settings updated:", newSettings);
    setSettingsState((prev) => ({
      ...prev,
      advancedSettings: newSettings,
    }));
  };

  const handleVoiceSettingsChange = (newSettings: any) => {
    console.log("Voice settings updated:", newSettings);
    setSettingsState((prev) => ({
      ...prev,
      voiceSettings: newSettings,
    }));
  };

  // Handler to update edited prompt when it changes
  const handlePromptChange = (newPrompt: string) => {
    console.log("Prompt updated:", newPrompt);
    setEditedPrompt(newPrompt);
  };

  // Add handler for weightage validation
  const handleWeightageValidationChange = (isValid: boolean) => {
    setIsWeightageValid(isValid);
  };

  // FIXED: Remove the effect that loads from localStorage when returning from preview
  // This was causing the override issue!
  // The localStorage loading should only happen once at initialization, not when toggling preview

  // Smoothly scroll to a section when clicked
  const scrollToSection = (sectionId: string) => {
    if (mainContentRef.current) {
      const section = mainContentRef.current.querySelector(
        `[data-section="${sectionId}"]`,
      );
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  // When section is changed, scroll to it
  useEffect(() => {
    scrollToSection(activeSection);
  }, [activeSection]);

  // Function to process text into an array, removing numbering
  const processTextToArray = (text: string) => {
    if (!text) return [];
    return (
      text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line)
        // Remove any numbering patterns like "1:", "2:", etc.
        .map((line) => line.replace(/^\d+[\s:.)-]*\s*/, ""))
    );
  };

  // Helper function to parse percentage string to number, remove the % sign
  const parsePercentage = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace("%", "")) || 0;
  };

  // ENHANCED Helper function to create the simulation payload
  const createSimulationPayload = (status: "published" | "draft") => {
    if (!settingsState) {
      throw new Error("Settings not available");
    }

    // Get the latest script data directly from context
    const latestScriptData = scriptData;

    // Create a Map of the latest script data for quick lookup
    const scriptDataMap = new Map(latestScriptData.map((msg) => [msg.id, msg]));

    // Transform script to required format by removing 'id' field - but only if there's a script
    const transformedScript =
      hasScript && latestScriptData && latestScriptData.length > 0
        ? latestScriptData.map(({ id, ...rest }) => ({
            ...rest,
            script_sentence: rest.message,
            role:
              rest.role.toLowerCase() === "trainee"
                ? "assistant"
                : rest.role.toLowerCase(),
          }))
        : [];

    // Get values from settings state
    const { advancedSettings, voiceSettings } = settingsState;

    // Extract specific settings - ensure we're accessing the actual properties
    const levelSettings = advancedSettings?.levels || {};
    const timeSettings = advancedSettings?.estimatedTime || {
      enabled: false,
      value: "",
    };
    const objectivesSettings = advancedSettings?.objectives || {
      enabled: false,
      text: "",
    };
    const tipsSettings = advancedSettings?.quickTips || {
      enabled: false,
      text: "",
    };
    const voiceConfig = voiceSettings?.voice || {};
    const scoringConfig = voiceSettings?.scoring || {};

    // Parse time value to extract just the number
    const timeValue = String(timeSettings.value || "").match(/\d+/)?.[0] || "";

    // Check enabled levels from simulationLevels setting
    const lvl1Enabled = levelSettings.simulationLevels?.lvl1 !== false; // Default to true if undefined
    const lvl2Enabled = levelSettings.simulationLevels?.lvl2 === true;
    const lvl3Enabled = levelSettings.simulationLevels?.lvl3 === true;

    // Check if practice is enabled for each level - use enablePractice setting
    const lvl1PracticeEnabled = levelSettings.enablePractice?.lvl1 === true;
    const lvl2PracticeEnabled = levelSettings.enablePractice?.lvl2 === true;
    const lvl3PracticeEnabled = levelSettings.enablePractice?.lvl3 === true;

    // Create slidesData array from visualImages context with enhanced script data handling
    const slidesData =
      isAnyVisualType && visualImages.length > 0
        ? visualImages.map((img) => {
            // Extract sequence properly for API format while ensuring latest script data is used
            const sequence = Array.isArray(img.sequence)
              ? img.sequence.map((item) => {
                  if (item.type === "hotspot" && item.content) {
                    const hotspot = item.content;
                    return {
                      type: "hotspot",
                      id: hotspot.id,
                      name: hotspot.name,
                      hotspotType: hotspot.hotspotType,
                      coordinates: hotspot.coordinates,
                      settings: hotspot.settings || {},
                      options: hotspot.options || [],
                    };
                  } else if (item.type === "message" && item.content) {
                    const message = item.content;
                    // Check if this message exists in the latest script data
                    // and use the latest content if available
                    const latestMessage = scriptDataMap.get(message.id);
                    return {
                      type: "message",
                      id: message.id,
                      role: latestMessage?.role || message.role,
                      text: latestMessage?.message || message.text,
                    };
                  }
                  return item;
                })
              : [];
            const masking = Array.isArray(img.masking) ? img.masking : [];

            // Return formatted slide data
            return {
              imageId: img.id,
              imageName: img.name,
              imageUrl: img.url.startsWith("blob:") ? "" : img.url,
              sequence,
              masking,
            };
          })
        : [];

    // Process metric weightage values
    const metricWeightage = scoringConfig.metricWeightage || {};

    // Log what we're sending for debugging
    console.log(`Preparing ${status} submission with:`);
    console.log(`- Script items: ${transformedScript.length}`);
    console.log(`- Visual slides: ${slidesData.length}`);
    console.log(
      `- Assigned message IDs: ${Array.from(assignedScriptMessageIds).join(", ")}`,
    );
    console.log(`- Metric weightage:`, metricWeightage);
    console.log(`- Objectives enabled: ${objectivesSettings.enabled}`);
    console.log(`- Quick tips enabled: ${tipsSettings.enabled}`);

    // Create the payload with all the data
    const payload = {
      user_id: user?.id || "private_user",
      sim_name: simulationData?.name,
      division_id: simulationData?.division,
      department_id: simulationData?.department,
      sim_type: simulationData?.simulationType.toLowerCase(),
      tags: simulationData?.tags,
      status: status,
      lvl1: {
        is_enabled: lvl1Enabled,
        enable_practice: lvl1PracticeEnabled,
        hide_agent_script: levelSettings.hideAgentScript?.lvl1 === true,
        hide_customer_script: levelSettings.hideCustomerScript?.lvl1 === true,
        hide_keyword_scores: levelSettings.hideKeywordScores?.lvl1 === true,
        hide_sentiment_scores: levelSettings.hideSentimentScores?.lvl1 === true,
        hide_highlights: levelSettings.hideHighlights?.lvl1 === true,
        hide_coaching_tips: levelSettings.hideCoachingTips?.lvl1 === true,
        enable_post_simulation_survey:
          levelSettings.enablePostSurvey?.lvl1 === true,
        ai_powered_pauses_and_feedback:
          levelSettings.aiPoweredPauses?.lvl1 === true,
      },
      lvl2: {
        is_enabled: lvl2Enabled,
        enable_practice: lvl2PracticeEnabled,
        hide_agent_script: levelSettings.hideAgentScript?.lvl2 === true,
        hide_customer_script: levelSettings.hideCustomerScript?.lvl2 === true,
        hide_keyword_scores: levelSettings.hideKeywordScores?.lvl2 === true,
        hide_sentiment_scores: levelSettings.hideSentimentScores?.lvl2 === true,
        hide_highlights: levelSettings.hideHighlights?.lvl2 === true,
        hide_coaching_tips: levelSettings.hideCoachingTips?.lvl2 === true,
        enable_post_simulation_survey:
          levelSettings.enablePostSurvey?.lvl2 === true,
        ai_powered_pauses_and_feedback:
          levelSettings.aiPoweredPauses?.lvl2 === true,
      },
      lvl3: {
        is_enabled: lvl3Enabled,
        enable_practice: lvl3PracticeEnabled,
        hide_agent_script: levelSettings.hideAgentScript?.lvl3 === true,
        hide_customer_script: levelSettings.hideCustomerScript?.lvl3 === true,
        hide_keyword_scores: levelSettings.hideKeywordScores?.lvl3 === true,
        hide_sentiment_scores: levelSettings.hideSentimentScores?.lvl3 === true,
        hide_highlights: levelSettings.hideHighlights?.lvl3 === true,
        hide_coaching_tips: levelSettings.hideCoachingTips?.lvl3 === true,
        enable_post_simulation_survey:
          levelSettings.enablePostSurvey?.lvl3 === true,
        ai_powered_pauses_and_feedback:
          levelSettings.aiPoweredPauses?.lvl3 === true,
      },
      estimated_time_to_attempt_in_mins:
        timeSettings.enabled && timeValue !== "" ? parseInt(timeValue) : 0,
      // CRITICAL FIX: Only send objectives if enabled, otherwise send empty array
      key_objectives: objectivesSettings.enabled
        ? processTextToArray(objectivesSettings.text)
        : [],
      overview_video: "https://example.com/overview.mp4",
      // CRITICAL FIX: Only send quick tips if enabled, otherwise send empty array
      quick_tips: tipsSettings.enabled
        ? processTextToArray(tipsSettings.text)
        : [],
      voice_id: showVoiceSettings
        ? voiceConfig.voiceId || DEFAULT_VOICE_ID
        : "",
      language: voiceConfig.language || "English",
      mood: "Neutral",
      voice_speed: "Normal",
      prompt: showPromptSettings ? editedPrompt : "",
      simulation_completion_repetition: parseInt(
        scoringConfig.repetitionsNeeded || "3",
      ),
      simulation_max_repetition: parseInt(
        scoringConfig.repetitionsAllowed || "5",
      ),
      final_simulation_score_criteria:
        scoringConfig.simulationScore === "best"
          ? "best"
          : scoringConfig.simulationScore === "last"
            ? "last"
            : "average",
      simulation_scoring_metrics: {
        is_enabled: scoringConfig.scoringMetrics?.enabled === true,
        keyword_score: parseInt(
          (scoringConfig.keywordScore || (hasScript ? "20" : "0")).replace(
            "%",
            "",
          ),
        ),
        click_score: parseInt(
          (scoringConfig.clickScore || (hasScript ? "80" : "100")).replace(
            "%",
            "",
          ),
        ),
        points_per_keyword: parseInt(scoringConfig.pointsPerKeyword || "1"),
        points_per_click: parseInt(scoringConfig.pointsPerClick || "1"),
      },
      metric_weightage: {
        click_accuracy: parsePercentage(metricWeightage.clickAccuracy),
        keyword_accuracy: parsePercentage(metricWeightage.keywordAccuracy),
        data_entry_accuracy: parsePercentage(metricWeightage.dataEntryAccuracy),
        contextual_accuracy: parsePercentage(
          metricWeightage.contextualAccuracy,
        ),
        sentiment_measures: parsePercentage(metricWeightage.sentimentMeasures),
      },
      sim_practice: {
        is_unlimited: scoringConfig.practiceMode === "unlimited",
        pre_requisite_limit:
          scoringConfig.practiceMode === "limited"
            ? parseInt(scoringConfig.practiceLimit || "3")
            : undefined,
      },
      minimum_passing_score: parseInt(
        scoringConfig.minimumPassingScore || "60",
      ),
      is_locked: false,
      version: 1,
      script: transformedScript,
      slidesData: isAnyVisualType ? slidesData : undefined,
    };

    console.log("Final payload objectives:", payload.key_objectives);
    console.log("Final payload quick_tips:", payload.quick_tips);
    console.log("Created payload with latest script and visual data:", payload);
    return payload;
  };

  // Now the handlePublish needs to be updated to handle visual data differently
  const handlePublish = async () => {
    if (!simulationId || !simulationData) {
      setError("Missing simulation ID or data");
      return;
    }

    // Run validation before proceeding
    if (!validateSettings()) {
      return; // Don't proceed if validation fails
    }

    setIsPublishing(true);
    setError(null);
    setValidationError(null);

    try {
      // Get the base payload
      const payload = createSimulationPayload("published");
      console.log("Publishing with settings:", payload);

      // Check if we have visual data that requires FormData submission
      if (
        isAnyVisualType &&
        visualImages.length > 0 &&
        visualImages.some((img) => img.file)
      ) {
        // We have files to upload, need to use FormData
        const formData = new FormData();

        // Add the slides data as JSON
        formData.append("slidesData", JSON.stringify(payload.slidesData));

        // Add all the other payload properties
        Object.entries(payload).forEach(([key, value]) => {
          if (key !== "slidesData" && value !== undefined) {
            if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Add file objects to FormData
        visualImages.forEach((image) => {
          if (image.file) {
            formData.append(`slide_${image.id}`, image.file, image.name);
          }
        });

        // Use a different function for form data submission
        const response = await publishSimulationWithFormData(
          simulationId,
          formData,
        );
        handlePublishResponse(response);
      } else {
        // Regular JSON submission without files
        const response = await publishSimulation(simulationId, payload);
        handlePublishResponse(response);
      }
    } catch (error: any) {
      console.error("Error publishing simulation:", error);
      setError(
        `Error publishing simulation: ${error.message || "Unknown error"}`,
      );
    } finally {
      setIsPublishing(false);
    }
  };

  // Helper function to handle the publish response
  const handlePublishResponse = (response: any) => {
    console.log("Publish response:", response);
    if (response) {
      if (response.status === "success" || response.status === "published") {
        setPublishedSimId(simulationId);
        setShowPreview(true);
        if (onPublish) {
          onPublish();
        }
      } else {
        setError("Failed to publish simulation. Please try again.");
      }
    }
  };

  // Similarly update the handleSaveAsDraft function
  const handleSaveAsDraft = async () => {
    if (!simulationId || !simulationData) {
      setError("Missing simulation ID or data");
      return;
    }

    setIsSavingDraft(true);
    setError(null);

    try {
      // Get the base payload
      const payload = createSimulationPayload("draft");
      console.log("Saving as draft with settings:", payload);

      // Check if we have visual data that requires FormData submission
      if (
        isAnyVisualType &&
        visualImages.length > 0 &&
        visualImages.some((img) => img.file)
      ) {
        // We have files to upload, need to use FormData
        const formData = new FormData();

        // Add the slides data as JSON
        formData.append("slidesData", JSON.stringify(payload.slidesData));

        // Add all the other payload properties
        Object.entries(payload).forEach(([key, value]) => {
          if (key !== "slidesData" && value !== undefined) {
            if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Add file objects to FormData
        visualImages.forEach((image) => {
          if (image.file) {
            formData.append(`slide_${image.id}`, image.file, image.name);
          }
        });

        // Use updateSimulationWithFormData for form data submission
        const response = await updateSimulationWithFormData(
          simulationId,
          formData,
        );
        handleSaveAsDraftResponse(response);
      } else {
        // Regular JSON submission without files
        const response = await updateSimulation(simulationId, payload);
        handleSaveAsDraftResponse(response);
      }
    } catch (error: any) {
      console.error("Error saving simulation as draft:", error);
      setError(`Error saving as draft: ${error.message || "Unknown error"}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Helper function to handle the save as draft response
  const handleSaveAsDraftResponse = (response: any) => {
    console.log("Save as draft response:", response);
    if (response) {
      if (response.status === "success" || response.status === "draft") {
        // Navigate to manage-simulations instead of showing preview
        navigate(
          buildPathWithWorkspace(
            "/manage-simulations",
            currentWorkspaceId,
            currentTimeZone,
          ),
        );
      } else {
        setError("Failed to save simulation as draft. Please try again.");
      }
    }
  };

  // Handle back from preview while keeping settings
  const handleBackFromPreview = () => {
    setShowPreview(false);
  };

  // Loading screen component
  const LoadingScreen = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        width: "100%",
      }}
    >
      <CircularProgress size={60} sx={{ mb: 4, color: "#444CE7" }} />
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        {isPublishing
          ? "Creating Your Simulation"
          : isSavingDraft
            ? "Saving Your Draft"
            : "Loading Settings"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {isPublishing
          ? "Please wait while we process your simulation..."
          : isSavingDraft
            ? "Please wait while we save your draft..."
            : "Please wait while we load your simulation settings..."}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This may take a few moments
      </Typography>
    </Box>
  );

  if (showPreview && publishedSimId) {
    return (
      <>
        <Button
          onClick={handleBackFromPreview}
          sx={{ m: 2 }}
          variant="outlined"
        >
          ← Back to Settings
        </Button>
        <PreviewTab
          simulationId={publishedSimId}
          simulationType={
            simulationType as
              | "audio"
              | "chat"
              | "visual-audio"
              | "visual-chat"
              | "visual"
          }
        />
      </>
    );
  }

  // FIXED: Don't render until we have either API data or stored settings
  if (!settingsState) {
    return <LoadingScreen />;
  }

  // If we're loading, publishing, or saving draft, show the loading screen
  if (isLoading || isPublishing || isSavingDraft) {
    return <LoadingScreen />;
  }

  // Build navigation items based on simulation type
  const getNavigationItems = () => {
    // Core items for all simulation types
    const coreItems = [
      "Enable Practice",
      "Enable Post Simulations Survey",
      "AI Powered Pauses and Feedback",
      "Estimated Time to Attempt",
      "Key Objectives",
      "Quick Tips",
      "Overview Video",
    ];

    // Items specific to visual types (visual-audio, visual-chat, visual)
    if (isAnyVisualType) {
      coreItems.splice(3, 0, "Hide Highlights");
      coreItems.splice(4, 0, "Hide Coaching Tips");
    }

    // Items specific to types with script (audio, chat, visual-audio, visual-chat)
    if (hasScript) {
      coreItems.splice(1, 0, "Hide Agent Script");
      coreItems.splice(2, 0, "Hide Customer Script");
      coreItems.splice(3, 0, "Hide Keyword Scores");
      coreItems.splice(4, 0, "Hide Sentiment Scores");
    }

    return coreItems;
  };

  // Voice items - only for audio and visual-audio
  const voiceItems = showVoiceSettings ? ["AI Customer Voice"] : [];

  // Prompt items - only for audio and chat
  const promptItems = showPromptSettings ? ["Conversation Prompt"] : [];

  // Score items are the same for all types
  const scoreItems = [
    "Simulation Completion",
    "Number of Repetition Allowed",
    "Simulation Scoring Metrics",
    "Score Metric Weightage",
    "Sym Practice",
    "Minimum Passing Score",
  ];

  return (
    <Box
      sx={{
        bgcolor: "#F9FAFB",
        py: 0,
        px: 0,
        height: "100vh",
      }}
    >
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {validationError && (
        <Alert
          severity="warning"
          onClose={() => setValidationError(null)}
          sx={{ mb: 2 }}
        >
          {validationError}
        </Alert>
      )}

      <Stack spacing={1}>
        {/* Header Section */}
        <Card
          elevation={2}
          sx={{
            px: 4,
            py: 3,
            bgcolor: "#FFFFFF",
            borderRadius: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="h5">Settings</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your {isAnyVisualType ? "hotspot, " : ""}
              {hasScript ? "voice, " : ""}score, and simulation settings
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={handleSaveAsDraft}
              disabled={isSavingDraft || !simulationId}
              sx={{
                borderColor: "#444CE7",
                color: "#444CE7",
                borderRadius: 2,
                px: 3,
                "&:hover": {
                  borderColor: "#3538CD",
                  backgroundColor: "rgba(68, 76, 231, 0.04)",
                },
              }}
            >
              {isSavingDraft ? (
                <CircularProgress size={24} sx={{ color: "#444CE7" }} />
              ) : (
                "Save as Draft"
              )}
            </Button>
            <Tooltip
              title={
                isPublishDisabled
                  ? "At least one level must be enabled, estimated time must be specified when enabled, and score metric weightage must total 100% before publishing"
                  : ""
              }
              arrow
              placement="top"
            >
              <span>
                <Button
                  variant="contained"
                  onClick={handlePublish}
                  disabled={isPublishDisabled}
                  sx={{
                    bgcolor: "#444CE7",
                    "&:hover": { bgcolor: "#3538CD" },
                    borderRadius: 2,
                    px: 4,
                  }}
                >
                  {isPublishing ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Publish"
                  )}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Card>

        {/* Content Section */}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            flexDirection: "row-reverse",
            gap: 4,
            minHeight: "calc(100vh - 80px)",
          }}
        >
          {/* Sidebar */}
          <Card
            elevation={2}
            sx={{
              width: 320,
              height: 660,
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              py: 1,
              px: 2,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
            }}
          >
            <Stack spacing={3}>
              {/* Advanced Settings Navigation */}
              <Stack spacing={1}>
                <Typography
                  variant="h5"
                  fontWeight="500"
                  sx={{ color: "#666666" }}
                >
                  Advance Settings
                </Typography>

                <List disablePadding>
                  {getNavigationItems().map((item) => (
                    <NavItem
                      key={item}
                      button
                      className={item === activeSection ? "active" : ""}
                      sx={{
                        textAlign: "left",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        ...(item === activeSection && {
                          border: "1px solid #0037ff",
                          color: "#0037ff",
                          backgroundColor: "transparent",
                        }),
                      }}
                      onClick={() => setActiveSection(item)}
                    >
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: item === activeSection ? 600 : 400,
                        }}
                      />
                    </NavItem>
                  ))}
                </List>
              </Stack>

              {/* Voice & Prompt Settings Navigation - Only for types with script */}
              {(showVoiceSettings || showPromptSettings) && (
                <Stack spacing={2}>
                  <Typography
                    variant="h5"
                    fontWeight="500"
                    sx={{ color: "#666666" }}
                  >
                    Voice & Prompt Settings
                  </Typography>
                  <List disablePadding>
                    {/* Show voice items only for audio and visual-audio */}
                    {voiceItems.map((item) => (
                      <NavItem
                        key={item}
                        button
                        className={item === activeSection ? "active" : ""}
                        sx={{
                          textAlign: "left",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          ...(item === activeSection && {
                            border: "1px solid #0037ff",
                            color: "#0037ff",
                            backgroundColor: "transparent",
                          }),
                        }}
                        onClick={() => setActiveSection(item)}
                      >
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: item === activeSection ? 600 : 400,
                          }}
                        />
                      </NavItem>
                    ))}

                    {/* Show prompt items only for audio and chat */}
                    {promptItems.map((item) => (
                      <NavItem
                        key={item}
                        button
                        className={item === activeSection ? "active" : ""}
                        sx={{
                          textAlign: "left",
                          padding: "8px 16px",
                          borderRadius: "20px",
                          ...(item === activeSection && {
                            border: "1px solid #0037ff",
                            color: "#0037ff",
                            backgroundColor: "transparent",
                          }),
                        }}
                        onClick={() => setActiveSection(item)}
                      >
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{
                            variant: "body2",
                            fontWeight: item === activeSection ? 600 : 400,
                          }}
                        />
                      </NavItem>
                    ))}
                  </List>
                </Stack>
              )}

              {/* Score Settings Navigation */}
              <Stack spacing={2}>
                <Typography
                  variant="h5"
                  fontWeight="500"
                  sx={{ color: "#666666" }}
                >
                  Score Settings
                </Typography>
                <List disablePadding>
                  {scoreItems.map((item) => (
                    <NavItem
                      key={item}
                      button
                      className={item === activeSection ? "active" : ""}
                      sx={{
                        textAlign: "left",
                        padding: "8px 16px",
                        borderRadius: "20px",
                        ...(item === activeSection && {
                          border: "1px solid #0037ff",
                          color: "#0037ff",
                          backgroundColor: "transparent",
                        }),
                      }}
                      onClick={() => setActiveSection(item)}
                    >
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{
                          variant: "body2",
                          fontWeight: item === activeSection ? 600 : 400,
                        }}
                      />
                    </NavItem>
                  ))}
                </List>
              </Stack>
            </Stack>
          </Card>

          {/* Main Content */}
          <Box
            ref={mainContentRef}
            sx={{
              flex: 1,
              px: 4,
              height: 660,
              overflowY: "auto",
              "&::-webkit-scrollbar": {
                display: "none",
              },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
            }}
          >
            <Typography variant="h6" sx={{ mt: 2, mb: 4, color: "#666666" }}>
              {isVisualAudioOrChat
                ? simulationType === "visual-audio"
                  ? "Visual-Audio Simulation Settings"
                  : "Visual-Chat Simulation Settings"
                : isVisualOnly
                  ? "Visual Simulation Settings"
                  : simulationType === "audio"
                    ? "Audio Simulation Settings"
                    : "Chat Simulation Settings"}
            </Typography>

            <AdvancedSettings
              settings={settingsState.advancedSettings}
              onSettingsChange={handleAdvancedSettingsChange}
              simulationType={simulationType}
              activeSection={activeSection}
            />

            {/* Voice and Score settings with the prompt handler */}
            <VoiceAndScoreSettings
              prompt={editedPrompt} // Use the edited prompt
              settings={settingsState.voiceSettings}
              onSettingsChange={handleVoiceSettingsChange}
              onPromptChange={handlePromptChange} // Pass the prompt change handler
              activeSection={activeSection}
              showVoiceSettings={showVoiceSettings}
              showPromptSettings={showPromptSettings}
              simulationType={simulationType} // Pass simulation type to control conditional rendering
              onWeightageValidationChange={handleWeightageValidationChange} // Add this prop
              enabledLevels={
                settingsState.advancedSettings?.levels?.simulationLevels
              } // Pass enabled levels
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingTab;
