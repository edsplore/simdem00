import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Button,
  Divider,
} from '@mui/material';
import {
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChatBubble as ChatBubbleIcon,
  Lightbulb as LightbulbIcon,
  Highlight as HighlightIcon,
} from '@mui/icons-material';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Hotspot {
  id: string;
  name: string;
  type: string;
  text?: string;
  hotkey?: string;
}

interface HotspotSequenceProps {
  hotspots: Hotspot[];
  onHotspotsReorder: (newHotspots: Hotspot[]) => void;
  onHotspotDelete: (id: string) => void;
  onHotspotEdit: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SortableHotspot = ({ hotspot, onDelete, onEdit }: { 
  hotspot: Hotspot; 
  onDelete: () => void;
  onEdit: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: hotspot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'button':
        return <ChatBubbleIcon sx={{ fontSize: 20, color: '#444CE7' }} />;
      case 'coaching':
        return <LightbulbIcon sx={{ fontSize: 20, color: '#444CE7' }} />;
      case 'highlight':
        return <HighlightIcon sx={{ fontSize: 20, color: '#444CE7' }} />;
      default:
        return <ChatBubbleIcon sx={{ fontSize: 20, color: '#444CE7' }} />;
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        bgcolor: 'white',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 1,
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box {...attributes} {...listeners}>
            <IconButton size="small">
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Box>
          {getIcon(hotspot.type)}
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            {hotspot.name}
          </Typography>
          <IconButton size="small" onClick={onEdit}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
        
        {hotspot.text && (
          <Typography variant="body2" color="text.secondary" sx={{ pl: 5 }}>
            {hotspot.text}
          </Typography>
        )}
        
        {hotspot.hotkey && (
          <Typography variant="caption" sx={{ pl: 5, color: 'text.secondary' }}>
            Hotkey: {hotspot.hotkey}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

const HotspotSequence: React.FC<HotspotSequenceProps> = ({
  hotspots,
  onHotspotsReorder,
  onHotspotDelete,
  onHotspotEdit,
  isExpanded,
  onToggle,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = hotspots.findIndex((h) => h.id === active.id);
      const newIndex = hotspots.findIndex((h) => h.id === over.id);
      
      const newHotspots = [...hotspots];
      const [movedItem] = newHotspots.splice(oldIndex, 1);
      newHotspots.splice(newIndex, 0, movedItem);
      
      onHotspotsReorder(newHotspots);
    }
  };

  return (
    <Box
      sx={{
        width: 300,
        height: '100%',
        bgcolor: '#F9FAFB',
        borderLeft: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden auto',
      }}
    >
      <Stack sx={{ height: '100%' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Typography variant="subtitle1" fontWeight="600">
            Hotspots Sequence
          </Typography>
        </Stack>

        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={hotspots.map(h => h.id)}
              strategy={verticalListSortingStrategy}
            >
              {hotspots.map((hotspot) => (
                <SortableHotspot
                  key={hotspot.id}
                  hotspot={hotspot}
                  onDelete={() => onHotspotDelete(hotspot.id)}
                  onEdit={() => onHotspotEdit(hotspot.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </Box>
      </Stack>
    </Box>
  );
};

export default HotspotSequence;