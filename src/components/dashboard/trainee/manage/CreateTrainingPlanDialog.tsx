import React, { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../../../../context/AuthContext";
import { createTrainingPlan } from "../../../../services/trainingPlans";
import { fetchModules, type Module } from "../../../../services/modules";
import {
  fetchSimulations,
  type Simulation,
} from "../../../../services/simulations";
import { fetchTags, createTag, Tag } from "../../../../services/tags";
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
  Avatar,
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

interface Item {
  id: string;
  name: string;
  type: "module" | "simulation";
  simCount?: number;
}

interface CreateTrainingPlanFormData {
  name: string;
  tags: string[];
  selectedItems: Item[];
}

interface CreateTrainingPlanDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateTrainingPlanDialog: React.FC<CreateTrainingPlanDialogProps> = ({
  open,
  onClose,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showItemsList, setShowItemsList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Tags related state
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const loadItems = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [modulesData, simulationsData] = await Promise.all([
          fetchModules(user?.id || "user123"),
          fetchSimulations(user?.id || "user123"),
        ]);

        // Filter simulations to only include published ones
        const publishedSimulations = simulationsData.filter(
          (sim) => sim.status === "published",
        );

        const combinedItems: Item[] = [
          ...modulesData.map((m) => ({
            id: m.id,
            name: m.name,
            type: "module" as const,
            simCount: m.simulations_id.length,
          })),
          ...publishedSimulations.map((s) => ({
            id: s.id,
            name: s.sim_name,
            type: "simulation" as const,
          })),
        ];

        setItems(combinedItems);
      } catch (err) {
        setError("Failed to load items");
        console.error("Error loading items:", err);
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
      loadItems();
      loadTags();
    }
  }, [open, user?.id]);

  const {
    control,
    handleSubmit,
    formState: { isValid },
    watch,
    setValue,
  } = useForm<CreateTrainingPlanFormData>({
    mode: "onChange",
    defaultValues: {
      name: "Untitled Training Plan 01",
      tags: [],
      selectedItems: [],
    },
  });

  const selectedItems = watch("selectedItems");
  const selectedTags = watch("tags");
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getModuleAndSimCount = () => {
    const modules = selectedItems.filter(
      (item) => item.type === "module",
    ).length;
    const sims = selectedItems.filter(
      (item) => item.type === "simulation",
    ).length;
    return { modules, sims };
  };

  const onSubmit = async (data: CreateTrainingPlanFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await createTrainingPlan({
        user_id: user?.id || "user123",
        training_plan_name: data.name,
        tags: data.tags,
        added_object: data.selectedItems.map((item) => ({
          type: item.type,
          id: item.id,
        })),
      });

      if (response.status === "success") {
        onClose();
      }
    } catch (error) {
      console.error("Error creating training plan:", error);
      setSubmitError("Failed to create training plan. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeItem = (itemToRemove: Item) => {
    setValue(
      "selectedItems",
      selectedItems.filter((item) => item.id !== itemToRemove.id),
      { shouldValidate: true },
    );
  };

  const isItemSelected = (item: Item): boolean => {
    return selectedItems.some((selected) => selected.id === item.id);
  };

  const handleItemToggle = (item: Item) => {
    const currentItems = selectedItems;
    const isCurrentlySelected = isItemSelected(item);

    let newItems: Item[] = [];
    if (isCurrentlySelected) {
      newItems = currentItems.filter((selected) => selected.id !== item.id);
    } else {
      newItems = [...currentItems, item];
    }

    setValue("selectedItems", newItems, { shouldValidate: true });
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

  const { modules, sims } = getModuleAndSimCount();

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
              Create Training Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add training plan details and simulation
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
                  label="Training Plan Name"
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
                  <Typography variant="subtitle1">
                    Add Simulations and Modules
                  </Typography>
                  <Chip
                    label={`${modules} Modules | ${sims} Sims`}
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
                    onClickAway={() => setShowItemsList(false)}
                  >
                    <Box>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search simulations or modules..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowItemsList(true);
                        }}
                        onClick={() => setShowItemsList(true)}
                        InputProps={{
                          startAdornment: (
                            <SearchIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                      {showItemsList && (
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
                            minHeight: filteredItems.length > 0 ? 250 : "auto",
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
                          ) : filteredItems.length === 0 ? (
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
                            filteredItems.map((item) => (
                              <Box
                                key={item.id}
                                onClick={() => {
                                  handleItemToggle(item);
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
                                  checked={isItemSelected(item)}
                                  sx={{ p: 0 }}
                                />
                                <Typography variant="body2" noWrap>
                                  {item.id.slice(-6)}
                                </Typography>
                                <Typography variant="body2" noWrap>
                                  {item.name}
                                </Typography>
                                <Chip
                                  label={
                                    item.type === "module"
                                      ? `Module | ${item.simCount} Sim`
                                      : "Sim"
                                  }
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

                {selectedItems.length > 0 && (
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
                        {selectedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.id.slice(-6)}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Chip
                                label={
                                  item.type === "module"
                                    ? `Module | ${item.simCount} Sim`
                                    : "Sim"
                                }
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
                                onClick={() => removeItem(item)}
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
              {isSubmitting ? "Creating..." : "Create Training Plan"}
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

export default CreateTrainingPlanDialog;
