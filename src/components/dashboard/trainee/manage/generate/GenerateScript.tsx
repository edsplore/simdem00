import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Card, CardContent, Tabs, Tab, Button, Stack, styled } from '@mui/material';
import { createSimulation } from '../../../../../services/simulationCreate';
import type { CreateSimulationPayload } from '../../../../../services/simulationCreate';
import ScriptTab from './ScriptTab';
import VisualsTab from './VisualsTab';
import SettingsTab from './settingTab/SettingTab';
import PreviewTab from './PreviewTab';

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

export default function GenerateScript() {
  const [tabValue, setTabValue] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [scriptData, setScriptData] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [visualImages, setVisualImages] = useState<{ id: string; url: string; name: string; }[]>([]);
  const [simulationResponse, setSimulationResponse] = useState<SimulationResponse | null>(null);
  const location = useLocation();
  const simulationData = location.state?.simulationData as SimulationData;
  const isVisualType = simulationData?.simulationType?.includes('visual');

  // Get tabs based on simulation type
  const tabs = useMemo(() => {
    const baseTabs = [
      { label: 'Script', value: 0 },
      { label: 'Settings', value: isVisualType ? 2 : 1 },
      { label: 'Preview', value: isVisualType ? 3 : 2 }
    ];
    
    if (isVisualType) {
      baseTabs.splice(1, 0, { label: 'Visuals', value: 1 });
    }
    
    return baseTabs;
  }, [isVisualType]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleScriptLoad = (script: Message[]) => {
    setScriptData(script);
    setIsScriptLoaded(true);
  };

  const handleContinue = async () => {
    if (!simulationData || !scriptData.length) return;

    setIsLoading(true);
    try {
      // Transform script data to match API format
      const formattedScript = scriptData.map(msg => ({
        script_sentence: msg.message,
        role: msg.role.toLowerCase() === 'trainee' ? 'assistant' : msg.role.toLowerCase(),
        keywords: msg.keywords || []
      }));

      const payload: CreateSimulationPayload = {
        user_id: "user123", // This should come from your auth context
        name: simulationData.name,
        division_id: simulationData.division,
        department_id: simulationData.department,
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
        // Switch to settings tab
        setTabValue(1);
      }
    } catch (error) {
      console.error('Error creating simulation:', error);
      // Handle error appropriately
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: 'calc(100vh - 64px)' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 4, py: 2 }}>
        <StyledTabs value={tabValue} onChange={handleTabChange}>
          {tabs.map((tab) => (
            <StyledTab key={tab.label} label={tab.label} />
          ))}
        </StyledTabs>
        
        {isScriptLoaded && tabValue === 0 && (
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={isLoading}
            sx={{
              bgcolor: '#444CE7',
              '&:hover': { bgcolor: '#3538CD' },
              borderRadius: 2,
              px: 4,
            }}
          >
            {isLoading ? 'Creating...' : 'Continue'}
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
            {tabValue === 0 && (
              <ScriptTab 
                simulationType={simulationData?.simulationType}
                onScriptLoad={handleScriptLoad}
                isScriptLoaded={isScriptLoaded}
                onScriptUpdate={setScriptData}
              />
            )}
            {tabValue === 1 && (
              <VisualsTab onImagesUpdate={setVisualImages} />
            )}
            {tabValue === (isVisualType ? 2 : 1) && (
              <SettingsTab 
                simulationId={simulationResponse?.id}
                prompt={simulationResponse?.prompt}
                simulationType={simulationData?.simulationType}
                simulationData={simulationData}
              />
            )}
            {tabValue === (isVisualType ? 3 : 2) && <PreviewTab />}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}