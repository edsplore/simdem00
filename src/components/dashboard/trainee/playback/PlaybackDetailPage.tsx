import React, { useEffect, useState } from 'react';
import { Box, Button, Link, Stack } from '@mui/material';
import DashboardContent from '../DashboardContent';
import PlaybackHeader from './PlaybackHeader';
import PlaybackChat, { ChatMessage } from './detail/PlaybackChat';
import PlaybackControls from './detail/PlaybackControls';
import PlaybackDetails from './detail/PlaybackDetails';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchPlaybackByIdRowData,
  FetchPlaybackByIdRowDataResponse,
} from '../../../services/playback';

const PlaybackDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(true);
  const [playbackData, setPlaybackData] = useState<FetchPlaybackByIdRowDataResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const loadPlayback = async () => {
      if (!user?.id || !id) return;
      try {
        const data = await fetchPlaybackByIdRowData({
          user_id: user.id,
          attempt_id: id,
        });
        let parsed: ChatMessage[] = [];
        if (data.transcriptObject && data.transcriptObject.length > 0) {
          parsed = data.transcriptObject.map((item: any) => ({
            sender: item.role === 'user' ? 'user' : 'agent',
            text: item.content,
          }));
        } else if (data.transcript) {
          parsed = data.transcript
            .split('\n')
            .map((line) => {
              const [speaker, ...rest] = line.split(':');
              if (!speaker || rest.length === 0) return null;
              return {
                sender: speaker.trim() === 'Trainee' ? 'user' : 'agent',
                text: rest.join(':').trim(),
              } as ChatMessage;
            })
            .filter((m): m is ChatMessage => m !== null && m.text !== '');
        }
        setMessages(parsed);
        setPlaybackData(data);
      } catch (err) {
        console.error('Error loading playback data', err);
      }
    };
    loadPlayback();
  }, [id, user?.id]);

  return (
    <DashboardContent>
      <PlaybackHeader simulationName={playbackData?.name} />
      <Box display="flex" columnGap={4} px={4} py={3}>
        <Box flexGrow={1} minWidth={0}>
          <Stack spacing={4}>
            <PlaybackChat messages={messages} />
            <PlaybackControls audioUrl={playbackData?.audioUrl || ''} />
          </Stack>
          {!showDetails && (
            <Box textAlign="right" mt={2}>
              <Link component={Button} onClick={() => setShowDetails(true)}>
                Show Details
              </Link>
            </Box>
          )}
        </Box>
        {showDetails && playbackData && (
          <PlaybackDetails playbackData={playbackData} onClose={() => setShowDetails(false)} />
        )}
      </Box>
    </DashboardContent>
  );
};

export default PlaybackDetailPage;
