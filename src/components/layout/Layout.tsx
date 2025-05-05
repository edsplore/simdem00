import React, { useState } from 'react';
import { Stack, Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Stack
      sx={{
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <Stack
        direction="row"
        sx={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 1,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Stack>
  );
};

export default Layout;
