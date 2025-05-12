import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  SmartToy as SimulationIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { TrainingPlan } from '../../../../services/trainingPlans';

interface TrainingPlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  trainingPlan: TrainingPlan | null;
  trainingPlanDetails?: any;
  isLoading?: boolean;
}

const TrainingPlanDetailsDialog: React.FC<TrainingPlanDetailsDialogProps> = ({
  open,
  onClose,
  trainingPlan,
  trainingPlanDetails,
  isLoading = false,
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  if (!trainingPlan) return null;

  // Process the added objects from the training plan details
  const processAddedObjects = () => {
    if (!trainingPlanDetails || !trainingPlanDetails.added_object) {
      return { modules: [], simulations: [] };
    }

    const modules = [];
    const simulations = [];

    for (const item of trainingPlanDetails.added_object) {
      if (item.type === 'module') {
        modules.push(item);
      } else if (item.type === 'simulation') {
        simulations.push(item);
      }
    }

    return { modules, simulations };
  };

  const { modules, simulations } = processAddedObjects();

  const handleToggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const isModuleExpanded = (moduleId: string) => {
    return expandedModules[moduleId] || false;
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
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
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
                        onClick={() => handleToggleModule(module.id)}
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
                          primary={module.name}
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
                          {isModuleExpanded(module.id) ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </Stack>
                      </ListItem>

                      <Collapse in={isModuleExpanded(module.id)} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, pl: 9, bgcolor: '#F9FAFB' }}>
                          {module.simulations && module.simulations.length > 0 ? (
                            <>
                              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                Simulations in this Module ({module.simulations.length})
                              </Typography>
                              <List disablePadding>
                                {module.simulations.map((sim, simIndex) => (
                                  <ListItem key={sim.id} disablePadding sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <SimulationIcon fontSize="small" sx={{ color: '#444CE7' }} />
                                    </ListItemIcon>
                                    <ListItemText 
                                      primary={sim.name}
                                      primaryTypographyProps={{ variant: 'body2' }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No simulations in this module
                            </Typography>
                          )}
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
                        sx={{ 
                          cursor: 'default',
                          py: 1.5
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
                          primary={simulation.name}
                        />
                        <Chip
                          label="Simulation"
                          size="small"
                          sx={{
                            bgcolor: '#F5F6FF',
                            color: '#444CE7',
                          }}
                        />
                      </ListItem>
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrainingPlanDetailsDialog;
