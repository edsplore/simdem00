import React, { useState } from "react";
import DashboardContent from "../DashboardContent";
import { useParams } from "react-router-dom";
import PlaybackHeader from "./PlaybackHeader";
import { Stack } from "@mui/material";
import Playback from "./detail/Playback";

const PlaybackDetailPage = () => {
  const { id } = useParams();
  const [showDetails, setShowDetails] = useState(true);
  const [simulationName, setSimulationName] = useState<string>("");

  return (
    <DashboardContent>
      <Stack>
        <PlaybackHeader
          simulationName={simulationName}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />
        <Playback
          attepmtId={id || ""}
          showDetails={showDetails}
          onPlaybackDataLoaded={(data) => setSimulationName(data.name)}
        />
      </Stack>
    </DashboardContent>
  );
};

export default PlaybackDetailPage;
