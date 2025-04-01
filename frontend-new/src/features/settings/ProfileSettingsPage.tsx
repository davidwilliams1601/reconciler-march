import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ProfileSettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="body1" paragraph>
          Profile settings functionality will be implemented later.
        </Typography>
      </Box>
    </Container>
  );
};

export default ProfileSettingsPage; 