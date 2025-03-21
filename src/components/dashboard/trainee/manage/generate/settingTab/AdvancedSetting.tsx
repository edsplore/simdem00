import React from 'react';
import { useForm, Controller } from 'react-hook-form';
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
} from '@mui/material';
import {
  AudioFile,
  Visibility,
  ChatBubble,
  PlayCircle,
} from '@mui/icons-material';

// Styled components remain the same...
const StyledSwitch = styled(Switch)(({ theme }) => ({
  width: 44,
  height: 24,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    margin: 2,
    transitionDuration: '300ms',
    '&.Mui-checked': {
      transform: 'translateX(20px)',
      color: '#fff',
      '& + .MuiSwitch-track': {
        backgroundColor: '#444CE7',
        opacity: 1,
        border: 0,
      },
    },
  },
  '& .MuiSwitch-thumb': {
    boxSizing: 'border-box',
    width: 20,
    height: 20,
  },
  '& .MuiSwitch-track': {
    borderRadius: 26 / 2,
    backgroundColor: '#E9E9EA',
    opacity: 1,
  },
}));

interface SimulationType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface AdvancedSettingsFormData {
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
  };
  quickTips: {
    enabled: boolean;
    text: string;
  };
}

const simulationTypes: SimulationType[] = [
  {
    id: 'audio',
    title: 'Audio',
    description: 'Interactive audio call session simulation',
    icon: <AudioFile sx={{ fontSize: 24, color: '#444CE7' }} />,
  },
  {
    id: 'visual-audio',
    title: 'Visual - Audio',
    description: 'Audio simulation with click-through visuals',
    icon: <Visibility sx={{ fontSize: 24, color: '#444CE7' }} />,
  },
  {
    id: 'chat',
    title: 'Chat',
    description: 'Interactive text chat simulation',
    icon: <ChatBubble sx={{ fontSize: 24, color: '#444CE7' }} />,
  },
  {
    id: 'visual-chat',
    title: 'Visual - Chat',
    description: 'Chat Simulation with click-through visuals',
    icon: <Visibility sx={{ fontSize: 24, color: '#444CE7' }} />,
  },
  {
    id: 'visual',
    title: 'Visual Only',
    description: 'Click-through visuals only',
    icon: <Visibility sx={{ fontSize: 24, color: '#444CE7' }} />,
  },
];

const defaultSettings = {
  simulationLevels: {
    id: 'simulationLevels',
    name: 'Choose Simulation Levels',
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  practice: {
    id: 'practice',
    name: 'Enable Practice',
    levels: { lvl1: true, lvl2: false, lvl3: false },
  },
  hideAgentScript: {
    id: 'hideAgentScript',
    name: 'Hide Agent Script',
    description:
      'This will hide the agent responses from the conversation script',
    levels: { lvl1: true, lvl2: false, lvl3: false },
  },
  hideCustomerScript: {
    id: 'hideCustomerScript',
    name: 'Hide Customer Script',
    description:
      'This will hide the customer responses in the conversation script',
    levels: { lvl1: false, lvl2: true, lvl3: false },
  },
  hideKeywordScores: {
    id: 'hideKeywordScores',
    name: 'Hide Keyword Scores',
    description: 'This will hide the keyword scoring from the agent',
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  hideSentimentScores: {
    id: 'hideSentimentScores',
    name: 'Hide Sentiment Scores',
    description: 'This will hide the sentiments scoring from the agent',
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  hideHighlights: {
    id: 'hideHighlights',
    name: 'Hide Highlights',
    description:
      'This will hide the frame around the highlights. Hotspots will still be active',
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
  hideCoachingTips: {
    id: 'hideCoachingTips',
    name: 'Hide Coaching Tips',
    description: 'This will hide and disable coaching tips',
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  enablePostSurvey: {
    id: 'enablePostSurvey',
    name: 'Enable Post Simulations Survey',
    description:
      'This will enable the post simulation survey upon first completion attempt',
    levels: { lvl1: false, lvl2: false, lvl3: false },
  },
  aiPoweredPauses: {
    id: 'aiPoweredPauses',
    name: 'AI Powered Pauses and Feedback',
    description:
      'This will enable the post simulation survey upon first completion attempt',
    levels: { lvl1: true, lvl2: true, lvl3: false },
  },
};

const AdvancedSettings = () => {
  const { control, handleSubmit, watch } = useForm<AdvancedSettingsFormData>({
    defaultValues: {
      simulationType: 'audio',
      settings: Object.fromEntries(
        Object.entries(defaultSettings).map(([key, value]) => [
          key,
          value.levels,
        ])
      ),
      estimatedTime: {
        enabled: false,
        value: '10 mins',
      },
      objectives: {
        enabled: false,
        text: '1:Ensure effective communication through different media.\n2: Develop decision-making skills through realistic scenarios.\n3: Improve response time and adaptability in different situations.\n4: Reinforce learning through interactive feedback and analysis.',
      },
      overviewVideo: {
        enabled: false,
      },
      quickTips: {
        enabled: false,
        text: '1:Ensure effective communication through different media.\n2: Develop decision-making skills through realistic scenarios.\n3: Improve response time and adaptability in different situations.\n4: Reinforce learning through interactive feedback and analysis.',
      },
    },
  });

  const onSubmit = (data: AdvancedSettingsFormData) => {
    console.log('Form data:', data);
  };

  const selectedSimType = watch('simulationType');

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 1 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Typography sx={{ color: '#9C9C9D', fontWeight: 'medium' }}>
            ADVANCE SETTINGS
          </Typography>

          {/* Simulation Type Card */}
          <Card sx={{ px: 3, py: 2, borderRadius: 5, boxShadow: 2 }}>
            <Stack spacing={1}>
              <Typography variant="h6" sx={{ color: 'black' }}>
                Simulation Type
              </Typography>
              <Typography variant="body2" sx={{ color: '#9C9C9D' }}>
                Configure simulation type for this simulation
              </Typography>

              <Controller
                name="simulationType"
                control={control}
                render={({ field }) => (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: 2,
                    }}
                  >
                    {simulationTypes.map((type) => (
                      <Box
                        key={type.id}
                        onClick={() => field.onChange(type.id)}
                        sx={{
                          p: 2,
                          border: '2px solid',
                          borderColor:
                            field.value === type.id ? '#444CE7' : '#E9E9EA',
                          borderRadius: 4,
                          cursor: 'pointer',
                          bgcolor:
                            field.value === type.id ? '#FFFFFF' : 'transparent',
                          '&:hover': {
                            bgcolor: '#F5F6FF',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: '#F5F6FF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
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
                                    ? '#444CE7'
                                    : 'inherit',
                                fontWeight: 600,
                              }}
                            >
                              {type.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
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

          {/* Settings Table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table>
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow>
                  <TableCell sx={{ width: '30%' }}>Settings</TableCell>
                  <TableCell align="center">Lvl 01</TableCell>
                  <TableCell align="center">Lvl 02</TableCell>
                  <TableCell align="center">Lvl 03</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(defaultSettings).map(([key, setting]) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2" fontWeight="medium">
                          {setting.name}
                        </Typography>
                        {setting.description && (
                          <Typography variant="caption" color="text.secondary">
                            {setting.description}
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    {['lvl1', 'lvl2', 'lvl3'].map((level) => (
                      <TableCell key={level} align="center">
                        <Controller
                          name={`settings.${key}.${level}`}
                          control={control}
                          render={({ field }) => (
                            <StyledSwitch
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                            />
                          )}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Estimated Time Card */}
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: 'black' }}
                >
                  Estimated Time to Attempt
                </Typography>
                <Typography variant="body2" sx={{ color: '#9C9C9D' }}>
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
                  <Select {...field} labelId="time-label" label="Time">
                    <MenuItem value="10 mins">10 mins</MenuItem>
                    <MenuItem value="20 mins">20 mins</MenuItem>
                    <MenuItem value="30 mins">30 mins</MenuItem>
                  </Select>
                </FormControl>
              )}
            />
          </Card>

          {/* Objectives Card */}
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: 'black' }}
                >
                  Key Objectives
                </Typography>
                <Typography variant="body2" sx={{ color: '#9C9C9D' }}>
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
                    sx={{
                      backgroundColor: '#FFFFFF',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#444CE7',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#444CE7',
                        },
                      },
                    }}
                  />
                </Box>
              )}
            />
          </Card>

          {/* Overview Video Card */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    height: 48,
                    width: 48,
                    borderRadius: '50%',
                    bgcolor: '#F5F6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlayCircle sx={{ fontSize: 24, color: '#444CE7' }} />
                </Box>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ bgcolor: '#444CE7' }}
                >
                  Upload Video
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Tips Card */}
          <Card sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 'bold', color: 'black' }}
                >
                  Quick Tips
                </Typography>
                <Typography variant="body2" sx={{ color: '#9C9C9D' }}>
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
                    sx={{
                      backgroundColor: '#FFFFFF',
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: '#444CE7',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#444CE7',
                        },
                      },
                    }}
                  />
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
