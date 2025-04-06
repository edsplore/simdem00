import { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import axios from "axios";
import AdvancedSettings from "./AdvancedSetting";
import VoiceAndScoreSettings from "./VoiceScoreSetting";
import PreviewTab from "../PreviewTab";

const NavItem = styled(ListItem)(({ theme }) => ({
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#F5F6FF",
  },
}));

const DEFAULT_VOICE_ID = "11labs-Adrian";

interface SettingsTabProps {
  simulationId?: string;
  prompt?: string;
  simulationType?: string;
  simulationData?: {
    name: string;
    division: string;
    department: string;
    tags: string[];
    simulationType: string;
  };
  isLoading?: boolean; // Added isLoading prop
  onPublish?: () => void;
  script?: any[];
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  simulationId,
  prompt = "",
  simulationType = "audio",
  simulationData,
  isLoading = false, // Default to false
  onPublish,
  script,
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [publishedSimId, setPublishedSimId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("Simulation Type");
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Add state to track the edited prompt
  const [editedPrompt, setEditedPrompt] = useState(prompt);

  // Only set initial prompt value on mount, don't reset on prop changes
  useEffect(() => {
    if (prompt) {
      setEditedPrompt(prompt);
    }
  }, []); // Empty dependency array - only runs once on mount

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

  // Add state to track all settings
  const [settingsState, setSettingsState] = useState(() => {
    const storedSettings = loadSettingsFromStorage();
    if (storedSettings) return storedSettings;

    return {
      advancedSettings: {
        simulationType: simulationType || "audio",
        levels: {
          // This is the top-level setting that controls which levels are enabled
          simulationLevels: { lvl1: true, lvl2: false, lvl3: false },
          // Setting for enabling practice mode - separate from simulationLevels
          enablePractice: { lvl1: true, lvl2: true, lvl3: true },
          hideAgentScript: { lvl1: false, lvl2: false, lvl3: false },
          hideCustomerScript: { lvl1: false, lvl2: false, lvl3: false },
          hideKeywordScores: { lvl1: false, lvl2: false, lvl3: false },
          hideSentimentScores: { lvl1: true, lvl2: true, lvl3: false },
          hideHighlights: { lvl1: false, lvl2: false, lvl3: false },
          hideCoachingTips: { lvl1: true, lvl2: true, lvl3: false },
          enablePostSurvey: { lvl1: true, lvl2: false, lvl3: false },
          aiPoweredPauses: { lvl1: true, lvl2: true, lvl3: false },
        },
        estimatedTime: { enabled: true, value: "15 mins" },
        objectives: {
          enabled: true,
          text: "Learn basic customer service\nUnderstand refund process",
        },
        quickTips: {
          enabled: true,
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
          practiceMode: "limited",
          repetitionsAllowed: "3",
          repetitionsNeeded: "2",
          scoringMetrics: {
            enabled: true,
            keywordScore: hasScript ? "20%" : "0%",
            clickScore: hasScript ? "80%" : "100%",
          },
        },
      },
    };
  });

  // Save settings to localStorage when they change
  useEffect(() => {
    if (simulationId) {
      localStorage.setItem(
        `simulation_settings_${simulationId}`,
        JSON.stringify(settingsState),
      );
    }
  }, [settingsState, simulationId]);

  // Log current settings for debugging
  useEffect(() => {
    console.log("Current settings state:", settingsState);
  }, [settingsState]);

  // Add handler functions to update settings
  const handleAdvancedSettingsChange = (newSettings) => {
    console.log("Advanced settings updated:", newSettings);
    setSettingsState((prev) => ({
      ...prev,
      advancedSettings: newSettings,
    }));
  };

  const handleVoiceSettingsChange = (newSettings) => {
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

  // When returning from preview, restore settings
  useEffect(() => {
    if (!showPreview) {
      const storedSettings = loadSettingsFromStorage();
      if (storedSettings) {
        setSettingsState(storedSettings);
      }
    }
  }, [showPreview]);

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
  const processTextToArray = (text) => {
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

  const handlePublish = async () => {
    if (!simulationId || !simulationData) return;

    setIsPublishing(true);
    try {
      // Transform script to required format by removing 'id' field - but only if there's a script
      const transformedScript =
        hasScript && script
          ? script.map(({ id, ...rest }) => ({
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
      const levelSettings = advancedSettings.levels || {};
      const timeSettings = advancedSettings.estimatedTime || {
        enabled: true,
        value: "15 mins",
      };
      const objectivesSettings = advancedSettings.objectives || {
        enabled: true,
        text: "",
      };
      const tipsSettings = advancedSettings.quickTips || {
        enabled: true,
        text: "",
      };
      const voiceConfig = voiceSettings.voice || {};
      const scoringConfig = voiceSettings.scoring || {};

      // Parse time value to extract just the number
      const timeValue =
        String(timeSettings.value || "15").match(/\d+/)?.[0] || "15";

      // Check enabled levels from simulationLevels setting
      const lvl1Enabled = levelSettings.simulationLevels?.lvl1 !== false; // Default to true if undefined
      const lvl2Enabled = levelSettings.simulationLevels?.lvl2 === true;
      const lvl3Enabled = levelSettings.simulationLevels?.lvl3 === true;

      // Check if practice is enabled for each level - use enablePractice setting
      // Make sure we're explicitly using === true for the comparison
      const lvl1PracticeEnabled = levelSettings.enablePractice?.lvl1 === true;
      const lvl2PracticeEnabled = levelSettings.enablePractice?.lvl2 === true;
      const lvl3PracticeEnabled = levelSettings.enablePractice?.lvl3 === true;

      console.log("Practice settings:", {
        lvl1: lvl1PracticeEnabled,
        lvl2: lvl2PracticeEnabled,
        lvl3: lvl3PracticeEnabled,
      });
      console.log("Selected voice ID:", voiceConfig.voiceId);
      console.log("Edited prompt:", editedPrompt);

      // Use settings in the payload with proper access to nested properties
      const payload = {
        user_id: "userId1",
        name: simulationData.name,
        division_id: simulationData.division,
        department_id: simulationData.department,
        type: simulationData.simulationType.toLowerCase(),
        tags: simulationData.tags,
        status: "published",
        lvl1: {
          // Use the value from simulationLevels setting for is_enabled
          is_enabled: lvl1Enabled,
          // Use the value from enablePractice setting
          enable_practice: lvl1PracticeEnabled,
          // Use the actual values from settings
          hide_agent_script: levelSettings.hideAgentScript?.lvl1 === true,
          hide_customer_script: levelSettings.hideCustomerScript?.lvl1 === true,
          hide_keyword_scores: levelSettings.hideKeywordScores?.lvl1 === true,
          hide_sentiment_scores:
            levelSettings.hideSentimentScores?.lvl1 === true,
          hide_highlights: levelSettings.hideHighlights?.lvl1 === true,
          hide_coaching_tips: levelSettings.hideCoachingTips?.lvl1 === true,
          enable_post_simulation_survey:
            levelSettings.enablePostSurvey?.lvl1 === true,
          ai_powered_pauses_and_feedback:
            levelSettings.aiPoweredPauses?.lvl1 === true,
        },
        lvl2: {
          // Use the value from simulationLevels setting for is_enabled
          is_enabled: lvl2Enabled,
          // Use the value from enablePractice setting
          enable_practice: lvl2PracticeEnabled,
          // Use level 2 settings where relevant
          hide_agent_script: levelSettings.hideAgentScript?.lvl2 === true,
          hide_customer_script: levelSettings.hideCustomerScript?.lvl2 === true,
          hide_keyword_scores: levelSettings.hideKeywordScores?.lvl2 === true,
          hide_sentiment_scores:
            levelSettings.hideSentimentScores?.lvl2 === true,
          hide_highlights: levelSettings.hideHighlights?.lvl2 === true,
          hide_coaching_tips: levelSettings.hideCoachingTips?.lvl2 === true,
          enable_post_simulation_survey:
            levelSettings.enablePostSurvey?.lvl2 === true,
          ai_powered_pauses_and_feedback:
            levelSettings.aiPoweredPauses?.lvl2 === true,
        },
        lvl3: {
          // Use the value from simulationLevels setting for is_enabled
          is_enabled: lvl3Enabled,
          // Use the value from enablePractice setting
          enable_practice: lvl3PracticeEnabled,
          // Use level 3 settings where relevant
          hide_agent_script: levelSettings.hideAgentScript?.lvl3 === true,
          hide_customer_script: levelSettings.hideCustomerScript?.lvl3 === true,
          hide_keyword_scores: levelSettings.hideKeywordScores?.lvl3 === true,
          hide_sentiment_scores:
            levelSettings.hideSentimentScores?.lvl3 === true,
          hide_highlights: levelSettings.hideHighlights?.lvl3 === true,
          hide_coaching_tips: levelSettings.hideCoachingTips?.lvl3 === true,
          enable_post_simulation_survey:
            levelSettings.enablePostSurvey?.lvl3 === true,
          ai_powered_pauses_and_feedback:
            levelSettings.aiPoweredPauses?.lvl3 === true,
        },
        estimated_time_to_attempt_in_mins: parseInt(timeValue),
        key_objectives: objectivesSettings.enabled
          ? processTextToArray(objectivesSettings.text)
          : ["Learn basic customer service", "Understand refund process"],
        overview_video: "https://example.com/overview.mp4",
        quick_tips: tipsSettings.enabled
          ? processTextToArray(tipsSettings.text)
          : [
              "Listen to the customer carefully",
              "Be polite and empathetic",
              "Provide accurate information",
            ],
        // Use the actual voice ID from settings, only if voice settings should be shown
        voice_id: showVoiceSettings
          ? voiceConfig.voiceId || DEFAULT_VOICE_ID
          : "",
        language: voiceConfig.language || "English",
        mood: "Neutral",
        voice_speed: "Normal",
        // Use the edited prompt instead of the original one
        prompt: showPromptSettings ? editedPrompt : "",
        simulation_completion_repetition: parseInt(
          scoringConfig.repetitionsNeeded || "3",
        ),
        simulation_max_repetition: parseInt(
          scoringConfig.repetitionsAllowed || "5",
        ),
        final_simulation_score_criteria:
          scoringConfig.simulationScore === "best"
            ? "Best of three"
            : scoringConfig.simulationScore === "last"
              ? "Last attempt"
              : "Average of all",
        simulation_scoring_metrics: {
          is_enabled: scoringConfig.scoringMetrics?.enabled === true,
          keyword_score: parseInt(
            scoringConfig.keywordScore || (hasScript ? "20" : "0"),
          ),
          click_score: parseInt(
            scoringConfig.clickScore || (hasScript ? "80" : "100"),
          ),
        },
        sim_practice: {
          is_unlimited: scoringConfig.practiceMode === "unlimited",
          pre_requisite_limit: parseInt(scoringConfig.repetitionsNeeded || "3"),
        },
        is_locked: false,
        version: 1,
        script: transformedScript,
      };

      console.log("Publishing with settings:", payload);

      const response = await axios.put(
        `/api/simulations/${simulationId}/update`,
        payload,
      );

      console.log(response.data);

      if (response.data.status === "success") {
        setPublishedSimId(simulationId);
        setShowPreview(true);
        if (onPublish) {
          onPublish();
        }
      }
    } catch (error) {
      console.error("Error publishing simulation:", error);
    } finally {
      setIsPublishing(false);
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
        Creating Your Simulation
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
        Please wait while we process your simulation...
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

  // If we're loading or publishing, show the loading screen
  if (isLoading || isPublishing) {
    return <LoadingScreen />;
  }

  // Build navigation items based on simulation type
  const getNavigationItems = () => {
    // Core items for all simulation types
    const coreItems = [
      "Simulation Type",
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
    "Sym Practice",
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
          <Button
            variant="contained"
            onClick={handlePublish}
            disabled={isPublishing || !simulationId}
            sx={{
              bgcolor: "#444CE7",
              "&:hover": { bgcolor: "#3538CD" },
              borderRadius: 2,
              px: 4,
            }}
          >
            {isPublishing ? "Publishing..." : "Publish"}
          </Button>
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
              width: 350,
              height: 660,
              bgcolor: "#FFFFFF",
              borderRadius: 2,
              py: 1,
              px: 4,
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
              px: 10,
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
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
};

export default SettingsTab;
