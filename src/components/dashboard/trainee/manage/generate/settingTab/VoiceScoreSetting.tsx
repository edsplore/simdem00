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
} from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";
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
  onPromptChange?: (prompt: string) => void; // This is important!
  activeSection?: string;
  showVoiceSettings?: boolean;
  showPromptSettings?: boolean;
}

interface FormData {
  language: string;
  accent: string;
  gender: string;
  ageGroup: string;
  simulationScore: "best" | "last" | "average";
  keywordScore: string;
  clickScore: string;
  practiceMode: "unlimited" | "limited";
  repetitionsAllowed: string;
  repetitionsNeeded: string;
  scoringMetrics: {
    enabled: boolean;
    keywordScore: string;
    clickScore: string;
  };
}

const VoiceAndScoreSettings: React.FC<VoiceScoreSettingProps> = ({
  prompt,
  settings,
  onSettingsChange,
  onPromptChange,
  activeSection,
  showVoiceSettings = true,
  showPromptSettings = true,
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  // Initialize selectedVoice from settings, not empty
  const [selectedVoice, setSelectedVoice] = useState<string>(
    settings.voice.voiceId || "",
  );
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const wavesurferRefs = useRef<{ [key: string]: WaveSurfer }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);

  const { control, handleSubmit, watch, setValue } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      language: settings.voice.language,
      accent: settings.voice.accent,
      gender: settings.voice.gender,
      ageGroup: settings.voice.ageGroup,
      simulationScore: settings.scoring.simulationScore,
      keywordScore: settings.scoring.keywordScore,
      clickScore: settings.scoring.clickScore,
      practiceMode: settings.scoring.practiceMode,
      repetitionsAllowed: settings.scoring.repetitionsAllowed,
      repetitionsNeeded: settings.scoring.repetitionsNeeded,
      scoringMetrics: {
        enabled: settings.scoring.scoringMetrics?.enabled ?? true,
        keywordScore: settings.scoring.scoringMetrics?.keywordScore ?? "20%",
        clickScore: settings.scoring.scoringMetrics?.clickScore ?? "80%",
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

  // Log when component mounts and when settings change
  useEffect(() => {
    console.log("VoiceScore component mounted with settings:", settings);
    console.log("Initial voice ID:", settings.voice.voiceId);
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
            voiceId: selectedVoice || settings.voice.voiceId,
          },
          scoring: {
            simulationScore,
            keywordScore: watch("keywordScore"),
            clickScore: watch("clickScore"),
            practiceMode,
            repetitionsAllowed,
            repetitionsNeeded,
            scoringMetrics: {
              enabled: watch("scoringMetrics.enabled"),
              keywordScore: watch("scoringMetrics.keywordScore"),
              clickScore: watch("scoringMetrics.clickScore"),
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
    if (settings.voice.voiceId && settings.voice.voiceId !== selectedVoice) {
      console.log(
        "Updating selected voice from settings:",
        settings.voice.voiceId,
      );
      setSelectedVoice(settings.voice.voiceId);
    }
  }, [settings.voice.voiceId]);

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
        practiceMode: data.practiceMode,
        repetitionsAllowed: data.repetitionsAllowed,
        repetitionsNeeded: data.repetitionsNeeded,
        scoringMetrics: data.scoringMetrics,
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

              {/* Debug button - only for development */}
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => {
                  console.log("Current prompt value:", prompt);
                  alert(
                    `Current prompt: ${prompt?.substring(0, 50)}${prompt?.length > 50 ? "..." : ""}`,
                  );
                }}
                sx={{
                  display: "none" /* Remove this to enable for debugging */,
                }}
              >
                Debug Prompt
              </Button>
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

          {/* Simulation Scoring Metrics */}
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
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
            >
              <Controller
                name="scoringMetrics.keywordScore"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Keyword Score</InputLabel>
                    <Select
                      {...field}
                      label="Keyword Score"
                      disabled={!scoringMetricsEnabled}
                    >
                      <MenuItem value="20%">20%</MenuItem>
                      <MenuItem value="30%">30%</MenuItem>
                      <MenuItem value="40%">40%</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="scoringMetrics.clickScore"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Click Score</InputLabel>
                    <Select
                      {...field}
                      label="Click Score"
                      disabled={!scoringMetricsEnabled}
                    >
                      <MenuItem value="60%">60%</MenuItem>
                      <MenuItem value="70%">70%</MenuItem>
                      <MenuItem value="80%">80%</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
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
