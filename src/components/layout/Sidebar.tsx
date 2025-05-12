import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Stack,
  Typography,
  Tooltip,
  Divider,
  styled
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  MenuBook as MenuBookIcon,
  PlayCircle as PlayCircleIcon,
  Help as HelpIcon,
  Feedback as FeedbackIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  SmartToy as SmartToyIcon,
  Book as BookIcon,
} from '@mui/icons-material';
import { hasPermission } from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
}

const NavLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&.active': {
    backgroundColor: theme.palette.primary.lighter,
    color: theme.palette.primary.main,
  }
}));

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const location = useLocation();
  const { user, currentWorkspaceId, currentTimeZone } = useAuth();

  // Determine which dashboard the user has access to
  const hasTraineeDashboardAccess = user?.permissions?.["dashboard-trainee"];
  const hasManagerDashboardAccess = user?.permissions?.["dashboard-manager"];
  const hasAdminDashboardAccess = user?.permissions?.["dashboard-admin"];

  // Determine the dashboard path based on permissions
  // Priority: Admin > Manager > Trainee
  const getDashboardPath = () => {
    if (hasAdminDashboardAccess) {
      return '/dashboard'; // Will render AdminDashboard via DashboardRouter
    } else if (hasManagerDashboardAccess) {
      return '/dashboard'; // Will render ManagerDashboard via DashboardRouter
    } else {
      return '/dashboard'; // Will render TraineeDashboard via DashboardRouter
    }
  };

  const isActive = (path: string) => {
    // Special case for dashboard paths
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || 
             location.pathname === '/dashboard-manager' || 
             location.pathname === '/dashboard-admin';
    }
    return location.pathname === path;
  };

  // Append both workspace_id and timeZone to links if available
  const getNavLinkUrl = (path: string) => {
    const params = new URLSearchParams();

    if (currentWorkspaceId) {
      params.set('workspace_id', currentWorkspaceId);
    }

    if (currentTimeZone) {
      params.set('timeZone', currentTimeZone);
    }

    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  };

  // Define all possible nav items
  const allNavItems = [
    { path: getDashboardPath(), icon: BarChartIcon, label: 'Dashboard', permission: hasTraineeDashboardAccess || hasManagerDashboardAccess || hasAdminDashboardAccess ? true : false },
    { path: '/training', icon: MenuBookIcon, label: 'Training Plan', permission: 'training-plan' },
    { path: '/playback', icon: PlayCircleIcon, label: 'Playback', permission: 'playback' },
    { path: '/assign-simulations', icon: AssignmentIcon, label: 'Assign Simulations', permission: 'assign-simulations' },
    { path: '/manage-simulations', icon: SmartToyIcon, label: 'Manage Simulations', permission: 'manage-simulations' },
    { path: '/manage-training-plan', icon: BookIcon, label: 'Manage Training Plan', permission: 'manage-training-plan', divider: true },
    { path: '/settings', icon: SettingsIcon, label: 'Settings', permission: null },
    { path: '/support', icon: HelpIcon, label: 'Help & Support', permission: null },
    { path: '/feedback', icon: FeedbackIcon, label: 'Feedback', permission: null }
  ];

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => {
    // If no permission is required, show the item
    if (!item.permission) return true;

    // If permission is a boolean, use that directly
    if (typeof item.permission === 'boolean') return item.permission;

    // Check if user has the required permission
    return user?.permissions?.[item.permission];
  });

  return (
    <Stack
      sx={{
        width: isCollapsed ? 72 : 256,
        borderRight: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        transition: 'width 0.2s ease',
        height: '100%'
      }}
    >
      <Stack spacing={4} sx={{ py: 2 }}>
        <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
          {navItems.map((item, index) => (
            <React.Fragment key={item.path}>
              <Tooltip
                title={isCollapsed ? item.label : ''}
                placement="right"
              >
                <NavLink
                  to={getNavLinkUrl(item.path)}
                  className={isActive(item.path) ? 'active' : ''}
                  sx={{
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    px: isCollapsed ? 1 : 1.5
                  }}
                >
                  <item.icon sx={{ fontSize: 20 }} />
                  {!isCollapsed && <Typography>{item.label}</Typography>}
                </NavLink>
              </Tooltip>
              {item.divider && (
                <Divider sx={{ my: 2 }} />
              )}
            </React.Fragment>
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
};

export default Sidebar;