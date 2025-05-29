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
  CircularProgress,
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
    ContextualAccuracy: true,
    KeywordScore: false,
    ClickScore: false,
    DataAccuracy: false,
    Confidence: false,
    Energy: false,
    Concentration: false,
    FinalScore: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'Confidence':
        return <ChatIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'Concentration':
        return <PsychologyIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'Energy':
        return <EnergyIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'ContextualAccuracy':
        return <TimeIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'ClickScore':
        return <MouseIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'KeywordScore':
        return <TranslateIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'DataAccuracy':
        return <TextFieldsIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      case 'FinalScore':
        return <CheckCircleIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
      default:
        return <ChatIcon sx={{ color: '#444CE7', fontSize: 20 }} />;
    }
  };

  const formatCategoryTitle = (category: string): string => {
    // Add spaces before capital letters and capitalize the first letter
    return category
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
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
          <Box sx={{ p: 3, textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
            <CircularProgress />
          </Box>
        ) : !insights || !insights.insights ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No insights available</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 'calc(90vh - 100px)', overflow: 'auto' }}>
            {Object.entries(insights.insights).map(([category, insightItems]) => (
              <Box key={category} sx={{ mb: 1 }}>
                <Box
                  onClick={() => toggleSection(category)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: expandedSections[category] ? '#F5F6FF' : 'transparent',
                    '&:hover': {
                      bgcolor: '#F5F6FF',
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {getIconForCategory(category)}
                    <Typography variant="subtitle1">{formatCategoryTitle(category)}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    {expandedSections[category] ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </Stack>
                </Box>
                <Collapse in={expandedSections[category]}>
                  <Box sx={{ p: 2, pl: 6 }}>
                    {Array.isArray(insightItems) && insightItems.map((item, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {index + 1}. {item}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
                <Divider />
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InsightsDialog;