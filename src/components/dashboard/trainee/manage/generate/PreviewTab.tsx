import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Card, Button, Stack, Avatar } from '@mui/material';
import { HeadsetMic, PlayArrow, CallEnd } from '@mui/icons-material';
import axios from 'axios';
import { RetellWebClient } from 'retell-client-js-sdk';

interface Message {
  speaker: 'customer' | 'trainee';
  text: string;
}

interface PreviewTabProps {
  simulationId: string;
}

const webClient = new RetellWebClient();

const PreviewTab: React.FC<PreviewTabProps> = ({ simulationId }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const previousTranscriptRef = useRef<{ role: string; content: string }[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    webClient.on('conversationStarted', () => {
      console.log('Conversation started');
    });

    webClient.on('conversationEnded', ({ code, reason }) => {
      console.log('Conversation ended:', code, reason);
      setIsCallActive(false);
    });

    webClient.on('error', (error) => {
      console.error('WebRTC error:', error);
      setIsCallActive(false);
    });

    webClient.on('update', (update) => {
      console.log('Update received:', update);

      if (update.transcript) {
        const newTranscript = update.transcript;
        const previousTranscript = previousTranscriptRef.current || [];

        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages];
          const newTranscriptLength = newTranscript.length;
          const prevTranscriptLength = previousTranscript.length;

          if (newTranscriptLength === 0) return updatedMessages;

          if (newTranscriptLength > prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            updatedMessages.push({
              speaker: newMsg.role === 'agent' ? 'customer' : 'trainee',
              text: newMsg.content,
            });
          } else if (newTranscriptLength === prevTranscriptLength) {
            const newMsg = newTranscript[newTranscriptLength - 1];
            const lastMsgIndex = updatedMessages.length - 1;
            
            if (lastMsgIndex >= 0) {
              const lastMsg = updatedMessages[lastMsgIndex];
              if (lastMsg.speaker === (newMsg.role === 'agent' ? 'customer' : 'trainee')) {
                updatedMessages[lastMsgIndex].text = newMsg.content;
              } else {
                updatedMessages.push({
                  speaker: newMsg.role === 'agent' ? 'customer' : 'trainee',
                  text: newMsg.content,
                });
              }
            }
          }

          return updatedMessages;
        });

        previousTranscriptRef.current = newTranscript;
      }
    });

    return () => {
      webClient.stopCall();
    };
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      // Set call as active immediately and show "Ringing..." message
      setIsCallActive(true);
      setMessages([{
        speaker: 'customer',
        text: 'Ringing...'
      }]);

      const response = await axios.post('/api/simulations/start-audio-preview', {
        user_id: 'user123',
        sim_id: simulationId
      });

      console.log(response.data);

      if (response.data.access_token) {
        await webClient.startCall({
          accessToken: response.data.access_token
        });
      }
    } catch (error) {
      console.error('Error starting preview:', error);
      setIsCallActive(false);
      setMessages([]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndCall = () => {
    webClient.stopCall();
    setIsCallActive(false);
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'white', py: 0, px: 0 }}>
      <Card sx={{ maxWidth: '900px', minHeight: '600px', mx: 'auto', borderRadius: '16px' }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
          <Typography variant="subtitle2" color="text.secondary">Trainee</Typography>
        </Box>
        
        <Box sx={{ position: 'relative', height: 'calc(100vh - 200px)' }}>
          {!isCallActive ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              border: '1px solid #ccc',
              borderRadius: '16px',
              mx: 'auto',
              maxWidth: '80%',
              my: 4
            }}>
              <Box sx={{
                bgcolor: '#f5f7ff',
                borderRadius: '50%',
                p: 3,
                mb: 3
              }}>
                <HeadsetMic sx={{ fontSize: 48, color: '#4c6ef5' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a', mb: 1 }}>
                Preview Simulation
              </Typography>
              <Typography sx={{ color: '#666', mb: 2 }}>
                Press start to preview the Audio Simulation
              </Typography>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleStart}
                disabled={isStarting}
                sx={{
                  bgcolor: '#0037ff',
                  color: 'white',
                  px: 6,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '16px',
                  '&:hover': {
                    bgcolor: '#002ed4',
                  }
                }}
              >
                {isStarting ? 'Starting...' : 'Start'}
              </Button>
            </Box>
          ) : (
            <>
              <Box
                ref={chatContainerRef}
                sx={{
                  height: 'calc(100% - 80px)',
                  overflowY: 'auto',
                  px: 3,
                  py: 2,
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                }}
              >
                <Stack spacing={2}>
                  {messages.map((message, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={2}
                      justifyContent={message.speaker === 'customer' ? 'flex-start' : 'flex-end'}
                      alignItems="flex-start"
                    >
                      {message.speaker === 'customer' && (
                        <Avatar sx={{ width: 32, height: 32 }}>C</Avatar>
                      )}
                      <Box
                        sx={{
                          maxWidth: '70%',
                          bgcolor: '#FAFAFF',
                          p: 2,
                          borderRadius: 3,
                          border: '2px solid #6D7295',
                          borderTopLeftRadius: message.speaker === 'customer' ? 0 : 3,
                          borderTopRightRadius: message.speaker === 'trainee' ? 0 : 3,
                        }}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                      </Box>
                      {message.speaker === 'trainee' && (
                        <Avatar
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                          sx={{ width: 32, height: 32 }}
                        />
                      )}
                    </Stack>
                  ))}
                </Stack>
              </Box>
              <Box sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0,
                p: 2,
                display: 'flex',
                justifyContent: 'center',
                borderTop: '1px solid',
                borderColor: 'divider',
                bgcolor: 'white'
              }}>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<CallEnd />}
                  onClick={handleEndCall}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 4
                  }}
                >
                  End Call
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default PreviewTab;