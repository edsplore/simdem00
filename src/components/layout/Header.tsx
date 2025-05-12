import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Stack,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Box,
  Container,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useAuth } from "../../context/AuthContext";
import { createUser, fetchUserDetails } from "../../services/users";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import ProfileDetailsDialog from "../profile/ProfileDetailsDialog";
import logoImage from "../../assets/logo.svg";

const StyledMenu = styled(Menu)(({ theme }) => ({
  "& .MuiPaper-root": {
    borderRadius: 12,
    marginTop: theme.spacing(1),
    minWidth: 280,
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
  },
}));

const UserInfo = styled(Stack)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

const MenuItem2 = styled(MenuItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  "& .MuiSvgIcon-root": {
    fontSize: 20,
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(2),
  },
}));

interface HeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
}) => {
  const { user, logout, currentWorkspaceId } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const open = Boolean(anchorEl);

  useEffect(() => {
    const loadUserDetails = async () => {
      if (user?.id && currentWorkspaceId) {
        try {
          console.log(
            `Fetching user details for user ${user.id} in workspace ${currentWorkspaceId}`,
          );
          const userDetails = await fetchUserDetails(
            user.id,
            currentWorkspaceId,
          );

          if (userDetails.user.profile_img_url) {
            setProfileImageUrl(userDetails.user.profile_img_url);
          }

          // createUser({ user_id: user.id });
        } catch (error) {
          console.error("Error loading user details:", error);
        }
      }
    };

    loadUserDetails();
  }, [user?.id, currentWorkspaceId]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    handleClose();
    setIsProfileOpen(true);
  };

  return (
    <Stack
      component="header"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        position: "sticky",
        top: 0,
        zIndex: 1100,
      }}
    >
      <Container maxWidth={false}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ height: 64 }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={onToggleSidebar}>
              <MenuOpenIcon
                sx={{
                  transform: isSidebarCollapsed ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
            <Box
              component="img"
              src={logoImage}
              alt="Logo"
              sx={{
                height: 32,
                width: "auto",
              }}
            />
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack
              alignItems="flex-end"
              sx={{
                bgcolor: "rgba(0, 30, 238, 0.04)",
                px: 2,
                py: 1,
                borderRadius: 3,
                fontFamily: "Inter",
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 400,
                  fontFamily: "Inter",
                }}
              >
                {user?.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textTransform: "capitalize",
                  fontFamily: "Inter",
                }}
              >
                {user?.role}
              </Typography>
            </Stack>
            <IconButton
              onClick={handleClick}
              size="small"
              aria-controls={open ? "account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={open ? "true" : undefined}
            >
              <Box sx={{ position: "relative" }}>
                {profileImageUrl ? (
                  <Avatar
                    src={profileImageUrl}
                    sx={{ width: 32, height: 32 }}
                    alt={user?.name || "User"}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: "#F2F4F7",
                      color: "#475467",
                    }}
                  >
                    {user?.name
                      ? user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "?"}
                  </Avatar>
                )}
              </Box>
            </IconButton>
          </Stack>

          <StyledMenu
            id="account-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
          >
            <UserInfo spacing={0.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ position: "relative" }}>
                  {profileImageUrl ? (
                    <Avatar
                      src={profileImageUrl}
                      sx={{ width: 40, height: 40 }}
                      alt={user?.name || "User"}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "#F2F4F7",
                        color: "#475467",
                      }}
                    >
                      {user?.name
                        ? user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "?"}
                    </Avatar>
                  )}
                </Box>
                <Stack spacing={0}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {user?.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "primary.main",
                      bgcolor: "#F5F6FF",
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      display: "inline-block",
                      width: "fit-content",
                    }}
                  >
                    {user?.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {user?.role}
                  </Typography>
                </Stack>
              </Stack>
            </UserInfo>

            <Divider />

            <MenuItem2 onClick={handleOpenProfile}>
              <AccountCircleOutlinedIcon />
              <Typography>My Profile</Typography>
            </MenuItem2>
          </StyledMenu>

          <ProfileDetailsDialog
            open={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            profileImageUrl={profileImageUrl}
            user={user}
          />
        </Stack>
      </Container>
    </Stack>
  );
};

export default Header;
