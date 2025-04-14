import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, MenuItem, Divider } from '@mui/material';
import {
  EditOutlined as EditIcon,
  ContentCopyOutlined as DuplicateIcon,
  DownloadOutlined as DownloadIcon,
  LockOutlined as LockIcon,
  ArchiveOutlined as ArchiveIcon,
  DeleteOutlined as DeleteIcon,
  LockOpenOutlined as UnlockIcon,
} from '@mui/icons-material';
import { SimulationData } from './types';
import { hasUpdatePermission, hasCreatePermission, hasDeletePermission } from '../../../../utils/permissions';

interface ActionsMenuProps {
  anchorEl: HTMLElement | null;
  selectedRow: SimulationData | null;
  onClose: () => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  anchorEl,
  selectedRow,
  onClose,
}) => {
  const navigate = useNavigate();

  // Check permissions for different actions
  const canUpdate = hasUpdatePermission('manage-simulations');
  const canCreate = hasCreatePermission('manage-simulations');
  const canDelete = hasDeletePermission('manage-simulations');

  const handleEditClick = () => {
    if (selectedRow) {
      navigate(`/generate-scripts/${selectedRow.id}`);
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
          backgroundColor: '#FFFFFF', // Background color
          borderRadius: '8px', // Border radius for curved edges
          border: '1px solid #E0E0E0', // Light border around menu
          minWidth: '100px', // Small box size for menu
        },
      }}
    >
      {canUpdate && (
        <MenuItem
          onClick={handleEditClick}
          sx={{
            color: '#666666', // Text color
            '& svg': {
              color: '#EBEBEB', // Icon color updated to #EBEBEB
            },
            padding: '1px 8px', // Reduced padding for smaller spacing
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
      )}

      {canUpdate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canCreate && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px', // Reduced padding for smaller spacing
          }}
        >
          <DuplicateIcon sx={{ mr: 1 }} /> Duplicate
        </MenuItem>
      )}

      {canCreate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      <MenuItem
        onClick={onClose}
        sx={{
          color: '#666666',
          '& svg': {
            color: '#EBEBEB',
          },
          padding: '1px 8px', // Reduced padding for smaller spacing
        }}
      >
        <DownloadIcon sx={{ mr: 1 }} /> Download Script
      </MenuItem>

      <Divider sx={{ borderColor: '#EBEBEB' }} />

      {canUpdate && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px', // Reduced padding for smaller spacing
          }}
        >
          {selectedRow?.isLocked ? (
            <>
              <UnlockIcon sx={{ mr: 1 }} /> Unlock
            </>
          ) : (
            <>
              <LockIcon sx={{ mr: 1 }} /> Lock
            </>
          )}
        </MenuItem>
      )}

      {canUpdate && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canUpdate && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px', // Reduced padding for smaller spacing
          }}
        >
          <ArchiveIcon sx={{ mr: 1 }} /> Archive
        </MenuItem>
      )}

      {canUpdate && canDelete && <Divider sx={{ borderColor: '#EBEBEB' }} />}

      {canDelete && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: '#666666',
            '& svg': {
              color: '#EBEBEB',
            },
            padding: '1px 8px', // Reduced padding for smaller spacing
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      )}
    </Menu>
  );
};

export default ActionsMenu;