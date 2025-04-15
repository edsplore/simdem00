import React from 'react';
import { Box, Typography, Paper, Button, Container } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

const Unauthorized = () => {
  const handleGoToLogin = () => {
    window.location.href = 'https://eu2ccapsal001.eastus2.cloudapp.azure.com';
  };

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 3
        }}
      >
        <Box 
          sx={{ 
            width: 80, 
            height: 80, 
            borderRadius: '50%', 
            bgcolor: '#FEF3F2', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mb: 3
          }}
        >
          <BlockIcon sx={{ fontSize: 40, color: '#D92D20' }} />
        </Box>

        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Access Denied
        </Typography>

        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          You don't have permission to access this page or your session has expired.
        </Typography>

        <Button 
          variant="contained" 
          onClick={handleGoToLogin}
          sx={{ 
            bgcolor: '#444CE7',
            '&:hover': { bgcolor: '#3538CD' },
            borderRadius: 2,
            px: 4,
            py: 1
          }}
        >
          Go to Login
        </Button>
      </Paper>
    </Container>
  );
};

export default Unauthorized;