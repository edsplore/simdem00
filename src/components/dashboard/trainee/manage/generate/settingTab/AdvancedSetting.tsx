import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Paper,
  Card,
  styled,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  CardContent,
  Button,
} from "@mui/material";
import {
  AudioFile,
  Visibility,
  ChatBubble,
  PlayCircle,
} from "@mui/icons-material";
import { uploadOverviewVideo } from "../../../../../../services/video_upload";

// Styled components remain the same...
const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 44,
  height: 24,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(20px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "#444CE7",
        opacity: 1,
        border: 0,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 20,
    height: 20,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "#E9E9EA",
    opacity: 1,
  },
}));

interface SimulationType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
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

interface AdvancedSettingsProps {
  settings: SimulationSettings;
  onSettingsChange: (settings: SimulationSettings) => void;
  simulationType?: string;
  activeSection?: string;
  simulationId: string;
}

interface FormData {
  simulationType: string;
  settings: {
    [key: string]: {
      lvl1: boolean;
      lvl2: boolean;
      lvl3: boolean;
    };
  };
  estimatedTime: {
    enabled: boolean;
    value: string;
  };
  objectives: {
    enabled: boolean;
    text: string;
  };
  overviewVideo: {
    enabled: boolean;
    url?: string;
  };
  quickTips: {
    enabled: boolean;
    text: string;
  };
}

const simulationTypes: SimulationType[] = [
  {
    id: "audio",
    title: "Audio",
    description: "Interactive audio call session simulation",
    icon: <AudioFile sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual-audio",
    title: "Visual - Audio",
    description: "Audio simulation with click-through visuals",
    icon: <Visibility sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "chat",
    title: "Chat",
    description: "Interactive text chat simulation",
    icon: <ChatBubble sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual-chat",
    title: "Visual - Chat",
    description: "Chat Simulation with click-through visuals",
    icon: <Visibility sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual",
    title: "Visual Only",
    description: "Click-through visuals with hotspots",
    icon: <Visibility sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
];

const defaultSettings = {
  simulationLevels: {
    id: "simulationLevels",
    name: "Choose Simulation Levels",
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  enablePractice: {
    id: "enablePractice",
    name: "Enable Practice",
    description: "This will enable practice mode for users",
    levels: { lvl1: true, lvl2: true, lvl3: true },
  },
  hideAgentScript: {
    id: "hideAgentScript",
    name: "Hide Agent Script",
    description:
      "This will hide the agent responses from the conversation script",
    levels: { lvl1: true, lvl2: false, lvl3: false },
  },
  hideCustomerScript: {
    id: "hideCustomerScript",
    name: "Hide Customer Script",
    description:
      "This will hide the customer responses in the conversation script",
    levels: { lvl1: false, lvl2: true, lvl3: false },
  },
  hideKeywordScores: {
    id: "hideKeywordScores",
    name: "Hide Keyword Scores",
    description: "This will hide the keyword scoring from the agent",
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  hideSentimentScores: {
    id: "hideSentimentScores",
    name: "Hide Sentiment Scores",
    description: "This will hide the sentiments scoring from the agent",
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  hideHighlights: {
    id: "hideHighlights",
    name: "Hide Highlights",
    description:
      "This will hide the frame around the highlights. Hotspots will still be active",
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  hideCoachingTips: {
    id: "hideCoachingTips",
    name: "Hide Coaching Tips",
    description: "This will hide and disable coaching tips",
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  enablePostSurvey: {
    id: "enablePostSurvey",
    name: "Enable Post Simulations Survey",
    description:
      "This will enable the post simulation survey upon first completion attempt",
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  aiPoweredPauses: {
    id: "aiPoweredPauses",
    name: "AI Powered Pauses and Feedback",
    description: "This will enable realtime AI feedback and coaching",
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
};

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  settings,
  onSettingsChange,
  simulationType: initialSimType,
  activeSection,
  simulationId,
}) => {
  // Initialize form with values from props
  const { control, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      simulationType: initialSimType || "audio",
      settings: Object.fromEntries(
        Object.entries(defaultSettings).map(([key, value]) => [
          key,
          value.levels,
        ]),
      ),
      estimatedTime: {
        enabled: false,
        value: "",
      },
      objectives: {
        enabled: false,
        text: "Learn effective communication through different media\nDevelop decision-making skills through realistic scenarios\nImprove response time and adaptability in different situations\nReinforce learning through interactive feedback and analysis",
      },
      overviewVideo: {
        enabled: false,
        url: "",
      },
      quickTips: {
        enabled: false,
        text: "Listen to the customer carefully\nBe polite and empathetic\nProvide accurate information\nFollow proper procedures",
      },
    },
  });

  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track if form has been initialized from settings
  const hasInitializedFromSettings = useRef(false);

  // Reset initialization flag on unmount
  useEffect(() => {
    return () => {
      hasInitializedFromSettings.current = false;
    };
  }, []);

  // Initialize form values from settings ONLY on mount or when settings genuinely change from outside
  useEffect(() => {
    // Only initialize if we have settings and haven't initialized yet
    if (
      settings &&
      Object.keys(settings).length > 0 &&
      !hasInitializedFromSettings.current
    ) {

      // Delay initialization slightly to ensure settings are stable
      setTimeout(() => {
        // Build complete form data from settings
        const formData: FormData = {
          simulationType: settings.simulationType || initialSimType || "audio",
          settings:
            settings.levels ||
            Object.fromEntries(
              Object.entries(defaultSettings).map(([key, value]) => [
                key,
                value.levels,
              ]),
            ),
          estimatedTime: settings.estimatedTime || {
            enabled: false,
            value: "",
          },
          objectives: settings.objectives || {
            enabled: false,
            text: "Learn effective communication through different media\nDevelop decision-making skills through realistic scenarios\nImprove response time and adaptability in different situations\nReinforce learning through interactive feedback and analysis",
          },
          overviewVideo: settings.overviewVideo || {
            enabled: false,
            url: "",
          },
          quickTips: settings.quickTips || {
            enabled: false,
            text: "Listen to the customer carefully\nBe polite and empathetic\nProvide accurate information\nFollow proper procedures",
          },
        };

        // Reset the entire form with new values
        reset(formData);

        hasInitializedFromSettings.current = true;
      }, 100);
    }
  }, [settings, reset, initialSimType]); // Add dependencies properly

  // Check if the current simulation type is visual
  const simType = watch("simulationType");
  const isVisualAudioOrChat =
    simType === "visual-audio" || simType === "visual-chat";
  const isVisualOnly = simType === "visual";
  const isAnyVisualType = isVisualAudioOrChat || isVisualOnly;
  const hasScript = simType !== "visual";

  // Get the current state of all level enablement switches
  const simulationLevelsSettings = watch("settings.simulationLevels") || {};
  const level1Enabled = simulationLevelsSettings.lvl1 !== false;
  const level2Enabled = simulationLevelsSettings.lvl2 === true;
  const level3Enabled = simulationLevelsSettings.lvl3 === true;

  // Update parent component when form values change
  useEffect(() => {
    const subscription = watch((value) => {
      // Get the current levels enabled status
      const simulationLevels = value.settings?.simulationLevels || {};
      const level1Enabled = simulationLevels.lvl1 !== false;
      const level2Enabled = simulationLevels.lvl2 === true;
      const level3Enabled = simulationLevels.lvl3 === true;

      // Create a cleaned version of settings
      const cleanedSettings = { ...value.settings };

      // For each setting other than simulationLevels
      Object.keys(cleanedSettings).forEach((key) => {
        if (key !== "simulationLevels") {
          // For each level that's disabled, ensure its value is false
          if (!level1Enabled) {
            cleanedSettings[key].lvl1 = false;
          }
          if (!level2Enabled) {
            cleanedSettings[key].lvl2 = false;
          }
          if (!level3Enabled) {
            cleanedSettings[key].lvl3 = false;
          }
        }
      });

      // Only update if form has been initialized
      if (hasInitializedFromSettings.current) {
        // Update parent with the cleaned values
        onSettingsChange({
          ...settings,
          simulationType: value.simulationType,
          levels: cleanedSettings,
          estimatedTime: value.estimatedTime,
          objectives: value.objectives,
          quickTips: value.quickTips,
          overviewVideo: value.overviewVideo,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, onSettingsChange]); // Remove settings from dependencies to prevent loops

  const onSubmit = (data: FormData) => {
    onSettingsChange({
      ...settings,
      simulationType: data.simulationType,
      levels: data.settings,
      estimatedTime: data.estimatedTime,
      objectives: data.objectives,
      quickTips: data.quickTips,
      overviewVideo: data.overviewVideo,
    });
  };

  const handleVideoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const url = await uploadOverviewVideo(
        simulationId,
        file,
        (p) => setVideoUploadProgress(p),
      );
      setValue('overviewVideo.url', url, { shouldDirty: true, shouldTouch: true });
    } catch (err) {
      console.error('Video upload failed', err);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 1 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Typography sx={{ color: "#9C9C9D", fontWeight: "medium" }}>
            ADVANCE SETTINGS
          </Typography>

          {/* Simulation Type Card - Hidden */}
          {false && (
            <Card sx={{ px: 3, py: 2, borderRadius: 5, boxShadow: 2 }}>
              <Stack spacing={1}>
                <Typography
                  variant="h6"
                  sx={{ color: "black" }}
                  data-section="Simulation Type"
                >
                  Simulation Type
                </Typography>
                <Typography variant="body2" sx={{ color: "#9C9C9D" }}>
                  Configure simulation type for this simulation
                </Typography>

                <Controller
                  name="simulationType"
                  control={control}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 2,
                      }}
                    >
                      {simulationTypes.map((type) => (
                        <Box
                          key={type.id}
                          onClick={() => field.onChange(type.id)}
                          sx={{
                            p: 2,
                            border: "2px solid",
                            borderColor:
                              field.value === type.id ? "#444CE7" : "#E9E9EA",
                            borderRadius: 4,
                            cursor: "pointer",
                            bgcolor:
                              field.value === type.id
                                ? "#FFFFFF"
                                : "transparent",
                            "&:hover": {
                              bgcolor: "#F5F6FF",
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                bgcolor: "#F5F6FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {type.icon}
                            </Box>
                            <Stack spacing={0.5}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color:
                                    field.value === type.id
                                      ? "#444CE7"
                                      : "inherit",
                                  fontWeight: 600,
                                }}
                              >
                                {type.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {type.description}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
                />
              </Stack>
            </Card>
          )}

          {/* Settings Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                <TableRow>
                  <TableCell sx={{ width: "30%" }}>Settings</TableCell>
                  <TableCell align="center">Lvl 01</TableCell>
                  <TableCell align="center">Lvl 02</TableCell>
                  <TableCell align="center">Lvl 03</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(defaultSettings).map(([key, setting]) => {
                  // Only show hideHighlights and hideCoachingTips for visual types
                  if (
                    (key === "hideHighlights" || key === "hideCoachingTips") &&
                    !isAnyVisualType
                  ) {
                    return null;
                  }

                  // Hide agent script and customer script settings for visual type only
                  if (
                    (key === "hideAgentScript" ||
                      key === "hideCustomerScript") &&
                    isVisualOnly
                  ) {
                    return null;
                  }

                  return (
                    <TableRow key={setting.id} data-section={setting.name}>
                      <TableCell>
                        <Stack spacing={0.5}>
                          <Typography variant="body2" fontWeight="medium">
                            {setting.name}
                          </Typography>
                          {setting.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {setting.description}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>
                      {["lvl1", "lvl2", "lvl3"].map((level) => {
                        // Determine if this level is enabled overall
                        const isLevelEnabled =
                          (level === "lvl1" && level1Enabled) ||
                          (level === "lvl2" && level2Enabled) ||
                          (level === "lvl3" && level3Enabled);

                        const isLevelSettingRow = key === "simulationLevels";
                        const isDisabled =
                          !isLevelSettingRow && !isLevelEnabled;

                        const displayValue = (field: any) => {
                          if (isLevelSettingRow) {
                            return field.value || false;
                          } else {
                            return isLevelEnabled
                              ? field.value || false
                              : false;
                          }
                        };

                        return (
                          <TableCell key={level} align="center">
                            <Controller
                              name={`settings.${key}.${level}`}
                              control={control}
                              render={({ field }) => (
                                <StyledSwitch
                                  checked={displayValue(field)}
                                  onChange={(e) => {
                                    field.onChange(e.target.checked);
                                  }}
                                  disabled={isDisabled}
                                />
                              )}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Estimated Time Card */}
          <Card
            sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}
            data-section="Estimated Time to Attempt"
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "black" }}
                >
                  Estimated Time to Attempt
                </Typography>
                <Typography variant="body2" sx={{ color: "#9C9C9D" }}>
                  Estimated time required to complete this simulation by Trainee
                </Typography>
              </Box>
              <Controller
                name="estimatedTime.enabled"
                control={control}
                render={({ field }) => (
                  <StyledSwitch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </Stack>

            <Controller
              name="estimatedTime.value"
              control={control}
              render={({ field }) => (
                <FormControl sx={{ minWidth: 120, mt: 2 }}>
                  <InputLabel id="time-label">Time</InputLabel>
                  <Select
                    {...field}
                    labelId="time-label"
                    label="Time"
                    disabled={!watch("estimatedTime.enabled")}
                  >
                    <MenuItem value="10 mins">10 mins</MenuItem>
                    <MenuItem value="15 mins">15 mins</MenuItem>
                    <MenuItem value="20 mins">20 mins</MenuItem>
                    <MenuItem value="25 mins">25 mins</MenuItem>
                    <MenuItem value="30 mins">30 mins</MenuItem>
                    <MenuItem value="35 mins">35 mins</MenuItem>
                    <MenuItem value="40 mins">40 mins</MenuItem>
                    <MenuItem value="45 mins">45 mins</MenuItem>
                    <MenuItem value="50 mins">50 mins</MenuItem>
                    <MenuItem value="55 mins">55 mins</MenuItem>
                    <MenuItem value="60 mins">60 mins</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Card>

          {/* Objectives Card */}
          <Card
            sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}
            data-section="Key Objectives"
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "black" }}
                >
                  Key Objectives
                </Typography>
                <Typography variant="body2" sx={{ color: "#9C9C9D" }}>
                  This will show the key objective of the simulation
                </Typography>
              </Box>
              <Controller
                name="objectives.enabled"
                control={control}
                render={({ field }) => (
                  <StyledSwitch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </Stack>

            <Controller
              name="objectives.text"
              control={control}
              render={({ field }) => (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    {...field}
                    label="Objectives"
                    multiline
                    rows={5}
                    fullWidth
                    variant="outlined"
                    disabled={!watch("objectives.enabled")}
                    placeholder="Enter each objective on a separate line without numbering.
Example:
Learn basic customer service
Understand refund process"
                    helperText="Each line will be treated as a separate objective. Do not add numbering."
                    sx={{
                      backgroundColor: "#FFFFFF",
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: watch("objectives.enabled")
                            ? "#444CE7"
                            : "rgba(0, 0, 0, 0.12)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: watch("objectives.enabled")
                            ? "#444CE7"
                            : "rgba(0, 0, 0, 0.12)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "#f5f5f5",
                        },
                      },
                    }}
                  />

                  {/* Preview section */}
                  {watch("objectives.enabled") && (
                    <Box
                      sx={{ mt: 1, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                      >
                        Preview (how it will appear):
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {field.value
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((line, index) => {
                            const cleanLine = line.replace(
                              /^\d+[\s:.)-]*\s*/,
                              "",
                            );
                            return (
                              <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontSize: "0.8rem",
                                    mr: 1,
                                  }}
                                >
                                  {index + 1}
                                </Box>
                                {cleanLine}
                              </Typography>
                            );
                          })}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            />
          </Card>

          {/* Overview Video Card */}
          <Card data-section="Overview Video">
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Overview Video
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This will show the overview video of the simulation before
                    the trainee begins.
                  </Typography>
                </Box>
                <Controller
                  name="overviewVideo.enabled"
                  control={control}
                  render={({ field }) => (
                    <StyledSwitch
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  )}
                />
              </Box>

              <Box
                sx={{
                  mt: 4,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    height: 48,
                    width: 48,
                    borderRadius: "50%",
                    bgcolor: "#F5F6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlayCircle sx={{ fontSize: 24, color: "#444CE7" }} />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ bgcolor: "#444CE7" }}
                  disabled={!watch("overviewVideo.enabled") || isUploadingVideo}
                  onClick={handleVideoButtonClick}
                >
                  {isUploadingVideo ? `${videoUploadProgress}%` : 'Upload Video'}
                </Button>
                <input
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleVideoChange}
                  style={{ display: 'none' }}
                />
                {watch('overviewVideo.url') && !isUploadingVideo && (
                  <Typography variant="caption" color="text.secondary">
                    Video uploaded
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Quick Tips Card */}
          <Card
            sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}
            data-section="Quick Tips"
          >
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "black" }}
                >
                  Quick Tips
                </Typography>
                <Typography variant="body2" sx={{ color: "#9C9C9D" }}>
                  This will show the key Quick Tips of the simulation before the
                  training
                </Typography>
              </Box>
              <Controller
                name="quickTips.enabled"
                control={control}
                render={({ field }) => (
                  <StyledSwitch
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </Stack>

            <Controller
              name="quickTips.text"
              control={control}
              render={({ field }) => (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    {...field}
                    label="Quick Tips"
                    multiline
                    rows={5}
                    fullWidth
                    variant="outlined"
                    disabled={!watch("quickTips.enabled")}
                    placeholder="Enter each tip on a separate line without numbering.
Example:
Listen to the customer carefully
Be polite and empathetic
Provide accurate information"
                    helperText="Each line will be treated as a separate tip. Do not add numbering."
                    sx={{
                      backgroundColor: "#FFFFFF",
                      "& .MuiOutlinedInput-root": {
                        "&:hover fieldset": {
                          borderColor: watch("quickTips.enabled")
                            ? "#444CE7"
                            : "rgba(0, 0, 0, 0.12)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: watch("quickTips.enabled")
                            ? "#444CE7"
                            : "rgba(0, 0, 0, 0.12)",
                        },
                        "&.Mui-disabled": {
                          backgroundColor: "#f5f5f5",
                        },
                      },
                    }}
                  />

                  {/* Preview section */}
                  {watch("quickTips.enabled") && (
                    <Box
                      sx={{ mt: 1, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        gutterBottom
                      >
                        Preview (how it will appear):
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        {field.value
                          .split("\n")
                          .filter((line) => line.trim())
                          .map((line, index) => {
                            const cleanLine = line.replace(
                              /^\d+[\s:.)-]*\s*/,
                              "",
                            );
                            return (
                              <Typography
                                key={index}
                                variant="body2"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontSize: "0.8rem",
                                    mr: 1,
                                  }}
                                >
                                  {index + 1}
                                </Box>
                                {cleanLine}
                              </Typography>
                            );
                          })}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            />
          </Card>
        </Stack>
      </form>
    </Box>
  );
};

export default AdvancedSettings;
