import React, { createContext, useContext, useState } from "react";

export interface Message {
  id: string;
  role: "Customer" | "Trainee";
  message: string;
  keywords: string[];
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  type: "button" | "field";
  settings: {
    font: string;
    fontSize: number;
    buttonColor: string;
    textColor: string;
    timeoutDuration: number;
    highlightField: boolean;
    enableHotkey: boolean;
  };
}

export interface VisualImage {
  id: string;
  url: string;
  name: string;
  hotspots?: Hotspot[];
}

// Complete SimulationSettings interface
export interface SimulationSettings {
  simulationType?: string;
  levels?: {
    [key: string]: {
      lvl1: boolean;
      lvl2: boolean;
      lvl3: boolean;
    };
  };
  estimatedTime?: {
    enabled: boolean;
    value: string;
  };
  objectives?: {
    enabled: boolean;
    text: string;
  };
  overviewVideo?: {
    enabled: boolean;
    url?: string;
  };
  quickTips?: {
    enabled: boolean;
    text: string;
  };
  voice?: {
    language?: string;
    accent?: string;
    gender?: string;
    ageGroup?: string;
    voiceId?: string;
    mood?: string;
    voiceSpeed?: string;
  };
  scoring?: {
    simulationScore?: "best" | "last" | "average";
    pointsPerKeyword?: string;
    pointsPerClick?: string;
    practiceMode?: "unlimited" | "limited";
    practiceLimit?: string;
    repetitionsAllowed?: string;
    repetitionsNeeded?: string;
    minimumPassingScore?: string;
    scoringMetrics?: {
      enabled?: boolean;
      keywordScore?: string;
      clickScore?: string;
    };
    metricWeightage?: {
      clickAccuracy?: string;
      keywordAccuracy?: string;
      dataEntryAccuracy?: string;
      contextualAccuracy?: string;
      sentimentMeasures?: string;
    };
  };
}

interface SimulationWizardContextType {
  // Script Data
  scriptData: Message[];
  setScriptData: (data: Message[]) => void;
  isScriptLocked: boolean;
  setIsScriptLocked: (locked: boolean) => void;

  // Visual Data
  visualImages: VisualImage[];
  setVisualImages: (images: VisualImage[]) => void;

  // Settings Data
  settings: SimulationSettings;
  setSettings: (settings: SimulationSettings) => void;

  // Simulation Response
  simulationResponse: { id: string; status: string; prompt: string } | null;
  setSimulationResponse: (
    response: { id: string; status: string; prompt: string } | null,
  ) => void;

  // Published State
  isPublished: boolean;
  setIsPublished: (published: boolean) => void;

  // Track which script message IDs are assigned to visuals
  assignedScriptMessageIds: Set<string>;
  setAssignedScriptMessageIds: (ids: Set<string>) => void;
}

const SimulationWizardContext = createContext<
  SimulationWizardContextType | undefined
>(undefined);

export const SimulationWizardProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [scriptData, setScriptData] = useState<Message[]>([]);
  const [isScriptLocked, setIsScriptLocked] = useState(false);
  const [visualImages, setVisualImages] = useState<VisualImage[]>([]);
  const [assignedScriptMessageIds, setAssignedScriptMessageIds] = useState<
    Set<string>
  >(new Set());

  // Initialize settings with empty object - will be populated from API
  const [settings, setSettings] = useState<SimulationSettings>({});

  const [simulationResponse, setSimulationResponse] = useState<{
    id: string;
    status: string;
    prompt: string;
  } | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  // Simple setter that replaces the entire settings object
  const updateSettings = (newSettings: SimulationSettings) => {
    setSettings(newSettings);
  };

  return (
    <SimulationWizardContext.Provider
      value={{
        scriptData,
        setScriptData,
        isScriptLocked,
        setIsScriptLocked,
        visualImages,
        setVisualImages,
        settings,
        setSettings: updateSettings,
        simulationResponse,
        setSimulationResponse,
        isPublished,
        setIsPublished,
        assignedScriptMessageIds,
        setAssignedScriptMessageIds,
      }}
    >
      {children}
    </SimulationWizardContext.Provider>
  );
};

export const useSimulationWizard = () => {
  const context = useContext(SimulationWizardContext);
  if (context === undefined) {
    throw new Error(
      "useSimulationWizard must be used within a SimulationWizardProvider",
    );
  }
  return context;
};
