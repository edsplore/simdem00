import React, { useEffect, useState } from "react";
import { Stack, Grid, Typography, Card, CardContent, Box } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import completionImage from "../../../../assets/completion.svg";
import averageImage from "../../../../assets/average.svg";
import highestImage from "../../../../assets/highest.svg";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchPlaybackStats,
  FetchPlaybackStatsResponse,
} from "../../../../services/playback";

interface StatData {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon: React.ReactNode;
  progress?: number;
  backgroundIcon?: string;
}

interface PlaybackStatsProps {
  setGlobalLoading: any;
}

const stats: StatData[] = [
  {
    title: "Simulations Completed",
    value: "18/32",
    subtitle: "Total 7 Modules",
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
    progress: 56,
  },
  {
    title: "On Time Completion",
    value: "74%",
    subtitle: "16 simulations",
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
    backgroundIcon: "/src/assets/completion.svg",
  },
  {
    title: "Average Sim Score",
    value: "89%",
    trend: { value: -4, label: "vs last week" },
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
    backgroundIcon: "/src/assets/average.svg",
  },
  {
    title: "Highest Sim Score",
    value: "94%",
    trend: { value: 2, label: "vs last week" },
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
    backgroundIcon: "/src/assets/highest.svg",
  },
];

const CircularProgress = ({ value }: { value: number }) => {
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2563EB"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <Typography
        variant="h6"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontWeight: 600,
        }}
      >
        {value}%
      </Typography>
    </Box>
  );
};

const PlaybackStats = ({ setGlobalLoading }: PlaybackStatsProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [playbackStatsData, setPlaybackStatsData] =
    useState<FetchPlaybackStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPlaybackStats = async () => {
    if (user?.id) {
      try {
        setIsLoading(true);
        setError(null);
        setGlobalLoading(true);
        // In a real implementation, we would fetch data from the API
        const data = await fetchPlaybackStats({
          user_id: user.id,
        });
        setPlaybackStatsData(data);
      } catch (error) {
        console.error("Error loading playback data:", error);
        setError("Failed to load playback data");
      } finally {
        setIsLoading(false);
        setGlobalLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPlaybackStats();
  }, [user]);
  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight="medium">
        My Overall Stats
      </Typography>
      <Grid container spacing={2}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={3} key={index}>
            <Card
              variant="outlined"
              sx={{
                height: "100%",
                minHeight: 180, // Set minimum height for all cards
              }}
            >
              <CardContent
                sx={{
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Stack spacing={2} sx={{ flex: 1 }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {stat.title}
                    {stat.icon}
                  </Typography>

                  {index === 0 ? (
                    <Stack direction="row" sx={{ width: "100%" }}>
                      <Box sx={{ width: "67%" }}>
                        <Stack spacing={1}>
                          <Typography
                            variant="h4"
                            sx={{ display: "flex", alignItems: "baseline" }}
                          >
                            {playbackStatsData ? (
                              <>
                                {
                                  playbackStatsData.simultion_completion
                                    .completed
                                }
                                /{playbackStatsData.simultion_completion.total}
                              </>
                            ) : (
                              <></>
                            )}
                            {/* {playbackStatsData ? (
                              playbackStatsData[
                                Object.keys(playbackStatsData)[
                                  index
                                ] as keyof typeof playbackStatsData
                              ]
                            ) : (
                              <></>
                            )} */}
                            <Typography
                              component="span"
                              sx={{
                                fontSize: "1rem",
                                color: "text.secondary",
                                ml: 0.5,
                              }}
                            >
                              /
                              {playbackStatsData ? (
                                playbackStatsData.simultion_completion.total
                              ) : (
                                <></>
                              )}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stat.subtitle}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box
                        sx={{
                          width: "33%",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <CircularProgress value={stat.progress || 0} />
                      </Box>
                    </Stack>
                  ) : (
                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Typography variant="h4">{stat.value}</Typography>
                      {stat.subtitle && (
                        <Typography variant="body2" color="text.secondary">
                          {stat.subtitle}
                        </Typography>
                      )}
                      {stat.trend && (
                        <Typography
                          variant="body2"
                          color={
                            stat.trend.value > 0 ? "success.main" : "error.main"
                          }
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          {stat.trend.value > 0 ? "↑" : "↓"}{" "}
                          {Math.abs(stat.trend.value)}%
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {stat.trend.label}
                          </Typography>
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>
                {stat.backgroundIcon && (
                  <Box
                    component="img"
                    src={stat.backgroundIcon}
                    alt=""
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      width: 80,
                      height: 80,
                      opacity: 1,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
};

export default PlaybackStats;
