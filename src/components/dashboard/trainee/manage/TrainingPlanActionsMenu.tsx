// src/components/dashboard/trainee/manage/TrainingPlanActionsMenu.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, Divider, CircularProgress } from '@mui/material';
import {
  EditOutlined as EditIcon,
  ContentCopyOutlined as DuplicateIcon,
  ArchiveOutlined as ArchiveIcon,
  DeleteOutlined as DeleteIcon,
} from '@mui/icons-material';
import { hasUpdatePermission, hasCreatePermission, hasDeletePermission } from '../../../../utils/permissions';
import { useAuth } from '../../../../context/AuthContext';
import { cloneTrainingPlan } from '../../../../services/trainingPlans';
import { cloneModule } from '../../../../services/modules';

interface TrainingPlanActionsMenuProps {
  anchorEl: HTMLElement | null;
  selectedItem: {
    id: string;
    type: 'module' | 'training-plan';
  } | null;
  onClose: () => void;
  onCloneSuccess?: () => void;
  onEditClick?: (id: string, type: 'module' | 'training-plan') => void;
}

const TrainingPlanActionsMenu: React.FC<TrainingPlanActionsMenuProps> = ({
  anchorEl,
  selectedItem,
  onClose,
  onCloneSuccess,
  onEditClick,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCloning, setIsCloning] = useState(false);

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
        console.log(`${selectedItem.type} cloned successfully:`, response);
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

  const handleArchiveClick = () => {
    if (selectedItem) {
      console.log(`Archive ${selectedItem.type} with ID: ${selectedItem.id}`);
    }
    onClose();
  };

  const handleDeleteClick = () => {
    if (selectedItem) {
      console.log(`Delete ${selectedItem.type} with ID: ${selectedItem.id}`);
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

      {/* {canCreate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canUpdate && (
        <MenuItem
          onClick={handleArchiveClick}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
          <ArchiveIcon sx={{ mr: 1 }} /> Archive
        </MenuItem>
      )}

      {canUpdate && canDelete && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canDelete && (
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px',
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      )} */}
    </Menu>
  );
};

export default TrainingPlanActionsMenu;