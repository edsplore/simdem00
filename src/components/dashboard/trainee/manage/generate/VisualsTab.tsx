import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Box,
  Typography,
  Stack, 
  Button,
  IconButton,
  Collapse,
  Card,
  styled,
  Divider,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Description as DescriptionIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import SortableItem from './SortableItem';
import ImageHotspot from './ImageHotspot';
import HotspotSequence from './HotspotSequence';

interface VisualImage {
  id: string;
  url: string;
  name: string;
}

interface VisualsTabProps {
  onImagesUpdate?: (images: VisualImage[]) => void;
}

const DropZone = styled(Box)(({ theme }) => ({
  border: '2px dashed #DEE2FC',
  borderRadius: theme.spacing(2),
  padding: theme.spacing(4),
  backgroundColor: '#FCFCFE',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s ease-in-out',
  minHeight: '320px',
  '&:hover': {
    borderColor: theme.palette.primary.main,
  },
}));

const ImagePreview = styled(Card)(({ theme }) => ({
  width: '100%',
  borderRadius: theme.spacing(1),
  position: 'relative',
  marginBottom: theme.spacing(2),
  '&:hover .image-actions': {
    opacity: 1,
  },
}));

const ThumbnailContainer = styled(Box)(({ theme }) => ({
  width: '280px',
  height: '200px',
  overflow: 'hidden',
  borderRadius: theme.spacing(1),
  position: 'relative',
  '&:hover .image-actions': {
    opacity: 1,
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const ScrollableStack = styled(Stack)(({ theme }) => ({
  maxHeight: 'calc(100vh - 300px)',
  overflowY: 'auto',
  paddingRight: theme.spacing(1),
  marginRight: -theme.spacing(1),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#F1F1F1',
    borderRadius: '10px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#DEE2FC',
    borderRadius: '10px',
    '&:hover': {
      background: '#444CE7',
    },
  },
}));

const VisualsTab: React.FC<VisualsTabProps> = ({ onImagesUpdate }) => {
  const [images, setImages] = useState<VisualImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isSequenceExpanded, setIsSequenceExpanded] = useState(false);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onImagesUpdate?.(newItems);
        return newItems;
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    const newImages = imageFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      name: file.name,
    }));

    setImages(prev => {
      const updated = [...prev, ...newImages];
      onImagesUpdate?.(updated);
      return updated;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleDelete = (id: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      onImagesUpdate?.(updated);
      return updated;
    });
    if (selectedImageId === id) {
      setSelectedImageId(null);
    }
  };

  const handleImageClick = (id: string) => {
    setSelectedImageId(id);
  };

  return (
    <Stack spacing={4}>
      {images.length === 0 ? (
        <DropZone
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <DescriptionIcon sx={{ fontSize: 80, color: '#DEE2FC', mb: 2 }} />
          <Typography variant="h5" sx={{ color: "#0F174F", mb: 2 }} gutterBottom fontWeight="800">
            Add Visuals
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px", mb: 2 }}>
            Drag and drop your images here in .png, .jpeg format
          </Typography>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', my: 2 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Stack>

          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            sx={{
              bgcolor: '#444CE7',
              color: 'white',
              py: 1.5,
              px: 4,
              '&:hover': { bgcolor: '#3538CD' },
            }}
          >
            Upload
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </Button>
        </DropZone>
      ) : (
        <Box sx={{ display: 'flex', gap: 4, height: 'calc(100vh - 250px)' }}>
          {/* Left sidebar with thumbnails */}
          <Box sx={{ width: 280 }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map(img => img.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollableStack spacing={2}>
                  {images.map((image, index) => (
                    <SortableItem
                      key={image.id}
                      id={image.id}
                      image={image}
                      index={index}
                      selectedImageId={selectedImageId}
                      onImageClick={handleImageClick}
                      onDelete={handleDelete}
                    />
                  ))}
                </ScrollableStack>
              </SortableContext>
            </DndContext>

            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              sx={{
                mt: 2,
                borderStyle: 'dashed',
                borderColor: '#DEE2FC',
                color: '#444CE7',
                '&:hover': {
                  borderColor: '#444CE7',
                  bgcolor: '#F5F6FF',
                },
              }}
            >
              Add Image
              <input
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          {/* Main content area */}
          <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
            {selectedImageId ? (
              <Box
                sx={{
                  height: '100%',
                  bgcolor: '#F9FAFB',
                  borderRadius: 2,
                  p: 4,
                  flex: 1,
                  transition: 'all 0.3s ease',
                  marginRight: isSequenceExpanded ? '340px' : '40px',
                }}
              >
                <ImageHotspot
                  imageUrl={images.find(img => img.id === selectedImageId)?.url || ''}
                  onHotspotsChange={(newHotspots) => {
                    setHotspots(newHotspots);
                    onHotspotsChange?.(newHotspots);
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Select an image from the left to preview
                </Typography>
              </Box>
            )}
            
            {selectedImageId && (
              <Box sx={{ 
                position: 'absolute',
                right: 0,
                top: 0,
                height: '100%',
                display: 'flex',
                transition: 'all 0.3s ease',
              }}>
                {/* Collapse toggle button */}
                <Box sx={{
                  width: 40,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  <IconButton
                    onClick={() => setIsSequenceExpanded(!isSequenceExpanded)}
                    sx={{
                      bgcolor: '#F5F6FF',
                      '&:hover': { bgcolor: '#EEF0FF' },
                      transform: isSequenceExpanded ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </Box>

                {/* Sequence panel */}
                <Box
                  sx={{
                    transform: isSequenceExpanded ? 'translateX(0)' : 'translateX(100%)',
                    transition: 'transform 0.3s ease',
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    height: '100%',
                  }}
                >
                  <HotspotSequence
                    hotspots={hotspots}
                    onHotspotsReorder={setHotspots}
                    onHotspotDelete={(id) => {
                      setHotspots(prev => prev.filter(h => h.id !== id));
                    }}
                    onHotspotEdit={(id) => {
                      // Handle edit - you can implement this later
                      console.log('Edit hotspot:', id);
                    }}
                    isExpanded={isSequenceExpanded}
                    onToggle={() => setIsSequenceExpanded(!isSequenceExpanded)}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Stack>
  );
};

export default VisualsTab;