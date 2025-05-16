import React, { useState } from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import {
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChatBubble as ChatBubbleIcon,
  Lightbulb as LightbulbIcon,
  Highlight as HighlightIcon,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

// Utility function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // Create a temporary DOM element to safely extract text content
  if (typeof window !== "undefined") {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  }

  // Fallback regex method for server-side or when DOM is not available
  return html
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
    .replace(/&amp;/g, "&") // Replace escaped ampersands
    .replace(/&lt;/g, "<") // Replace escaped less-than
    .replace(/&gt;/g, ">") // Replace escaped greater-than
    .replace(/&quot;/g, '"') // Replace escaped quotes
    .trim();
};

/** The shape of a single item in our combined sequence. */
export interface SequenceItem {
  /** Unique ID, e.g. "hotspot-xxx" or "message-yyy". */
  id: string;
  /** "hotspot" or "message". */
  type: "hotspot" | "message";
  /** The actual content object. */
  content: Hotspot | ScriptMessage;
  /** Addition timestamp for natural ordering */
  timestamp?: number;
}

/** A normal hotspot definition. */
export interface Hotspot {
  id: string;
  name: string;
  type: "hotspot";
  hotspotType:
    | "button"
    | "coaching"
    | "highlight"
    | "dropdown"
    | "checkbox"
    | "textfield"
    | string;
  text?: string;
  hotkey?: string;
  coordinates?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  settings?: any;
  options?: string[];
}

/** A script message definition. */
export interface ScriptMessage {
  id: string;
  text: string;
  role: "Customer" | "Trainee";
  visualId?: string;
  order?: number;
}

/** Props to the overall HotspotSequence container. */
interface HotspotSequenceProps {
  /** Combined array of messages + hotspots in the correct sequence. */
  sequence: SequenceItem[];
  /** Called after reordering so the parent can store new sequence. */
  onSequenceReorder: (newSequence: SequenceItem[]) => void;

  /** Called if user clicks delete on an item. */
  onItemDelete: (id: string, type: "hotspot" | "message") => void;
  /** Called if user clicks edit on an item. */
  onItemEdit: (id: string, type: "hotspot" | "message") => void;
}

/** Single row in the sequence (draggable). */
function SortableRow({
  item,
  onDelete,
  onEdit,
}: {
  item: SequenceItem;
  onDelete: () => void;
  onEdit: () => void;
}) {
  // Ensure item exists and has the required properties
  if (!item || typeof item !== "object") {
    console.error("Invalid item passed to SortableRow:", item);
    return null;
  }

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: item.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Make sure item has a valid type
  if (!item.type || !["message", "hotspot"].includes(item.type)) {
    console.error("Item has invalid or missing type:", item);
    return (
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          p: 2,
          pr: 3,
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Typography color="error">Invalid sequence item</Typography>
      </Box>
    );
  }

  if (item.type === "message") {
    // Render a script message row
    // Check if content exists and has the required properties
    if (!item.content) {
      console.error("Message item missing content:", item);
      return (
        <Box
          ref={setNodeRef}
          style={style}
          sx={{
            p: 2,
            pr: 3,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            mb: 2,
          }}
        >
          <Typography color="error">Invalid message data</Typography>
        </Box>
      );
    }

    const msg = item.content as ScriptMessage;

    return (
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          p: 2,
          pr: 3,
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Drag handle */}
            <Box {...attributes} {...listeners}>
              <IconButton size="small">
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Use explicit comparison to catch all variations of Customer/customer roles */}
            {msg.role.toLowerCase() === "customer" ? (
              <SupportAgentIcon sx={{ color: "#444CE7", fontSize: 20 }} />
            ) : (
              <PersonIcon sx={{ color: "#444CE7", fontSize: 20 }} />
            )}
            <Typography
              variant="subtitle2"
              sx={{
                flex: 1,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {msg.role}
            </Typography>

            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
              pr: 1,
            }}
          >
            {stripHtmlTags(msg.text)}
          </Typography>
        </Stack>
      </Box>
    );
  } else {
    // Render a hotspot row
    // Check if content exists and has the required properties
    if (!item.content) {
      console.error("Hotspot item missing content:", item);
      return (
        <Box
          ref={setNodeRef}
          style={style}
          sx={{
            p: 2,
            pr: 3,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            mb: 2,
          }}
        >
          <Typography color="error">Invalid hotspot data</Typography>
        </Box>
      );
    }

    const ht = item.content as Hotspot;

    function getHotspotIcon(hType: string) {
      switch (hType) {
        case "button":
          return <ChatBubbleIcon sx={{ fontSize: 20, color: "#444CE7" }} />;
        case "coaching":
          return <LightbulbIcon sx={{ fontSize: 20, color: "#444CE7" }} />;
        case "highlight":
          return <HighlightIcon sx={{ fontSize: 20, color: "#444CE7" }} />;
        default:
          return <ChatBubbleIcon sx={{ fontSize: 20, color: "#444CE7" }} />;
      }
    }

    return (
      <Box
        ref={setNodeRef}
        style={style}
        sx={{
          p: 2,
          pr: 3,
          bgcolor: "white",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Drag handle */}
            <Box {...attributes} {...listeners}>
              <IconButton size="small">
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Box>

            {getHotspotIcon(ht.hotspotType || ht.type)}

            <Typography
              variant="subtitle2"
              sx={{
                flex: 1,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {ht.name || "Untitled hotspot"}
            </Typography>

            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>

          {ht.text && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                pl: 5,
                pr: 1,
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
            >
              {stripHtmlTags(ht.text)}
            </Typography>
          )}
          {ht.hotkey && (
            <Typography
              variant="caption"
              sx={{ pl: 5, pr: 1, color: "text.secondary" }}
            >
              Hotkey: {ht.hotkey}
            </Typography>
          )}
        </Stack>
      </Box>
    );
  }
}

const HotspotSequence: React.FC<HotspotSequenceProps> = ({
  sequence,
  onSequenceReorder,
  onItemDelete,
  onItemEdit,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Reorder local array
    const oldIndex = sequence.findIndex((x) => x.id === active.id);
    const newIndex = sequence.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newArr = [...sequence];
    const [moved] = newArr.splice(oldIndex, 1);
    newArr.splice(newIndex > oldIndex ? newIndex - 1 : newIndex, 0, moved);

    // Fire parent callback with new order
    onSequenceReorder(newArr);
  };

  // Make sure sequence is valid before trying to render it
  const validSequence = Array.isArray(sequence) ? sequence : [];

  return (
    <Box
      sx={{
        width: 400,
        height: "100%",
        bgcolor: "#F9FAFB",
        borderLeft: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, pr: 3, py: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Typography variant="subtitle1" fontWeight="600">
          Sequence
        </Typography>
      </Stack>

      {/* Draggable items - always shown */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          pr: 3,
          py: 2,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#F1F1F1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#DEE2FC",
            borderRadius: "10px",
            "&:hover": {
              background: "#444CE7",
            },
          },
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={validSequence.map((it) => it.id)}
            strategy={verticalListSortingStrategy}
          >
            {validSequence.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                onEdit={() => {
                  if (item.content && item.content.id) {
                    onItemEdit(item.content.id, item.type);
                  } else {
                    console.error("Missing content.id for item:", item);
                  }
                }}
                onDelete={() => {
                  if (item.content && item.content.id) {
                    onItemDelete(item.content.id, item.type);
                  } else {
                    console.error("Missing content.id for item:", item);
                  }
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Box>
    </Box>
  );
};

export default HotspotSequence;
