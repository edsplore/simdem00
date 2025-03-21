import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Dialog,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Stack,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';

interface Hotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  type: 'button' | 'field';
  settings: {
    font: string;
    fontSize: number;
    buttonColor: string;
    textColor: string;
    timeoutDuration: number;
    highlightField: boolean;
    enableHotkey: boolean;
  };
}

interface ImageHotspotProps {
  imageUrl: string;
  onHotspotsChange?: (hotspots: Hotspot[]) => void;
  onEditHotspot?: (hotspot: Hotspot) => void;
  editingHotspot?: Hotspot | null;
}

const ImageHotspot: React.FC<ImageHotspotProps> = ({ 
  imageUrl, 
  onHotspotsChange,
  onEditHotspot,
  editingHotspot 
}) => {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentHotspot, setCurrentHotspot] = useState<Partial<Hotspot> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dialogPosition, setDialogPosition] = useState({ top: 0, left: 0 });

  // Update hotspots when editing hotspot changes
  useEffect(() => {
    if (editingHotspot) {
      setCurrentHotspot(editingHotspot);
      setShowSettings(true);
      
      // Position dialog near the hotspot
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDialogPosition({
          top: editingHotspot.y + rect.top,
          left: editingHotspot.x + editingHotspot.width + rect.left + 16
        });
      }
    }
  }, [editingHotspot]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentHotspot({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentHotspot) return;
    setIsDrawing(false);

    // Calculate dialog position with viewport awareness
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dialogHeight = 520; // Approximate dialog height
      const dialogWidth = 320; // Dialog width
      
      // Initial position next to hotspot
      let top = currentHotspot.y + rect.top;
      let left = currentHotspot.x + currentHotspot.width + rect.left + 16;
      
      // Adjust vertical position if dialog would go off screen
      if (top + dialogHeight > viewportHeight) {
        top = Math.max(viewportHeight - dialogHeight - 16, 16);
      }
      
      // Adjust horizontal position if dialog would go off screen
      if (left + dialogWidth > viewportWidth) {
        left = currentHotspot.x + rect.left - dialogWidth - 16;
      }
      
      setDialogPosition({ top, left });
    }
    
    setShowSettings(true);
  };

  const handleSettingsSave = (settings: Partial<Hotspot>) => {
    if (!currentHotspot) return;

    const hotspot: Hotspot = {
      id: currentHotspot.id || Date.now().toString(),
      x: currentHotspot.x || 0,
      y: currentHotspot.y || 0,
      width: currentHotspot.width || 0,
      height: currentHotspot.height || 0,
      name: settings.name || 'Untitled hotspot',
      type: settings.type || 'button',
      settings: {
        font: settings.settings?.font || 'Inter',
        fontSize: settings.settings?.fontSize || 16,
        buttonColor: settings.settings?.buttonColor || '#00AB55',
        textColor: settings.settings?.textColor || '#FFFFFF',
        timeoutDuration: settings.settings?.timeoutDuration || 2,
        highlightField: settings.settings?.highlightField || false,
        enableHotkey: settings.settings?.enableHotkey || false,
      },
    };

    // Update existing hotspot or add new one
    const newHotspots = editingHotspot
      ? hotspots.map(h => h.id === hotspot.id ? hotspot : h)
      : [...hotspots, hotspot];

    setHotspots(newHotspots);
    setCurrentHotspot(null);
    setShowSettings(false);
    onHotspotsChange?.(newHotspots);
  };

  // Function to remove a hotspot
  const removeHotspot = (id: string) => {
    const newHotspots = hotspots.filter(h => h.id !== id);
    setHotspots(newHotspots);
    onHotspotsChange?.(newHotspots);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          cursor: isDrawing ? 'crosshair' : 'url("data:image/svg+xml,%3Csvg width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'10\' fill=\'black\'/%3E%3Cpath d=\'M12 7V17M7 12H17\' stroke=\'white\' stroke-width=\'2\'/%3E%3C/svg%3E") 12 12, auto',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <Box
          component="img"
          src={imageUrl}
          alt="Hotspot canvas"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />

        {/* Existing hotspots */}
        {hotspots.map((hotspot) => (
          <Box
            key={hotspot.id}
            sx={{
              position: 'absolute',
              left: hotspot.x,
              top: hotspot.y,
              width: hotspot.width,
              height: hotspot.height,
              border: '2px solid #444CE7',
              backgroundColor: 'rgba(68, 76, 231, 0.1)',
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Currently drawing hotspot */}
        {currentHotspot && (
          <Box
            sx={{
              position: 'absolute',
              left: currentHotspot.x,
              top: currentHotspot.y,
              width: currentHotspot.width,
              height: currentHotspot.height,
              border: '2px solid #444CE7',
              backgroundColor: 'rgba(68, 76, 231, 0.1)',
              pointerEvents: 'none',
            }}
          />
        )}
      </Box>

      {/* Settings Dialog */}
      {showSettings && (
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            top: dialogPosition.top,
            left: dialogPosition.left,
            width: 320,
            borderRadius: 2,
            zIndex: 1300,
          }}
        >
          <Stack spacing={2} sx={{ p: 2 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: '#F5F6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AddIcon sx={{ fontSize: 16, color: '#444CE7' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight="600">Add Hotspot</Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={() => {
                  setShowSettings(false);
                  setCurrentHotspot(null);
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>

            {/* Form Fields */}
            <Stack spacing={1.5}>
              <TextField
                size="small"
                label="Name *"
                defaultValue="Untitled button"
                onChange={(e) => setCurrentHotspot(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
              />
              
              <Select
                size="small"
                label="Type"
                InputLabelProps={{ shrink: true }}
                value={currentHotspot?.type || 'button'}
                onChange={(e) => setCurrentHotspot(prev => ({
                  ...prev,
                  type: e.target.value as 'button' | 'field'
                }))}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    padding: '0 4px',
                  }
                }}
              >
                <MenuItem value="button">Button</MenuItem>
                <MenuItem value="dropdown">Dropdown</MenuItem>
                <MenuItem value="checkbox">Checkbox</MenuItem>
                <MenuItem value="textfield">Text Field</MenuItem>
                <MenuItem value="highlight">Highlight</MenuItem>
                <MenuItem value="coaching">Coaching Tip</MenuItem>
              </Select>

              <Stack direction="row" spacing={1}>
                <Select
                  size="small"
                  fullWidth
                  label="Font"
                  InputLabelProps={{ shrink: true }}
                  value={currentHotspot?.settings?.font || 'Inter'}
                  onChange={(e) => setCurrentHotspot(prev => ({
                    ...prev,
                    settings: {
                      ...prev?.settings,
                      font: e.target.value as string
                    }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': {
                      backgroundColor: 'white',
                      padding: '0 4px',
                    }
                  }}
                >
                  <MenuItem value="Inter">Inter</MenuItem>
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Roboto">Roboto</MenuItem>
                </Select>

                <Select
                  size="small"
                  fullWidth
                  label="Size"
                  InputLabelProps={{ shrink: true }}
                  value={currentHotspot?.settings?.fontSize || 16}
                  onChange={(e) => setCurrentHotspot(prev => ({
                    ...prev,
                    settings: {
                      ...prev?.settings,
                      fontSize: e.target.value as number
                    }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': {
                      backgroundColor: 'white',
                      padding: '0 4px',
                    }
                  }}
                >
                  {[12, 14, 16, 18, 20].map(size => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </Stack>

              <Select
                size="small"
                label="Timeout Duration"
                InputLabelProps={{ shrink: true }}
                value={currentHotspot?.settings?.timeoutDuration || 2}
                onChange={(e) => setCurrentHotspot(prev => ({
                  ...prev,
                  settings: {
                    ...prev?.settings,
                    timeoutDuration: e.target.value as number
                  }
                }))}
                sx={{
                  '& .MuiInputLabel-root': {
                    backgroundColor: 'white',
                    padding: '0 4px',
                  }
                }}
              >
                {[1, 2, 3, 4, 5].map(duration => (
                  <MenuItem key={duration} value={duration}>{duration} sec</MenuItem>
                ))}
              </Select>

              <Stack direction="row" spacing={1}>
                <Select
                  size="small"
                  fullWidth
                  label="Button Color"
                  InputLabelProps={{ shrink: true }}
                  value={currentHotspot?.settings?.buttonColor || '#00AB55'}
                  onChange={(e) => setCurrentHotspot(prev => ({
                    ...prev,
                    settings: {
                      ...prev?.settings,
                      buttonColor: e.target.value as string
                    }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': {
                      backgroundColor: 'white',
                      padding: '0 4px',
                    }
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: value,
                          borderRadius: 0.5,
                        }}
                      />
                      {value}
                    </Box>
                  )}
                >
                  <MenuItem value="#00AB55">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#00AB55',
                        borderRadius: 0.5,
                        mr: 1,
                      }}
                    />
                    #00AB55
                  </MenuItem>
                  <MenuItem value="#444CE7">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#444CE7',
                        borderRadius: 0.5,
                        mr: 1,
                      }}
                    />
                    #444CE7
                  </MenuItem>
                </Select>

                <Select
                  size="small"
                  fullWidth
                  label="Text Color"
                  InputLabelProps={{ shrink: true }}
                  value={currentHotspot?.settings?.textColor || '#FFFFFF'}
                  onChange={(e) => setCurrentHotspot(prev => ({
                    ...prev,
                    settings: {
                      ...prev?.settings,
                      textColor: e.target.value as string
                    }
                  }))}
                  sx={{
                    '& .MuiInputLabel-root': {
                      backgroundColor: 'white',
                      padding: '0 4px',
                    }
                  }}
                  renderValue={(value) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          bgcolor: value,
                          borderRadius: 0.5,
                          border: '1px solid #E5E7EB',
                        }}
                      />
                      {value}
                    </Box>
                  )}
                >
                  <MenuItem value="#FFFFFF">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#FFFFFF',
                        borderRadius: 0.5,
                        border: '1px solid #E5E7EB',
                        mr: 1,
                      }}
                    />
                    #FFFFFF
                  </MenuItem>
                  <MenuItem value="#000000">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        bgcolor: '#000000',
                        borderRadius: 0.5,
                        mr: 1,
                      }}
                    />
                    #000000
                  </MenuItem>
                </Select>
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    onChange={(e) => setCurrentHotspot(prev => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        highlightField: e.target.checked
                      }
                    }))}
                  />
                }
                label={
                  <Typography variant="body2">Highlight Field</Typography>
                }
              />

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    onChange={(e) => setCurrentHotspot(prev => ({
                      ...prev,
                      settings: {
                        ...prev?.settings,
                        enableHotkey: e.target.checked
                      }
                    }))}
                  />
                }
                label={
                  <Typography variant="body2">Enable Hotkey</Typography>
                }
              />
            </Stack>

            {/* Actions */}
            <Stack direction="row" spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setShowSettings(false);
                  setCurrentHotspot(null);
                }}
                sx={{ textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={() => handleSettingsSave(currentHotspot || {})}
                sx={{
                  bgcolor: '#444CE7',
                  '&:hover': { bgcolor: '#3538CD' },
                  textTransform: 'none',
                }}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default ImageHotspot;
