import React, { useState, useEffect } from "react";
import { Stack, Container, Typography } from "@mui/material";
import DashboardContent from "../DashboardContent";
import PlaybackHeader from "./playback/PlaybackHeader";
import PlaybackTable from "./playback/PlaybackTable";
import StatsGrid from "./StatsGrid";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPlaybackStats,
  FetchPlaybackStatsResponse,
} from "../../services/playback";
import type { TrainingStats } from "../../types/training";

const PlaybackPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<TrainingStats | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;
      try {
        const data: FetchPlaybackStatsResponse = await fetchPlaybackStats({
          user_id: user.id,
        });
        const converted: TrainingStats = {
          simulation_completed: {
            total_simulations: data.simultion_completion.total,
            completed_simulations: data.simultion_completion.completed,
            percentage:
              data.simultion_completion.total > 0
                ? Math.round(
                    (data.simultion_completion.completed /
                      data.simultion_completion.total) *
                      100,
                  )
                : 0,
          },
          timely_completion: {
            total_simulations: data.ontime_completion.total,
            completed_simulations: data.ontime_completion.completed,
            percentage:
              data.ontime_completion.total > 0
                ? Math.round(
                    (data.ontime_completion.completed /
                      data.ontime_completion.total) *
                      100,
                  )
                : 0,
          },
          average_sim_score: data.average_sim_score.percentage,
          highest_sim_score: data.highest_sim_score.percentage,
        };
        setStats(converted);
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
                <Typography variant="h5" fontWeight="medium">
                  My Overall Stats
                </Typography>
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
