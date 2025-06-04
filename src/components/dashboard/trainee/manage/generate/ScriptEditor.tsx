import React, { useState, useRef, useMemo, useEffect } from "react";
import ReactQuill, { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";
import DOMPurify from "dompurify";
import {
  Stack,
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  IconButton,
  TextField,
  Button,
  Box,
  styled,
  useTheme,
  Popper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  Autocomplete,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIndicatorIcon,
  Mic as MicIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";

// Import the AudioRecorder component
import AudioRecorder from "./AudioRecorder";
import vectorIcon from "../../../../../assets/vector.svg";
import featuredIcon from "../../../../../assets/featuredIcon.svg";


//
// 1. Define a custom Quill format for "keyword"
//    This style uses green text + lightgreen background.
// //
// const KeywordStyle = Quill.import("formats/bold"); // or use a more basic blot
// class KeywordFormat extends KeywordStyle {}
// KeywordFormat.blotName = "keyword";
// KeywordFormat.tagName = "span";
// KeywordFormat.className = "keyword-highlight"; // we can define styling in CSS
// Quill.register(KeywordFormat, true);

const Inline = Quill.import("blots/inline");

class KeywordFormat extends Inline {
  static create(value) {
    const node = super.create();
    node.classList.add("keyword-highlight");
    return node;
  }

  static formats(node) {
    return node.classList.contains("keyword-highlight");
  }
}

KeywordFormat.blotName = "keyword";
KeywordFormat.tagName = "span";
Quill.register(KeywordFormat, true);
//
// 2. Set up a small CSS rule for .keyword-highlight
//    (You can also do this inline in a <style> or your theme.)
//    E.g. .keyword-highlight { color: green; background-color: #ccffd1; }
//

// Define a styled component for drag overlay
const DragOverlay = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  height: 3,
  backgroundColor: theme.palette.secondary.main,
  borderRadius: 2,
  transition: "transform 0.2s ease, opacity 0.2s ease",
}));

//
// The rest is your existing data model.
//
interface Keyword {
  main_keyword: string;
  alternative_keywords: string[];
  points: number;
}

interface Message {
  id: string;
  role: "Customer" | "Trainee";
  message: string; // We'll store Quill HTML in here once editing is done
  keywords: Keyword[];
}

const initialMessages: Message[] = [
  {
    id: "script-0",
    role: "Customer",
    message: "Hello! I want to refill my medications please.",
    keywords: [],
  },
  {
    id: "script-1",
    role: "Trainee",
    message:
      "Thank you for calling <strong>Centerwell Pharmacy</strong>. My name is [Your Name]. Are you ready to take advantage of your <u>Mail Order Benefits</u> today?",
    keywords: [],
  },
];

const MessageBubble = styled("div")(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: "1px solid transparent",
  minWidth: "140px",
  backgroundColor: theme.palette.grey[100],
  "&:hover": {
    borderColor: theme.palette.grey[300],
  },
}));

// Add a styled component for draggable messages with animation
const DraggableMessage = styled(Box)(({ theme }) => ({
  transition: "transform 0.2s ease, opacity 0.2s ease",
  "&.dragging": {
    opacity: 0.7,
    transform: "scale(1.01)",
    zIndex: 10,
  },
}));

interface ScriptEditorProps {
  script?: Message[];
  onScriptUpdate?: (script: Message[]) => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script = initialMessages,
  onScriptUpdate,
}) => {
  const theme = useTheme();

  // ----------------------------
  //   State
  // ----------------------------
  const [messages, setMessages] = useState<Message[]>(script);
  const [inputText, setInputText] = useState("");
  const [currentRole, setCurrentRole] = useState<"Customer" | "Trainee">(
    "Customer",
  );

  // Drag‐and‐drop
  const [draggedMessage, setDraggedMessage] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState(""); // we store the Quill HTML here
  const [draftDeltaText, setDraftDeltaText] = useState<any>("");
  const [draftRole, setDraftRole] = useState<"Customer" | "Trainee">(
    "Customer",
  ); // NEW: track edited role
  const [editingMinWidth, setEditingMinWidth] = useState<number>(0);

  // Add Message Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMessageRole, setAddMessageRole] = useState<"Customer" | "Trainee">(
    "Customer",
  );
  const [newMessageText, setNewMessageText] = useState("");
  const [addMessageIndex, setAddMessageIndex] = useState<number | null>(null);

  // We'll track which message's "keywords" we might be modifying
  // as we highlight/unhighlight text inside the Quill editor
  const [editingKeywords, setEditingKeywords] = useState<Keyword[]>([]);

  // We'll show a small popup at selection for "Add/Remove Keyword"
  const [selectionAnchor, setSelectionAnchor] = useState<Range | null>(null);
  const [selectionIndex, setSelectionIndex] = useState<number>(0);
  const [selectionLength, setSelectionLength] = useState<number>(0);
  const [showKeywordPopper, setShowKeywordPopper] = useState(false);
  const [isAlreadyKeyword, setIsAlreadyKeyword] = useState(false); // does selection have 'keyword'?
  const [activeTab, setActiveTab] = useState<"alternative" | "verbatim">("alternative"); // New state for tab management
  const [alternativeKeywordInput, setAlternativeKeywordInput] = useState(""); // State for alternative keyword input
  const [altInputValue, setAltInputValue] = useState("");

  // Refs
  const messageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Popper ref
  const keywordPopperRef = useRef(null);

  // Quill modules
  const modules = useMemo(
    () => ({
      toolbar: false, // Hide the default toolbar
    }),
    [],
  );

  // We define which Quill formats are allowed
  const formats = useMemo(
    () => ["bold", "italic", "underline", "span", "keyword"],
    [],
  );

  useEffect(() => {
    const editor = quillRef?.current?.getEditor();
  }, [draftText]);

  // We will attach a small ref to Quill
  const quillRef = useRef<ReactQuill>(null);

  // --- Virtual anchor for Popper ---
  const [virtualAnchor, setVirtualAnchor] = useState<{
    getBoundingClientRect: () => DOMRect;
    clientWidth: number;
    clientHeight: number;
  } | null>(null);

  const calculateVirtualAnchor = (index: number, length: number) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const bounds = quill.getBounds(index, length);
      const editorContainer = quillRef.current.editor?.container;
      if (editorContainer && bounds) {
        const rect = editorContainer.getBoundingClientRect();
        return {
          getBoundingClientRect: () => ({
            top: rect.top + bounds.top + window.scrollY,
            left: rect.left + bounds.left + window.scrollX,
            width: bounds.width,
            height: bounds.height,
            right: rect.left + bounds.left + bounds.width + window.scrollX,
            bottom: rect.top + bounds.top + bounds.height + window.scrollY,
          }),
          clientWidth: bounds.width,
          clientHeight: bounds.height,
        };
      }
    }
    return null;
  };

  // ----------------------------
  //  Basic UI logic
  // ----------------------------
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: `msg-${messages.length}`, // FIXED: Use stable, predictable IDs
      role: currentRole,
      message: inputText,
      keywords: [],
    };

    // Create a new array with all existing messages plus the new one
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);

    // Use the callback to update parent component
    if (onScriptUpdate) {
      onScriptUpdate(updatedMessages);
    }

    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRole = () => {
    setCurrentRole((prev) => (prev === "Customer" ? "Trainee" : "Customer"));
  };

  const deleteMessage = (id: string) => {
    const updatedMessages = messages.filter((m) => m.id !== id);
    setMessages(updatedMessages);
    if (onScriptUpdate) {
      onScriptUpdate(updatedMessages);
    }
  };

  // ----------------------------
  //  Add Message Dialog
  // ----------------------------
  const handleOpenAddDialog = (index: number) => {
    setAddMessageIndex(index);
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setNewMessageText("");
    setAddMessageIndex(null);
  };

  const handleAddMessage = () => {
    if (!newMessageText.trim() || addMessageIndex === null) {
      handleCloseAddDialog();
      return;
    }

    const newMessage: Message = {
      id: `msg-add-${messages.length}`, // FIXED: Use stable, predictable IDs
      role: addMessageRole,
      message: newMessageText,
      keywords: [],
    };

    const updatedMessages = [...messages];
    updatedMessages.splice(addMessageIndex, 0, newMessage);
    setMessages(updatedMessages);

    // Update parent component
    if (onScriptUpdate) {
      onScriptUpdate(updatedMessages);
    }

    handleCloseAddDialog();
  };

  // ----------------------------
  //  Enhanced Drag & Drop
  // ----------------------------
  const handleDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    msgId: string,
    index: number,
  ) => {
    setDraggedMessage(msgId);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = "move";
    setDragStartY(e.clientY);

    const rowEl = messageRefs.current[index];
    if (rowEl) {
      const dragImage = rowEl.cloneNode(true) as HTMLElement;
      dragImage.style.position = "absolute";
      dragImage.style.top = "-9999px";
      dragImage.style.width = `${rowEl.offsetWidth}px`;
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 20, 20);

      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedMessage(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseY = e.clientY - containerRect.top;

    let newIndex = -1;
    for (let i = 0; i < messageRefs.current.length; i++) {
      const el = messageRefs.current[i];
      if (el) {
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2 - containerRect.top;
        if (mouseY < mid) {
          newIndex = i;
          break;
        }
      }
    }
    if (newIndex === -1) {
      newIndex = messages.length;
    }
    setDragOverIndex(newIndex);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggedMessage || dragOverIndex === null) return;

    const draggedIndex = messages.findIndex((m) => m.id === draggedMessage);
    if (draggedIndex === dragOverIndex || draggedIndex + 1 === dragOverIndex)
      return;

    const newArr = [...messages];
    const [removed] = newArr.splice(draggedIndex, 1);
    newArr.splice(
      dragOverIndex > draggedIndex ? dragOverIndex - 1 : dragOverIndex,
      0,
      removed,
    );

    setMessages(newArr);
    // Update parent component after reordering
    if (onScriptUpdate) {
      onScriptUpdate(newArr);
    }

    setDraggedMessage(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // ----------------------------
  //  Editing + Quill
  // ----------------------------
  const handleClickMessage = (msg: Message, index: number) => {
    if (editingId === msg.id) return;
    // Start editing
    setEditingId(msg.id);
    // In a real app, 'msg.message' might be plain text or already HTML. We'll assume HTML
    const inputHtml =
      "<p><span class='keyword'>Thank you for calli</span>ng Sunshine Pharmacy. My name is Sarah, and I'm here to assist you with your prescription needs. This call may be recorded for quality and training purposes. Before we proceed, may I have your full name, please?</p>";
    const safeHtml = inputHtml
      .replace(/<span[^>]*>/g, "")
      .replace(/<\/span>/g, "");
    setDraftText(msg.message);

    // setDraftText(delta);
    setDraftRole(msg.role); // NEW: initialize draft role
    setEditingKeywords(msg.keywords || []);

    // measure bubble width
    const rowEl = messageRefs.current[index];
    if (rowEl) {
      const bubbleEl = rowEl.querySelector(".bubble-content") as HTMLElement;
      if (bubbleEl) {
        setEditingMinWidth(bubbleEl.offsetWidth);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowKeywordPopper(false);
  };

  const handleSaveEdit = (id: string) => {
    // Save the updated HTML + updated keywords + updated role
    const updatedMessages = messages.map((m) =>
      m.id === id
        ? {
          ...m,
          message: draftText,
          keywords: editingKeywords,
          role: draftRole,
        }
        : m,
    );
    setMessages(updatedMessages);
    if (onScriptUpdate) {
      onScriptUpdate(updatedMessages);
    }

    setEditingId(null);
    setShowKeywordPopper(false);
  };

  // We'll treat the original text vs. new text to see if changed
  const hasChanged = useMemo(() => {
    const msg = messages.find((m) => m.id === editingId);
    if (!msg) return false;

    // Compare HTML text
    if (msg.message !== draftText) return true;

    // Compare role
    if (msg.role !== draftRole) return true;

    // Compare keywords array - improved comparison
    const originalKeywords = msg.keywords || [];
    const currentKeywords = editingKeywords || [];

    // Check if number of keywords changed
    if (originalKeywords.length !== currentKeywords.length) return true;

    // Create a map from main_keyword to keyword object for easy lookup
    const originalKeywordMap = new Map();
    originalKeywords.forEach(kw => {
      originalKeywordMap.set(kw.main_keyword, kw);
    });

    const currentKeywordMap = new Map();
    currentKeywords.forEach(kw => {
      currentKeywordMap.set(kw.main_keyword, kw);
    });

    // Check if any keyword was added or removed
    for (const mainKeyword of originalKeywordMap.keys()) {
      if (!currentKeywordMap.has(mainKeyword)) return true;
    }
    for (const mainKeyword of currentKeywordMap.keys()) {
      if (!originalKeywordMap.has(mainKeyword)) return true;
    }

    // Check if any existing keyword was modified
    for (const [mainKeyword, currentKeyword] of currentKeywordMap.entries()) {
      const originalKeyword = originalKeywordMap.get(mainKeyword);
      if (!originalKeyword) continue;

      // Compare points
      if (originalKeyword.points !== currentKeyword.points) return true;

      // Compare alternative keywords arrays
      const origAlts = originalKeyword.alternative_keywords || [];
      const currAlts = currentKeyword.alternative_keywords || [];

      if (origAlts.length !== currAlts.length) return true;

      // Sort arrays to compare content regardless of order
      const sortedOrigAlts = [...origAlts].sort();
      const sortedCurrAlts = [...currAlts].sort();

      for (let j = 0; j < sortedOrigAlts.length; j++) {
        if (sortedOrigAlts[j] !== sortedCurrAlts[j]) return true;
      }
    }

    return false;
  }, [editingId, draftText, editingKeywords, draftRole, messages]);

  //
  // onSelectionChange in Quill
  // If the user highlights some text, we show the "Add/Remove Keyword" popup
  //
  const handleQuillChangeSelection = (
    range: { index: number; length: number } | null,
    source: string,
    editor: any,
  ) => {
    if (!range || range.length === 0) {
      // no selection
      const htmlText = editor.getHTML();
      setDraftText(htmlText);
      return;
    }

    // Only show keyword popper for Trainee messages
    if (draftRole !== "Trainee") {
      setShowKeywordPopper(false);
      return;
    }

    // If the user highlights text, we figure out if it's already a "keyword"
    const selectedText = editor.getText(range.index, range.length);

    const selectedMessage = messages.find(
      (message) => message.id === editingId,
    );

    let isKeyword = selectedMessage?.keywords.some(kw => kw.main_keyword === selectedText) || false;
    isKeyword = editingKeywords?.some(kw => kw.main_keyword === selectedText) || false;
    setIsAlreadyKeyword(isKeyword);

    // We'll store the selection index/length
    setSelectionIndex(range.index);
    setSelectionLength(range.length);

    // Calculate the virtual anchor BEFORE showing the popper
    const anchor = calculateVirtualAnchor(range.index, range.length);
    if (anchor) {
      setVirtualAnchor(anchor);
      // Now we show the popper with the correct position already set
      setShowKeywordPopper(true);
    }
  };

  //
  // handleQuillChange is the main text change handler for Quill
  //
  const handleQuillChange = (content: string, editor: any) => {
    setDraftText(content);
  };

  // Handle audio transcription
  const handleTranscription = (text: string) => {
    setInputText(text);
  };

  // Effect to update script whenever messages change
  useEffect(() => {
    if (onScriptUpdate) {
      onScriptUpdate(messages);
    }
  }, [messages, onScriptUpdate]);

  // Reset active tab to "alternative" when keyword popper opens
  useEffect(() => {
    if (showKeywordPopper) {
      setActiveTab("alternative");
      setAlternativeKeywordInput(""); // Clear alternative keyword input
    }
  }, [showKeywordPopper]);

  const handleAddAlternativeKeyword = () => {
    if (!altInputValue.trim()) return;
    if (quillRef.current) {
      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
      setEditingKeywords(prev => {
        const updated = [...prev];
        const keywordIndex = updated.findIndex(k => k.main_keyword === mainKeyword);
        if (keywordIndex >= 0) {
          if (!updated[keywordIndex].alternative_keywords.includes(altInputValue.trim())) {
            updated[keywordIndex] = {
              ...updated[keywordIndex],
              alternative_keywords: [
                ...updated[keywordIndex].alternative_keywords,
                altInputValue.trim()
              ]
            };
          }
        } else {
          updated.push({
            main_keyword: mainKeyword,
            alternative_keywords: [altInputValue.trim()],
            points: 1
          });
        }
        return updated;
      });
      setAltInputValue("");
    }
  };

  // ----------------------------
  //  Render
  // ----------------------------
  return (
    <Card
      sx={{
        height: "80vh",
        display: "flex",
        flexDirection: "column",
        mx: 4,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        borderRadius: 2,
      }}
    >
      <CardHeader
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          py: 1.5,
          px: 3,
          bgcolor: "#F9FAFB",
        }}
        title={
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Trainee
            </Typography>
          </Stack>
        }
      />

      <CardContent
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 3,
          py: 2,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          position: "relative",
        }}
      >
        {dragOverIndex === 0 && <DragOverlay sx={{ top: 0 }} />}

        {messages.map((msg, i) => {
          const isEditing = editingId === msg.id;
          const isDragged = draggedMessage === msg.id;

          return (
            <React.Fragment key={msg.id}>
              <DraggableMessage
                ref={(el) => (messageRefs.current[i] = el)}
                className={isDragged ? "dragging" : ""}
                sx={{
                  display: "flex",
                  justifyContent:
                    msg.role === "Customer" ? "flex-start" : "flex-end",
                  mb: 2,
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  animation: isDragged ? "pulse 1.5s infinite" : "none",
                  "@keyframes pulse": {
                    "0%": { transform: "scale(1)" },
                    "50%": { transform: "scale(1.01)" },
                    "100%": { transform: "scale(1)" },
                  },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{ maxWidth: "70%" }}
                >
                  {/* Customer avatar on left */}
                  {msg.role === "Customer" && (
                    <Avatar sx={{ bgcolor: "#E7E7E7" }}>
                      <MicIcon fontSize="small" />
                    </Avatar>
                  )}

                  {/* Bubble + hover icons */}
                  <Box
                    sx={{
                      position: "relative",
                      ...(msg.role === "Customer"
                        ? { pr: "3rem" }
                        : { pl: "3rem" }),
                      "&:hover .action-buttons": {
                        opacity: 1,
                        visibility: "visible",
                      },
                    }}
                  >
                    <Box
                      className="action-buttons"
                      sx={{
                        position: "absolute",
                        top: 0,
                        display: "flex",
                        gap: 0.5,
                        opacity: 0,
                        visibility: "hidden",
                        transition: "opacity 0.2s",
                        ...(msg.role === "Customer"
                          ? { right: "-6rem" }
                          : { left: "-6rem" }),
                      }}
                    >
                      {msg.role === "Customer" ? (
                        <>
                          <Tooltip title="Drag Message" arrow>
                            <IconButton
                              size="small"
                              draggable
                              onDragStart={(e) => handleDragStart(e, msg.id, i)}
                              onDragEnd={handleDragEnd}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Message" arrow>
                            <IconButton
                              size="small"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Add Message" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAddDialog(i)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Add Message" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAddDialog(i)}
                            >
                              <AddIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Message" arrow>
                            <IconButton
                              size="small"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Drag Message" arrow>
                            <IconButton
                              size="small"
                              draggable
                              onDragStart={(e) => handleDragStart(e, msg.id, i)}
                              onDragEnd={handleDragEnd}
                            >
                              <DragIndicatorIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>

                    {/* Bubble */}
                    {!isEditing ? (
                      <MessageBubble
                        className="bubble-content"
                        onClick={() => handleClickMessage(msg, i)}
                        sx={{
                          cursor: "pointer",
                          bgcolor:
                            msg.role === "Customer" ? "#F9FAFB" : "#F5F6FF",
                          borderTopRightRadius:
                            msg.role === "Trainee" ? 0 : undefined,
                          borderTopLeftRadius:
                            msg.role === "Customer" ? 0 : undefined,
                        }}
                      // Dangerously set the HTML since Quill content is HTML
                      >
                        <div
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(msg.message),
                          }}
                        />
                      </MessageBubble>
                    ) : (
                      <MessageBubble
                        className="bubble-content"
                        sx={{
                          minWidth: editingMinWidth,
                          bgcolor: "#fff",
                          borderColor: "primary.main",
                          borderWidth: 1,
                          borderStyle: "solid",
                          boxShadow: theme.shadows[1],
                        }}
                      >
                        {/* ROLE SELECTOR - NEW */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <Select
                            value={draftRole}
                            onChange={(e) =>
                              setDraftRole(
                                e.target.value as "Customer" | "Trainee",
                              )
                            }
                            size="small"
                          >
                            <MenuItem value="Customer">Customer</MenuItem>
                            <MenuItem value="Trainee">Trainee</MenuItem>
                          </Select>
                        </FormControl>

                        {/* QUILL Editor */}
                        <ReactQuill
                          ref={quillRef}
                          value={draftText}
                          onChange={handleQuillChange}
                          onChangeSelection={handleQuillChangeSelection}
                          // modules={modules}
                          formats={formats}
                          theme="snow"
                          style={{
                            // override the default quill editor bg
                            backgroundColor: "inherit",
                            border: "none",
                          }}
                        />
                        {/* <style>{`.keyword-style { background-color: yellow; font-weight: bold; }`}</style> */}
                        <Popper
                          open={showKeywordPopper}
                          anchorEl={virtualAnchor}
                          placement="bottom-start"
                          style={{ zIndex: 3000 }}
                          modifiers={[{
                            name: 'preventOverflow',
                            enabled: true,
                            options: {
                              altAxis: true,
                              altBoundary: true,
                              boundary: document.body,
                            },
                          }]}
                        >
                          <Box
                            sx={{
                              bgcolor: "#FFFFFF",
                              border: "1px solid #00000033",
                              borderRadius: "20px",
                              boxShadow: "0px 0px 24px 0px #1D006614",
                              display: "flex",
                              flexDirection: "column",
                              width: 386,
                              height: 'auto',
                              overflow: 'visible',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Header */}
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                                height: 52,
                                justifyContent: "space-between",
                                paddingLeft: 1,
                                paddingRight: 2,
                                py: 1,
                                borderBottom: "1px solid #EAECF0",
                                boxSizing: "border-box",
                                gap: 1,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <IconButton
                                  size="small"
                                  sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    p: 0,
                                    cursor: 'default',
                                    "&:hover": {
                                      backgroundColor: "transparent",
                                      transform: "none",
                                      boxShadow: "none"
                                    }
                                  }}
                                >
                                  <img src={featuredIcon} alt="FeaturedIcon" />
                                </IconButton>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 18, ml: 1 }}>
                                  Add Keyword
                                </Typography>
                              </Box>
                              <IconButton
                                size="small"
                                onClick={() => setShowKeywordPopper(false)}
                                sx={{ width: 28, height: 28, borderRadius: "50%", p: 0 }}
                              >
                                <img src={vectorIcon} alt="Close" style={{ width: 13, height: 13 }} />
                              </IconButton>
                            </Box>

                            {/* Selected keyword display */}
                            <Box
                              sx={{
                                width: "100%",
                                minHeight: 58,
                                borderBottom: "1px solid #EAECF0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "flex-start",
                                px: 2,
                                bgcolor: "transparent",
                              }}
                            >
                              <Box
                                sx={{
                                  bgcolor: "#E9F8EE",
                                  color: "#157A41",
                                  borderRadius: "24px",
                                  border: "1px solid #EAECF0",
                                  px: 2,
                                  py: 0.5,
                                  display: "flex",
                                  alignItems: "center",
                                  fontWeight: 600,
                                  fontSize: 16,
                                  height: 32,
                                  boxShadow: "none",
                                  gap: 1
                                }}
                              >
                                {quillRef.current?.getEditor().getText(selectionIndex, selectionLength)}
                                <IconButton
                                  size="small"
                                  sx={{ color: "#157A41", p: 0, width: 24, height: 24, "&:hover": { bgcolor: "transparent" } }}
                                  onClick={() => {
                                    if (quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      setEditingKeywords((prev) => prev.filter(kw => kw.main_keyword !== mainKeyword));
                                      const quill = quillRef.current.getEditor();
                                      quill.formatText(selectionIndex, selectionLength, "keyword", false);
                                    }
                                    setShowKeywordPopper(false);
                                  }}
                                >
                                    <img src={vectorIcon} alt="Close" style={{ width: 13, height: 13, filter: 'invert(27%) sepia(79%) saturate(1089%) hue-rotate(134deg) brightness(94%) contrast(87%)' }} />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Tabs for Alternative Word and Verbatim */}
                            <Box
                              sx={{
                                width: "calc(100% - 32px)",
                                height: 41,
                                display: "flex",
                                gap: 0,
                                bgcolor: "#fff",
                                  border: "1px solid #F8F8F8",
                                borderRadius: "12px",
                                alignItems: "center",
                                p: "2px",
                                mt: 2,
                                mb: 2,
                                mx: 2,
                                overflow: "hidden",
                                px: 2,
                              }}
                            >
                              <Button
                                disableRipple
                                sx={{
                                  flex: 1,
                                  height: 33,
                                  bgcolor: activeTab === "alternative" ? "#F4F6FF" : "transparent",
                                  color: activeTab === "alternative" ? "#175CD3" : "#667085",
                                  fontWeight: 600,
                                  fontSize: 16,
                                  borderRadius: "8px",
                                  boxShadow: "none",
                                  textTransform: "none",
                                  minWidth: 0,
                                  p: 0,
                                  "&:hover": {
                                    bgcolor: activeTab === "alternative" ? "#F4F6FF" : "transparent",
                                    boxShadow: "none",
                                  },
                                }}
                                onClick={() => setActiveTab("alternative")}
                              >
                                Alternative Word
                              </Button>
                              <Button
                                disableRipple
                                sx={{
                                  flex: 1,
                                  height: 33,
                                  bgcolor: activeTab === "verbatim" ? "#F4F6FF" : "transparent",
                                  color: activeTab === "verbatim" ? "#175CD3" : "#667085",
                                  fontWeight: 600,
                                  fontSize: 16,
                                  borderRadius: "8px",
                                  boxShadow: "none",
                                  textTransform: "none",
                                  minWidth: 0,
                                  p: 0,
                                  "&:hover": {
                                    bgcolor: activeTab === "verbatim" ? "#F4F6FF" : "transparent",
                                    boxShadow: "none",
                                  },
                                }}
                                onClick={() => {
                                  setActiveTab("verbatim");
                                  setAlternativeKeywordInput("");
                                  setEditingKeywords(prev => prev.map(keyword => ({ ...keyword, alternative_keywords: [] })));
                                }}
                              >
                                Verbatim
                              </Button>
                            </Box>

                            {/* Alternative keywords input - only show when Alternative Word tab is active */}
                            {activeTab === "alternative" && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  width: "100%",
                                  bgcolor: "#fff",
                                  border: "1px solid #EAECF0",
                                  borderRadius: "8px",
                                  px: 1,
                                  py: 0.5,
                                  minHeight: 40,
                                  mt: 1,
                                  mb: 2,
                                  mx: 2,
                                  gap: 1.5,
                                  maxWidth: 'calc(100% - 32px)',
                                  overflowX: 'auto',
                                  flexWrap: 'nowrap',
                                }}
                              >
                                <Autocomplete
                                  multiple
                                  freeSolo
                                  disableClearable
                                  options={[]}
                                  value={(() => {
                                    if (quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      const keyword = editingKeywords.find(k => k.main_keyword === mainKeyword);
                                      return keyword ? keyword.alternative_keywords : [];
                                    }
                                    return [];
                                  })()}
                                  inputValue={altInputValue}
                                  onInputChange={(event, newInputValue) => {
                                    setAltInputValue(newInputValue);
                                  }}
                                  onChange={(event, newValue) => {
                                    if (quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      setEditingKeywords(prev => {
                                        const updated = [...prev];
                                        const keywordIndex = updated.findIndex(k => k.main_keyword === mainKeyword);
                                        if (keywordIndex >= 0) {
                                          updated[keywordIndex] = {
                                            ...updated[keywordIndex],
                                            alternative_keywords: newValue.filter(v => v.trim() !== "")
                                          };
                                        } else {
                                          updated.push({
                                            main_keyword: mainKeyword,
                                            alternative_keywords: newValue.filter(v => v.trim() !== ""),
                                            points: 1
                                          });
                                        }
                                        return updated;
                                      });
                                    }
                                    setAltInputValue("");
                                  }}
                                  renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                      <Chip
                                        variant="outlined"
                                        label={option}
                                        {...getTagProps({ index })}
                                        sx={{
                                          bgcolor: "#F4F6F8",
                                          color: "#344054",
                                          borderRadius: "20px",
                                          fontWeight: 500,
                                          fontSize: 15,
                                          height: 28,
                                          ".MuiChip-deleteIcon": {
                                            color: "#98A2B3",
                                            fontSize: 18,
                                            mr: 0.5
                                          }
                                        }}
                                      />
                                    ))
                                  }
                                  renderInput={(params) => (
                                    <TextField
                                      {...params}
                                      variant="standard"
                                      placeholder="+Add alternative word"
                                      InputProps={{
                                        ...params.InputProps,
                                        disableUnderline: true,
                                        style: { minHeight: 28, fontSize: 15, fontWeight: 500 }
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddAlternativeKeyword();
                                        }
                                      }}
                                      sx={{
                                        flex: 1,
                                        minWidth: 120,
                                        "& .MuiInputBase-root": {
                                          bgcolor: "transparent",
                                          border: "none",
                                          boxShadow: "none",
                                          p: 0,
                                        },
                                        "& .MuiInputBase-input": {
                                          fontSize: 15,
                                          fontWeight: 500,
                                          p: 0,
                                          "&::placeholder": {
                                            color: "#666666",
                                            opacity: 1,
                                          },
                                        }
                                      }}
                                    />
                                  )}
                                  sx={{
                                    flex: 1,
                                    minWidth: 120,
                                    "& .MuiAutocomplete-endAdornment": { display: "none" },
                                    maxWidth: 300,
                                  }}
                                />
                                {/* Show +Add only if there is at least one keyword */}
                                {(() => {
                                  if (quillRef.current) {
                                    const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                    const keyword = editingKeywords.find(k => k.main_keyword === mainKeyword);
                                    if (keyword && keyword.alternative_keywords.length > 0) {
                                      return (
                                        <Button
                                          onClick={handleAddAlternativeKeyword}
                                          sx={{
                                            ml: 1,
                                            color: "#175CD3",
                                            fontWeight: 500,
                                            fontSize: 15,
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            p: 0,
                                            minWidth: 36,
                                            height: 28,
                                            "&:hover": { textDecoration: "underline", background: "none" }
                                          }}
                                        >
                                          +Add
                                        </Button>
                                      );
                                    }
                                  }
                                  return null;
                                })()}
                              </Box>
                            )}

                            {/* Keyword Score */}
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, mb: 2, borderTop: "1px solid #EAECF0", borderBottom: "1px solid #EAECF0", bgcolor: "#fff" }}>
                              <Typography sx={{ fontSize: 15, color: "#666666", fontWeight: 500 }}>Keyword Score</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 1, height: 32 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (editingId && quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      setEditingKeywords((prev) => {
                                        const updatedKeywords = [...prev];
                                        const keywordIndex = updatedKeywords.findIndex(k => k.main_keyword === mainKeyword);
                                        if (keywordIndex >= 0) {
                                          if (updatedKeywords[keywordIndex].points > 0) {
                                            updatedKeywords[keywordIndex] = {
                                              ...updatedKeywords[keywordIndex],
                                              points: updatedKeywords[keywordIndex].points - 1
                                            };
                                          }
                                        } else {
                                          updatedKeywords.push({ main_keyword: mainKeyword, alternative_keywords: [], points: 0 });
                                        }
                                        return updatedKeywords;
                                      });
                                    }
                                  }}
                                  sx={{
                                    color: (() => {
                                      if (quillRef.current) {
                                        const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                        const keyword = editingKeywords.find(k => k.main_keyword === mainKeyword);
                                        const currentValue = keyword?.points || 1;
                                        return currentValue === 1 ? "#E5E7EB" : "#666666";
                                      }
                                      return "#666666";
                                    })()
                                  }}
                                >
                                  −
                                </IconButton>
                                <Typography sx={{ px: 2 }}>
                                  {(() => {
                                    if (quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      const keyword = editingKeywords.find(k => k.main_keyword === mainKeyword);
                                      return keyword?.points || 1;
                                    }
                                    return 1;
                                  })()}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    if (editingId && quillRef.current) {
                                      const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                      setEditingKeywords((prev) => {
                                        const updatedKeywords = [...prev];
                                        const keywordIndex = updatedKeywords.findIndex(k => k.main_keyword === mainKeyword);
                                        if (keywordIndex >= 0) {
                                          updatedKeywords[keywordIndex] = {
                                            ...updatedKeywords[keywordIndex],
                                            points: updatedKeywords[keywordIndex].points + 1
                                          };
                                        } else {
                                          updatedKeywords.push({ main_keyword: mainKeyword, alternative_keywords: [], points: 1 });
                                        }
                                        return updatedKeywords;
                                      });
                                    }
                                  }}
                                >
                                  +
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Action buttons */}
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 0, mt: 0, gap: 2, mb: 2, }}>
                              <Button
                                variant="outlined"
                                size="small"
                                sx={{ 
                                  flex: 1, 
                                  height: 36, 
                                  fontWeight: 500, 
                                  fontSize: 15,
                                  borderColor: "#666666",
                                  color: "#666666",
                                  "&:hover": {
                                    borderColor: "#F8F8F8",
                                    backgroundColor: "transparent"
                                  }
                                }}
                                onClick={() => {
                                  if (quillRef.current) {
                                    const mainKeyword = quillRef.current.getEditor().getText(selectionIndex, selectionLength);
                                    setEditingKeywords((prev) => prev.filter(kw => kw.main_keyword !== mainKeyword));
                                    const quill = quillRef.current.getEditor();
                                    quill.formatText(selectionIndex, selectionLength, "keyword", false);
                                  }
                                  setShowKeywordPopper(false);
                                }}
                              >
                                Remove Keyword
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                sx={{ flex: 1, height: 36, fontWeight: 600, fontSize: 15, boxShadow: "none" }}
                                onClick={() => {
                                  if (quillRef.current) {
                                    const quill = quillRef.current.getEditor();
                                    const mainKeyword = quill.getText(selectionIndex, selectionLength);
                                    const existingKeywordIndex = editingKeywords.findIndex(kw => kw.main_keyword === mainKeyword);
                                    if (existingKeywordIndex >= 0) {
                                      quill.formatText(selectionIndex, selectionLength, "keyword", true);
                                    } else {
                                      setEditingKeywords(prev => [...prev, { main_keyword: mainKeyword, alternative_keywords: [], points: 1 }]);
                                      quill.formatText(selectionIndex, selectionLength, "keyword", true);
                                    }
                                  }
                                  setShowKeywordPopper(false);
                                }}
                              >
                                Save
                              </Button>
                            </Box>
                          </Box>
                        </Popper>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleSaveEdit(msg.id)}
                            disabled={!hasChanged}
                            sx={{ textTransform: "none" }}
                          >
                            Save
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleCancelEdit}
                            sx={{ textTransform: "none" }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </MessageBubble>
                    )}
                  </Box>

                  {/* Trainee avatar on right */}
                  {msg.role === "Trainee" && (
                    <Avatar
                      src="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
                      sx={{ width: 32, height: 32 }}
                    />
                  )}
                </Stack>
              </DraggableMessage>

              {/* Insertion line if dropping below this message */}
              {dragOverIndex === i + 1 && <DragOverlay sx={{ my: 1 }} />}
            </React.Fragment>
          );
        })}
      </CardContent>

      {/* Footer */}
      <CardActions
        sx={{
          borderTop: 1,
          borderColor: "divider",
          p: 2,
          px: 3,
          bgcolor: "#F9FAFB",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ width: "100%" }}
          alignItems="center"
        >
          <Tooltip title="Change Role" arrow>
            <Button
              variant="outlined"
              onClick={toggleRole}
              endIcon={<RefreshIcon />}
              sx={{
                borderRadius: 2,
                px: 2,
                py: 1,
                minWidth: 120,
                textTransform: "none",
                bgcolor: "background.paper",
              }}
            >
              {currentRole}
            </Button>
          </Tooltip>
          <TextField
            fullWidth
            size="small"
            placeholder="Type in your script..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "background.paper",
                borderRadius: 2,
              },
            }}
          />
          {/* Replace the Mic icon with our AudioRecorder component */}
          <AudioRecorder onTranscriptionReceived={handleTranscription} />
          <Tooltip title="Send Message" arrow>
            <IconButton
              onClick={handleSendMessage}
              sx={{
                bgcolor: "background.paper",
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>

      {/* Add Message Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Message</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="add-message-role-label">Role</InputLabel>
              <Select
                labelId="add-message-role-label"
                value={addMessageRole}
                onChange={(e) =>
                  setAddMessageRole(e.target.value as "Customer" | "Trainee")
                }
                label="Role"
              >
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Trainee">Trainee</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Message"
              multiline
              rows={4}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button
            onClick={handleAddMessage}
            variant="contained"
            disabled={!newMessageText.trim()}
          >
            Add Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Keyword Popper */}

      {/* Optional: Add a style tag for the keyword highlighting */}
      <style jsx>{`
        .keyword-highlight {
          color: green;
          background-color: #ccffd1;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </Card>
  );
};

export default ScriptEditor;