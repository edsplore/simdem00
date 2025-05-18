import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import {
  fetchTrainingPlans,
  type TrainingPlan,
  type TrainingPlanPaginationParams,
} from "../../../services/trainingPlans";
import { fetchUsersSummary, type User } from "../../../services/users";
import { fetchTeamDetails, fetchTeams, type Team } from "../../../services/teams";
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

interface CreateTrainingPlanFormData {
  name: string;
  trainingPlan: string;
  startDate: string;
  dueDate: string;
  assignTo: string[];
  onAssignmentCreated?: () => void;
}

interface AssignTrainingPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onAssignmentCreated?: () => void;
}

const AssignTrainingPlanDialog: React.FC<AssignTrainingPlanDialogProps> = ({
  open,
  onClose,
  onAssignmentCreated,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTrainingPlansList, setShowTrainingPlansList] = useState(false);
  const searchFieldRef = useRef<HTMLDivElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState("");
  const [showAssigneesList, setShowAssigneesList] = useState(false);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMorePlans, setHasMorePlans] = useState(true);
  const [totalPlans, setTotalPlans] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { isValid, errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<CreateTrainingPlanFormData>({
    mode: "onChange",
    defaultValues: {
      name: "",
      trainingPlan: "",
      startDate: "",
      dueDate: "",
      assignTo: [],
    },
  });

  useEffect(() => {
    const loadTrainingPlans = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create pagination params
        const paginationParams: TrainingPlanPaginationParams = {
          page: page,
          pagesize: 20, // Fetch a larger number to avoid pagination in the dialog
          sortBy: "name",
          sortDir: "asc"
        };

        // Add search filter if provided
        if (searchQuery) {
          paginationParams.search = searchQuery;
        }

        const response = await fetchTrainingPlans(user?.id || "user123", paginationParams);

        // If this is the first page, replace the data
        if (page === 1) {
          setTrainingPlans(response.training_plans);
        } else {
          // Otherwise append to existing data
          setTrainingPlans(prev => [...prev, ...response.training_plans]);
        }

        // Update pagination state
        if (response.pagination) {
          setTotalPlans(response.pagination.total_count);
          setHasMorePlans(page < response.pagination.total_pages);
        } else {
          setHasMorePlans(false);
        }
      } catch (err) {
        setError("Failed to load training plans");
        console.error("Error loading training plans:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      loadTrainingPlans();
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

        console.log("Users response:", usersResponse);
        console.log("Teams response:", teamsResponse);

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

        console.log("Loaded assignees:", {
          teams: teamAssignees.length,
          users: userAssignees.length,
          total: teamAssignees.length + userAssignees.length,
        });
      } catch (error) {
        console.error("Error loading assignees:", error);
      } finally {
        setIsLoadingAssignees(false);
      }
    };

    if (open && currentWorkspaceId) {
      loadAssignees();
    }
  }, [open, currentWorkspaceId]);

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

  // Filter training plans based on search query
  const filteredPlans = trainingPlans.filter((plan) =>
    plan.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Filter assignees based on search query
  const filteredAssignees = assignees.filter(
    (assignee) =>
      assignee.name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
      (assignee.email &&
        assignee.email
          .toLowerCase()
          .includes(assigneeSearchQuery.toLowerCase())),
  );

  // Load more training plans when scrolling
  const handleLoadMore = () => {
    if (!isLoading && hasMorePlans) {
      setPage(prevPage => prevPage + 1);
    }
  };

  // Reset search and pagination when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setPage(1);
      setTrainingPlans([]);
    }
  }, [open]);

  const onSubmit = async (data: CreateTrainingPlanFormData) => {
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
      const traineeIds = data.assignTo.filter(
        (id) => assignees.find((a) => a.id === id)?.type === "trainee",
      );

      // Fetch detailed team information for each team
      const teamDetailsPromises = teamIds.map(teamId => 
        fetchTeamDetails(currentWorkspaceId, teamId)
      );

      // Wait for all team details to be fetched
      const teamsWithDetails = await Promise.all(teamDetailsPromises);

      console.log("Teams with details:", teamsWithDetails);

      // Create the assignment with detailed team information
      const response = await createAssignment({
        user_id: user?.id || "user123",
        name: data.name,
        type: "TrainingPlan",
        id: data.trainingPlan,
        start_date: data.startDate,
        end_date: data.dueDate,
        team_id: teamsWithDetails, // Use the detailed team objects
        trainee_id: traineeIds,
      });

      if (response.status === "success") {
        // Reset form
        reset({
          name: "",
          trainingPlan: "",
          startDate: "",
          dueDate: "",
          assignTo: [],
        });
        setSelectedPlan(null);

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

  const handleDeleteAssignee = (
    assigneeId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();
    const newValue = selectedAssignees.filter((id) => id !== assigneeId);
    setValue("assignTo", newValue, { shouldValidate: true });
  };

  // New handler to prevent event propagation for search input
  const handleSearchInputKeyDown = (e) => {
    e.stopPropagation();
  };

  // Handler for training plan search input change
  const handleTrainingPlanSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1); // Reset to first page when search changes
    setTrainingPlans([]); // Clear existing results
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
              Assign Training Plan
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign training plan to teams and trainees
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
                name="trainingPlan"
                control={control}
                rules={{ required: true }}
                render={({ field }) => {
                  const selectedPlanDetails = selectedPlan ? (
                    <Stack spacing={0.5} sx={{ width: "100%" }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" color="text.secondary">
                          {selectedPlan.id.slice(-6)}
                        </Typography>
                        <Chip
                          label={`Training plan | ${selectedPlan.added_object.length} Items`}
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
                        {selectedPlan.name}
                      </Typography>
                    </Stack>
                  ) : null;

                  return (
                    <Box position="relative" ref={searchFieldRef}>
                      <ClickAwayListener
                        onClickAway={() => setShowTrainingPlansList(false)}
                      >
                        <Box>
                          <TextField
                            {...field}
                            fullWidth
                            placeholder="Search training plans..."
                            value={searchQuery}
                            onChange={handleTrainingPlanSearchChange}
                            onClick={() => setShowTrainingPlansList(true)}
                            InputProps={{
                              startAdornment: (
                                <SearchIcon
                                  sx={{ color: "text.secondary", mr: 1 }}
                                />
                              ),
                            }}
                          />
                          {selectedPlanDetails && !showTrainingPlansList && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                              }}
                            >
                              {selectedPlanDetails}
                            </Box>
                          )}
                          {showTrainingPlansList && (
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
                                  filteredPlans.length > 0 ? 250 : "auto",
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
                              ) : filteredPlans.length === 0 ? (
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
                                  {filteredPlans.map((plan) => (
                                    <Box
                                      key={plan.id}
                                      onClick={() => {
                                        field.onChange(plan.id);
                                        setSelectedPlan(plan);
                                        setShowTrainingPlansList(false);
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
                                            {plan.id.slice(-6)}
                                          </Typography>
                                          <Chip
                                            label={`Training plan | ${plan.added_object.length} Items`}
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
                                          {plan.name}
                                        </Typography>
                                      </Stack>
                                    </Box>
                                  ))}

                                  {/* Load more button */}
                                  {hasMorePlans && (
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
                              onDelete={(e) => handleDeleteAssignee(value, e)}
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
              disabled={!isValid}
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
              Assign Training Plan
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

export default AssignTrainingPlanDialog;