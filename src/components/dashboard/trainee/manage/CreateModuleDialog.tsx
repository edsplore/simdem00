import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../../../context/AuthContext";
import { createModule } from "../../../../services/modules";
import {
  fetchSimulations,
  type Simulation,
  type SimulationPaginationParams,
} from "../../../../services/simulations";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  IconButton,
  TextField,
  Box,
  Button,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  ClickAwayListener,
  Checkbox,
  CircularProgress,
  Autocomplete,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Close as CloseIcon,
  Book as BookIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { fetchTags, createTag, Tag } from "../../../../services/tags";

interface SimulationItem {
  id: string;
  name: string;
}

interface CreateModuleFormData {
  name: string;
  tags: string[];
  selectedSimulations: SimulationItem[];
}

interface CreateModuleDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateModuleDialog: React.FC<CreateModuleDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSimulationsList, setShowSimulationsList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tags related state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const loadSimulations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use pagination to fetch published simulations
        const paginationParams: SimulationPaginationParams = {
          page: 1,
          pagesize: 100, // Fetch a larger number to avoid pagination in the dialog
          status: ["published"], // Only fetch published simulations
          sortBy: "simName",
          sortDir: "asc"
        };

        // Add search filter if provided
        if (searchQuery) {
          paginationParams.search = searchQuery;
        }

        const response = await fetchSimulations(user?.id || "user123", paginationParams);

        // Filter to only include published simulations
        setSimulations(response.simulations);
      } catch (err) {
        setError("Failed to load simulations");
        console.error("Error loading simulations:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTags = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingTags(true);
        const tagsData = await fetchTags(user.id);
        setAvailableTags(tagsData);
      } catch (error) {
        console.error("Failed to load tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    if (open) {
      loadSimulations();
      loadTags();
    }
  }, [open, user?.id, searchQuery]);

  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<CreateModuleFormData>({
    mode: "onChange",
    defaultValues: {
      name: "Untitled Module 01",
      tags: [],
      selectedSimulations: [],
    },
  });

  const selectedSimulations = watch("selectedSimulations");
  const selectedTags = watch("tags");
  const isSimulationSelected = (simulation: Simulation) => {
    return selectedSimulations.some(
      (selected) => selected.id === simulation.id,
    );
  };
  const filteredSimulations = simulations
    .filter((sim) =>
      sim.sim_name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      // Sort selected simulations to the top
      const aSelected = isSimulationSelected(a);
      const bSelected = isSimulationSelected(b);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;
      return 0;
    });

  const onSubmit = async (data: CreateModuleFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await createModule({
        user_id: user?.id || "user123",
        module_name: data.name,
        tags: data.tags,
        simulations: data.selectedSimulations.map((sim) => sim.id),
      });

      if (response.status === "success") {
        onClose();
      }
    } catch (error) {
      console.error("Error creating module:", error);
      setSubmitError("Failed to create module. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeSimulation = (simulationToRemove: SimulationItem) => {
    setValue(
      "selectedSimulations",
      selectedSimulations.filter((sim) => sim.id !== simulationToRemove.id),
      { shouldValidate: true },
    );
  };

  const handleSimulationToggle = (simulation: Simulation) => {
    const currentSimulations = selectedSimulations;
    const isCurrentlySelected = isSimulationSelected(simulation);

    let newSimulations: SimulationItem[];
    if (isCurrentlySelected) {
      newSimulations = currentSimulations.filter(
        (selected) => selected.id !== simulation.id,
      );
    } else {
      newSimulations = [
        ...currentSimulations,
        { id: simulation.id, name: simulation.sim_name },
      ];
    }

    setValue("selectedSimulations", newSimulations, { shouldValidate: true });
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
              <BookIcon sx={{ color: "#444CE7" }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Create Module
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add module details and simulation
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: "24px !important" }}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Module Name"
                  required
                  fullWidth
                  size="medium"
                />
              )}
            />

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
                          backgroundColor: "#F5F6FF",
                          border: "1px solid #DEE2FC",
                          color: "#444CE7",
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

            <Box>
              <Stack spacing={2}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="subtitle1">Add Simulations</Typography>
                  <Chip
                    label={`${selectedSimulations.length} Sims`}
                    sx={{
                      bgcolor: "#F5F6FF",
                      color: "#444CE7",
                      borderRadius: 16,
                      height: 28,
                    }}
                  />
                </Stack>

                <Box position="relative" ref={searchFieldRef}>
                  <ClickAwayListener
                    onClickAway={() => setShowSimulationsList(false)}
                  >
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search simulations..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSimulationsList(true);
                        }}
                        onClick={() => setShowSimulationsList(true)}
                        InputProps={{
                          startAdornment: (
                            <SearchIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                      {showSimulationsList && (
                        <Box
                          sx={{
                            position: "absolute",
                            zIndex: 1300,
                            width:
                              searchFieldRef.current?.offsetWidth || "100%",
                            left: 0,
                            mt: 0.5,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                            boxShadow: 3,
                            maxHeight: 300,
                            minHeight:
                              filteredSimulations.length > 0 ? 250 : "auto",
                            overflow: "auto",
                            "&::-webkit-scrollbar": {
                              width: "8px",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              backgroundColor: "#E5E7EB",
                              borderRadius: "4px",
                            },
                          }}
                        >
                          {isLoading ? (
                            <Box
                              sx={{
                                p: 2,
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <CircularProgress size={24} />
                            </Box>
                          ) : error ? (
                            <Typography sx={{ p: 2, color: "error.main" }}>
                              {error}
                            </Typography>
                          ) : filteredSimulations.length === 0 ? (
                            <Typography
                              sx={{
                                p: 2,
                                color: "text.secondary",
                                textAlign: "center",
                              }}
                            >
                              No matches found
                            </Typography>
                          ) : (
                            filteredSimulations.map((simulation) => (
                              <Box
                                key={simulation.id}
                                onClick={() => {
                                  handleSimulationToggle(simulation);
                                }}
                                sx={{
                                  p: 1.5,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "#F5F6FF" },
                                  display: "grid",
                                  gridTemplateColumns: "auto 80px 1fr auto",
                                  alignItems: "center",
                                  gap: 2,
                                  width: "100%",
                                }}
                              >
                                <Checkbox
                                  checked={isSimulationSelected(simulation)}
                                  sx={{ p: 0 }}
                                />
                                <Typography variant="body2" noWrap>
                                  {simulation.id.slice(-6)}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {simulation.sim_name}
                                </Typography>
                                <Chip
                                  label="Sim"
                                  size="small"
                                  sx={{
                                    bgcolor: "#F5F6FF",
                                    color: "#444CE7",
                                    justifySelf: "end",
                                  }}
                                />
                              </Box>
                            ))
                          )}
                        </Box>
                      )}
                    </Box>
                  </ClickAwayListener>
                </Box>

                {selectedSimulations.length > 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#F9FAFB" }}>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedSimulations.map((simulation) => (
                          <TableRow key={simulation.id}>
                            <TableCell>{simulation.id.slice(-6)}</TableCell>
                            <TableCell>{simulation.name}</TableCell>
                            <TableCell>
                              <Chip
                                label="Sim"
                                size="small"
                                sx={{
                                  bgcolor: "#F5F6FF",
                                  color: "#444CE7",
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => removeSimulation(simulation)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Stack>
            </Box>

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
                },
                "&.Mui-disabled": {
                  bgcolor: "#F5F6FF",
                  color: "#444CE7",
                },
              }}
            >
              {isSubmitting ? "Creating..." : "Create Module"}
            </Button>
            {submitError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {submitError}
              </Alert>
            )}
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateModuleDialog;