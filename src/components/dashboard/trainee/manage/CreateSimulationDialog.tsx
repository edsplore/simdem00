import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Box,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  SmartToy as SimulatorIcon,
  Headphones as AudioIcon,
  Chat as ChatIcon,
  Visibility as VisualIcon,
} from "@mui/icons-material";

import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../../../context/AuthContext";
import { fetchDivisions, fetchDepartments } from "../../../../services/suggestions";
import axios from "axios";

type CreateSimulationFormData = {
  name: string;
  division: string;
  department: string;
  tags: string[];
  simulationType: "audio" | "visual-audio" | "chat" | "visual-chat" | "visual";
};

type CreateSimulationDialogProps = {
  open: boolean;
  onClose: () => void;
};

const simulationTypes = [
  {
    id: "audio",
    title: "Audio",
    description: "Interactive audio call session simulation",
    icon: <AudioIcon sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual-audio",
    title: "Visual - Audio",
    description: "Audio simulation with click-through visuals",
    icon: <VisualIcon sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "chat",
    title: "Chat",
    description: "Interactive text chat simulation",
    icon: <ChatIcon sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual-chat",
    title: "Visual - Chat",
    description: "Chat Simulation with click-through visuals",
    icon: <VisualIcon sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
  {
    id: "visual",
    title: "Visual Only",
    description: "Click-through visuals only",
    icon: <VisualIcon sx={{ fontSize: 24, color: "#444CE7" }} />,
  },
];

const availableTags = ["Tag 1", "Tag 2", "Tag 3", "Tag 4", "Tag 5", "Tag 6"];

const CreateSimulationDialog: React.FC<CreateSimulationDialogProps> = ({
  open,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isLoadingDivisions, setIsLoadingDivisions] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { isValid },
    reset,
    setValue,
    watch,
  } = useForm<CreateSimulationFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      division: "",
      department: "",
      tags: [],
      simulationType: "audio",
    },
  });

  // Fetch divisions and departments when dialog opens
  useEffect(() => {
    if (open && currentWorkspaceId) {
      // Fetch divisions
      const loadDivisions = async () => {
        setIsLoadingDivisions(true);
        try {
          const divisionsData = await fetchDivisions(currentWorkspaceId);
          console.log('Loaded divisions:', divisionsData);
          setDivisions(divisionsData);
        } catch (error) {
          console.error('Failed to load divisions:', error);
        } finally {
          setIsLoadingDivisions(false);
        }
      };

      // Fetch departments
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartments(currentWorkspaceId);
          console.log('Loaded departments:', departmentsData);
          setDepartments(departmentsData);
        } catch (error) {
          console.error('Failed to load departments:', error);
        } finally {
          setIsLoadingDepartments(false);
        }
      };

      loadDivisions();
      loadDepartments();
    }
  }, [open, currentWorkspaceId]);

  const onSubmit = async (data: CreateSimulationFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Call the API to create a simulation
      const response = await axios.post("/api/simulations/create", {
        user_id: user?.id || "user123", // Use authenticated user ID
        name: data.name,
        division_id: data.division || "",
        department_id: data.department || "",
        type: data.simulationType.toLowerCase(),
        tags: data.tags || [],
        script: [], // Empty script to be filled later
        status: "draft", // Start as draft
      });

      if (
        response.data &&
        response.data.status === "success" &&
        response.data.id
      ) {
        // Reset form for next time
        reset();
        // Close dialog
        onClose();
        // Navigate to the generate scripts page with the ID
        navigate(`/generate-scripts/${response.data.id}`);
      } else {
        setErrorMessage("Failed to create simulation. Please try again.");
      }
    } catch (error) {
      console.error("Error creating simulation:", error);
      setErrorMessage("An error occurred while creating the simulation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseError = () => {
    setErrorMessage(null);
  };

  const tags = watch("tags");

  const removeTag = (tag: string) => {
    const newTags = tags.filter((item) => item !== tag);
    setValue("tags", newTags);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 600,
          },
        }}
      >
        <DialogTitle sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                position: "relative",
                width: 48,
                height: 48,
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  bottom: -6,
                  left: -6,
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  bgcolor: "#EEF4FF",
                  zIndex: 0,
                }}
              />
              <Box
                sx={{
                  position: "relative",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  bgcolor: "#F5F6FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <SimulatorIcon sx={{ color: "#444CE7" }} />
              </Box>
            </Box>

            <Stack spacing={0.5} flex={1}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                }}
              >
                Create Simulation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter simulation details to get started
              </Typography>
            </Stack>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 3,
            "&::-webkit-scrollbar": {
              display: "none",
            },
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            pt: "24px !important",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Stack direction="row" spacing={2}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Simulation Name"
                      required
                      fullWidth
                      size="medium"
                      sx={{ flex: 1 }}
                    />
                  )}
                />
              </Stack>

              <Stack direction="row" spacing={2}>
                <Controller
                  name="division"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      fullWidth
                      displayEmpty
                      required
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <Typography color="text.secondary">
                              Division
                            </Typography>
                          );
                        }
                        return selected;
                      }}
                     MenuProps={{
                       PaperProps: {
                         style: {
                           maxHeight: 300,
                           overflow: 'auto'
                         }
                       }
                     }}
                    >
                      {isLoadingDivisions ? (
                        <MenuItem disabled>Loading divisions...</MenuItem>
                      ) : divisions.length === 0 ? (
                        <MenuItem disabled>No divisions available</MenuItem>
                      ) : (
                        divisions.map((division) => (
                          <MenuItem key={division} value={division}>
                            {division}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  )}
                />

                <Controller
                  name="department"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      fullWidth
                      displayEmpty
                      required
                      renderValue={(selected) => {
                        if (!selected) {
                          return (
                            <Typography color="text.secondary">
                              Department
                            </Typography>
                          );
                        }
                        return selected;
                      }}
                     MenuProps={{
                       PaperProps: {
                         style: {
                           maxHeight: 300,
                           overflow: 'auto'
                         }
                       }
                     }}
                    >
                      {isLoadingDepartments ? (
                        <MenuItem disabled>Loading departments...</MenuItem>
                      ) : departments.length === 0 ? (
                        <MenuItem disabled>No departments available</MenuItem>
                      ) : (
                        departments.map((department) => (
                          <MenuItem key={department} value={department}>
                            {department}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  )}
                />
              </Stack>

              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <>
                    <Select
                      {...field}
                      fullWidth
                      multiple
                      displayEmpty
                      renderValue={(selected) => (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {selected?.length === 0 && (
                            <Typography color="text.secondary">
                              Add Tags
                            </Typography>
                          )}
                          {selected.map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              onDelete={(event) => {
                                // Prevent the select from opening when clicking the delete icon
                                event.stopPropagation();
                                removeTag(tag);
                              }}
                              onMouseDown={(event) => {
                                // Also prevent the mousedown event from propagating
                                event.stopPropagation();
                              }}
                              deleteIcon={
                                <CloseIcon sx={{ color: "#B0B0B0" }} />
                              }
                              sx={{
                                borderRadius: 20,
                                backgroundColor: "transparent",
                                border: " 1px solid #B0B0B0",
                                color: "#333333",
                                fontSize: "1rem",
                                fontWeight: "medium",
                                "& .MuiChip-deleteIcon": {
                                  color: "#B0B0B0",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                     MenuProps={{
                       PaperProps: {
                         style: {
                           maxHeight: 300,
                           overflow: 'auto'
                         }
                       }
                     }}
                    >
                      {availableTags.map((tag) => (
                        <MenuItem key={tag} value={tag}>
                          {tag}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                )}
              />

              <Stack spacing={2}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                  }}
                >
                  Choose Simulation Type
                </Typography>
                <Controller
                  name="simulationType"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 2,
                      }}
                    >
                      {simulationTypes.map((type) => (
                        <Box
                          key={type.id}
                          onClick={() => field.onChange(type.id)}
                          sx={{
                            p: 2,
                            border: "3px solid ",
                            borderColor:
                              field.value === type.id ? "#444CE7" : "divider",
                            borderRadius: 5,
                            cursor: "pointer",
                            bgcolor:
                              field.value === type.id
                                ? "#FFFFFF"
                                : "transparent",
                            "&:hover": {
                              bgcolor: "#F5F6FF",
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                          >
                            <Box
                              sx={{
                                position: "relative",
                                width: 40,
                                height: 40,
                              }}
                            >
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: -4,
                                  left: -4,
                                  width: 48,
                                  height: 48,
                                  borderRadius: "50%",
                                  bgcolor: "#EEF4FF",
                                  zIndex: 0,
                                }}
                              />
                              <Box
                                sx={{
                                  position: "relative",
                                  width: 40,
                                  height: 40,
                                  borderRadius: "50%",
                                  bgcolor: "#F5F6FF",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  zIndex: 1,
                                }}
                              >
                                {type.icon}
                              </Box>
                            </Box>
                            <Stack spacing={0.5}>
                              <Typography
                                variant="h6"
                                sx={{
                                  color:
                                    field.value === type.id
                                      ? "#444CE7"
                                      : "inherit",
                                  fontWeight: "bold",
                                  fontFamily: "Roboto, sans-serif",
                                }}
                              >
                                {type.title}
                              </Typography>

                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {type.description}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Box>
                  )}
                />
              </Stack>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!isValid || isSubmitting}
                sx={{
                  mt: 2,
                  py: 1.5,
                  bgcolor: "#444CE7",
                  color: "white",
                  "&:hover": {
                    bgcolor: "#3538CD",
                    color: "white",
                  },
                  "&.Mui-disabled": {
                    bgcolor: "#F5F6FF",
                    color: "#444CE7",
                  },
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: "#444CE7" }} />
                ) : (
                  "Create Simulation"
                )}
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CreateSimulationDialog;