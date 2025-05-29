import React, { useState, useEffect } from "react";
import { Stack, Container, Typography } from "@mui/material";
import DashboardContent from "../DashboardContent";
import PlaybackHeader from "./playback/PlaybackHeader";
import PlaybackTable from "./playback/PlaybackTable";
import StatsGrid from "./StatsGrid";
import { useAuth } from "../../../context/AuthContext";
import { fetchAssignedStats } from "../../../services/training";
import type { TrainingStats } from "../../../types/training";

const PlaybackPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrainingStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const data: TrainingStats = await fetchAssignedStats({
          user_id: user.id,
        });
        setStats(data);
      } catch (error) {
        console.error("Error loading playback stats:", error);
      }
    };

    loadStats();
  }, [user?.id]);

  return (
    <DashboardContent>
      <Container>
        <Stack spacing={4} sx={{ py: 1 }}>
          <PlaybackHeader />
          <Stack spacing={5}>
            {stats && (
              <>
                <StatsGrid stats={stats} />
              </>
            )}
            <PlaybackTable />
          </Stack>
        </Stack>
      </Container>
    </DashboardContent>
  );
};

export default PlaybackPage;
