import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Stack,
  Collapse,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ChatBubble as ChatIcon,
  Psychology as PsychologyIcon,
  BatteryChargingFull as EnergyIcon,
  AccessTime as TimeIcon,
  Mouse as MouseIcon,
  TextFields as TextFieldsIcon,
  CheckCircle as CheckCircleIcon,
  Translate as TranslateIcon,
} from '@mui/icons-material';
import { FetchPlaybackInsightsResponse } from '../../../../../services/playback';

interface InsightsDialogProps {
  open: boolean;
  onClose: () => void;
  insights: FetchPlaybackInsightsResponse | null;
  isLoading: boolean;
}

const InsightsDialog: React.FC<InsightsDialogProps> = ({
  open,
  onClose,
  insights,
  isLoading,
}) => {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    confidence: true,
    concentration: false,
    energy: false,
    dead_air_time: false,
    click_score: false,
    keyword_score: false,
    text_field_keyword_score: false,
    sim_accuracy_score: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'confidence':
        return <ChatIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'concentration':
        return <PsychologyIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'energy':
        return <EnergyIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'dead_air_time':
        return <TimeIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'click_score':
        return <MouseIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'keyword_score':
        return <TranslateIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'text_field_keyword_score':
        return <TextFieldsIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'sim_accuracy_score':
        return <CheckCircleIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      default:
        return <ChatIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
    }
  };

  const formatCategoryTitle = (category: string): string => {
    switch (category) {
      case 'confidence':
        return 'Confidence';
      case 'concentration':
        return 'Concentration';
      case 'energy':
        return 'Energy';
      case 'dead_air_time':
        return 'Dead Air Time';
      case 'click_score':
        return 'Click Score';
      case 'keyword_score':
        return 'Keyword Score';
      case 'text_field_keyword_score':
        return 'Text Field Keyword Score';
      case 'sim_accuracy_score':
        return 'Sim Accuracy Score';
      default:
        return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 600,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '8px',
              bgcolor: '#F5F6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChatIcon sx={{ color: '#444CE7' }} />
          </Box>
          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Insights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View detailed insights of your simulation score
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>Loading insights...</Typography>
          </Box>
        ) : !insights ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No insights available</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 'calc(90vh - 100px)', overflow: 'auto' }}>
            {/* Confidence Section */}
            {insights.insights.confidence && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('confidence')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.confidence ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('confidence')}
                    <Typography variant="subtitle1">Confidence</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.confidence.score}
                    </Typography>
                    {expandedSections.confidence ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.confidence}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    {insights.insights.confidence.things_done_well.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, color: 'success.main' }}
                        >
                          Things Done Well:
                        </Typography>
                        {insights.insights.confidence.things_done_well.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}

                    {insights.insights.confidence.things_to_improve.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, mt: 2, color: 'warning.main' }}
                        >
                          Things to improve:
                        </Typography>
                        {insights.insights.confidence.things_to_improve.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Concentration Section */}
            {insights.insights.concentration && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('concentration')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.concentration ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('concentration')}
                    <Typography variant="subtitle1">Concentration</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.concentration.score}
                    </Typography>
                    {expandedSections.concentration ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.concentration}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    {insights.insights.concentration.things_done_well.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, color: 'success.main' }}
                        >
                          Things Done Well:
                        </Typography>
                        {insights.insights.concentration.things_done_well.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}

                    {insights.insights.concentration.things_to_improve.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, mt: 2, color: 'warning.main' }}
                        >
                          Things to improve:
                        </Typography>
                        {insights.insights.concentration.things_to_improve.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Energy Section */}
            {insights.insights.energy && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('energy')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.energy ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('energy')}
                    <Typography variant="subtitle1">Energy</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.energy.score}
                    </Typography>
                    {expandedSections.energy ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.energy}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    {insights.insights.energy.things_done_well.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, color: 'success.main' }}
                        >
                          Things Done Well:
                        </Typography>
                        {insights.insights.energy.things_done_well.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}

                    {insights.insights.energy.things_to_improve.length > 0 && (
                      <>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, mt: 2, color: 'warning.main' }}
                        >
                          Things to improve:
                        </Typography>
                        {insights.insights.energy.things_to_improve.map((item, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {index + 1}. {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        ))}
                      </>
                    )}
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Dead Air Time Section */}
            {insights.insights.dead_air_time && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('dead_air_time')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.dead_air_time ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('dead_air_time')}
                    <Typography variant="subtitle1">Dead Air Time</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.dead_air_time.percentage}
                    </Typography>
                    {expandedSections.dead_air_time ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.dead_air_time}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {insights.insights.dead_air_time.description}
                    </Typography>
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Click Score Section */}
            {insights.insights.click_score && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('click_score')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.click_score ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('click_score')}
                    <Typography variant="subtitle1">Click Score</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.click_score.score}/{insights.insights.click_score.total}
                    </Typography>
                    {expandedSections.click_score ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.click_score}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {insights.insights.click_score.description}
                    </Typography>
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Keyword Score Section */}
            {insights.insights.keyword_score && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('keyword_score')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.keyword_score ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('keyword_score')}
                    <Typography variant="subtitle1">Keyword Score</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.keyword_score.score}/{insights.insights.keyword_score.total}
                    </Typography>
                    {expandedSections.keyword_score ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.keyword_score}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {insights.insights.keyword_score.description}
                    </Typography>
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Text Field Keyword Score Section */}
            {insights.insights.text_field_keyword_score && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('text_field_keyword_score')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.text_field_keyword_score
                      ? '#F5F6FF'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('text_field_keyword_score')}
                    <Typography variant="subtitle1">Text Field Keyword Score</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.text_field_keyword_score.score}/
                      {insights.insights.text_field_keyword_score.total}
                    </Typography>
                    {expandedSections.text_field_keyword_score ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.text_field_keyword_score}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {insights.insights.text_field_keyword_score.description}
                    </Typography>
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}

            {/* Sim Accuracy Score Section */}
            {insights.insights.sim_accuracy_score && (
              <Box sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection('sim_accuracy_score')}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections.sim_accuracy_score
                      ? '#F5F6FF'
                      : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory('sim_accuracy_score')}
                    <Typography variant="subtitle1">Sim Accuracy Score</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="subtitle1" fontWeight="bold">
                      {insights.insights.sim_accuracy_score.percentage}
                    </Typography>
                    {expandedSections.sim_accuracy_score ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections.sim_accuracy_score}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      {insights.insights.sim_accuracy_score.description}
                    </Typography>
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InsightsDialog;