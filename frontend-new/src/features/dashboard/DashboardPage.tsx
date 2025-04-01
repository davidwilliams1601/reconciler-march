import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const DashboardPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Invoice Reconciler
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" paragraph>
          This is a temporary welcome page. The full dashboard functionality will be implemented later.
        </Typography>
      </Box>
    </Container>
  );
};

export default DashboardPage; 