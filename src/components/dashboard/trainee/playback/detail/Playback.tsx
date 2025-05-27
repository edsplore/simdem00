import { useEffect, useState } from "react";
import { useAuth } from "../../../../../context/AuthContext";
import PlaybackChat from "./PlaybackChat";
import PlaybackControls from "./PlaybackControls";
import {
  fetchPlaybackByIdRowData,
  FetchPlaybackByIdRowDataResponse,
} from "../../../../../services/playback";
import { Stack } from "@mui/material";
import PlaybackDetails from "./PlaybackDetails";

interface PlaybackProps {
  attepmtId: string;
  showDetails: boolean;
}
const Playback = ({ attepmtId, showDetails }: PlaybackProps) => {
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
          if (data.transcriptObject.length == 0) {
            const transcript = data?.transcript.split("\n");
            const messages = transcript
              ?.map((line) => {
                const [speaker, ...rest] = line.split(":");
                if (!speaker || rest.length === 0) return null;

                return {
                  type: speaker.trim() === "Trainee" ? "customer" : "agent",
                  text: rest.join(":").trim(),
                };
              })
              .filter((entry): entry => entry !== null && entry.text !== "");
            setMessages(messages);
          }
          setPlaybackData(data);
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
    <>
      <Stack direction="row" spacing={2}>
        <Stack flex={1} spacing={2}>
          <PlaybackChat
            messages={
              playbackData?.transcriptObject?.length > 0
                ? playbackData.transcriptObject
                : messages
            }
          />
          <PlaybackControls audioUrl={playbackData?.audioUrl || ""} />
        </Stack>
        {showDetails && playbackData ? (
          <PlaybackDetails playbackData={playbackData} />
        ) : (
          <></>
        )}
      </Stack>
    </>
  );
};
export default Playback;
