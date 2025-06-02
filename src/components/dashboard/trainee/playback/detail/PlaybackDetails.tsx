import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SimIcon from '@mui/icons-material/SimCard';
import TimerIcon from '@mui/icons-material/AccessTime';
import MouseIcon from '@mui/icons-material/Mouse';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PowerIcon from '@mui/icons-material/Power';
import PsychologyIcon from '@mui/icons-material/Psychology';
import dayjs from 'dayjs';

import ScoreDetailsCard from './ScoreDetailsCard';
import InsightsDialog from './InsightsDialog';
import { useAuth } from '../../../../../context/AuthContext';
import {
  FetchPlaybackByIdRowDataResponse,
  fetchPlaybackInsights,
  FetchPlaybackInsightsResponse,
} from '../../../../../services/playback';

interface PlaybackDetailsProps {
  playbackData: FetchPlaybackByIdRowDataResponse;
  onClose: () => void;
}

const PlaybackDetails: React.FC<PlaybackDetailsProps> = ({ playbackData, onClose }) => {
  const { user } = useAuth();
  const [isInsightsDialogOpen, setIsInsightsDialogOpen] = useState(false);
  const [insights, setInsights] = useState<FetchPlaybackInsightsResponse | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const formattedDate = dayjs(playbackData.completedAt).format('MMM D, YYYY');
  const isPassed = playbackData.simAccuracyScore >= playbackData.minPassingScore;

  const handleViewInsights = async () => {
    if (!user?.id) return;
    setIsLoadingInsights(true);
    setInsightsError(null);
    try {
      const simulationId = playbackData.id.includes('-')
        ? playbackData.id.split('-')[0]
        : playbackData.id;
      const simulationType = playbackData.type?.replace(/-/g, '_');
      const data = await fetchPlaybackInsights({
        user_id: user.id,
        attempt_id: playbackData.id,
        simulation_id: simulationId,
        simulation_type: simulationType,
      });
      setInsights(data);
      setIsInsightsDialogOpen(true);
    } catch (err) {
      setInsightsError('Failed to load insights.');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, width: 360 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          Simulation Details
        </Typography>
        <IconButton onClick={onClose} sx={{ ml: 'auto' }} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Table size="small" aria-label="simulation-meta">
        <TableBody>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Sim Name &amp; ID
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight={600}>
                {playbackData.name} ({playbackData.id})
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Completion Date
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight={600}>
                {formattedDate}
              </Typography>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Sim Type
              </Typography>
            </TableCell>
            <TableCell>
              <Box display="flex" columnGap={1}>
                {playbackData.type && (
                  <Chip label={playbackData.type} size="small" variant="outlined" />
                )}
                {playbackData.simLevel && (
                  <Chip label={playbackData.simLevel} size="small" variant="outlined" />
                )}
              </Box>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Typography variant="caption" color="text.secondary">
                Attempt Type
              </Typography>
            </TableCell>
            <TableCell>
              <Typography variant="body2" fontWeight={600}>
                {playbackData.attemptType}
              </Typography>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <Box mt={3}>
        <Box display="flex" alignItems="center" columnGap={2} flexWrap="wrap">
          <Typography variant="h6">Score Details</Typography>
          <Chip
            color="secondary"
            variant="outlined"
            size="small"
            label={`Min passing score: ${playbackData.minPassingScore}%`}
          />
          <Chip
            color={isPassed ? 'success' : 'error'}
            size="small"
            label={isPassed ? 'Passed' : 'Failed'}
          />
        </Box>
        <Box
          display="grid"
          gridTemplateColumns="repeat(2,1fr)"
          rowGap={2}
          columnGap={2}
          mt={2}
        >
          <ScoreDetailsCard
            icon={<SimIcon fontSize="small" />}
            label="Sim Score"
            value={`${playbackData.simAccuracyScore}%`}
          />
          <ScoreDetailsCard
            icon={<TimerIcon fontSize="small" />}
            label="Completion Time"
            value={playbackData.timeTakenSeconds}
          />
          <ScoreDetailsCard
            icon={<MouseIcon fontSize="small" />}
            label="Click Score"
            value={`${playbackData.clickScore.toFixed(2)}%`}
          />
          <ScoreDetailsCard
            icon={<TextFieldsIcon fontSize="small" />}
            label="Keyword Score"
            value={`${playbackData.keywordScore}%`}
          />
          <ScoreDetailsCard
            icon={<TextFieldsIcon fontSize="small" />}
            label="Text Field Keyword Score"
            value={`${playbackData.textFieldKeywordScore}%`}
          />
          <ScoreDetailsCard
            icon={<CheckCircleIcon fontSize="small" />}
            label="Contextual Accuracy Score"
            value={`${playbackData.simAccuracyScore}%`}
          />
          <ScoreDetailsCard
            icon={<VisibilityIcon fontSize="small" />}
            label="Confidence"
            value={`${playbackData.confidence}%`}
          />
          <ScoreDetailsCard
            icon={<PsychologyIcon fontSize="small" />}
            label="Concentration"
            value={`${playbackData.concentration}%`}
          />
          <ScoreDetailsCard
            icon={<PowerIcon fontSize="small" />}
            label="Energy"
            value={`${playbackData.energy}%`}
          />
          <ScoreDetailsCard
            icon={<TimerIcon fontSize="small" />}
            label="Dead Air Time"
            value={`${playbackData.timeTakenSeconds}`}
          />
        </Box>
      </Box>

      <Box mt={3}>
        <Button
          fullWidth
          variant="text"
          onClick={handleViewInsights}
          disabled={isLoadingInsights}
        >
          {isLoadingInsights ? 'Loading Insights...' : 'View Insight'}
        </Button>
        {insightsError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {insightsError}
          </Typography>
        )}
      </Box>

      <InsightsDialog
        open={isInsightsDialogOpen}
        onClose={() => setIsInsightsDialogOpen(false)}
        insights={insights}
        isLoading={isLoadingInsights}
      />
    </Paper>
  );
};

export default PlaybackDetails;
