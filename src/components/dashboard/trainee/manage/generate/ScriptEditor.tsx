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
interface Message {
  id: string;
  role: "Customer" | "Trainee";
  message: string; // We'll store Quill HTML in here once editing is done
  keywords: string[]; // The array of selected keywords
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "Customer",
    message: "Hello! I want to refill my medications please.",
    keywords: [],
  },
  {
    id: "2",
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
    "Customer"
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
    "Customer"
  ); // NEW: track edited role
  const [editingMinWidth, setEditingMinWidth] = useState<number>(0);

  // Add Message Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMessageRole, setAddMessageRole] = useState<"Customer" | "Trainee">(
    "Customer"
  );
  const [newMessageText, setNewMessageText] = useState("");
  const [addMessageIndex, setAddMessageIndex] = useState<number | null>(null);

  // We'll track which message's "keywords" we might be modifying
  // as we highlight/unhighlight text inside the Quill editor
  const [editingKeywords, setEditingKeywords] = useState<string[]>([]);

  // We'll show a small popup at selection for "Add/Remove Keyword"
  const [selectionAnchor, setSelectionAnchor] = useState<Range | null>(null);
  const [selectionIndex, setSelectionIndex] = useState<number>(0);
  const [selectionLength, setSelectionLength] = useState<number>(0);
  const [showKeywordPopper, setShowKeywordPopper] = useState(false);
  const [isAlreadyKeyword, setIsAlreadyKeyword] = useState(false); // does selection have 'keyword'?

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
    []
  );

  // We define which Quill formats are allowed
  const formats = useMemo(
    () => ["bold", "italic", "underline", "span", "keyword"],
    []
  );

  useEffect(() => {
    const editor = quillRef?.current?.getEditor();
    console.log("draft Text ----- ", draftText);
  }, [draftText]);

  // We will attach a small ref to Quill
  const quillRef = useRef<ReactQuill>(null);

  // ----------------------------
  //  Basic UI logic
  // ----------------------------
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage: Message = {
      id: Date.now().toString(),
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
      id: Date.now().toString(),
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
    index: number
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
      removed
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
    console.log(msg.message);
    const inputHtml =
      "<p><span class='keyword'>Thank you for calli</span>ng Sunshine Pharmacy. My name is Sarah, and I’m here to assist you with your prescription needs. This call may be recorded for quality and training purposes. Before we proceed, may I have your full name, please?</p>";
    const safeHtml = inputHtml
      .replace(/<span[^>]*>/g, "")
      .replace(/<\/span>/g, "");
    setDraftText(msg.message);

    // setDraftText(delta);
    setDraftRole(msg.role); // NEW: initialize draft role
    console.log(editingKeywords, "-------------------------editingKeywords");
    setEditingKeywords(msg.keywords || []);
    console.log(editingKeywords, "-------------------------editingKeywords");

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
        : m
    );
    console.log("handle svae edit ", draftText);
    setMessages(updatedMessages);
    if (onScriptUpdate) {
      onScriptUpdate(updatedMessages);
    }

    // Update parent component
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
    // Compare keywords array
    if (JSON.stringify(msg.keywords) !== JSON.stringify(editingKeywords))
      return true;
    // NEW: Compare role
    if (msg.role !== draftRole) return true;
    return false;
  }, [editingId, draftText, editingKeywords, draftRole, messages]);

  //
  // onSelectionChange in Quill
  // If the user highlights some text, we show the "Add/Remove Keyword" popup
  //
  const handleQuillChangeSelection = (
    range: { index: number; length: number } | null,
    source: string,
    editor: any
  ) => {
    if (!range || range.length === 0) {
      // no selection
      const htmlText = editor.getHTML();
      console.log("html text ---------", htmlText);
      setDraftText(htmlText);
      setShowKeywordPopper(false);
      return;
    }
    console.log("range", range);
    console.log("editor", editor);
    // If the user highlights text, we figure out if it's already a "keyword"
    const format = editor.getText(range.index, range.length);

    const selectedMessage = messages.find(
      (message) => message.id === editingId
    );

    let isKeyword = selectedMessage?.keywords.includes(format) || false;
    isKeyword = editingKeywords?.includes(format) || false;
    setIsAlreadyKeyword(isKeyword);

    // We'll store the selection index/length
    setSelectionIndex(range.index);
    setSelectionLength(range.length);

    // Let's get bounding rect of that selection to position a Popper
    // const nativeRange = editor.getBounds(
    //   range.index,
    //   range.length
    // );
    // The editor container is offset in the page, so we get the container's position
    // const quillEl = editor.editor.container.getBoundingClientRect();

    // We'll create a Range to anchor the Popper in pure DOM
    // const selectionRange = document.createRange();
    // selectionRange.setStart(editor.scroll.domNode, 0); // minimal anchor
    // setSelectionAnchor(selectionRange);

    // Now we show the popper
    setShowKeywordPopper(true);

    // We'll position the popper near the selection
    // We'll pass these offsets via style or store them in state
    // so the popper can position above the text
  };

  //
  // handleQuillChange is the main text change handler for Quill
  //
  const handleQuillChange = (content: string, editor: any) => {
    setDraftText(content);
  };

  //
  // Adding/Removing a Keyword in Quill
  //
  const addKeyword = (quill: any) => {
    const range = quill.getSelection();
    if (!range || range.length === 0) return;
    const selectionIndex = range.index;
    const selectionLength = range.length;

    const substring = quill.getText(selectionIndex, selectionLength);

    setEditingKeywords((prev: string[]) => [...prev, substring]);

    // console.log("newmessages ------", messages);
    quill.formatText(selectionIndex, selectionLength, "keyword", true);

    setShowKeywordPopper(false);
  };

  useEffect(() => {
    console.log("Updated messages:", messages);
  }, [messages]);

  const removeKeyword = (quill: any) => {
    // un‐highlight the selection
    quill.formatText(selectionIndex, selectionLength, "keyword", false);

    // remove that substring from editingKeywords
    const substring = quill.getText(selectionIndex, selectionLength);
    setEditingKeywords((prev) => prev.filter((kw) => kw !== substring));

    setShowKeywordPopper(false);
  };

  // We'll create a Popper that points to our "selectionAnchor" (a DOM Range).
  // However, DOM Ranges aren't typical "anchorEl", so we do a trick: we create an empty hidden span near the selection:
  const [popperPos, setPopperPos] = useState<{ left: number; top: number }>({
    left: 0,
    top: 0,
  });

  useEffect(() => {
    if (!selectionAnchor || !showKeywordPopper) return;

    // We can approximate the selection's bounding box from the Quill's bounding rect
    // + the results of editor.getSelectionBounds()
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const bounds = editor.getSelectionBounds(selectionIndex, selectionLength);
      const containerRect = editor.editor.container.getBoundingClientRect();

      setPopperPos({
        left: containerRect.left + bounds.left,
        top: containerRect.top + bounds.top - 40, // 40px above
      });
    }
  }, [selectionAnchor, showKeywordPopper, selectionIndex, selectionLength]);

  // Update local messages state when script prop changes
  useEffect(() => {
    console.log("Script updated:", script); // Debug log
    setMessages(script);
  }, [script]);

  // Handle audio transcription
  const handleTranscription = (text: string) => {
    setInputText(text);
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
                                e.target.value as "Customer" | "Trainee"
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
                          anchorEl={keywordPopperRef.current} // not used in a standard way
                          style={{
                            position: "absolute",
                            left: "40%",
                            top: "10%",
                            right: "10%",
                            zIndex: 1300,
                            width: "fit-content",
                          }}
                        >
                          <Box
                            sx={{
                              p: 1,
                              bgcolor: "background.paper",
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              boxShadow: theme.shadows[2],
                              display: "flex",
                              gap: 1,
                            }}
                          >
                            {isAlreadyKeyword ? (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  const quill = quillRef.current?.getEditor();
                                  if (quill) removeKeyword(quill);
                                }}
                              >
                                Remove Keyword
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => {
                                  const quill = quillRef.current?.getEditor();
                                  if (quill) addKeyword(quill);
                                }}
                              >
                                Add Keyword
                              </Button>
                            )}
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
