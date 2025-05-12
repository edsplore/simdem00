import React from 'react';
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
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Book as BookIcon,
  SmartToy as SimulationIcon,
} from '@mui/icons-material';
import { Module } from '../../../../services/modules';

interface ModuleDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  module: Module | null;
  moduleDetails?: any;
  isLoading?: boolean;
}

const ModuleDetailsDialog: React.FC<ModuleDetailsDialogProps> = ({
  open,
  onClose,
  module,
  moduleDetails,
  isLoading = false,
}) => {
  if (!module) return null;

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
              {module.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Module Details
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
            {/* Simulations Section */}
            {moduleDetails && moduleDetails.simulations_id && moduleDetails.simulations_id.length > 0 ? (
              <>
                <Typography variant="h6">
                  Simulations ({moduleDetails.simulations_id.length})
                </Typography>
                <List
                  sx={{
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {moduleDetails.simulations_id.map((simulation: any, index: number) => (
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
                      {index < moduleDetails.simulations_id.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No simulations found in this module.
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModuleDetailsDialog;
