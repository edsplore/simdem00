import React, { useState } from "react";
import Layout from "../../../layout/Layout";
import DashboardContent from "../../DashboardContent";
import { useParams } from "react-router-dom";
import PlaybackHeader from "./detail/PlaybackHeader";
import PlaybackChat from "./detail/PlaybackChat";
import PlaybackDetails from "./detail/PlaybackDetails";
import PlaybackControls from "./detail/PlaybackControls";
import { Stack } from "@mui/material";
import Playback from "./detail/Playback";

const PlaybackDetailPage = () => {
  const { id } = useParams();
  const [showDetails, setShowDetails] = useState(true);

  return (
    <DashboardContent>
      <Stack>
        <PlaybackHeader
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(!showDetails)}
        />
        <Playback attepmtId={id || ""} showDetails={showDetails} />
      </Stack>
    </DashboardContent>
  );
};

export default PlaybackDetailPage;
