import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MenuItem, Divider, CircularProgress } from "@mui/material";
import {
  EditOutlined as EditIcon,
  ContentCopyOutlined as DuplicateIcon,
  DownloadOutlined as DownloadIcon,
  LockOutlined as LockIcon,
  ArchiveOutlined as ArchiveIcon,
  DeleteOutlined as DeleteIcon,
  LockOpenOutlined as UnlockIcon,
} from "@mui/icons-material";
import { SimulationData } from "./types";
import {
  hasUpdatePermission,
  hasCreatePermission,
  hasDeletePermission,
} from "../../../../utils/permissions";
import {
  cloneSimulation,
  archiveSimulation,
} from "../../../../services/simulation_operations";
import { useAuth } from "../../../../context/AuthContext";
import { buildPathWithWorkspace } from "../../../../utils/navigation";

interface ActionsMenuProps {
  anchorEl: HTMLElement | null;
  selectedRow: SimulationData | null;
  onClose: () => void;
  onCloneSuccess?: () => void;
  onArchiveSuccess?: () => void;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
  anchorEl,
  selectedRow,
  onClose,
  onCloneSuccess,
  onArchiveSuccess,
}) => {
  const navigate = useNavigate();
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();
  const [isCloning, setIsCloning] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Check permissions for different actions
  const canUpdate = hasUpdatePermission("manage-simulations");
  const canCreate = hasCreatePermission("manage-simulations");
  const canDelete = hasDeletePermission("manage-simulations");

  const handleEditClick = () => {
    if (selectedRow) {
      navigate(
        buildPathWithWorkspace(
          `/generate-scripts/${selectedRow.id}`,
          currentWorkspaceId,
          currentTimeZone
        )
      );
    }
    onClose();
  };

  const handleDuplicateClick = async () => {
    if (!selectedRow || !user?.id) {
      onClose();
      return;
    }

    setIsCloning(true);

    try {
      const response = await cloneSimulation(user.id, selectedRow.id);

      if (response && response.status === "success") {
        console.log("Simulation cloned successfully:", response);
        // Call the success callback to refresh the simulations list
        if (onCloneSuccess) {
          onCloneSuccess();
        }
      } else {
        console.error("Failed to clone simulation:", response);
      }
    } catch (error) {
      console.error("Error cloning simulation:", error);
    } finally {
      setIsCloning(false);
      onClose();
    }
  };

  const handleArchiveClick = async () => {
    if (!selectedRow || !user?.id) {
      onClose();
      return;
    }

    setIsArchiving(true);

    try {
      const response = await archiveSimulation(user.id, selectedRow.id);

      if (response && response.status === 'archived') {
        console.log('Simulation archived successfully:', response);
        if (onArchiveSuccess) {
          onArchiveSuccess();
        }
      } else {
        console.error('Failed to archive simulation:', response);
      }
    } catch (error) {
      console.error('Error archiving simulation:', error);
    } finally {
      setIsArchiving(false);
      onClose();
    }
  };
  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      sx={{
        "& .MuiPaper-root": {
          backgroundColor: "#FFFFFF", // Background color
          borderRadius: "8px", // Border radius for curved edges
          border: "1px solid #E0E0E0", // Light border around menu
          minWidth: "100px", // Small box size for menu
        },
      }}
    >
      {canUpdate && (
        <MenuItem
          onClick={handleEditClick}
          sx={{
            color: "#666666", // Text color
            "& svg": {
              color: "#EBEBEB", // Icon color updated to #EBEBEB
            },
            padding: "1px 8px", // Reduced padding for smaller spacing
          }}
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
      )}

      {canUpdate && <Divider sx={{ borderColor: "#EBEBEB" }} />}

      {canCreate && (
        <MenuItem
          onClick={handleDuplicateClick}
          disabled={isCloning}
          sx={{
            color: "#666666",
            "& svg": {
              color: "#EBEBEB",
            },
            padding: "1px 8px", // Reduced padding for smaller spacing
          }}
        >
          {isCloning ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <DuplicateIcon sx={{ mr: 1 }} />
          )}
          {isCloning ? "Cloning..." : "Duplicate"}
        </MenuItem>
      )}

      {canCreate && <Divider sx={{ borderColor: "#EBEBEB" }} />}

      {/* <MenuItem
        onClick={onClose}
        sx={{
          color: "#666666",
          "& svg": {
            color: "#EBEBEB",
          },
          padding: "1px 8px", // Reduced padding for smaller spacing
        }}
      >
        <DownloadIcon sx={{ mr: 1 }} /> Download Script
      </MenuItem>

      <Divider sx={{ borderColor: "#EBEBEB" }} />

      {canUpdate && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: "#666666",
            "& svg": {
              color: "#EBEBEB",
            },
            padding: "1px 8px", // Reduced padding for smaller spacing
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

      {canUpdate && <Divider sx={{ borderColor: "#EBEBEB" }} />}
*/}

      {canUpdate && (
        <MenuItem
          onClick={handleArchiveClick}
          disabled={isArchiving}
          sx={{
            color: "#666666",
            "& svg": {
              color: "#EBEBEB",
            },
            padding: "1px 8px", // Reduced padding for smaller spacing
          }}
        >
          {isArchiving ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : (
            <ArchiveIcon sx={{ mr: 1 }} />
          )}
          {isArchiving ? "Archiving..." : "Archive"}
        </MenuItem>
      )}

      {/*
      {canUpdate && canDelete && <Divider sx={{ borderColor: "#EBEBEB" }} />}

      {canDelete && (
        <MenuItem
          onClick={onClose}
          sx={{
            color: "#666666",
            "& svg": {
              color: "#EBEBEB",
            },
            padding: "1px 8px", // Reduced padding for smaller spacing
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
        )}
      */}
    </Menu>
  );
};

export default ActionsMenu;
