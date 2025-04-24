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
  FormControl,
  InputLabel,
  Autocomplete,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  SmartToy as SimulatorIcon,
  Headphones as AudioIcon,
  Chat as ChatIcon,
  Visibility as VisualIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../../../context/AuthContext";
import {
  fetchDivisions,
  fetchDepartments,
} from "../../../../services/suggestions";
import { fetchTags, createTag, Tag } from "../../../../services/tags";
import { createSimulation } from "../../../../services/simulation_operations";

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
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [inputValue, setInputValue] = useState("");

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

  const selectedTags = watch("tags");

  // Fetch divisions and departments when dialog opens
  useEffect(() => {
    if (open && currentWorkspaceId) {
      // Fetch divisions
      const loadDivisions = async () => {
        setIsLoadingDivisions(true);
        try {
          const divisionsData = await fetchDivisions(currentWorkspaceId);
          console.log("Loaded divisions:", divisionsData);
          setDivisions(divisionsData);
        } catch (error) {
          console.error("Failed to load divisions:", error);
        } finally {
          setIsLoadingDivisions(false);
        }
      };

      // Fetch departments
      const loadDepartments = async () => {
        setIsLoadingDepartments(true);
        try {
          const departmentsData = await fetchDepartments(currentWorkspaceId);
          console.log("Loaded departments:", departmentsData);
          setDepartments(departmentsData);
        } catch (error) {
          console.error("Failed to load departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      };

      // Fetch tags
      const loadTags = async () => {
        setIsLoadingTags(true);
        try {
          const tagsData = await fetchTags(user?.id || "user123");
          setAvailableTags(tagsData);
        } catch (error) {
          console.error("Failed to load tags:", error);
        } finally {
          setIsLoadingTags(false);
        }
      };

      loadDivisions();
      loadDepartments();
      loadTags();
    }
  }, [open, currentWorkspaceId, user?.id]);

  const onSubmit = async (data: CreateSimulationFormData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Use the new createSimulation function
      const response = await createSimulation({
        user_id: user?.id || "user123", // Use authenticated user ID
        name: data.name,
        division_id: data.division || "",
        department_id: data.department || "",
        type: data.simulationType.toLowerCase() as SimulationType,
        tags: data.tags || [],
        script: [], // Empty script to be filled later
        status: "draft", // Start as draft
      });

      if (response && response.status === "success" && response.id) {
        // Reset form for next time
        reset();
        // Close dialog
        onClose();
        // Navigate to the generate scripts page with the ID
        navigate(`/generate-scripts/${response.id}`);
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

  const handleCreateTag = async (tagName: string) => {
    if (!tagName.trim() || !user?.id) return;

    setIsCreatingTag(true);
    try {
      const response = await createTag(user.id, tagName.trim());

      if (response && response.id) {
        // Add the new tag to the available tags list
        const newTag: Tag = {
          id: response.id,
          name: tagName.trim(),
          created_by: user.id,
          created_at: new Date().toISOString(),
          last_modified_by: user.id,
          last_modified_at: new Date().toISOString(),
        };

        setAvailableTags((prev) => [...prev, newTag]);

        // Add the new tag to the selected tags
        setValue("tags", [...selectedTags, tagName.trim()]);

        // Clear the input
        setInputValue("");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreatingTag(false);
    }
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
                    <FormControl fullWidth required>
                      <InputLabel id="division-label">Division</InputLabel>
                      <Select
                        {...field}
                        labelId="division-label"
                        label="Division"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              overflow: "auto",
                            },
                          },
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
                    </FormControl>
                  )}
                />

                <Controller
                  name="department"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormControl fullWidth required>
                      <InputLabel id="department-label">Department</InputLabel>
                      <Select
                        {...field}
                        labelId="department-label"
                        label="Department"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300,
                              overflow: "auto",
                            },
                          },
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
                    </FormControl>
                  )}
                />
              </Stack>

              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    id="tags-autocomplete"
                    options={availableTags.map((tag) => tag.name)}
                    value={field.value}
                    onChange={(_, newValue) => {
                      field.onChange(newValue);
                    }}
                    inputValue={inputValue}
                    onInputChange={(_, newInputValue) => {
                      setInputValue(newInputValue);
                    }}
                    filterOptions={(options, params) => {
                      const filtered = options.filter((option) =>
                        option
                          .toLowerCase()
                          .includes(params.inputValue.toLowerCase()),
                      );

                      // Add "Create" option if input is not empty and doesn't exist in options
                      const inputValue = params.inputValue.trim();
                      if (
                        inputValue !== "" &&
                        !options.includes(inputValue) &&
                        !selectedTags.includes(inputValue)
                      ) {
                        filtered.unshift(inputValue);
                      }

                      return filtered;
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option}
                          label={option}
                          sx={{
                            borderRadius: 20,
                            backgroundColor: "transparent",
                            border: "1px solid #B0B0B0",
                            color: "#333333",
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                          }}
                        />
                      ))
                    }
                    renderOption={(props, option) => {
                      const isNewOption = !availableTags.some(
                        (tag) => tag.name === option,
                      );

                      if (isNewOption) {
                        return (
                          <ListItem {...props} key={`create-${option}`}>
                            <ListItemText
                              primary={
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
                                  <Typography>Create "{option}"</Typography>
                                  <Button
                                    size="small"
                                    startIcon={<AddIcon />}
                                    variant="contained"
                                    color="primary"
                                    sx={{ ml: 2 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreateTag(option);
                                    }}
                                    disabled={isCreatingTag}
                                  >
                                    {isCreatingTag ? "Creating..." : "Create"}
                                  </Button>
                                </Box>
                              }
                            />
                          </ListItem>
                        );
                      }

                      return (
                        <MenuItem {...props} key={option}>
                          {option}
                        </MenuItem>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Add or create tags"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingTags && <CircularProgress size={20} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    loading={isLoadingTags}
                    loadingText="Loading tags..."
                    noOptionsText="No matching tags"
                  />
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
