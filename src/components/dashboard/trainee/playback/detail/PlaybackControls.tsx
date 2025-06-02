import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SettingsIcon from '@mui/icons-material/Settings';
import WaveSurfer from 'wavesurfer.js';

interface PlaybackControlsProps {
  audioUrl: string;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({ audioUrl }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (waveformRef.current && !wavesurferRef.current) {
      wavesurferRef.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#C2C2C2',
        progressColor: '#007AFF',
        cursorColor: '#000',
        barWidth: 3,
        height: 36,
      });

      wavesurferRef.current.on('ready', () => {
        setDuration(Math.floor(wavesurferRef.current?.getDuration() || 0));
      });
      wavesurferRef.current.on('audioprocess', () => {
        setCurrentTime(Math.floor(wavesurferRef.current?.getCurrentTime() || 0));
      });
      wavesurferRef.current.on('play', () => setIsPlaying(true));
      wavesurferRef.current.on('pause', () => setIsPlaying(false));
    }
    return () => {
      wavesurferRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (wavesurferRef.current && audioUrl) {
      wavesurferRef.current.load(audioUrl);
    }
  }, [audioUrl]);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (!wavesurferRef.current) return;
    if (isPlaying) {
      wavesurferRef.current.pause();
    } else {
      wavesurferRef.current.play();
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, display: 'flex', alignItems: 'center', columnGap: 3 }}
    >
      <IconButton onClick={handlePlayPause} size="large">
        {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <Typography variant="body2">
        {formatTime(currentTime)} / {formatTime(duration)}
      </Typography>
      <Box flexGrow={1} minHeight={36}>
        <div ref={waveformRef} style={{ width: '100%', height: '100%' }} />
      </Box>
      <IconButton size="large">
        <VolumeUpIcon />
      </IconButton>
      <IconButton size="large">
        <SettingsIcon />
      </IconButton>
    </Paper>
  );
};

export default PlaybackControls;
