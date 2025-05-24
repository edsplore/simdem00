import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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

const DEFAULT_AUDIO_VOICE_ID = "11labs-Adrian";
const DEFAULT_VISUAL_AUDIO_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

const getDefaultVoiceId = (simType?: string) =>
  simType === "visual-audio"
    ? DEFAULT_VISUAL_AUDIO_VOICE_ID
    : DEFAULT_AUDIO_VOICE_ID;

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
    mood?: string;
    voiceSpeed?: string;
  };
  levels?: {
    [key: string]: any;
  };
  scoring?: {
    simulationScore?: "best" | "last" | "average";
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
    url?: string;
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
  // Get context data
  const {
    scriptData,
    visualImages,
    setIsScriptLocked,
    assignedScriptMessageIds,
    settings: contextSettings,
    setSettings: setContextSettings,
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
  const [isWeightageValid, setIsWeightageValid] = useState(true);
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  // Track if we've initialized from API data
  const hasInitializedFromAPI = useRef(false);

  // Reset initialization flag on unmount
  useEffect(() => {
    return () => {
      hasInitializedFromAPI.current = false;
    };
  }, []);

  // Check simulation type categories
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  const isVisualOnly = simulationType === "visual";
  const isAnyVisualType = isVisualAudioOrChat || isVisualOnly;
  const hasScript = simulationType !== "visual";

  // New checks for voice and prompt visibility
  const showVoiceSettings =
    simulationType === "audio" || simulationType === "visual-audio";
  const showPromptSettings =
    simulationType === "audio" || simulationType === "chat";

  // Debug helper function
  const debugSettingsMapping = (apiData: any, mappedSettings: any) => {
    console.group("Settings Mapping Debug");

    // Check level mappings
    console.log("=== LEVEL MAPPINGS ===");
    console.log("API lvl1:", apiData.levels?.lvl1);
    console.log(
      "Mapped lvl1:",
      mappedSettings.levels?.simulationLevels?.lvl1,
      mappedSettings.levels?.enablePractice?.lvl1,
    );

    console.log("API lvl2:", apiData.levels?.lvl2);
    console.log(
      "Mapped lvl2:",
      mappedSettings.levels?.simulationLevels?.lvl2,
      mappedSettings.levels?.enablePractice?.lvl2,
    );

    console.log("API lvl3:", apiData.levels?.lvl3);
    console.log(
      "Mapped lvl3:",
      mappedSettings.levels?.simulationLevels?.lvl3,
      mappedSettings.levels?.enablePractice?.lvl3,
    );

    // Check time mapping
    console.log("\n=== TIME MAPPING ===");
    console.log(
      "API estimated_time_to_attempt_in_mins:",
      apiData.estimated_time_to_attempt_in_mins,
    );
    console.log("API est_time:", apiData.est_time);
    console.log("Mapped estimatedTime:", mappedSettings.estimatedTime);

    // Check objectives and tips
    console.log("\n=== OBJECTIVES & TIPS ===");
    console.log("API key_objectives:", apiData.key_objectives);
    console.log("Mapped objectives:", mappedSettings.objectives);
    console.log("API quick_tips:", apiData.quick_tips);
    console.log("Mapped quickTips:", mappedSettings.quickTips);

    // Check voice settings
    console.log("\n=== VOICE SETTINGS ===");
    console.log("API voice_id:", apiData.voice_id);
    console.log("API language:", apiData.language);
    console.log("API mood:", apiData.mood);
    console.log("API voice_speed:", apiData.voice_speed);
    console.log("Mapped voice:", mappedSettings.voice);

    // Check scoring settings
    console.log("\n=== SCORING SETTINGS ===");
    console.log(
      "API simulation_completion_repetition:",
      apiData.simulation_completion_repetition,
    );
    console.log(
      "API simulation_max_repetition:",
      apiData.simulation_max_repetition,
    );
    console.log(
      "API final_simulation_score_criteria:",
      apiData.final_simulation_score_criteria,
    );
    console.log("API minimum_passing_score:", apiData.minimum_passing_score);
    console.log(
      "Mapped scoring.repetitionsNeeded:",
      mappedSettings.scoring?.repetitionsNeeded,
    );
    console.log(
      "Mapped scoring.repetitionsAllowed:",
      mappedSettings.scoring?.repetitionsAllowed,
    );
    console.log(
      "Mapped scoring.simulationScore:",
      mappedSettings.scoring?.simulationScore,
    );
    console.log(
      "Mapped scoring.minimumPassingScore:",
      mappedSettings.scoring?.minimumPassingScore,
    );

    // Check scoring metrics
    console.log("\n=== SCORING METRICS ===");
    console.log(
      "API simulation_scoring_metrics:",
      apiData.simulation_scoring_metrics,
    );
    console.log(
      "Mapped scoringMetrics:",
      mappedSettings.scoring?.scoringMetrics,
    );

    // Check metric weightage
    console.log("\n=== METRIC WEIGHTAGE ===");
    console.log("API metric_weightage:", apiData.metric_weightage);
    console.log(
      "Mapped metricWeightage:",
      mappedSettings.scoring?.metricWeightage,
    );

    // Check practice settings
    console.log("\n=== PRACTICE SETTINGS ===");
    console.log("API sim_practice:", apiData.sim_practice);
    console.log("Mapped practiceMode:", mappedSettings.scoring?.practiceMode);
    console.log("Mapped practiceLimit:", mappedSettings.scoring?.practiceLimit);

    console.groupEnd();
  };

  // Helper function to create settings from API data or defaults
  const createSettingsFromData = useCallback(
    (simData?: any) => {
      // Use passed data or fallback to simulationData
      const data = simData || simulationData;

      if (!data) {
        console.log("No simulation data available, returning defaults");
        // Return defaults if no data
        return {
          simulationType: simulationType || "audio",
          levels: {
            simulationLevels: { lvl1: true, lvl2: false, lvl3: false },
            enablePractice: { lvl1: false, lvl2: false, lvl3: false },
            hideAgentScript: { lvl1: false, lvl2: false, lvl3: false },
            hideCustomerScript: { lvl1: false, lvl2: false, lvl3: false },
            hideKeywordScores: { lvl1: false, lvl2: false, lvl3: false },
            hideSentimentScores: { lvl1: true, lvl2: true, lvl3: false },
            hideHighlights: { lvl1: false, lvl2: false, lvl3: false },
            hideCoachingTips: { lvl1: true, lvl2: true, lvl3: false },
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
            text: "Listen to the customer carefully\nBe polite and empathetic",
          },
          overviewVideo: { enabled: false },
          voice: {
            language: "English",
            accent: "American",
            gender: "Male",
            ageGroup: "Middle Aged",
            voiceId: getDefaultVoiceId(simulationType),
            mood: "Neutral",
            voiceSpeed: "Normal",
          },
          scoring: {
            simulationScore: "best",
            pointsPerKeyword: "1",
            pointsPerClick: "1",
            practiceMode: "limited",
            practiceLimit: "3",
            repetitionsAllowed: "3",
            repetitionsNeeded: "1",
            minimumPassingScore: "60",
            scoringMetrics: {
              enabled: true,
              keywordScore: hasScript ? "20%" : "0%",
              clickScore: hasScript ? "80%" : "100%",
            },
            metricWeightage: {
              clickAccuracy: isAnyVisualType ? "30%" : "0%",
              keywordAccuracy: hasScript ? "30%" : "0%",
              dataEntryAccuracy: isAnyVisualType ? "20%" : "0%",
              contextualAccuracy: "0%",
              sentimentMeasures: "0%",
            },
          },
        };
      }

      console.log("Creating settings from API data");

      // Convert API data to internal format
      const levels = data.levels || {};
      const lvl1 = levels.lvl1 || {};
      const lvl2 = levels.lvl2 || {};
      const lvl3 = levels.lvl3 || {};

      const convertedLevels = {
        simulationLevels: {
          lvl1: lvl1.isEnabled !== false,
          lvl2: lvl2.isEnabled === true,
          lvl3: lvl3.isEnabled === true,
        },
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

      // Parse estimated time - handle both string and number
      const estimatedTimeValue =
        typeof data.estimated_time_to_attempt_in_mins === "string"
          ? parseInt(data.estimated_time_to_attempt_in_mins)
          : data.estimated_time_to_attempt_in_mins;

      const estimatedTime = {
        enabled: !!(estimatedTimeValue && estimatedTimeValue > 0),
        value: estimatedTimeValue
          ? `${estimatedTimeValue} mins`
          : data.est_time || "",
      };

      // Parse objectives
      const keyObjectives = data.key_objectives || [];
      const objectives = {
        enabled: keyObjectives.length > 0,
        text:
          keyObjectives.length > 0
            ? keyObjectives.join("\n")
            : "Learn basic customer service\nUnderstand refund process",
      };

      // Parse quick tips
      const quickTipsArray = data.quick_tips || [];
      const quickTips = {
        enabled: quickTipsArray.length > 0,
        text:
          quickTipsArray.length > 0
            ? quickTipsArray.join("\n")
            : "Listen to the customer carefully\nBe polite and empathetic",
      };

      // Parse overview video
      const overviewVideo = {
        enabled: !!(data.overviewVideo || data.overview_video),
        url: data.overview_video || data.overviewVideo || "",
      };

      // Parse voice settings - with proper defaults for null values
      const voice = {
        language: data.language || "English",
        accent: "American", // Not in API, using default
        gender: "Male", // Not in API, using default
        ageGroup: "Middle Aged", // Not in API, using default
        voiceId: data.voice_id || getDefaultVoiceId(simulationType),
        mood: data.mood || "Neutral",
        voiceSpeed: data.voice_speed || "Normal",
      };

      // Parse scoring settings
      const metricWeightage = data.metric_weightage || {};
      const scoringMetrics = data.simulation_scoring_metrics || {};
      const simPractice = data.sim_practice || {};

      const scoring = {
        simulationScore:
          data.final_simulation_score_criteria === "last"
            ? "last"
            : data.final_simulation_score_criteria === "average"
              ? "average"
              : "best",
        pointsPerKeyword: String(scoringMetrics.points_per_keyword ?? 1),
        pointsPerClick: String(scoringMetrics.points_per_click ?? 1),
        practiceMode: simPractice.is_unlimited ? "unlimited" : "limited",
        practiceLimit: String(simPractice.pre_requisite_limit ?? 3),
        repetitionsAllowed: String(data.simulation_max_repetition ?? 3),
        repetitionsNeeded: String(data.simulation_completion_repetition ?? 1),
        minimumPassingScore: String(data.minimum_passing_score ?? 60),
        scoringMetrics: {
          enabled: scoringMetrics.is_enabled !== false,
          keywordScore: `${scoringMetrics.keyword_score ?? (hasScript ? 20 : 0)}%`,
          clickScore: `${scoringMetrics.click_score ?? (hasScript ? 80 : 100)}%`,
        },
        metricWeightage: {
          clickAccuracy: `${metricWeightage.click_accuracy ?? (isAnyVisualType ? 30 : 0)}%`,
          keywordAccuracy: `${metricWeightage.keyword_accuracy ?? (hasScript ? 30 : 0)}%`,
          dataEntryAccuracy: `${metricWeightage.data_entry_accuracy ?? (isAnyVisualType ? 20 : 0)}%`,
          contextualAccuracy: `${metricWeightage.contextual_accuracy ?? 0}%`,
          sentimentMeasures: `${metricWeightage.sentiment_measures ?? 0}%`,
        },
      };

      const finalSettings = {
        simulationType: data.simulationType || simulationType || "audio",
        levels: convertedLevels,
        estimatedTime,
        objectives,
        quickTips,
        overviewVideo,
        voice,
        scoring,
      };

      console.log("Created settings from API:", finalSettings);
      return finalSettings;
    },
    [simulationType, hasScript, isAnyVisualType],
  ); // Remove simulationData from dependencies

  // Initialize settings from API data ONCE when simulationData arrives
  useEffect(() => {
    // Only initialize from API if context is empty and we haven't initialized yet
    if (
      simulationData &&
      !hasInitializedFromAPI.current &&
      Object.keys(contextSettings).length === 0
    ) {
      console.log("Initializing settings from API data for the first time");
      const apiSettings = createSettingsFromData(simulationData);

      // Debug the mapping
      debugSettingsMapping(simulationData, apiSettings);

      setContextSettings(apiSettings);
      hasInitializedFromAPI.current = true;
      console.log("Context settings have been initialized from API");
    } else if (
      simulationData &&
      Object.keys(contextSettings).length > 0 &&
      !hasInitializedFromAPI.current
    ) {
      // Context already has settings, don't overwrite them
      console.log("Context already has settings, preserving existing values");
      hasInitializedFromAPI.current = true;
    }
  }, [simulationData, createSettingsFromData, setContextSettings]); // Remove contextSettings from dependencies

  // Update edited prompt when prop changes
  useEffect(() => {
    if (prompt) {
      setEditedPrompt(prompt);
    }
  }, [prompt]);

  // Memoized update handlers to prevent re-creation
  const handleAdvancedSettingsChange = useCallback(
    (newSettings: SimulationSettings) => {
      setContextSettings(newSettings);
    },
    [setContextSettings],
  );

  const handleVoiceSettingsChange = useCallback(
    (newSettings: SimulationSettings) => {
      setContextSettings(newSettings);
    },
    [setContextSettings],
  );

  const handlePromptChange = useCallback((newPrompt: string) => {
    setEditedPrompt(newPrompt);
  }, []);

  const handleWeightageValidationChange = useCallback((isValid: boolean) => {
    setIsWeightageValid(isValid);
  }, []);

  // Validate settings before publishing
  const validateSettings = () => {
    const levels = contextSettings?.levels?.simulationLevels;
    const isAnyLevelEnabled = levels?.lvl1 || levels?.lvl2 || levels?.lvl3;

    const estimatedTime = contextSettings?.estimatedTime;
    const isEstimatedTimeValid =
      !estimatedTime?.enabled ||
      (estimatedTime.enabled &&
        estimatedTime.value &&
        estimatedTime.value.trim() !== "");

    let errorMessage = null;

    if (!isAnyLevelEnabled && !isEstimatedTimeValid && !isWeightageValid) {
      errorMessage =
        "At least one level must be enabled, estimated time must be specified when enabled, and score metric weightage must total 100% before publishing.";
    } else if (!isAnyLevelEnabled && !isEstimatedTimeValid) {
      errorMessage =
        "At least one level must be enabled and estimated time must be specified when enabled before publishing.";
    } else if (!isAnyLevelEnabled && !isWeightageValid) {
      errorMessage =
        "At least one level must be enabled and score metric weightage must total 100% before publishing.";
    } else if (!isEstimatedTimeValid && !isWeightageValid) {
      errorMessage =
        "Estimated time must be specified when enabled and score metric weightage must total 100% before publishing.";
    } else if (!isAnyLevelEnabled) {
      errorMessage = "At least one level must be enabled before publishing.";
    } else if (!isEstimatedTimeValid) {
      errorMessage =
        "Estimated time must be specified when enabled before publishing.";
    } else if (!isWeightageValid) {
      errorMessage =
        "Score metric weightage must total 100% before publishing.";
    }

    setValidationError(errorMessage);
    return errorMessage === null;
  };

  // Check if publish button should be disabled
  const isPublishDisabled = useMemo(() => {
    if (isPublishing || !simulationId) return true;

    const levels = contextSettings?.levels?.simulationLevels;
    const isAnyLevelEnabled = levels?.lvl1 || levels?.lvl2 || levels?.lvl3;

    const estimatedTime = contextSettings?.estimatedTime;
    const isEstimatedTimeValid =
      !estimatedTime?.enabled ||
      (estimatedTime.enabled &&
        estimatedTime.value &&
        estimatedTime.value.trim() !== "");

    return !isAnyLevelEnabled || !isEstimatedTimeValid || !isWeightageValid;
  }, [
    isPublishing,
    simulationId,
    contextSettings?.levels?.simulationLevels,
    contextSettings?.estimatedTime,
    isWeightageValid,
  ]);

  // Scroll to section when clicked
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

  useEffect(() => {
    scrollToSection(activeSection);
  }, [activeSection]);

  // Helper functions
  const processTextToArray = (text: string) => {
    if (!text) return [];
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line)
      .map((line) => line.replace(/^\d+[\s:.)-]*\s*/, ""));
  };

  const parsePercentage = (value: string | undefined): number => {
    if (!value) return 0;
    return parseInt(value.replace("%", "")) || 0;
  };

  // Create simulation payload
  const createSimulationPayload = (status: "published" | "draft") => {
    const latestScriptData = scriptData;
    const scriptDataMap = new Map(latestScriptData.map((msg) => [msg.id, msg]));

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

    const levelSettings = contextSettings?.levels || {};
    const timeSettings = contextSettings?.estimatedTime || {
      enabled: false,
      value: "",
    };
    const objectivesSettings = contextSettings?.objectives || {
      enabled: false,
      text: "",
    };
    const tipsSettings = contextSettings?.quickTips || {
      enabled: false,
      text: "",
    };
    const voiceConfig = contextSettings?.voice || {};
    const scoringConfig = contextSettings?.scoring || {};

    const timeValue = String(timeSettings.value || "").match(/\d+/)?.[0] || "";

    const lvl1Enabled = levelSettings.simulationLevels?.lvl1 !== false;
    const lvl2Enabled = levelSettings.simulationLevels?.lvl2 === true;
    const lvl3Enabled = levelSettings.simulationLevels?.lvl3 === true;

    const lvl1PracticeEnabled = levelSettings.enablePractice?.lvl1 === true;
    const lvl2PracticeEnabled = levelSettings.enablePractice?.lvl2 === true;
    const lvl3PracticeEnabled = levelSettings.enablePractice?.lvl3 === true;

    const slidesData =
      isAnyVisualType && visualImages.length > 0
        ? visualImages.map((img) => {
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

            return {
              imageId: img.id,
              imageName: img.name,
              imageUrl: img.url.startsWith("blob:") ? "" : img.url,
              sequence,
              masking,
            };
          })
        : [];

    const metricWeightage = scoringConfig.metricWeightage || {};

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
      key_objectives: objectivesSettings.enabled
        ? processTextToArray(objectivesSettings.text)
        : [],
      overview_video:
        contextSettings?.overviewVideo?.url ||
        "https://example.com/overview.mp4",
      quick_tips: tipsSettings.enabled
        ? processTextToArray(tipsSettings.text)
        : [],
      voice_id: showVoiceSettings
        ? voiceConfig.voiceId || getDefaultVoiceId(simulationType)
        : "",
      language: voiceConfig.language || "English",
      mood: voiceConfig.mood || "Neutral",
      voice_speed: voiceConfig.voiceSpeed || "Normal",
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
          (
            scoringConfig.scoringMetrics?.keywordScore ??
            (hasScript ? "20%" : "0%")
          ).replace("%", ""),
        ),
        click_score: parseInt(
          (
            scoringConfig.scoringMetrics?.clickScore ??
            (hasScript ? "80%" : "100%")
          ).replace("%", ""),
        ),
        points_per_keyword: parseInt(scoringConfig.pointsPerKeyword ?? "1"),
        points_per_click: parseInt(scoringConfig.pointsPerClick ?? "1"),
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

    return payload;
  };

  // Handle publish
  const handlePublish = async () => {
    if (!simulationId || !simulationData) {
      setError("Missing simulation ID or data");
      return;
    }

    if (!validateSettings()) {
      return;
    }

    setIsPublishing(true);
    setError(null);
    setValidationError(null);

    try {
      const payload = createSimulationPayload("published");

      if (
        isAnyVisualType &&
        visualImages.length > 0 &&
        visualImages.some((img) => img.file)
      ) {
        const formData = new FormData();
        formData.append("slidesData", JSON.stringify(payload.slidesData));

        Object.entries(payload).forEach(([key, value]) => {
          if (key !== "slidesData" && value !== undefined) {
            if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        visualImages.forEach((image) => {
          if (image.file) {
            formData.append(`slide_${image.id}`, image.file, image.name);
          }
        });

        const response = await publishSimulationWithFormData(
          simulationId,
          formData,
        );
        handlePublishResponse(response);
      } else {
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

  const handlePublishResponse = (response: any) => {
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

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!simulationId || !simulationData) {
      setError("Missing simulation ID or data");
      return;
    }

    setIsSavingDraft(true);
    setError(null);

    try {
      const payload = createSimulationPayload("draft");

      if (
        isAnyVisualType &&
        visualImages.length > 0 &&
        visualImages.some((img) => img.file)
      ) {
        const formData = new FormData();
        formData.append("slidesData", JSON.stringify(payload.slidesData));

        Object.entries(payload).forEach(([key, value]) => {
          if (key !== "slidesData" && value !== undefined) {
            if (typeof value === "object") {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        visualImages.forEach((image) => {
          if (image.file) {
            formData.append(`slide_${image.id}`, image.file, image.name);
          }
        });

        const response = await updateSimulationWithFormData(
          simulationId,
          formData,
        );
        handleSaveAsDraftResponse(response);
      } else {
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

  const handleSaveAsDraftResponse = (response: any) => {
    if (response) {
      if (response.status === "success" || response.status === "draft") {
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
        {isPublishing ? "Creating Your Simulation" : "Saving Your Draft"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        {isPublishing
          ? "Please wait while we process your simulation..."
          : "Please wait while we save your draft..."}
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

  if (isLoading || isPublishing || isSavingDraft) {
    return <LoadingScreen />;
  }

  // Build navigation items
  const getNavigationItems = () => {
    const coreItems = [
      "Enable Practice",
      "Enable Post Simulations Survey",
      "AI Powered Pauses and Feedback",
      "Estimated Time to Attempt",
      "Key Objectives",
      "Quick Tips",
      "Overview Video",
    ];

    if (isAnyVisualType) {
      coreItems.splice(3, 0, "Hide Highlights");
      coreItems.splice(4, 0, "Hide Coaching Tips");
    }

    if (hasScript) {
      coreItems.splice(1, 0, "Hide Agent Script");
      coreItems.splice(2, 0, "Hide Customer Script");
      coreItems.splice(3, 0, "Hide Keyword Scores");
      coreItems.splice(4, 0, "Hide Sentiment Scores");
    }

    return coreItems;
  };

  const voiceItems = showVoiceSettings ? ["AI Customer Voice"] : [];
  const promptItems = showPromptSettings ? ["Conversation Prompt"] : [];
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

              {/* Voice & Prompt Settings Navigation */}
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

            {/* Only render settings components when settings are loaded */}
            {Object.keys(contextSettings).length > 0 &&
            contextSettings.scoring ? (
              <>
                <AdvancedSettings
                  settings={contextSettings}
                  onSettingsChange={handleAdvancedSettingsChange}
                  simulationType={simulationType}
                  activeSection={activeSection}
                />

                <VoiceAndScoreSettings
                  prompt={editedPrompt}
                  settings={contextSettings}
                  onSettingsChange={handleVoiceSettingsChange}
                  onPromptChange={handlePromptChange}
                  activeSection={activeSection}
                  showVoiceSettings={showVoiceSettings}
                  showPromptSettings={showPromptSettings}
                  simulationType={simulationType}
                  onWeightageValidationChange={handleWeightageValidationChange}
                  enabledLevels={contextSettings?.levels?.simulationLevels}
                />
              </>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <CircularProgress size={30} />
                <Typography sx={{ mt: 2 }}>Loading settings...</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingTab;
