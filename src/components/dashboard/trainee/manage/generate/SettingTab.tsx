import { useState } from "react";
import { Stack, Typography, Box, List, ListItem, ListItemText, Card, styled, Button } from '@mui/material';
import { publishSimulation } from '../../../../../services/simulation';
import type { SimulationPayload } from '../../../../../services/simulation';
import AdvancedSettings from './AdvancedSetting';
import VoiceAndScoreSettings from './VoiceScoreSetting';
import PreviewTab from '../PreviewTab';

// ... rest of the imports remain the same ...

const SettingsTab: React.FC<SettingsTabProps> = ({ simulationId, prompt, simulationData, script }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [publishedSimId, setPublishedSimId] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!simulationId || !simulationData) return;

    setIsPublishing(true);
    try {
      // Transform script to required format
      const transformedScript = script?.map(({ id, ...rest }) => ({
        ...rest,
        script_sentence: rest.message,
        role: rest.role.toLowerCase() === 'trainee' ? 'assistant' : rest.role.toLowerCase()
      }));

      const payload: SimulationPayload = {
        user_id: "userId1",
        name: simulationData.name,
        division_id: simulationData.division,
        department_id: simulationData.department,
        type: simulationData.simulationType.toLowerCase(),
        tags: simulationData.tags,
        status: "published",
        lvl1: {
          is_enabled: true,
          enable_practice: true,
          hide_agent_script: false,
          hide_customer_script: false,
          hide_keyword_scores: false,
          hide_sentiment_scores: true,
          hide_highlights: false,
          hide_coaching_tips: true,
          enable_post_simulation_survey: true,
          ai_powered_pauses_and_feedback: true
        },
        lvl2: {
          is_enabled: false
        },
        lvl3: {
          is_enabled: false
        },
        estimated_time_to_attempt_in_mins: 15,
        key_objectives: [
          "Learn basic customer service",
          "Understand refund process"
        ],
        overview_video: "https://example.com/overview.mp4",
        quick_tips: [
          "Listen to the customer carefully.",
          "Be polite and empathetic.",
          "Provide accurate information."
        ],
        voice_id: "11labs-Adrian",
        language: "English",
        mood: "Neutral",
        voice_speed: "Normal",
        prompt: prompt,
        simulation_completion_repetition: 3,
        simulation_max_repetition: 5,
        final_simulation_score_criteria: "Best of three",
        simulation_scoring_metrics: {
          is_enabled: true,
          keyword_score: 20,
          click_score: 80
        },
        sim_practice: {
          is_unlimited: false,
          pre_requisite_limit: 3
        },
        is_locked: false,
        version: 1,
        script: transformedScript
      };

      const response = await publishSimulation(simulationId, payload);
      
      if (response.status === 'success') {
        setPublishedSimId(simulationId);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error publishing simulation:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // ... rest of the component remains the same ...
};

export default SettingsTab;