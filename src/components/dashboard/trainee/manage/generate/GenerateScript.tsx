import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Tabs, Tab, Button, Stack, styled } from '@mui/material';
import { createSimulation } from '../../../../../services/simulationCreate';
import type { CreateSimulationPayload } from '../../../../../services/simulationCreate';
import { Lock as LockIcon } from '@mui/icons-material';
import { SimulationWizardProvider, useSimulationWizard } from '../../../../../context/SimulationWizardContext';
import ScriptTab from './ScriptTab';
import VisualsTab from './VisualsTab';
import SettingsTab from './settingTab/SettingTab';
import PreviewTab from './PreviewTab';
import axios from 'axios';

interface TabState {
  script: boolean;
  visuals: boolean;
  settings: boolean;
  preview: boolean;
}

interface SimulationData {
  id: string;
  name: string;
  division: string;
  department: string;
  tags: string[];
  simulationType: 'audio' | 'chat' | 'visual-audio' | 'visual-chat' | 'visual';
}

interface Message {
  id: string;
  role: 'Customer' | 'Trainee';
  message: string;
  keywords: string[];
}

interface SimulationResponse {
  id: string;
  status: string;
  prompt: string;
}

const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: '44px',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTabs-flexContainer': {
    marginBottom: '-1px',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: '44px',
  padding: '10px 20px',
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  marginRight: '4px',
  color: theme.palette.text.secondary,
  boxShadow: '0 -1px 2px rgba(0,0,0,0.05)',
  '&.Mui-selected': {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.primary.main,
    fontWeight: 600,
    zIndex: 1,
  },
  '&:not(.Mui-selected)': {
    backgroundColor: '#F3F4F6',
  },
  '&.preview-tab': {
    opacity: 0.5,
    pointerEvents: 'none',
  },
}));

// Helper function to create simulation with FormData
const createSimulationWithFormData = async (formData: FormData) => {
  const response = await axios.post('/api/simulations/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

const GenerateScriptContent = () => {
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const {
    scriptData,
    setScriptData,
    isScriptLocked,
    setIsScriptLocked,
    visualImages,
    setVisualImages,
    isPublished,
    setIsPublished,
    simulationResponse,
    setSimulationResponse
  } = useSimulationWizard();

  const [enabledTabs, setEnabledTabs] = useState<TabState>({
    script: true,
    visuals: false,
    settings: false,
    preview: false
  });
  const location = useLocation();
  const simulationData = location.state?.simulationData as SimulationData;

  // Check different types of visual simulations
  const isVisualAudioOrChat = simulationData?.simulationType === 'visual-audio' || 
                              simulationData?.simulationType === 'visual-chat';
  const isVisualOnly = simulationData?.simulationType === 'visual';
  const isVisualType = isVisualAudioOrChat || isVisualOnly;

  // Update enabled tabs based on state changes and simulation type
  useEffect(() => {
    setEnabledTabs(prev => {
      // For 'visual' type, we skip the script tab and start with visuals
      if (isVisualOnly) {
        return {
          script: false, // Disable script tab for visual type
          visuals: true, // Always enabled for visual type
          settings: visualImages.length > 0,
          preview: isPublished
        };
      }
      // For other types (audio, chat, visual-audio, visual-chat)
      return {
        script: true,
        visuals: isScriptLocked && isVisualType,
        settings: (isScriptLocked && visualImages.length > 0) || (isScriptLocked && !isVisualType),
        preview: isPublished
      };
    });
  }, [isScriptLocked, visualImages.length, isPublished, isVisualOnly, isVisualType]);

  // Initialize the tab value for visual type to skip script tab
  useEffect(() => {
    if (isVisualOnly && tabValue === 0) {
      // Start at visuals tab for visual type
      setTabValue(0);
    }
  }, [isVisualOnly, tabValue]);

  // Get tabs based on simulation type
  const tabs = useMemo(() => {
    if (isVisualOnly) {
      // Skip Script tab for visual-only type
      return [
        { label: 'Visuals', value: 0 },
        { label: 'Settings', value: 1 },
        { label: 'Preview', value: 2 }
      ];
    } else if (isVisualAudioOrChat) {
      return [
        { label: 'Script', value: 0 },
        { label: 'Visuals', value: 1 },
        { label: 'Settings', value: 2 },
        { label: 'Preview', value: 3 }
      ];
    } else {
      // For audio and chat, no visuals tab
      return [
        { label: 'Script', value: 0 },
        { label: 'Settings', value: 1 },
        { label: 'Preview', value: 2 }
      ];
    }
  }, [isVisualOnly, isVisualAudioOrChat]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    // Check if the tab is enabled before allowing the change
    const tabKeys = isVisualOnly 
      ? ['visuals', 'settings', 'preview'] 
      : ['script', 'visuals', 'settings', 'preview'];

    if (!enabledTabs[tabKeys[newValue]]) {
      return;
    }
    setTabValue(newValue);
  };

  const handleScriptLoad = useCallback((script: Message[]) => {
    setScriptData(script);
  }, [setScriptData]);

  // Modified to handle different simulation types
  const handleContinue = async () => {
    // For visual type, we don't need script data
    if (isVisualOnly) {
      // Move directly to visuals tab, which is index 0 for visual type
      setTabValue(0);
      return;
    }

    if (!simulationData || (!isVisualOnly && !scriptData.length)) return;

    if (!simulationData.division || !simulationData.department) {
      console.error('Missing required fields: division or department');
      return;
    }

    setIsLoading(true);

    try {
      // Lock the script for all types except visual
      setIsScriptLocked(true);

      // For non-visual types (audio, chat), create simulation directly here
      if (!isVisualType) {
        // Transform script data to match API format
        const formattedScript = scriptData.map(msg => ({
          script_sentence: msg.message,
          role: msg.role.toLowerCase() === 'trainee' ? 'assistant' : msg.role.toLowerCase(),
          keywords: msg.keywords || []
        }));

        const payload: CreateSimulationPayload = {
          user_id: "user123", // This should come from your auth context
          name: simulationData.name,
          division_id: simulationData.division || '',
          department_id: simulationData.department || '',
          type: simulationData.simulationType.toLowerCase(),
          script: formattedScript,
          tags: simulationData.tags
        };

        const response = await createSimulation(payload);

        if (response.status === 'success') {
          setSimulationResponse({
            id: response.id,
            status: response.status,
            prompt: response.prompt
          });

          // Move to settings tab (skipping visuals) - for audio/chat this would be index 1
          const settingsTabIndex = tabs.findIndex(tab => tab.label === 'Settings');
          setTabValue(settingsTabIndex);
        }
      } 
      // For visual-audio and visual-chat types, just move to visuals tab
      else if (isVisualAudioOrChat) {
        // Visuals tab is always at index 1 for visual-audio and visual-chat types
        setTabValue(1); 
      }
    } catch (error) {
      console.error('Error handling continue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create simulation with slides (called from VisualsTab)
  const createSimulationWithSlides = async (formData: FormData) => {
    if (!simulationData) return null;

    // For visual type, we don't need script data
    if (!isVisualOnly && !scriptData.length) return null;

    setIsLoading(true);
    try {
      // Transform script data to match API format if not visual-only type
      const formattedScript = !isVisualOnly ? scriptData.map(msg => ({
        script_sentence: msg.message,
        role: msg.role.toLowerCase() === 'trainee' ? 'assistant' : msg.role.toLowerCase(),
        keywords: msg.keywords || []
      })) : [];

      // Add script data and other required fields to formData
      formData.append('user_id', 'user123'); // This should come from your auth context
      formData.append('name', simulationData.name);
      formData.append('division_id', simulationData.division || '');
      formData.append('department_id', simulationData.department || '');
      formData.append('type', simulationData.simulationType.toLowerCase());

      // Only add script for non-visual types
      if (!isVisualOnly) {
        formData.append('script', JSON.stringify(formattedScript));
      }

      formData.append('tags', JSON.stringify(simulationData.tags));

      // Use a modified create simulation function that accepts FormData
      const response = await createSimulationWithFormData(formData);

      if (response.status === 'success') {
        setSimulationResponse({
          id: response.id,
          status: response.status,
          prompt: response.prompt
        });

        // Move to settings tab
        const settingsTabIndex = tabs.findIndex(tab => tab.label === 'Settings');
        setTabValue(settingsTabIndex);

        return response;
      }
      return null;
    } catch (error) {
      console.error('Error creating simulation:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which component to render based on tab value and simulation type
  const renderTabContent = () => {
    // For visual type, the first tab is Visuals
    if (isVisualOnly) {
      if (tabValue === 0) {
        return (
          <VisualsTab 
            images={visualImages}
            onImagesUpdate={setVisualImages}
            createSimulation={createSimulationWithSlides}
            simulationType={simulationData?.simulationType}
            onComplete={() => {
              if (visualImages.length > 0) {
                // Move to settings tab
                const settingsTabIndex = tabs.findIndex(tab => tab.label === 'Settings');
                setTabValue(settingsTabIndex);
              }
            }}
          />
        );
      } else if (tabValue === 1) {
        // Settings tab for visual type
        return (
          <SettingsTab 
            simulationId={simulationResponse?.id}
            prompt={simulationResponse?.prompt}
            simulationType={simulationData?.simulationType}
            simulationData={simulationData}
            onPublish={() => {
              setIsPublished(true);
              // Move to preview tab
              const previewTabIndex = tabs.findIndex(tab => tab.label === 'Preview');
              setTabValue(previewTabIndex);
            }}
          />
        );
      } else if (tabValue === 2) {
        // Preview tab for visual type
        return (
          <PreviewTab 
            simulationId={simulationResponse?.id || ''} 
            simulationType={simulationData?.simulationType}
          />
        );
      }
    } else {
      // For all other types
      if (tabValue === 0) {
        return (
          <ScriptTab 
            simulationType={simulationData?.simulationType}
            isLocked={isScriptLocked}
          />
        );
      } else if (isVisualAudioOrChat && tabValue === 1) {
        return (
          <VisualsTab 
            images={visualImages}
            onImagesUpdate={setVisualImages}
            createSimulation={createSimulationWithSlides}
            simulationType={simulationData?.simulationType}
            onComplete={() => {
              if (visualImages.length > 0) {
                // Move to settings tab
                const settingsTabIndex = tabs.findIndex(tab => tab.label === 'Settings');
                setTabValue(settingsTabIndex);
              }
            }}
          />
        );
      } else if ((isVisualAudioOrChat && tabValue === 2) || (!isVisualType && tabValue === 1)) {
        return (
          <SettingsTab 
            simulationId={simulationResponse?.id}
            prompt={simulationResponse?.prompt}
            simulationType={simulationData?.simulationType}
            simulationData={simulationData}
            onPublish={() => {
              setIsPublished(true);
              // Move to preview tab
              const previewTabIndex = tabs.findIndex(tab => tab.label === 'Preview');
              setTabValue(previewTabIndex);
            }}
          />
        );
      } else if ((isVisualAudioOrChat && tabValue === 3) || (!isVisualType && tabValue === 2)) {
        return (
          <PreviewTab 
            simulationId={simulationResponse?.id || ''} 
            simulationType={simulationData?.simulationType}
          />
        );
      }
    }

    return null;
  };

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: 'calc(100vh - 64px)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 4, py: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <StyledTabs value={tabValue} onChange={handleTabChange}>
            {tabs.map((tab, index) => {
              // For visual type, we map differently
              const tabKey = isVisualOnly
                ? ['visuals', 'settings', 'preview'][index]
                : ['script', 'visuals', 'settings', 'preview'][index];

              return (
                <StyledTab
                  key={tab.label}
                  label={tab.label}
                  disabled={!enabledTabs[tabKey]}
                  sx={{
                    opacity: enabledTabs[tabKey] ? 1 : 0.5,
                    cursor: enabledTabs[tabKey] ? 'pointer' : 'not-allowed'
                  }}
                />
              );
            })}
          </StyledTabs>
          {(!isVisualOnly && isScriptLocked) && (
            <LockIcon sx={{ color: 'success.main', fontSize: 20 }} />
          )}
        </Stack>

        {scriptData.length > 0 && tabValue === 0 && !isVisualOnly && (
          <Button
            variant="contained"
            onClick={async () => {
              await handleContinue();
            }}
            disabled={isLoading}
            sx={{
              bgcolor: '#444CE7',
              '&:hover': { bgcolor: '#3538CD' },
              borderRadius: 2,
              px: 4,
            }}
          >
            {isLoading ? 'Processing...' : 'Save and Continue'}
          </Button>
        )}
      </Stack>

      <Box sx={{ px: 4 }}>
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: '0px 1px 3px rgba(16, 24, 40, 0.1), 0px 1px 2px rgba(16, 24, 40, 0.06)',
            position: 'relative',
            zIndex: 0,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {renderTabContent()}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

const GenerateScript = () => {
  return (
    <SimulationWizardProvider>
      <GenerateScriptContent />
    </SimulationWizardProvider>
  );
};

export default GenerateScript;