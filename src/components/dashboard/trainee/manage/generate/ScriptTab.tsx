import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Divider,
  TextField,
  IconButton,
  Link,
  Stack,
  Select,
  styled,
  MenuItem,
  ListItemIcon,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  SmartToy,
  Description,
  Upload,
  AudioFile,
  Mic,
  PlayArrow,
  ChatBubble,
  Edit as EditIcon,
  Lock as LockIcon,
} from "@mui/icons-material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import { useSimulationWizard } from "../../../../../context/SimulationWizardContext";
import AIScriptGenerator from "./AIScriptGenerator";
import ScriptEditor from "./ScriptEditor";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
// Import the AudioRecorder component
import AudioRecorder from "./AudioRecorder";
import { convertAudioToScript } from "../../../../../services/simulation_script";

interface Message {
  id: string;
  role: "Customer" | "Trainee";
  message: string;
  keywords: string[];
}

interface ScriptTabProps {
  simulationType?: string;
  isLocked?: boolean;
  onContinue?: () => void;
}

const OptionCard = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(3),
  border: "2px dashed #DEE2FC",
  borderRadius: theme.spacing(2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  minHeight: "290px",
  backgroundColor: "#FCFCFE",
}));

const ActionButton = styled(Button)(({ theme }) => ({
  marginTop: "auto",
  width: "100%",
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  textTransform: "none",
  backgroundColor: "#E8EAFD",
  fontWeight: 600,
}));

const ScriptTab: React.FC<ScriptTabProps> = ({
  simulationType,
  isLocked = false,
  onContinue,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showSavedScript, setShowSavedScript] = useState(false);
  const [currentRole, setCurrentRole] = useState<"Customer" | "Trainee">(
    "Trainee",
  );
  const [showBackButton, setShowBackButton] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { scriptData, setScriptData, setIsScriptLocked } =
    useSimulationWizard();

  // Function to handle template download
  const handleDownloadTemplate = () => {
    // Template content as specified
    const templateContent = `Trainee: Thank you for calling. How can i help you today?
Customer: Hi, I'm trying to find out if my Medicare Advantage plan covers routine dental care.
Trainee: I'd be happy to help! Many Medicare Advantage plans do include dental benefits, but coverage can vary. Could you provide your plan name or member ID so I can check the specifics?
Customer: Sure! My plan is HealthFirst Advantage Plus.
Trainee: Thanks! Let me check… Okay, I see that your plan does cover routine dental services, including two cleanings, one set of X-rays, and two exams per year at no cost if you visit an in-network provider.
Customer: That's good to know. What about more complex procedures, like crowns or root canals?
Trainee: Great question! For major dental work like crowns, root canals, or dentures, there is partial coverage, meaning you may have a copay or coinsurance. For example, a crown might require a 50% coinsurance, so your plan would pay half, and you'd cover the rest.
Customer: Oh, I see. How do I find out which dentists are in-network?
Trainee: I can help with that! Would you like me to search for in-network dentists near your ZIP code?
Customer: Yes, my ZIP code is 75001.
Trainee: Got it! I see three in-network providers within five miles of you. I can send you their contact details if you'd like.
Customer: That would be great. Thanks!
Trainee: You're welcome! I'll send that information now. Let me know if you need anything else!`;

    // Create a Blob object with the text content
    const blob = new Blob([templateContent], { type: "text/plain" });

    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = url;
    a.download = "script_template.txt";

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if simulation is a visual type
  const isVisualType = simulationType?.includes("visual");

  // When loading from a saved state or creating new
  useEffect(() => {
    if (isLocked && scriptData.length > 0) {
      setShowSavedScript(true);
    }
  }, [isLocked, scriptData]);

  const handleScriptUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - ensure it's a text file
    if (file.type !== "text/plain" && !file.name.endsWith(".txt")) {
      setError("Please upload only .txt files.");
      return;
    }

    // Show loading message
    const loadingScript: Message[] = [
      {
        id: "loading-1", // FIXED: Use stable, predictable ID
        role: "Trainee",
        message: "Processing file... Please wait.",
        keywords: [],
      },
    ];
    setScriptData(loadingScript);
    setIsLoading(true);
    setError(null);

    try {
      // Use FileReader with explicit encoding instead of file.text()
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(new Error("Error reading file"));
        // Read as text with UTF-8 encoding
        reader.readAsText(file, "UTF-8");
      });

      // Parse the dialogue content
      const dialogueLines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && line.includes(":"));

      const messages: Message[] = dialogueLines
        .map((line, index) => {
          // Split only on the first colon to preserve any colons in the message content
          const colonIndex = line.indexOf(":");
          if (colonIndex === -1) return null;

          const role = line.substring(0, colonIndex).trim();
          const message = line.substring(colonIndex + 1).trim();

          return {
            id: `script-${index}`, // FIXED: Use stable, predictable ID
            role: role === "Customer" ? "Customer" : "Trainee",
            message: message,
            keywords: [],
          };
        })
        .filter(Boolean) as Message[];

      if (messages.length === 0) {
        throw new Error(
          "No valid dialogue content found in the file. Please check the format.",
        );
      }

      setScriptData(messages);
    } catch (error: any) {
      console.error("Error processing file:", error);
      const errorScript: Message[] = [
        {
          id: "error-1", // FIXED: Use stable ID
          role: "Trainee",
          message: `Error: ${error.message || "Failed to process file. Please check the format and try again."}`,
          keywords: [],
        },
      ];
      setScriptData(errorScript);
      setError(error.message || "Failed to process file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAudioUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type - ensure it's an audio file
    if (!file.type.startsWith("audio/")) {
      setError("Please upload only audio files (.mp3).");
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Show loading message
      const loadingScript: Message[] = [
        {
          id: "loading-1", // FIXED: Use stable ID
          role: "Trainee",
          message: "Processing audio file... This may take a few minutes.",
          keywords: [],
        },
      ];
      setScriptData(loadingScript);

      // Use the new function from simulation_script.ts
      const response = await convertAudioToScript(
        "user123", // Or use authenticated user ID: user?.id || "user123"
        file,
        (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total!,
          );
        },
      );


      if (response && Array.isArray(response.script)) {
        const transformedScript: Message[] = response.script.map(
          (item: any, index: number) => ({
            id: `script-${index}`, // FIXED: Use stable, predictable ID
            role: item.role || "Trainee",
            message: item.message || "",
            keywords: item.keywords || [],
          }),
        );

        setScriptData(transformedScript);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error: any) {
      console.error("Error processing audio file:", error);

      let errorMessage = "An error occurred while processing the audio file.";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "The request took too long to complete. Please try again with a smaller file or check your internet connection.";
      } else if (error.response) {
        errorMessage = `Server Error: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      const errorScript: Message[] = [
        {
          id: "error-1", // FIXED: Use stable ID
          role: "Trainee",
          message: `Error: ${errorMessage}`,
          keywords: [],
        },
      ];

      setScriptData(errorScript);
    } finally {
      setIsLoading(false);
    }
  };

  // Fixed handleTextInput to properly add messages to the script
  const handleTextInput = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: `script-${scriptData.length}`, // FIXED: Use stable, predictable ID
        role: currentRole,
        message: inputMessage.trim(),
        keywords: [],
      };

      // Log before updating

      // Create a completely new array with the existing messages plus the new one
      const updatedScript = [...scriptData, newMessage];


      // Use the updated array to set the state
      setScriptData(updatedScript);
      setInputMessage("");
    }
  };

  // Handler for speech-to-text transcription
  const handleTranscription = (text: string) => {
    setInputMessage(text);
  };

  const handleScriptGenerated = (script: Message[]) => {
    setShowAIGenerator(false);
    setScriptData(script);
  };

  if (scriptData.length > 0 && !isLocked && !showSavedScript) {
    return (
      <Stack spacing={2}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Button
          variant="text"
          onClick={() => {
            setScriptData([]);
            setShowAIGenerator(false);
          }}
          sx={{
            alignSelf: "flex-start",
            color: "text.secondary",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          ← Back to script options
        </Button>

        <ScriptEditor script={scriptData} onScriptUpdate={setScriptData} />
      </Stack>
    );
  }

  if (showSavedScript) {
    return (
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Script Content</Typography>
          <Button
            variant="outlined"
            onClick={() => setShowSavedScript(false)}
            startIcon={<EditIcon />}
          >
            Edit Script Options
          </Button>
        </Box>
        <ScriptEditor script={scriptData} onScriptUpdate={setScriptData} />

        {/* No bottom "Save Script Changes" button - removed as requested */}
      </Stack>
    );
  }

  if (showAIGenerator) {
    return (
      <Stack spacing={2}>
        <Button
          variant="text"
          onClick={() => setShowAIGenerator(false)}
          sx={{
            alignSelf: "flex-start",
            color: "text.secondary",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          ← Back to script options
        </Button>
        <AIScriptGenerator onScriptGenerated={handleScriptGenerated} />
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {isLocked && (
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Box
            sx={{
              bgcolor: "#ECFDF3",
              p: 2,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
            }}
          >
            <LockIcon sx={{ color: "success.main" }} />
            <Typography color="success.main">Script is in place.</Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setShowSavedScript(true)}
            sx={{
              bgcolor: "#444CE7",
              "&:hover": { bgcolor: "#3538CD" },
              borderRadius: 2,
              px: 4,
            }}
          >
            View Script
          </Button>
        </Stack>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 3,
        }}
      >
        <OptionCard
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "200px",
          }}
        >
          <SmartToy sx={{ fontSize: 80, color: "#DEE2FC", mb: 2 }} />
          <Typography
            variant="h5"
            sx={{ color: "#0F174F", mb: 2 }}
            gutterBottom
            fontWeight="800"
          >
            Generate Script with AI
            <Box
              component="span"
              sx={{
                ml: 1,
                px: 1,
                py: 0.5,
                bgcolor: "#343F8A",
                color: "white",
                borderRadius: 5,
                fontSize: "0.75rem",
                verticalAlign: "middle",
              }}
            >
              New
            </Box>
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: "13px", mb: 2 }}
          >
            Generate script for {simulationType || "simulation"} scenarios using
            SimAI
          </Typography>
          <ActionButton
            variant="contained"
            startIcon={<SmartToy />}
            sx={{
              bgcolor: "#001EEE",
              py: 2.7,
              "&:hover": { bgcolor: "#3538CD" },
              height: "40px",
              width: "300px",
              alignItems: "center",
            }}
            onClick={() => setShowAIGenerator(true)}
          >
            Try Now
          </ActionButton>
        </OptionCard>

        <OptionCard
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "200px",
          }}
        >
          <Description sx={{ fontSize: 80, color: "#DEE2FC", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ color: "#0F174F", mb: 2 }}
            gutterBottom
            fontWeight="800"
          >
            Upload Script
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: "13px" }}
          >
            Simulation script as text in .txt format
          </Typography>
          <Link
            component="button"
            onClick={handleDownloadTemplate}
            color="text.secondary"
            sx={{
              mb: 0,
              display: "block",
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Download template
          </Link>
          <input
            type="file"
            accept=".txt,text/plain"
            style={{ display: "none" }}
            id="script-upload"
            onChange={handleScriptUpload}
          />
          <label htmlFor="script-upload">
            <ActionButton
              variant="outlined"
              component="span"
              startIcon={<Upload sx={{ fontSize: 30 }} />}
              sx={{
                color: "#001EEE",
                py: 2.7,
                borderColor: "#E8EAFD",
                "&:hover": {
                  borderColor: "#3538CD",
                  bgcolor: "#F5F6FF",
                },
                height: "40px",
                width: "300px",
                alignItems: "center",
              }}
            >
              Upload Script
            </ActionButton>
          </label>
        </OptionCard>

        <OptionCard
          sx={{
            visibility:
              simulationType?.includes("audio") ||
              simulationType?.includes("chat")
                ? "visible"
                : "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "200px",
          }}
        >
          <AudioFile sx={{ fontSize: 80, color: "#DEE2FC", mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ color: "#0F174F", mb: 2 }}
            gutterBottom
            fontWeight="800"
          >
            Upload Audio
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, fontSize: "13px" }}
          >
            Simulation script as audio in .mp3 format
          </Typography>
          <input
            type="file"
            accept="audio/mp3,audio/*"
            style={{ display: "none" }}
            id="audio-upload"
            onChange={handleAudioUpload}
          />
          <label htmlFor="audio-upload">
            <ActionButton
              variant="outlined"
              component="span"
              startIcon={<Upload sx={{ fontSize: 30 }} />}
              sx={{
                color: "#001EEE",
                py: 2.7,
                borderColor: "#E8EAFD",
                "&:hover": {
                  borderColor: "#3538CD",
                  bgcolor: "#F5F6FF",
                },
                height: "40px",
                width: "300px",
                alignItems: "center",
              }}
            >
              Upload Audio
            </ActionButton>
          </label>
        </OptionCard>
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ width: "100%" }}
      >
        <Divider sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          OR
        </Typography>
        <Divider sx={{ flex: 1 }} />
      </Stack>

      <Stack spacing={3}>
        <Button
          variant="outlined"
          startIcon={<ChatBubble />}
          sx={{
            py: 1,
            px: 3,
            borderRadius: 5,
            borderColor: "#DEE2FD",
            color: "text.secondary",
            textTransform: "none",
            alignSelf: "center",
            "&:hover": {
              borderColor: "#DEE2FC",
              bgcolor: "#F5F6FF",
            },
          }}
        >
          Start adding script using the text editor below
        </Button>

        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            p: 2,
            bgcolor: "#FAFAFF",
            borderRadius: 5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Select
              value={currentRole}
              onChange={(e) =>
                setCurrentRole(e.target.value as "Customer" | "Trainee")
              }
              size="small"
              sx={{
                minWidth: 120,
                bgcolor: "white",
                display: "flex",
                alignItems: "center",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  pr: "32px !important",
                },
                "& .MuiSelect-icon": {
                  display: "none",
                },
              }}
              IconComponent={() => null}
            >
              <MenuItem value="Customer">
                <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                  <SupportAgentIcon sx={{ color: "grey" }} />
                </ListItemIcon>
                Customer
                <ListItemIcon sx={{ minWidth: "auto", ml: "auto" }}>
                  <ManageHistoryIcon sx={{ color: "grey" }} />
                </ListItemIcon>
              </MenuItem>
              <MenuItem value="Trainee">
                <ListItemIcon sx={{ minWidth: "auto", mr: 1 }}>
                  <SupportAgentIcon sx={{ color: "grey" }} />
                </ListItemIcon>
                Trainee
                <ListItemIcon sx={{ minWidth: "auto", ml: "auto" }}>
                  <ManageHistoryIcon sx={{ color: "grey" }} />
                </ListItemIcon>
              </MenuItem>
            </Select>
          </Stack>
          <TextField
            fullWidth
            placeholder="Type in your script..."
            variant="outlined"
            size="small"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleTextInput();
              }
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "white",
              },
            }}
          />
          {/* Replace Mic button with AudioRecorder component */}
          <AudioRecorder onTranscriptionReceived={handleTranscription} />
          <IconButton onClick={handleTextInput}>
            <PlayArrow />
          </IconButton>
        </Box>
      </Stack>
    </Stack>
  );
};

export default ScriptTab;
