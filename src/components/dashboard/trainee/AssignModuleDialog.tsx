import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  fetchModules, 
  type Module, 
  type ModulePaginationParams 
} from "../../../services/modules";
import { fetchUsersSummary, type User } from "../../../services/users";
import { fetchTeams, type Team, fetchTeamDetails } from "../../../services/teams";
import { 
  createAssignment, 
  type Team as DetailedTeam,
  type TeamMember
} from "../../../services/assignments";
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
  Checkbox,
  ClickAwayListener,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Close as CloseIcon,
  Book as BookIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { useAuth } from "../../../context/AuthContext";

interface Assignee {
  id: string;
  name: string;
  email?: string;
  type: "team" | "trainee";
}

interface CreateModuleFormData {
  name: string;
  moduleId: string;
  startDate: string;
  dueDate: string;
  assignTo: string[];
}

interface AssignModuleDialogProps {
  open: boolean;
  onClose: () => void;
  onAssignmentCreated?: () => void;
}

const AssignModuleDialog: React.FC<AssignModuleDialogProps> = ({
  open,
  onClose,
  onAssignmentCreated,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModulesList, setShowModulesList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneesList, setShowAssigneesList] = useState(false);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreModules, setHasMoreModules] = useState(true);
  const [totalModules, setTotalModules] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { isValid, errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<CreateModuleFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      moduleId: "",
      startDate: "",
      dueDate: "",
      assignTo: [],
    },
  });

  useEffect(() => {
    const loadModules = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create pagination params
        const paginationParams: ModulePaginationParams = {
          page: page,
          pagesize: 20, // Fetch a larger number to avoid pagination in the dialog
          sortBy: "name",
          sortDir: "asc"
        };

        // Add search filter if provided
        if (searchQuery) {
          paginationParams.search = searchQuery;
        }

        const response = await fetchModules(user?.id || "user123", paginationParams);

        // If this is the first page, replace the data
        if (page === 1) {
          setModules(response.modules);
        } else {
          // Otherwise append to existing data
          setModules(prev => [...prev, ...response.modules]);
        }

        // Update pagination state
        if (response.pagination) {
          setTotalModules(response.pagination.total_count);
          setHasMoreModules(page < response.pagination.total_pages);
        } else {
          setHasMoreModules(false);
        }
      } catch (err) {
        setError("Failed to load modules");
        console.error("Error loading modules:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadModules();
    }
  }, [open, user?.id, searchQuery, page]);

  useEffect(() => {
    const loadAssignees = async () => {
      if (!currentWorkspaceId) {
        console.error("No workspace ID available");
        return;
      }

      setIsLoadingAssignees(true);
      try {
        // Fetch both users and teams in parallel
        const [usersResponse, teamsResponse] = await Promise.all([
          fetchUsersSummary(currentWorkspaceId),
          fetchTeams(currentWorkspaceId),
        ]);


        // Process users
        const userAssignees: Assignee[] = Array.isArray(usersResponse)
          ? usersResponse.map((user) => ({
              id: user.user_id,
              name:
                user.fullName ||
                `${user.first_name || ""} ${user.last_name || ""}`.trim(),
              email: user.email,
              type: "trainee",
            }))
          : [];

        // Process teams - handle both response formats
        let teamsList: Team[] = [];
        if (teamsResponse.teams && Array.isArray(teamsResponse.teams)) {
          teamsList = teamsResponse.teams;
        } else if (teamsResponse.items && Array.isArray(teamsResponse.items)) {
          teamsList = teamsResponse.items;
        }

        const teamAssignees: Assignee[] = teamsList.map((team) => ({
          id: team.team_id,
          name: team.team_name || team.name || `Team ${team.team_id.slice(-4)}`,
          type: "team",
        }));

        // Combine users and teams
        setAssignees([...teamAssignees, ...userAssignees]);

      } catch (error) {
        console.error("Error loading assignees:", error);
        setError("Failed to load users and teams");
      } finally {
        setIsLoadingAssignees(false);
      }
    };

    if (open && currentWorkspaceId) {
      loadAssignees();
    }
  }, [open, currentWorkspaceId]);

  // Reset search and pagination when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setPage(1);
      setModules([]);
    }
  }, [open]);

  const selectedAssignees = watch("assignTo");
  const startDate = watch("startDate");
  const dueDate = watch("dueDate");

  // Add validation to ensure dueDate is after startDate
  useEffect(() => {
    if (startDate && dueDate) {
      const start = new Date(startDate);
      const due = new Date(dueDate);

      if (due < start) {
        setValue("dueDate", "");
        trigger("dueDate");
      }
    }
  }, [startDate, dueDate, setValue, trigger]);

  // Filter modules based on search query
  const filteredModules = modules.filter((module) =>
    module.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredAssignees = assignees.filter(
    (assignee) =>
      assignee.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
      (assignee.email &&
        assignee.email
          .toLowerCase()
          .includes(assigneeSearchQuery.toLowerCase())),
  );

  // Load more modules when scrolling
  const handleLoadMore = () => {
    if (!isLoading && hasMoreModules) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Handler for module search input change
  const handleModuleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
    setModules([]); // Clear existing results
  };

  const onSubmit = async (data: CreateModuleFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      if (!currentWorkspaceId) {
        setSubmitError("Workspace ID is required");
        return;
      }

      // Split assignees into teams and trainees
      const teamIds = data.assignTo.filter(
        (id) => assignees.find((a) => a.id === id)?.type === "team",
      );
      const trainees = data.assignTo.filter(
        (id) => assignees.find((a) => a.id === id)?.type === "trainee",
      );

      // Fetch detailed team information for each team
      const teamDetailsPromises = teamIds.map(teamId => 
        fetchTeamDetails(currentWorkspaceId, teamId)
      );

      // Wait for all team details to be fetched
      const teamsWithDetails = await Promise.all(teamDetailsPromises);


      const response = await createAssignment({
        user_id: user?.id || "user123",
        name: data.name,
        type: "Module",
        id: data.moduleId,
        start_date: data.startDate,
        end_date: data.dueDate,
        team_id: teamsWithDetails, // Use the detailed team objects
        trainee_id: trainees,
      });

      if (response.status === "success") {
        // Reset form
        reset({
          name: "",
          moduleId: "",
          startDate: "",
          dueDate: "",
          assignTo: [],
        });
        setSelectedModule(null);

        // Call success callback and close dialog
        onAssignmentCreated?.();
        onClose();
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      setSubmitError("Failed to create assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedAssigneeName = (id: string) => {
    return assignees.find((assignee) => assignee.id === id)?.name || "";
  };

  const handleDeleteAssignee = (assigneeId: string) => {
    const newValue = selectedAssignees.filter((id) => id !== assigneeId);
    setValue("assignTo", newValue, { shouldValidate: true });
  };

  // New handler to prevent event propagation for search input
  const handleSearchInputKeyDown = (e) => {
    e.stopPropagation();
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
              Assign Module
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign module to teams and trainees
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
            <Stack spacing={2}>
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Assignment Name"
                    required
                    fullWidth
                    size="medium"
                  />
                )}
              />

              <Controller
                name="moduleId"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const selectedModuleDetails = selectedModule ? (
                    <Stack spacing={0.5} sx={{ width: "100%" }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" color="text.secondary">
                          {selectedModule.id.slice(-6)}
                        </Typography>
                        <Chip
                          label={`Module | ${selectedModule.simulations_id.length} Sims`}
                          size="small"
                          sx={{
                            bgcolor: "#F5F6FF",
                            color: "#444CE7",
                            height: 24,
                            "& .MuiChip-label": {
                              px: 1,
                              fontSize: "12px",
                            },
                          }}
                        />
                      </Stack>
                      <Typography variant="body1">
                        {selectedModule.name}
                      </Typography>
                    </Stack>
                  ) : null;

                  return (
                    <Box position="relative" ref={searchFieldRef}>
                      <ClickAwayListener
                        onClickAway={() => setShowModulesList(false)}
                      >
                        <Box>
                          <TextField
                            {...field}
                            fullWidth
                            placeholder="Search modules..."
                            value={searchQuery}
                            onChange={handleModuleSearchChange}
                            onClick={() => setShowModulesList(true)}
                            InputProps={{
                              startAdornment: (
                                <SearchIcon
                                  sx={{ color: "text.secondary", mr: 1 }}
                                />
                              ),
                            }}
                          />
                          {selectedModuleDetails && !showModulesList && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                              }}
                            >
                              {selectedModuleDetails}
                            </Box>
                          )}
                          {showModulesList && (
                            <Box
                              sx={{
                                position: "absolute",
                                zIndex: 1300,
                                width: "100%",
                                left: 0,
                                mt: 0.5,
                                bgcolor: "background.paper",
                                borderRadius: 1,
                                boxShadow: 3,
                                maxHeight: 300,
                                minHeight:
                                  filteredModules.length > 0 ? 250 : "auto",
                                overflow: "auto",
                              }}
                            >
                              {isLoading && page === 1 ? (
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
                              ) : filteredModules.length === 0 ? (
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
                                <>
                                  {filteredModules.map((module) => (
                                    <Box
                                      key={module.id}
                                      onClick={() => {
                                        field.onChange(module.id);
                                        setSelectedModule(module);
                                        setShowModulesList(false);
                                        setSearchQuery("");
                                      }}
                                      sx={{
                                        p: 1.5,
                                        cursor: "pointer",
                                        "&:hover": { bgcolor: "#F5F6FF" },
                                      }}
                                    >
                                      <Stack spacing={0.5}>
                                        <Stack
                                          direction="row"
                                          justifyContent="space-between"
                                          alignItems="center"
                                        >
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            {module.id.slice(-6)}
                                          </Typography>
                                          <Chip
                                            label={`Module | ${module.simulations_id.length} Sims`}
                                            size="small"
                                            sx={{
                                              bgcolor: "#F5F6FF",
                                              color: "#444CE7",
                                              height: 24,
                                              "& .MuiChip-label": {
                                                px: 1,
                                                fontSize: "12px",
                                              },
                                            }}
                                          />
                                        </Stack>
                                        <Typography variant="body1">
                                          {module.name}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  ))}

                                  {/* Load more button */}
                                  {hasMoreModules && (
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        display: "flex",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <Button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleLoadMore();
                                        }}
                                        disabled={isLoading}
                                        size="small"
                                      >
                                        {isLoading ? (
                                          <CircularProgress size={20} />
                                        ) : (
                                          "Load More"
                                        )}
                                      </Button>
                                    </Box>
                                  )}
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                      </ClickAwayListener>
                    </Box>
                  );
                }}
              />

              <Stack direction="row" spacing={2}>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Start Date"
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />

                <Controller
                  name="dueDate"
                  control={control}
                  rules={{ 
                    required: true,
                    validate: value => {
                      if (!startDate) return true;
                      const start = new Date(startDate);
                      const due = new Date(value);
                      return due >= start || "Due date must be after start date";
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      type="date"
                      label="Due Date"
                      required
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Stack>

              <Controller
                name="assignTo"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    {...field}
                    multiple
                    fullWidth
                    displayEmpty
                    onOpen={() => setShowAssigneesList(true)}
                    onClose={() => setShowAssigneesList(false)}
                    renderValue={(selected) => {
                      if (selected.length === 0) {
                        return (
                          <Typography color="text.secondary">
                            Assign to
                          </Typography>
                        );
                      }
                      return (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => (
                            <Chip
                              key={value}
                              label={getSelectedAssigneeName(value)}
                              onMouseDown={(e) => e.stopPropagation()}
                              onDelete={() => handleDeleteAssignee(value)}
                              deleteIcon={<CloseIcon />}
                              avatar={
                                <Avatar sx={{ bgcolor: "#F5F6FF" }}>
                                  {assignees.find((a) => a.id === value)
                                    ?.type === "team" ? (
                                    <GroupIcon
                                      sx={{
                                        color: "#444CE7",
                                        width: 16,
                                        height: 16,
                                      }}
                                    />
                                  ) : (
                                    <PersonIcon
                                      sx={{
                                        color: "#444CE7",
                                        width: 16,
                                        height: 16,
                                      }}
                                    />
                                  )}
                                </Avatar>
                              }
                              sx={{
                                bgcolor: "#F5F6FF",
                                border: "1px solid #DEE2FC",
                                "& .MuiChip-deleteIcon": {
                                  color: "#444CE7",
                                  fontSize: 16,
                                  "&:hover": {
                                    color: "#3538CD",
                                  },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                        },
                      },
                      anchorOrigin: {
                        vertical: "bottom",
                        horizontal: "left",
                      },
                      transformOrigin: {
                        vertical: "top",
                        horizontal: "left",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        position: "sticky",
                        top: 0,
                        bgcolor: "background.paper",
                        zIndex: 1,
                      }}
                    >
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Search users or teams..."
                        value={assigneeSearchQuery}
                        onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                        // Added these handlers to prevent event propagation
                        onKeyDown={handleSearchInputKeyDown}
                        onClick={(e) => e.stopPropagation()}
                        InputProps={{
                          startAdornment: (
                            <SearchIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        }}
                      />
                    </Box>

                    {isLoadingAssignees ? (
                      <Box
                        sx={{ display: "flex", justifyContent: "center", p: 2 }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    ) : assignees.length === 0 ? (
                      <MenuItem disabled>No users or teams available</MenuItem>
                    ) : filteredAssignees.length === 0 ? (
                      <MenuItem disabled>No matches found</MenuItem>
                    ) : (
                      filteredAssignees.map((assignee) => (
                        <MenuItem
                          key={assignee.id}
                          value={assignee.id}
                          sx={{
                            py: 1,
                            px: 2,
                            "&:hover": {
                              bgcolor: "#F5F6FF",
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            spacing={2}
                            alignItems="center"
                            sx={{ width: "100%" }}
                          >
                            <Checkbox
                              checked={selectedAssignees.includes(assignee.id)}
                              sx={{
                                color: "#D0D5DD",
                                "&.Mui-checked": {
                                  color: "#444CE7",
                                },
                              }}
                            />
                            <Avatar
                              sx={{ width: 24, height: 24, bgcolor: "#F5F6FF" }}
                            >
                              {assignee.type === "team" ? (
                                <GroupIcon
                                  sx={{
                                    color: "#444CE7",
                                    width: 16,
                                    height: 16,
                                  }}
                                />
                              ) : (
                                <PersonIcon
                                  sx={{
                                    color: "#444CE7",
                                    width: 16,
                                    height: 16,
                                  }}
                                />
                              )}
                            </Avatar>
                            <Stack spacing={0.5} flex={1}>
                              <Typography variant="body2">
                                {assignee.name}
                              </Typography>
                              {assignee.email && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {assignee.email}
                                </Typography>
                              )}
                            </Stack>
                            <Chip
                              label={
                                assignee.type === "team" ? "Team" : "Trainee"
                              }
                              size="small"
                              sx={{
                                bgcolor: "#F5F6FF",
                                color: "#444CE7",
                                height: 24,
                                "& .MuiChip-label": {
                                  px: 1,
                                  fontSize: "12px",
                                },
                              }}
                            />
                          </Stack>
                        </MenuItem>
                      ))
                    )}
                  </Select>
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
                },
                "&.Mui-disabled": {
                  bgcolor: "#F5F6FF",
                  color: "#444CE7",
                },
              }}
            >
              {isSubmitting ? "Assigning..." : "Assign Module"}
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

export default AssignModuleDialog;
