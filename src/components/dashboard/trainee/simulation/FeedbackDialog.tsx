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
  FormLabel
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
  simulationName: string;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  open,
  onClose,
  onSubmit,
  simulationName
}) => {
  const { control, handleSubmit, reset } = useForm<FeedbackFormData>({
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
                  borderRadius: '50%',
                  color: field.value === value.toString() ? 'white' : '#343F8A',
                  borderColor: field.value === value.toString() ? '#343F8A' : '#E0E0E0',
                  bgcolor: field.value === value.toString() ? '#343F8A' : 'transparent',
                  '&:hover': {
                    bgcolor: field.value === value.toString() ? '#343F8A' : '#F5F6FF',
                    borderColor: '#343F8A',
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
        }
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
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
              sx={{ width: 24, height: 24, color: '#343F8A' }}
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

      <DialogContent sx={{ p: 3, pt: 1 }}>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={4}>
            {/* Effectiveness Rating */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                Overall, how effective was this simulation in preparing you for the specific work area it targeted?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all effective, 10 = Extremely effective)
              </Typography>
              {renderRatingButtons('effectivenessRating')}
            </Box>

            {/* Objectives Clarity Rating */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                How clear were the objectives and instructions provided for this simulation?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Very unclear, 10 = Very clear)
              </Typography>
              {renderRatingButtons('objectivesClarityRating')}
            </Box>

            {/* Skills Acquisition */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                Did you acquire the necessary skills from this simulation to handle the specific work area it was designed for?
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                (Select one option)
              </Typography>
              <Controller
                name="skillsAcquisition"
                control={control}
                render={({ field }) => (
                  <FormControl component="fieldset">
                    <RadioGroup {...field}>
                      <FormControlLabel value="Strongly Disagree" control={<Radio />} label="Strongly Disagree" />
                      <FormControlLabel value="Disagree" control={<Radio />} label="Disagree" />
                      <FormControlLabel value="Neutral" control={<Radio />} label="Neutral" />
                      <FormControlLabel value="Agree" control={<Radio />} label="Agree" />
                      <FormControlLabel value="Strongly Agree" control={<Radio />} label="Strongly Agree" />
                    </RadioGroup>
                  </FormControl>
                )}
              />
            </Box>

            {/* Confidence Rating */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                How confident do you feel in applying the skills practiced in this simulation to a real call center environment?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all confident, 10 = Extremely confident)
              </Typography>
              {renderRatingButtons('confidenceRating')}
            </Box>

            {/* Scoring Effectiveness Rating */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
                How effective was the scoring and insights provided during or after the simulation in helping you improve?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                On a scale of 1 to 10 (1 = Not at all effective, 10 = Extremely effective)
              </Typography>
              {renderRatingButtons('scoringEffectivenessRating')}
            </Box>

            {/* Impactful Part */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
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
                    placeholder="Describe"
                    sx={{ mt: 1 }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Optional
              </Typography>
            </Box>

            {/* Improvement Suggestions */}
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">
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
                    placeholder="Describe"
                    sx={{ mt: 1 }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Optional
              </Typography>
            </Box>

            {/* Action Buttons */}
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
                variant="contained"
                sx={{
                  bgcolor: '#0037ff',
                  color: 'white',
                  '&:hover': {
                    bgcolor: '#002ed4',
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
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;