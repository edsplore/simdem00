import React from 'react';
import {
  Avatar,
  Box,
  Chip,
  Paper,
  Stack,
  Typography,
  ChipProps,
  Divider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

export interface ChatMessage {
  sender: 'agent' | 'user';
  text: string;
  originalText?: string;
  chips?: ChipProps[];
  avatarSrc?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const theme = useTheme();
  const { sender, text, originalText, avatarSrc, chips } = message;
  return (
    <Box
      display="flex"
      justifyContent="flex-start"
      flexDirection={sender === 'agent' ? 'row-reverse' : 'row'}
      columnGap={2}
    >
      {avatarSrc && <Avatar src={avatarSrc} sx={{ width: 32, height: 32 }} />}
      <Box maxWidth="100%">
        <Paper
          variant="outlined"
          sx={{
            backgroundColor:
              sender === 'user' ? theme.palette.grey[100] : undefined,
            borderRadius: 3,
            px: 3,
            py: 2,
            maxWidth: '100%',
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {text}
          </Typography>
          {originalText && (
            <>
              <Divider variant="fullWidth" sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {originalText}
              </Typography>
            </>
          )}
        </Paper>
        {chips && chips.length > 0 && (
          <Stack direction="row" spacing={1} mt={1}>
            {chips.map((chipProps, idx) => (
              <Chip key={idx} variant="outlined" size="small" {...chipProps} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

interface PlaybackChatProps {
  messages: ChatMessage[];
}

const PlaybackChat: React.FC<PlaybackChatProps> = ({ messages }) => (
  <Stack spacing={4} pb={5} maxWidth="720px">
    {messages.map((msg, idx) => (
      <ChatBubble key={idx} message={msg} />
    ))}
  </Stack>
);

export default PlaybackChat;
