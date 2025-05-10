import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import WaveSurfer from "wavesurfer.js";
import {
  Card,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Box,
  Switch,
  Divider,
  Stack,
  Avatar,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Grid,
} from "@mui/material";
import { PlayArrow, Pause, InfoOutlined } from "@mui/icons-material";
import {
  listVoices,
  filterVoices,
} from "../../../../../../services/simulation_voices";

interface Voice {
  voice_id: string;
  voice_type: string;
  voice_name: string;
  provider: string;
  accent: string;
  gender: string;
  age: string;
  avatar_url: string;
  preview_audio_url: string;
}

interface VoiceScoreSettingProps {
  prompt?: string;
  settings: SimulationSettings;
  onSettingsChange: (settings: SimulationSettings) => void;
  onPromptChange?: (prompt: string) => void;
  activeSection?: string;
  showVoiceSettings?: boolean;
  showPromptSettings?: boolean;
  simulationType?: string; // Add simulation type prop
}

interface ScoreMetricWeightage {
  clickAccuracy: number;
  keywordAccuracy: number;
  dataEntryAccuracy: number;
  contextualAccuracy: number;
  sentimentMeasures: number;
}

interface FormData {
  language: string;
  accent: string;
  gender: string;
  ageGroup: string;
  simulationScore: "best" | "last" | "average";
  keywordScore: string;
  clickScore: string;
  pointsPerKeyword: string;
  pointsPerClick: string;
  practiceMode: "unlimited" | "limited";
  repetitionsAllowed: string;
  repetitionsNeeded: string;
  scoringMetrics: {
    enabled: boolean;
    keywordScore: string;
    clickScore: string;
  };
  metricWeightage: {
    clickAccuracy: string;
    keywordAccuracy: string;
    dataEntryAccuracy: string;
    contextualAccuracy: string;
    sentimentMeasures: string;
  };
}

const DEFAULT_POINT_VALUES = ["1", "2", "3", "4", "5"];
const DEFAULT_PERCENTAGE_VALUES = [
  "0%",
  "5%",
  "10%",
  "15%",
  "20%",
  "25%",
  "30%",
  "35%",
  "40%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "100%",
];

const VoiceAndScoreSettings: React.FC<VoiceScoreSettingProps> = ({
  prompt,
  settings,
  onSettingsChange,
  onPromptChange,
  activeSection,
  showVoiceSettings = true,
  showPromptSettings = true,
  simulationType = "audio", // Default to audio
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>(
    settings.voice?.voiceId || "",
  );
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const wavesurferRefs = useRef<{ [key: string]: WaveSurfer }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [weightageError, setWeightageError] = useState<string | null>(null);

  // Check if simulation type is visual
  const isVisualOnly = simulationType === "visual";
  const isVisualAudioOrChat =
    simulationType === "visual-audio" || simulationType === "visual-chat";
  const isAnyVisualType = isVisualOnly || isVisualAudioOrChat;
  const hasScript = simulationType !== "visual";

  // Initialize form with default values
  const { control, handleSubmit, watch, setValue, getValues } =
    useForm<FormData>({
      mode: "onChange",
      defaultValues: {
        language: settings.voice?.language || "English",
        accent: settings.voice?.accent || "American",
        gender: settings.voice?.gender || "Male",
        ageGroup: settings.voice?.ageGroup || "Middle Aged",
        simulationScore: settings.scoring?.simulationScore || "best",
        keywordScore:
          settings.scoring?.keywordScore || (hasScript ? "20" : "0"),
        clickScore: settings.scoring?.clickScore || (hasScript ? "80" : "100"),
        pointsPerKeyword: settings.scoring?.pointsPerKeyword || "1",
        pointsPerClick: settings.scoring?.pointsPerClick || "1",
        practiceMode: settings.scoring?.practiceMode || "limited",
        repetitionsAllowed: settings.scoring?.repetitionsAllowed || "3",
        repetitionsNeeded: settings.scoring?.repetitionsNeeded || "3",
        scoringMetrics: {
          enabled: settings.scoring?.scoringMetrics?.enabled ?? true,
          keywordScore: settings.scoring?.scoringMetrics?.keywordScore ?? "20%",
          clickScore: settings.scoring?.scoringMetrics?.clickScore ?? "80%",
        },
        metricWeightage: {
          clickAccuracy:
            settings.scoring?.metricWeightage?.clickAccuracy ||
            (isAnyVisualType ? "30%" : "0%"),
          keywordAccuracy:
            settings.scoring?.metricWeightage?.keywordAccuracy ||
            (hasScript ? "30%" : "0%"),
          dataEntryAccuracy:
            settings.scoring?.metricWeightage?.dataEntryAccuracy ||
            (isAnyVisualType ? "20%" : "0%"),
          contextualAccuracy:
            settings.scoring?.metricWeightage?.contextualAccuracy || "10%",
          sentimentMeasures:
            settings.scoring?.metricWeightage?.sentimentMeasures || "10%",
        },
      },
    });

  const accent = watch("accent");
  const gender = watch("gender");
  const ageGroup = watch("ageGroup");
  const scoringMetricsEnabled = watch("scoringMetrics.enabled");

  // Watch all simulation score settings
  const simulationScore = watch("simulationScore");
  const repetitionsAllowed = watch("repetitionsAllowed");
  const repetitionsNeeded = watch("repetitionsNeeded");
  const practiceMode = watch("practiceMode");

  // Watch weightage values to validate total
  const clickAccuracy = watch("metricWeightage.clickAccuracy");
  const keywordAccuracy = watch("metricWeightage.keywordAccuracy");
  const dataEntryAccuracy = watch("metricWeightage.dataEntryAccuracy");
  const contextualAccuracy = watch("metricWeightage.contextualAccuracy");
  const sentimentMeasures = watch("metricWeightage.sentimentMeasures");

  // Validate weightage totals
  useEffect(() => {
    // Remove % and convert to numbers
    const parsePercentage = (value: string) =>
      parseInt(value.replace("%", "")) || 0;

    const weightageTotal =
      parsePercentage(clickAccuracy) +
      parsePercentage(keywordAccuracy) +
      parsePercentage(dataEntryAccuracy) +
      parsePercentage(contextualAccuracy) +
      parsePercentage(sentimentMeasures);

    if (weightageTotal !== 100) {
      setWeightageError(
        `Total weightage is ${weightageTotal}%. Please adjust to total 100%.`,
      );
    } else {
      setWeightageError(null);
    }
  }, [
    clickAccuracy,
    keywordAccuracy,
    dataEntryAccuracy,
    contextualAccuracy,
    sentimentMeasures,
  ]);

  // Log when component mounts and when settings change
  useEffect(() => {
    console.log("VoiceScore component mounted with settings:", settings);
    console.log("Initial voice ID:", settings.voice?.voiceId);
    console.log("Simulation type:", simulationType);
  }, []);

  // Add an effect to update parent component when form values change
  useEffect(() => {
    const updateParentSettings = () => {
      // Update settings only if we have values to update
      if (simulationScore && repetitionsAllowed && repetitionsNeeded) {
        console.log("Updating parent with new scoring settings:", {
          simulationScore,
          repetitionsAllowed,
          repetitionsNeeded,
          practiceMode,
        });

        onSettingsChange({
          ...settings,
          voice: {
            ...settings.voice,
            language: watch("language"),
            accent: watch("accent"),
            gender: watch("gender"),
            ageGroup: watch("ageGroup"),
            voiceId: selectedVoice || settings.voice?.voiceId,
          },
          scoring: {
            simulationScore,
            keywordScore: watch("keywordScore"),
            clickScore: watch("clickScore"),
            pointsPerKeyword: watch("pointsPerKeyword"),
            pointsPerClick: watch("pointsPerClick"),
            practiceMode,
            repetitionsAllowed,
            repetitionsNeeded,
            scoringMetrics: {
              enabled: watch("scoringMetrics.enabled"),
              keywordScore: watch("scoringMetrics.keywordScore"),
              clickScore: watch("scoringMetrics.clickScore"),
            },
            metricWeightage: {
              clickAccuracy: watch("metricWeightage.clickAccuracy"),
              keywordAccuracy: watch("metricWeightage.keywordAccuracy"),
              dataEntryAccuracy: watch("metricWeightage.dataEntryAccuracy"),
              contextualAccuracy: watch("metricWeightage.contextualAccuracy"),
              sentimentMeasures: watch("metricWeightage.sentimentMeasures"),
            },
          },
        });
      }
    };

    // Call immediately to update on mount
    updateParentSettings();
  }, [
    simulationScore,
    repetitionsAllowed,
    repetitionsNeeded,
    practiceMode,
    selectedVoice,
    clickAccuracy,
    keywordAccuracy,
    dataEntryAccuracy,
    contextualAccuracy,
    sentimentMeasures,
    onSettingsChange,
  ]);

  const fetchVoices = async () => {
    try {
      const response = await listVoices("user123");
      console.log("API response - voices:", response);
      if (response.voices && Array.isArray(response.voices)) {
        setVoices(response.voices);
      }
    } catch (error) {
      console.error("Error fetching voices:", error);
    }
  };

  useEffect(() => {
    if (showVoiceSettings) {
      fetchVoices();
    }
  }, [showVoiceSettings]);

  useEffect(() => {
    // If we have a voice ID from settings, select it
    if (settings.voice?.voiceId && settings.voice.voiceId !== selectedVoice) {
      console.log(
        "Updating selected voice from settings:",
        settings.voice.voiceId,
      );
      setSelectedVoice(settings.voice.voiceId);
    }
  }, [settings.voice?.voiceId]);

  useEffect(() => {
    const filtered = filterVoices(voices, {
      accent,
      gender,
      age: ageGroup,
    });
    setFilteredVoices(filtered.slice(0, 3));
  }, [voices, accent, gender, ageGroup]);

  useEffect(() => {
    if (!showVoiceSettings) return;

    filteredVoices.forEach((voice) => {
      if (!wavesurferRefs.current[voice.voice_id]) {
        const wavesurfer = WaveSurfer.create({
          container: `#waveform-${voice.voice_id}`,
          waveColor: "#C2C2C2",
          progressColor: "#444CE7",
          cursorColor: "transparent",
          barWidth: 4,
          barGap: 3,
          height: 40,
          normalize: true,
        });

        wavesurfer.load(voice.preview_audio_url);
        wavesurferRefs.current[voice.voice_id] = wavesurfer;

        wavesurfer.on("finish", () => {
          setIsPlaying((prev) => ({ ...prev, [voice.voice_id]: false }));
        });
      }
    });

    return () => {
      Object.values(wavesurferRefs.current).forEach((wavesurfer) => {
        wavesurfer.destroy();
      });
      wavesurferRefs.current = {};
    };
  }, [filteredVoices, showVoiceSettings]);

  // Add effect to update parent component when voice selection changes
  useEffect(() => {
    // Update parent component with the selected voice ID immediately
    if (selectedVoice) {
      console.log("Voice ID changed, updating parent:", selectedVoice);
      onSettingsChange({
        ...settings,
        voice: {
          ...settings.voice,
          voiceId: selectedVoice,
        },
      });
    }
  }, [selectedVoice]);

  const handlePlayPause = (voiceId: string) => {
    const wavesurfer = wavesurferRefs.current[voiceId];
    if (wavesurfer) {
      if (isPlaying[voiceId]) {
        wavesurfer.pause();
      } else {
        // Pause all other playing wavesurfers
        Object.entries(wavesurferRefs.current).forEach(([id, ws]) => {
          if (id !== voiceId && isPlaying[id]) {
            ws.pause();
            setIsPlaying((prev) => ({ ...prev, [id]: false }));
          }
        });
        wavesurfer.play();
      }
      setIsPlaying((prev) => ({ ...prev, [voiceId]: !prev[voiceId] }));
    }
  };

  const handleProcessVoice = async () => {
    setIsProcessing(true);
    try {
      // Simulate some processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = (data: FormData) => {
    // Ensure we capture the current selectedVoice state
    console.log("Form submitted with voice ID:", selectedVoice);
    console.log("Form submitted with simulation score:", data.simulationScore);
    console.log(
      "Form submitted with repetitions allowed:",
      data.repetitionsAllowed,
    );
    console.log(
      "Form submitted with repetitions needed:",
      data.repetitionsNeeded,
    );

    onSettingsChange({
      ...settings,
      voice: {
        language: data.language,
        accent: data.accent,
        gender: data.gender,
        ageGroup: data.ageGroup,
        voiceId: selectedVoice, // Use the actual selected voice ID
      },
      scoring: {
        simulationScore: data.simulationScore,
        keywordScore: data.keywordScore,
        clickScore: data.clickScore,
        pointsPerKeyword: data.pointsPerKeyword,
        pointsPerClick: data.pointsPerClick,
        practiceMode: data.practiceMode,
        repetitionsAllowed: data.repetitionsAllowed,
        repetitionsNeeded: data.repetitionsNeeded,
        scoringMetrics: data.scoringMetrics,
        metricWeightage: data.metricWeightage,
      },
    });
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", p: 2 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* AI Customer Voice - only show if applicable */}
        {showVoiceSettings && (
          <Card
            sx={{ p: 2, borderRadius: 2, boxShadow: 3, mb: 3 }}
            data-section="AI Customer Voice"
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              AI Customer Voice
              <Box
                component="span"
                sx={{ color: "primary.main", fontSize: "1.5rem" }}
              >
                ⚡
              </Box>
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Manage your AI customer voice settings
            </Typography>

            <Typography variant="subtitle1" gutterBottom>
              Base Voice Parameters
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 3,
              }}
            >
              <Controller
                name="language"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select {...field} label="Language">
                      <MenuItem value="English">English</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="accent"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Accent</InputLabel>
                    <Select {...field} label="Accent">
                      <MenuItem value="American">American</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select {...field} label="Gender">
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="ageGroup"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Age Group</InputLabel>
                    <Select {...field} label="Age Group">
                      <MenuItem value="Middle Aged">Middle Aged</MenuItem>
                      <MenuItem value="Young">Young</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleProcessVoice}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Process Base Voice"}
            </Button>

            {filteredVoices.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Voices
                </Typography>
                <RadioGroup
                  value={selectedVoice}
                  onChange={(e) => {
                    console.log("Selected voice changed to:", e.target.value);
                    setSelectedVoice(e.target.value);
                  }}
                >
                  <Stack spacing={2}>
                    {filteredVoices.map((voice) => (
                      <Box
                        key={voice.voice_id}
                        sx={{
                          border: "1px solid",
                          borderColor:
                            selectedVoice === voice.voice_id
                              ? "#444CE7"
                              : "divider",
                          borderRadius: 2,
                          p: 2,
                        }}
                      >
                        <Stack spacing={2}>
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <FormControlLabel
                              value={voice.voice_id}
                              control={<Radio />}
                              label=""
                            />
                            <Avatar
                              src={voice.avatar_url}
                              alt={voice.voice_name}
                              sx={{ width: 40, height: 40 }}
                            />
                            <Box flex={1}>
                              <Typography variant="subtitle2">
                                {voice.voice_name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {voice.accent} • {voice.gender} • {voice.age}
                              </Typography>
                            </Box>
                            <IconButton
                              onClick={() => handlePlayPause(voice.voice_id)}
                              sx={{
                                bgcolor: isPlaying[voice.voice_id]
                                  ? "#444CE7"
                                  : "grey.200",
                                color: isPlaying[voice.voice_id]
                                  ? "white"
                                  : "text.primary",
                                "&:hover": {
                                  bgcolor: isPlaying[voice.voice_id]
                                    ? "#3538CD"
                                    : "grey.300",
                                },
                              }}
                            >
                              {isPlaying[voice.voice_id] ? (
                                <Pause />
                              ) : (
                                <PlayArrow />
                              )}
                            </IconButton>
                          </Stack>
                          <Box
                            id={`waveform-${voice.voice_id}`}
                            sx={{
                              width: "100%",
                              bgcolor: "#F5F6FF",
                              borderRadius: 1,
                            }}
                          />
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </RadioGroup>
              </Box>
            )}
          </Card>
        )}

        {/* Conversation Prompt */}
        {showPromptSettings && (
          <Card
            sx={{ p: 2, borderRadius: 2, boxShadow: 3, mb: 3 }}
            data-section="Conversation Prompt"
          >
            <Typography variant="h6" gutterBottom>
              Conversation Prompt
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Edit your AI Customer conversation prompt
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={prompt || ""}
              label="Prompt"
              placeholder="Enter a conversation prompt for the AI customer..."
              onChange={(e) => {
                console.log("Prompt change:", e.target.value);
                if (onPromptChange) {
                  onPromptChange(e.target.value);
                }
              }}
              InputProps={{
                style: { fontSize: "14px" },
              }}
              inputProps={{
                style: { cursor: "text" },
              }}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#FFFFFF",
                },
                "& .MuiOutlinedInput-root": {
                  "&:hover fieldset": {
                    borderColor: "#444CE7",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#444CE7",
                  },
                },
              }}
            />
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ flex: 1, display: "block" }}
              >
                The conversation prompt helps guide the AI in how it should
                respond during the simulation. You can customize this to match
                your training scenarios.
              </Typography>
            </Stack>
          </Card>
        )}

        {/* Simulation Completion */}
        <Card
          sx={{ p: 2, borderRadius: 2, boxShadow: 3, mb: 3 }}
          data-section="Simulation Completion"
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
            <Box>
              <Typography variant="h6">Simulation Completion</Typography>
              <Typography color="text.secondary">
                Set no. of repetitions needed on each simulation for success
              </Typography>
            </Box>
            <Controller
              name="repetitionsNeeded"
              control={control}
              render={({ field }) => (
                <FormControl sx={{ width: 100 }}>
                  <Select
                    {...field}
                    size="small"
                    value={field.value}
                    onChange={(e) => {
                      console.log(
                        "Repetitions needed changed to:",
                        e.target.value,
                      );
                      field.onChange(e.target.value);
                    }}
                  >
                    <MenuItem value="2">2x</MenuItem>
                    <MenuItem value="3">3x</MenuItem>
                    <MenuItem value="4">4x</MenuItem>
                    <MenuItem value="5">5x</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          <Divider sx={{ mb: 3, bgcolor: "grey.300" }} />

          {/* Number of Repetition Allowed */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}
            data-section="Number of Repetition Allowed"
          >
            <Box>
              <Typography variant="h6">
                Number of Repetitions Allowed
              </Typography>
              <Typography color="text.secondary">
                Set max no. of repetitions allowed for this simulation
              </Typography>
            </Box>
            <Controller
              name="repetitionsAllowed"
              control={control}
              render={({ field }) => (
                <FormControl sx={{ width: 100 }}>
                  <Select
                    {...field}
                    size="small"
                    value={field.value}
                    onChange={(e) => {
                      console.log(
                        "Repetitions allowed changed to:",
                        e.target.value,
                      );
                      field.onChange(e.target.value);
                    }}
                  >
                    <MenuItem value="3">3x</MenuItem>
                    <MenuItem value="4">4x</MenuItem>
                    <MenuItem value="5">5x</MenuItem>
                    <MenuItem value="6">6x</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Box>

          {/* Final Simulation Score */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Final Simulation Score
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Set what will be the final score for this simulation if user do
              multiple attempts
            </Typography>
            <Controller
              name="simulationScore"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={() => {
                      console.log("Setting simulation score to: best");
                      field.onChange("best");
                    }}
                    sx={{
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: field.value === "best" ? "#143FDA" : "gray",
                      color: field.value === "best" ? "#143FDA" : "gray",
                      backgroundColor: "transparent",
                      "&:hover": {
                        borderColor:
                          field.value === "best" ? "#143FDA" : "gray",
                        color: field.value === "best" ? "#143FDA" : "gray",
                      },
                    }}
                  >
                    Best of 3 attempts
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("Setting simulation score to: last");
                      field.onChange("last");
                    }}
                    sx={{
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: field.value === "last" ? "#143FDA" : "gray",
                      color: field.value === "last" ? "#143FDA" : "gray",
                      backgroundColor: "transparent",
                      "&:hover": {
                        borderColor:
                          field.value === "last" ? "#143FDA" : "gray",
                        color: field.value === "last" ? "#143FDA" : "gray",
                      },
                    }}
                  >
                    Last attempt
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("Setting simulation score to: average");
                      field.onChange("average");
                    }}
                    sx={{
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor:
                        field.value === "average" ? "#143FDA" : "gray",
                      color: field.value === "average" ? "#143FDA" : "gray",
                      backgroundColor: "transparent",
                      "&:hover": {
                        borderColor:
                          field.value === "average" ? "#143FDA" : "gray",
                        color: field.value === "average" ? "#143FDA" : "gray",
                      },
                    }}
                  >
                    Average of all attempts
                  </Button>
                </Box>
              )}
            />
          </Box>

          <Divider sx={{ mb: 3, bgcolor: "grey.300" }} />

          {/* Enhanced Simulation Scoring Metrics */}
          <Box sx={{ mb: 3 }} data-section="Simulation Scoring Metrics">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Simulation Scoring Metrics</Typography>
              <Controller
                name="scoringMetrics.enabled"
                control={control}
                render={({ field }) => (
                  <Switch {...field} checked={field.value} />
                )}
              />
            </Box>
            <Typography color="text.secondary" gutterBottom>
              Set min. values needed on different scoring metrics for plan
              success
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                {/* Percentage-based scoring metrics (original) */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="scoringMetrics.keywordScore"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Keyword Score (%)</InputLabel>
                        <Select
                          {...field}
                          label="Keyword Score (%)"
                          disabled={!scoringMetricsEnabled || isVisualOnly}
                        >
                          {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="scoringMetrics.clickScore"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Click Score (%)</InputLabel>
                        <Select
                          {...field}
                          label="Click Score (%)"
                          disabled={!scoringMetricsEnabled || !isAnyVisualType}
                        >
                          {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* New point-based metrics */}
                <Grid item xs={12} md={6}>
                  <Controller
                    name="pointsPerKeyword"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Points per Keyword</InputLabel>
                        <Select
                          {...field}
                          label="Points per Keyword"
                          disabled={!scoringMetricsEnabled || isVisualOnly}
                        >
                          {DEFAULT_POINT_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="pointsPerClick"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Points per Click</InputLabel>
                        <Select
                          {...field}
                          label="Points per Click"
                          disabled={!scoringMetricsEnabled || !isAnyVisualType}
                        >
                          {DEFAULT_POINT_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          {/* New Score Metric Weightage section */}
          <Box sx={{ mb: 3 }} data-section="Score Metric Weightage">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="h6">Score Metric Weightage</Typography>
                <IconButton size="small" color="primary">
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Typography color="text.secondary" gutterBottom>
              Set percentage allocation for each metric (total must be 100%)
            </Typography>

            {weightageError && (
              <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
                {weightageError}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Only show for visual types */}
              {isAnyVisualType && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name="metricWeightage.clickAccuracy"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Click Accuracy</InputLabel>
                        <Select {...field} label="Click Accuracy">
                          {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Only show for non-visual only types */}
              {!isVisualOnly && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name="metricWeightage.keywordAccuracy"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Keyword Accuracy</InputLabel>
                        <Select {...field} label="Keyword Accuracy">
                          {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Only show for visual types */}
              {isAnyVisualType && (
                <Grid item xs={12} md={6}>
                  <Controller
                    name="metricWeightage.dataEntryAccuracy"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Data Entry Accuracy</InputLabel>
                        <Select {...field} label="Data Entry Accuracy">
                          {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                            <MenuItem key={val} value={val}>
                              {val}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Show for all types */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="metricWeightage.contextualAccuracy"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Contextual Accuracy</InputLabel>
                      <Select {...field} label="Contextual Accuracy">
                        {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* Show for all types */}
              <Grid item xs={12} md={6}>
                <Controller
                  name="metricWeightage.sentimentMeasures"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Sentiment Measures</InputLabel>
                      <Select {...field} label="Sentiment Measures">
                        {DEFAULT_PERCENTAGE_VALUES.map((val) => (
                          <MenuItem key={val} value={val}>
                            {val}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ mb: 3, bgcolor: "grey.300" }} />

          {/* Sym Practice */}
          <Box data-section="Sym Practice">
            <Typography variant="h6" gutterBottom>
              Sym Practice
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Allows trainees to practice before test without impacting scores
            </Typography>
            <Controller
              name="practiceMode"
              control={control}
              render={({ field }) => (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    onClick={() => {
                      console.log("Setting practice mode to: unlimited");
                      field.onChange("unlimited");
                    }}
                    sx={{
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor:
                        field.value === "unlimited" ? "#143FDA" : "gray",
                      color: field.value === "unlimited" ? "#143FDA" : "gray",
                      backgroundColor: "transparent",
                      "&:hover": {
                        borderColor:
                          field.value === "unlimited" ? "#143FDA" : "gray",
                        color: field.value === "unlimited" ? "#143FDA" : "gray",
                      },
                    }}
                  >
                    Unlimited
                  </Button>
                  <Button
                    onClick={() => {
                      console.log("Setting practice mode to: limited");
                      field.onChange("limited");
                    }}
                    sx={{
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor:
                        field.value === "limited" ? "#143FDA" : "gray",
                      color: field.value === "limited" ? "#143FDA" : "gray",
                      backgroundColor: "transparent",
                      "&:hover": {
                        borderColor:
                          field.value === "limited" ? "#143FDA" : "gray",
                        color: field.value === "limited" ? "#143FDA" : "gray",
                      },
                    }}
                  >
                    Prerequisite Limited
                  </Button>
                </Box>
              )}
            />
          </Box>
        </Card>
      </form>
    </Box>
  );
};

export default VoiceAndScoreSettings;
