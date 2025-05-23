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

// FIXED: Complete SimulationSettings interface with all fields properly organized
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
  };
  scoring?: {
    simulationScore?: "best" | "last" | "average";
    // REMOVED: duplicate keywordScore and clickScore fields
    pointsPerKeyword?: string;
    pointsPerClick?: string;
    practiceMode?: "unlimited" | "limited";
    practiceLimit?: string;
    repetitionsAllowed?: string;
    repetitionsNeeded?: string;
    minimumPassingScore?: string;
    scoringMetrics?: {
      enabled?: boolean;
      keywordScore?: string; // These are the correct ones
      clickScore?: string; // These are the correct ones
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

  // Track if the user has published changes during this session
  hasPublishedChanges: boolean;
  setHasPublishedChanges: (published: boolean) => void;

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

  // FIXED: Initialize settings with complete default values - removed duplicate fields
  const [settings, setSettings] = useState<SimulationSettings>({
    simulationType: "audio",
    levels: {},
    estimatedTime: {
      enabled: false,
      value: "10 mins",
    },
    objectives: {
      enabled: false,
      text: "",
    },
    overviewVideo: {
      enabled: false,
    },
    quickTips: {
      enabled: false,
      text: "",
    },
    voice: {
      language: "English",
      accent: "American",
      gender: "Male",
      ageGroup: "Middle Age",
      voiceId: "",
    },
    scoring: {
      simulationScore: "best",
      // REMOVED: duplicate keywordScore and clickScore fields
      pointsPerKeyword: "1",
      pointsPerClick: "1",
      practiceMode: "unlimited",
      practiceLimit: "3",
      repetitionsAllowed: "3",
      repetitionsNeeded: "2",
      minimumPassingScore: "60",
      scoringMetrics: {
        enabled: true,
        keywordScore: "20%", // These are the correct ones
        clickScore: "80%", // These are the correct ones
      },
      metricWeightage: {
        clickAccuracy: "30%",
        keywordAccuracy: "30%",
        dataEntryAccuracy: "20%",
        contextualAccuracy: "10%",
        sentimentMeasures: "10%",
      },
    },
  });

  const [simulationResponse, setSimulationResponse] = useState<{
    id: string;
    status: string;
    prompt: string;
  } | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [hasPublishedChanges, setHasPublishedChanges] = useState(false);

  // FIXED: Update settings while preserving ALL existing values
  const updateSettings = (newSettings: Partial<SimulationSettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
      voice: {
        ...prevSettings.voice,
        ...(newSettings.voice || {}),
      },
      scoring: {
        ...prevSettings.scoring,
        ...(newSettings.scoring || {}),
        // FIXED: Ensure metricWeightage is properly merged
        metricWeightage: {
          ...prevSettings.scoring?.metricWeightage,
          ...(newSettings.scoring?.metricWeightage || {}),
        },
        // FIXED: Ensure scoringMetrics is properly merged
        scoringMetrics: {
          ...prevSettings.scoring?.scoringMetrics,
          ...(newSettings.scoring?.scoringMetrics || {}),
        },
      },
    }));
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
        hasPublishedChanges,
        setHasPublishedChanges,
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
