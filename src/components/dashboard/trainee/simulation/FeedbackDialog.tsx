import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  IconButton, 
  Typography, 
  Box, 
  Button, 
  Stack,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Divider
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';

// Feedback form data structure
interface FeedbackFormData {
  effectivenessRating: string;
  objectivesClarityRating: string;
  skillsAcquisition: string;
  confidenceRating: string;
  scoringEffectivenessRating: string;
  impactfulPart: string;
  improvementSuggestions: string;
}

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => void;
  simulationId: string;
  attemptId: string;
  simulationName?: string;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  onClose,
  onSubmit,
  simulationId,
  attemptId,
  simulationName,
}) => {
  const { control, handleSubmit, reset, formState: { isValid }, watch } = useForm<FeedbackFormData>({
    mode: 'onChange',
    defaultValues: {
      effectivenessRating: '',
      objectivesClarityRating: '',
      skillsAcquisition: '',
      confidenceRating: '',
      scoringEffectivenessRating: '',
      impactfulPart: '',
      improvementSuggestions: ''
    }
  });

  // Watch all required fields to determine if form is valid
  const watchedFields = watch(['effectivenessRating', 'objectivesClarityRating', 'skillsAcquisition', 'confidenceRating', 'scoringEffectivenessRating']);
  const allRequiredFieldsFilled = watchedFields.every(field => field && field !== '');

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const handleFormSubmit = (data: FeedbackFormData) => {
    onSubmit(data);
    onClose();
  };

  const renderRatingButtons = (name: keyof FeedbackFormData) => {
    return (
      <Controller
        name={name}
        control={control}
        rules={{ required: true }}
        render={({ field }) => (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <Button
                key={value}
                variant={field.value === value.toString() ? "contained" : "outlined"}
                onClick={() => field.onChange(value.toString())}
                sx={{
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  p: 0,
                  borderRadius: '6px',
                  color: field.value === value.toString() ? 'white' : '#666',
                  border: `1px solid ${field.value === value.toString() ? '#143FDA' : 'rgba(0, 0, 0, 0.2)'}`,
                  bgcolor: field.value === value.toString() ? '#143FDA' : 'transparent',
                  '&:hover': {
                    bgcolor: field.value === value.toString() ? '#143FDA' : '#F5F6FF',
                    borderColor: '#143FDA',
                  },
                }}
              >
                {value}
              </Button>
            ))}
          </Stack>
        )}
      />
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }
      }}
    >
      {/* Fixed Header */}
      <DialogTitle 
        sx={{ 
          p: 3, 
          pb: 2,
          position: 'sticky',
          top: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: '#F5F6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="svg"
              sx={{ width: 24, height: 24, color: '#143FDA' }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.2L4 17.2V4H20V16Z" />
              <path d="M11 12H13V14H11V12ZM11 6H13V10H11V6Z" />
            </Box>
          </Box>
          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Share Feedback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              How was your simulation attempt? Share your experience to help us enhance the experience.
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* Scrollable Content */}
      <DialogContent 
        sx={{ 
          p: 3, 
          pt: 1,
          flex: 1,
          overflow: 'auto',
          pb: '100px', // Add padding bottom to account for fixed footer
        }}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} id="feedback-form">
          <Stack spacing={0}>
            {/* Effectiveness Rating */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium">
                Overall, how effective was this simulation in preparing you for the specific work area it targeted?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all effective, 10 = Extremely effective)
              </Typography>
              {renderRatingButtons('effectivenessRating')}
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Objectives Clarity Rating */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium">
                How clear were the objectives and instructions provided for this simulation?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Very unclear, 10 = Very clear)
              </Typography>
              {renderRatingButtons('objectivesClarityRating')}
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Skills Acquisition */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium">
                Did you acquire the necessary skills from this simulation to handle the specific work area it was designed for?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                (Select one option)
              </Typography>
              <Controller
                name="skillsAcquisition"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <RadioGroup {...field}>
                      <FormControlLabel 
                        value="Strongly Disagree" 
                        control={<Radio sx={{ color: '#143FDA', '&.Mui-checked': { color: '#143FDA' } }} />} 
                        label="Strongly Disagree" 
                      />
                      <FormControlLabel 
                        value="Disagree" 
                        control={<Radio sx={{ color: '#143FDA', '&.Mui-checked': { color: '#143FDA' } }} />} 
                        label="Disagree" 
                      />
                      <FormControlLabel 
                        value="Neutral" 
                        control={<Radio sx={{ color: '#143FDA', '&.Mui-checked': { color: '#143FDA' } }} />} 
                        label="Neutral" 
                      />
                      <FormControlLabel 
                        value="Agree" 
                        control={<Radio sx={{ color: '#143FDA', '&.Mui-checked': { color: '#143FDA' } }} />} 
                        label="Agree" 
                      />
                      <FormControlLabel 
                        value="Strongly Agree" 
                        control={<Radio sx={{ color: '#143FDA', '&.Mui-checked': { color: '#143FDA' } }} />} 
                        label="Strongly Agree" 
                      />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Confidence Rating */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium">
                How confident do you feel in applying the skills practiced in this simulation to a real call center environment?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all confident, 10 = Extremely confident)
              </Typography>
              {renderRatingButtons('confidenceRating')}
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Scoring Effectiveness Rating */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium">
                How effective was the scoring and insights provided during or after the simulation in helping you improve?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all effective, 10 = Extremely effective)
              </Typography>
              {renderRatingButtons('scoringEffectivenessRating')}
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Impactful Part */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                What was the most impactful part of this simulation for your learning and preparation?
              </Typography>
              <Controller
                name="impactfulPart"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Input text"
                    label="Describe"
                    variant="outlined"
                    sx={{ 
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#143FDA',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#143FDA',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#143FDA',
                        },
                      },
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Optional
              </Typography>
            </Box>

            <Divider sx={{ bgcolor: '#E0E0E0' }} />

            {/* Improvement Suggestions */}
            <Box py={3}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                What could be improved to make this simulation more effective or enjoyable?
              </Typography>
              <Controller
                name="improvementSuggestions"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Input text"
                    label="Describe"
                    variant="outlined"
                    sx={{ 
                      mt: 1,
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#143FDA',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#143FDA',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#143FDA',
                        },
                      },
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Optional
              </Typography>
            </Box>
          </Stack>
        </form>
      </DialogContent>

      {/* Fixed Footer */}
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          bgcolor: 'background.paper',
          borderTop: '1px solid #E0E0E0',
          p: 3,
          zIndex: 1,
        }}
      >
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: '#E0E0E0',
              color: '#333333',
              '&:hover': {
                borderColor: '#C0C0C0',
                bgcolor: '#F5F5F5',
              },
              borderRadius: 2,
              px: 4,
              py: 1.5,
              flex: 1,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="feedback-form"
            variant="contained"
            disabled={!allRequiredFieldsFilled}
            sx={{
              bgcolor: allRequiredFieldsFilled ? '#143FDA' : '#B0B0B0',
              color: 'white',
              '&:hover': {
                bgcolor: allRequiredFieldsFilled ? '#0F2FBA' : '#B0B0B0',
              },
              '&.Mui-disabled': {
                bgcolor: '#B0B0B0',
                color: 'white',
              },
              borderRadius: 2,
              px: 4,
              py: 1.5,
              flex: 1,
            }}
          >
            Submit Feedback
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
};

export default FeedbackDialog;