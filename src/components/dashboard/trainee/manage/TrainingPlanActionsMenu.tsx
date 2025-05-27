// src/components/dashboard/trainee/manage/TrainingPlanActionsMenu.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, Divider, CircularProgress } from '@mui/material';
import {
  EditOutlined as EditIcon,
  ContentCopyOutlined as DuplicateIcon,
  ArchiveOutlined as ArchiveIcon,
  UnarchiveOutlined as UnarchiveIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material';
import { hasUpdatePermission, hasCreatePermission, hasDeletePermission } from '../../../../utils/permissions';
import { useAuth } from '../../../../context/AuthContext';
import {
  cloneTrainingPlan,
  archiveTrainingPlan,
  unarchiveTrainingPlan,
} from '../../../../services/trainingPlans';
import {
  cloneModule,
  archiveModule,
  unarchiveModule,
} from '../../../../services/modules';

interface TrainingPlanActionsMenuProps {
  anchorEl: HTMLElement | null;
  selectedItem: {
    id: string;
    type: 'module' | 'training-plan';
    status?: string;
  } | null;
  onClose: () => void;
  onCloneSuccess?: () => void;
  onEditClick?: (id: string, type: 'module' | 'training-plan') => void;
  onArchiveSuccess?: () => void;
  onUnarchiveSuccess?: () => void;
}

const TrainingPlanActionsMenu: React.FC<TrainingPlanActionsMenuProps> = ({
  anchorEl,
  selectedItem,
  onClose,
  onCloneSuccess,
  onEditClick,
  onArchiveSuccess,
  onUnarchiveSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCloning, setIsCloning] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  // Check permissions for different actions
  const canUpdate = hasUpdatePermission('manage-training-plan');
  const canCreate = hasCreatePermission('manage-training-plan');
  const canDelete = hasDeletePermission('manage-training-plan');

  const handleEditClick = () => {
    if (selectedItem && onEditClick) {
      onEditClick(selectedItem.id, selectedItem.type);
    }
    onClose();
  };

  const handleDuplicateClick = async () => {
    if (!selectedItem || !user?.id) {
      onClose();
      return;
    }

    setIsCloning(true);

    try {
      let response;

      if (selectedItem.type === 'module') {
        // Use the cloneModule function from modules.ts
        response = await cloneModule(user.id, selectedItem.id);
      } else {
        // Use the cloneTrainingPlan function from trainingPlans.ts
        response = await cloneTrainingPlan(user.id, selectedItem.id);
      }

      if (response && response.status === 'success') {
        // Call the success callback to refresh the list
        if (onCloneSuccess) {
          onCloneSuccess();
        }
      } else {
        console.error(`Failed to clone ${selectedItem.type}:`, response);
      }
    } catch (error) {
      console.error(`Error cloning ${selectedItem.type}:`, error);
    } finally {
      setIsCloning(false);
      onClose();
    }
  };

  const handleArchiveClick = async () => {
    if (!selectedItem || !user?.id) {
      onClose();
      return;
    }

    setIsArchiving(true);

    try {
      let response;
      if (selectedItem.type === 'module') {
        response = await archiveModule(user.id, selectedItem.id);
      } else {
        response = await archiveTrainingPlan(user.id, selectedItem.id);
      }

      if (response && (response.status === 'success' || response.status === 'archived')) {
        if (onArchiveSuccess) {
          onArchiveSuccess();
        }
      } else {
        console.error('Failed to archive', selectedItem.type, response);
      }
    } catch (error) {
      console.error('Error archiving', selectedItem.type, error);
    } finally {
      setIsArchiving(false);
      onClose();
    }
  };

  const handleUnarchiveClick = async () => {
    if (!selectedItem || selectedItem.status !== 'archived' || !user?.id) {
      onClose();
      return;
    }

    setIsUnarchiving(true);

    try {
      let response;
      if (selectedItem.type === 'module') {
        response = await unarchiveModule(user.id, selectedItem.id);
      } else {
        response = await unarchiveTrainingPlan(user.id, selectedItem.id);
      }

      if (response && (response.status === 'success' || response.status === 'unarchived')) {
        if (onUnarchiveSuccess) {
          onUnarchiveSuccess();
        }
      } else {
        console.error('Failed to unarchive', selectedItem.type, response);
      }
    } catch (error) {
      console.error('Error unarchiving', selectedItem.type, error);
    } finally {
      setIsUnarchiving(false);
      onClose();
    }
  };

  const handleDeleteClick = () => {
    if (selectedItem) {
    }
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        '& .MuiPaper-root': {
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #E0E0E0',
          minWidth: '100px',
        },
      }}
    >
      {canUpdate && (
        <MenuItem
          onClick={handleEditClick}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
      )}

      {canUpdate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canCreate && (
        <MenuItem
          onClick={handleDuplicateClick}
          disabled={isCloning}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
      {isCloning ? (
        <CircularProgress size={16} sx={{ mr: 1 }} />
      ) : (
        <DuplicateIcon sx={{ mr: 1 }} />
      )}
      {isCloning ? 'Cloning...' : 'Duplicate'}
      </MenuItem>
      )}

      {canCreate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canUpdate && selectedItem?.status !== 'archived' && (
        <MenuItem
          onClick={handleArchiveClick}
          disabled={isArchiving}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
          {isArchiving ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <ArchiveIcon sx={{ mr: 1 }} />
          )}
          {isArchiving ? 'Archiving...' : 'Archive'}
        </MenuItem>
      )}

      {canUpdate && selectedItem?.status === 'archived' && (
        <MenuItem
          onClick={handleUnarchiveClick}
          disabled={isUnarchiving}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
          {isUnarchiving ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <UnarchiveIcon sx={{ mr: 1 }} />
          )}
          {isUnarchiving ? 'Unarchiving...' : 'Unarchive'}
        </MenuItem>
      )}
    </Menu>
  );
};

export default TrainingPlanActionsMenu;
