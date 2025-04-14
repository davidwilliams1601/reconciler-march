import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Box, 
  Alert, 
  CircularProgress, 
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Lock, LockOpen } from '@mui/icons-material';
import api from '../../services/api';

const XeroIntegrationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xeroStatus, setXeroStatus] = useState<{
    isConnected: boolean;
    tokenExpiry?: string;
    tenantName?: string;
  }>({
    isConnected: false
  });
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  useEffect(() => {
    checkXeroStatus();
  }, []);

  const checkXeroStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/xero/status');
      setXeroStatus({
        isConnected: response.data.connected,
        tokenExpiry: response.data.tokenExpiry,
        tenantName: response.data.tenantName
      });
    } catch (err) {
      console.error('Failed to check Xero status:', err);
      setError('Failed to check Xero connection status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAuthUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/xero/auth-url');
      setAuthUrl(response.data.auth_url);
    } catch (err) {
      console.error('Failed to get Xero auth URL:', err);
      setError('Failed to get Xero authorization URL. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectXero = () => {
    if (!authUrl) {
      getAuthUrl();
      return;
    }
    
    // Open Xero authorization page in a new window
    window.open(authUrl, '_blank');
  };

  const disconnectXero = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/xero/disconnect');
      setXeroStatus({
        isConnected: false
      });
      setAuthUrl(null);
    } catch (err) {
      console.error('Failed to disconnect from Xero:', err);
      setError('Failed to disconnect from Xero. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/xero/refresh-token');
      await checkXeroStatus();
    } catch (err) {
      console.error('Failed to refresh Xero connection:', err);
      setError('Failed to refresh Xero connection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Xero Integration
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Card variant="outlined" sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Connection Status
            </Typography>
            <Chip 
              icon={xeroStatus.isConnected ? <CheckCircle /> : <ErrorIcon />}
              label={xeroStatus.isConnected ? 'Connected' : 'Not Connected'}
              color={xeroStatus.isConnected ? 'success' : 'error'}
              variant="outlined"
            />
          </Box>
          
          {xeroStatus.isConnected && (
            <List>
              {xeroStatus.tenantName && (
                <ListItem>
                  <ListItemText 
                    primary="Connected Organization" 
                    secondary={xeroStatus.tenantName} 
                  />
                </ListItem>
              )}
              {xeroStatus.tokenExpiry && (
                <ListItem>
                  <ListItemText 
                    primary="Token Expires" 
                    secondary={new Date(xeroStatus.tokenExpiry).toLocaleString()} 
                  />
                </ListItem>
              )}
            </List>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            {!xeroStatus.isConnected ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<LockOpen />}
                onClick={handleConnectXero}
                disabled={loading}
              >
                Connect to Xero
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={refreshConnection}
                  disabled={loading}
                >
                  Refresh Connection
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Lock />}
                  onClick={disconnectXero}
                  disabled={loading}
                >
                  Disconnect
                </Button>
              </>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {xeroStatus.isConnected && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Invoice Sync
              </Typography>
              <Typography variant="body2" paragraph>
                Sync invoices between your system and Xero. This allows you to reconcile
                invoices with bank transactions automatically.
              </Typography>
              <Button 
                variant="contained" 
                color="secondary"
                fullWidth
                onClick={() => window.location.href = '/reconciliation'}
              >
                Go to Reconciliation
              </Button>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Last Sync Status
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Automatic sync runs every hour
              </Alert>
              <Button 
                variant="outlined" 
                color="primary"
                fullWidth
              >
                Sync Now
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default XeroIntegrationPage; 