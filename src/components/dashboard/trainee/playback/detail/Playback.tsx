import { useEffect, useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import PlaybackChat from "./PlaybackChat";
import PlaybackControls from "./PlaybackControls";
import {
  fetchPlaybackByIdRowData,
  FetchPlaybackByIdRowDataResponse,
} from "../../../../../services/playback";
import { Stack, Box } from "@mui/material";
import PlaybackDetails from "./PlaybackDetails";

interface PlaybackProps {
  attepmtId: string;
  showDetails: boolean;
  onPlaybackDataLoaded?: (data: FetchPlaybackByIdRowDataResponse) => void;
}

const Playback = ({ attepmtId, showDetails, onPlaybackDataLoaded }: PlaybackProps) => {
  const { user } = useAuth();
  const [playbackData, setPlaybackData] =
    useState<FetchPlaybackByIdRowDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    const loadPlaybackById = async () => {
      if (user?.id) {
        try {
          setIsLoading(true);
          setError(null);
          // In a real implementation, we would fetch data from the API
          const data = await fetchPlaybackByIdRowData({
            user_id: user.id,
            attempt_id: attepmtId,
          });
          let parsedMessages: {
            type: "agent" | "customer";
            text: string;
            originalText?: string;
            scores?: { keywordScore: string; symAccuracy: string };
          }[] = [];
          if (data.transcriptObject && data.transcriptObject.length > 0) {
            // Split transcript into lines and extract expected scripts for Trainee
            const transcriptLines = data.transcript.split('\n');
            const expectedLines = transcriptLines
              .filter(line => line.startsWith('Trainee:'))
              .map(line => line.replace('Trainee: ', ''));
            let expectedIndex = 0;
            parsedMessages = data.transcriptObject.map((item: any) => {
              if (item.role === "user") {
                // Trainee message (agent)
                const expectedScript = expectedLines[expectedIndex] || "";
                expectedIndex += 1;
                return {
                  type: "agent",
                  text: item.content,
                  originalText: expectedScript,
                  scores: {
                    keywordScore: data.keywordScore ? `${data.keywordScore}` : "",
                    symAccuracy: data.simAccuracyScore ? `${data.simAccuracyScore}%` : ""
                  }
                };
              } else {
                // Customer message
                return {
                  type: "customer",
                  text: item.content
                };
              }
            });
          } else if (data.transcript) {
            const transcript = data.transcript.split("\n");
            parsedMessages = transcript
              .map((line) => {
                const [speaker, ...rest] = line.split(":");
                if (!speaker || rest.length === 0) return null;

                return {
                  type: speaker.trim() === "Trainee" ? "agent" : "customer",
                  text: rest.join(":").trim(),
                };
              })
              .filter((entry): entry => entry !== null && entry.text !== "");
          }

          setMessages(parsedMessages);
          setPlaybackData(data);
          onPlaybackDataLoaded && onPlaybackDataLoaded(data);
        } catch (error) {
          console.error("Error loading playback data:", error);
          setError("Failed to load playback data");
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadPlaybackById();
  }, []);

  return (
    <Box sx={{
      height: 'calc(100vh - 130px)', // Adjust based on your header height
      display: 'flex',
      position: 'relative'
    }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Left Column */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Chat Area - scrollable */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              paddingBottom: '120px', // Space for controls
            }}
          >
            <PlaybackChat keywordAnalysis={playbackData?.keyword_analysis || []} />
          </Box>

          {/* Controls - fixed at bottom */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
              boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            }}
          >
            <PlaybackControls audioUrl={playbackData?.audioUrl || ''} />
          </Box>
        </Box>

        {/* Right Column - Details */}
        {showDetails && playbackData && (
          <Box sx={{ height: '100%' }}>
            <PlaybackDetails playbackData={playbackData} />
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default Playback;
