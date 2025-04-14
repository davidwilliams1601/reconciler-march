import React from 'react';
import { Container, Typography, Paper, Box, Alert } from '@mui/material';

const XeroIntegrationPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Xero Integration
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        Xero integration has been temporarily removed and will be reimplemented in a future update.
      </Alert>
      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            About Xero Integration
          </Typography>
          <Typography variant="body1">
            The Xero integration allows you to:
          </Typography>
          <ul>
            <li>Connect your Xero account to the invoice reconciler</li>
            <li>Import invoices from Xero</li>
            <li>Match bank transactions with invoices</li>
            <li>Automate reconciliation between systems</li>
          </ul>
        </Box>
        
        <Box>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body1">
            We're working on a new and improved Xero integration that will provide:
          </Typography>
          <ul>
            <li>Simplified authentication</li>
            <li>Better error handling</li>
            <li>Improved sync performance</li>
            <li>More detailed transaction matching</li>
          </ul>
        </Box>
      </Paper>
    </Container>
  );
};

export default XeroIntegrationPage; 