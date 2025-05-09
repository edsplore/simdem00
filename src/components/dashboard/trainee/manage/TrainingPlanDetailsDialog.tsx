import React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Stack,
  Typography,
  IconButton,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  SmartToy as SimulationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { TrainingPlan } from '../../../../services/trainingPlans';
import { fetchModuleDetails } from '../../../../services/modules';
import { fetchSimulationById } from '../../../../services/simulations';

interface TrainingPlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  trainingPlan: TrainingPlan | null;
}

interface ExpandedItem {
  id: string;
  type: 'module' | 'simulation';
  data: any;
  isLoading: boolean;
  error: string | null;
}

const TrainingPlanDetailsDialog: React.FC<TrainingPlanDetailsDialogProps> = ({
  open,
  onClose,
  trainingPlan,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, ExpandedItem>>({});

  if (!trainingPlan) return null;

  // Separate modules and simulations
  const modules = trainingPlan.added_object.filter(item => item.type === 'module');
  const simulations = trainingPlan.added_object.filter(item => item.type === 'simulation');

  const handleToggleItem = async (id: string, type: 'module' | 'simulation') => {
    // If already expanded, just toggle the visibility
    if (expandedItems[id]) {
      setExpandedItems(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          isExpanded: !prev[id].isExpanded
        }
      }));
      return;
    }

    // Initialize the expanded item with loading state
    setExpandedItems(prev => ({
      ...prev,
      [id]: {
        id,
        type,
        data: null,
        isLoading: true,
        error: null,
        isExpanded: true
      }
    }));

    try {
      let data;
      if (type === 'module') {
        data = await fetchModuleDetails(id);
      } else {
        data = await fetchSimulationById(id);
      }

      setExpandedItems(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          data,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error(`Error fetching ${type} details:`, error);
      setExpandedItems(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          error: `Failed to load ${type} details`,
          isLoading: false
        }
      }));
    }
  };

  const isItemExpanded = (id: string) => {
    return expandedItems[id]?.isExpanded || false;
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
              position: 'relative',
              width: 48,
              height: 48,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: -6,
                left: -6,
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: '#EEF4FF',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'relative',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#F5F6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <BookIcon sx={{ color: '#444CE7' }} />
            </Box>
          </Box>

          <Stack spacing={0.5} flex={1}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {trainingPlan.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Training Plan Details
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          {/* Modules Section */}
          {modules.length > 0 && (
            <>
              <Typography variant="h6">
                Modules ({modules.length})
              </Typography>
              <List
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {modules.map((module, index) => (
                  <React.Fragment key={`module-${module.id}`}>
                    <ListItem 
                      button 
                      onClick={() => handleToggleItem(module.id, 'module')}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: '#F5F6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <BookIcon sx={{ color: '#444CE7', fontSize: 18 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={`Module ${module.id.slice(-6)}`}
                        secondary={`ID: ${module.id}`}
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label="Module"
                          size="small"
                          sx={{
                            bgcolor: '#F5F6FF',
                            color: '#444CE7',
                          }}
                        />
                        {isItemExpanded(module.id) ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </Stack>
                    </ListItem>

                    <Collapse in={isItemExpanded(module.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, pl: 9, bgcolor: '#F9FAFB' }}>
                        {expandedItems[module.id]?.isLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : expandedItems[module.id]?.error ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {expandedItems[module.id].error}
                          </Alert>
                        ) : expandedItems[module.id]?.data ? (
                          <Stack spacing={2}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Module Details
                            </Typography>

                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Name:</Typography>
                                <Typography variant="body2">{expandedItems[module.id].data.name}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Created By:</Typography>
                                <Typography variant="body2">{expandedItems[module.id].data.created_by}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Created On:</Typography>
                                <Typography variant="body2">{new Date(expandedItems[module.id].data.created_at).toLocaleString()}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Last Modified:</Typography>
                                <Typography variant="body2">{new Date(expandedItems[module.id].data.last_modified_at).toLocaleString()}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Tags:</Typography>
                                <Box>
                                  {expandedItems[module.id].data.tags && expandedItems[module.id].data.tags.map((tag: string, i: number) => (
                                    <Chip
                                      key={i}
                                      label={tag}
                                      size="small"
                                      sx={{
                                        ml: 0.5,
                                        bgcolor: '#F5F6FF',
                                        color: '#444CE7',
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Stack>
                            </Stack>

                            {expandedItems[module.id].data.simulations_id && 
                             expandedItems[module.id].data.simulations_id.length > 0 && (
                              <>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                                  Simulations in this Module ({expandedItems[module.id].data.simulations_id.length})
                                </Typography>
                                <List disablePadding>
                                  {expandedItems[module.id].data.simulations_id.map((simId: string, simIndex: number) => (
                                    <ListItem key={simId} disablePadding sx={{ py: 0.5 }}>
                                      <ListItemIcon sx={{ minWidth: 36 }}>
                                        <SimulationIcon fontSize="small" sx={{ color: '#444CE7' }} />
                                      </ListItemIcon>
                                      <ListItemText 
                                        primary={`Simulation ${simId.slice(-6)}`}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                      />
                                      <Button 
                                        size="small" 
                                        variant="text" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleItem(simId, 'simulation');
                                        }}
                                        sx={{ minWidth: 0, p: 0.5 }}
                                      >
                                        View
                                      </Button>
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            )}
                          </Stack>
                        ) : null}
                      </Box>
                    </Collapse>
                    {index < modules.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}

          {/* Simulations Section */}
          {simulations.length > 0 && (
            <>
              <Typography variant="h6">
                Simulations ({simulations.length})
              </Typography>
              <List
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {simulations.map((simulation, index) => (
                  <React.Fragment key={`simulation-${simulation.id}`}>
                    <ListItem 
                      button 
                      onClick={() => handleToggleItem(simulation.id, 'simulation')}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: '#F5F6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <SimulationIcon sx={{ color: '#444CE7', fontSize: 18 }} />
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={`Simulation ${simulation.id.slice(-6)}`}
                        secondary={`ID: ${simulation.id}`}
                      />
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label="Simulation"
                          size="small"
                          sx={{
                            bgcolor: '#F5F6FF',
                            color: '#444CE7',
                          }}
                        />
                        {isItemExpanded(simulation.id) ? (
                          <ExpandLessIcon fontSize="small" />
                        ) : (
                          <ExpandMoreIcon fontSize="small" />
                        )}
                      </Stack>
                    </ListItem>

                    <Collapse in={isItemExpanded(simulation.id)} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, pl: 9, bgcolor: '#F9FAFB' }}>
                        {expandedItems[simulation.id]?.isLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : expandedItems[simulation.id]?.error ? (
                          <Alert severity="error" sx={{ mb: 2 }}>
                            {expandedItems[simulation.id].error}
                          </Alert>
                        ) : expandedItems[simulation.id]?.data ? (
                          <Stack spacing={2}>
                            <Typography variant="subtitle2" color="text.secondary">
                              Simulation Details
                            </Typography>

                            <Stack spacing={1}>
                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Name:</Typography>
                                <Typography variant="body2">{expandedItems[simulation.id].data.sim_name}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Type:</Typography>
                                <Chip
                                  label={expandedItems[simulation.id].data.sim_type}
                                  size="small"
                                  sx={{
                                    bgcolor: '#F5F6FF',
                                    color: '#444CE7',
                                  }}
                                />
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Status:</Typography>
                                <Chip
                                  label={expandedItems[simulation.id].data.status}
                                  size="small"
                                  sx={{
                                    bgcolor: 
                                      expandedItems[simulation.id].data.status === 'Published' ? '#ECFDF3' :
                                      expandedItems[simulation.id].data.status === 'Draft' ? '#F5F6FF' : '#F9FAFB',
                                    color: 
                                      expandedItems[simulation.id].data.status === 'Published' ? '#027A48' :
                                      expandedItems[simulation.id].data.status === 'Draft' ? '#444CE7' : '#344054',
                                  }}
                                />
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Version:</Typography>
                                <Typography variant="body2">v{expandedItems[simulation.id].data.version}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Est. Time:</Typography>
                                <Typography variant="body2">{expandedItems[simulation.id].data.est_time}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Created By:</Typography>
                                <Typography variant="body2">{expandedItems[simulation.id].data.created_by}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Created On:</Typography>
                                <Typography variant="body2">{new Date(expandedItems[simulation.id].data.created_on).toLocaleString()}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Last Modified:</Typography>
                                <Typography variant="body2">{new Date(expandedItems[simulation.id].data.last_modified).toLocaleString()}</Typography>
                              </Stack>

                              <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" color="text.secondary">Tags:</Typography>
                                <Box>
                                  {expandedItems[simulation.id].data.tags && expandedItems[simulation.id].data.tags.map((tag: string, i: number) => (
                                    <Chip
                                      key={i}
                                      label={tag}
                                      size="small"
                                      sx={{
                                        ml: 0.5,
                                        bgcolor: '#F5F6FF',
                                        color: '#444CE7',
                                      }}
                                    />
                                  ))}
                                </Box>
                              </Stack>
                            </Stack>
                          </Stack>
                        ) : null}
                      </Box>
                    </Collapse>
                    {index < simulations.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </>
          )}

          {modules.length === 0 && simulations.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No modules or simulations found in this training plan.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingPlanDetailsDialog;