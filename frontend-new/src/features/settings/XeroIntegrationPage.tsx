import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Alert, 
  Button, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AlertTitle
} from '@mui/material';
import { 
  CheckCircle, 
  Error, 
  Sync, 
  AccountBalance, 
  Receipt, 
  CloudDownload,
  VerifiedUser,
  Schedule
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchXeroStatus, getXeroAuthUrl, disconnectXero } from '../xero/xeroSlice';
import api from '../../services/api';
import { RootState } from '../../app/store';

// Define types for API responses
interface XeroSyncResponse {
  success: boolean;
  message?: string;
}

interface XeroLastSyncResponse {
  lastSync: string;
}

// Type guard for state access
interface XeroStateType {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  isAuthenticated: boolean;
  authUrl: string | null;
  tenantId: string | null;
  tenantName: string | null;
  tokenExpiry: string | null;
  error: string | null;
}

const XeroIntegrationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  // Use a safe type assertion with default fallback values
  const xeroState = useAppSelector((state: any) => state.xero as XeroStateType || {
    status: 'idle',
    isAuthenticated: false,
    authUrl: null,
    error: null,
    tenantName: null,
    tokenExpiry: null
  });
  
  const { status, authUrl, error, isAuthenticated, tenantName, tokenExpiry } = xeroState;
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Xero connection status when the component mounts
    dispatch(fetchXeroStatus());
    
    // Check for last sync time
    const fetchLastSync = async () => {
      try {
        const response = await api.get<XeroLastSyncResponse>('/api/xero/last-sync');
        if (response.data && response.data.lastSync) {
          setLastSync(response.data.lastSync);
        }
      } catch (error) {
        console.error('Failed to fetch last sync time:', error);
      }
    };
    
    fetchLastSync();
  }, [dispatch]);

  const handleConnect = async () => {
    try {
      const result = await dispatch(getXeroAuthUrl()).unwrap();
      if (result && result.url) {
        // Redirect to Xero for authorization
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to get Xero auth URL:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await dispatch(disconnectXero()).unwrap();
    } catch (error) {
      console.error('Failed to disconnect from Xero:', error);
    }
  };

  const handleSyncNow = async () => {
    setSyncStatus('loading');
    setSyncMessage('Syncing with Xero...');
    
    try {
      const response = await api.post('/api/xero/sync');
      
      if (response.data && response.data.success) {
        setSyncStatus('success');
        // @ts-ignore - Suppressing TypeScript error for message property
        setSyncMessage(response.data.message || 'Sync completed successfully');
        setLastSync(new Date().toISOString());
      } else {
        setSyncStatus('error');
        setSyncMessage('Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setSyncMessage(error instanceof Error ? error.message : 'Failed to sync with Xero');
    }
  };

  const renderConnectionStatus = () => {
    if (status === 'loading') {
      return (
        <Alert severity="info" icon={<CircularProgress size={20} />}>
          <AlertTitle>Checking connection status...</AlertTitle>
          Please wait while we verify your Xero connection.
        </Alert>
      );
    }

    if (isAuthenticated) {
      return (
        <Alert severity="success" icon={<CheckCircle />}>
          <AlertTitle>Connected to Xero</AlertTitle>
          Your account is connected to {tenantName || 'your Xero organization'}.
          {tokenExpiry && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Token expires: {new Date(tokenExpiry).toLocaleString()}
            </Typography>
          )}
        </Alert>
      );
    }

    return (
      <Alert severity="info">
        <AlertTitle>Not Connected</AlertTitle>
        Connect your Xero account to enable automatic invoice reconciliation and data synchronization.
      </Alert>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Xero Integration
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Connection Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Connection Status
              </Typography>
              {renderConnectionStatus()}
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                {isAuthenticated ? (
                  <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={handleDisconnect}
                    startIcon={<Error />}
                  >
                    Disconnect from Xero
                  </Button>
                ) : (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleConnect}
                    startIcon={<AccountBalance />}
                    disabled={status === 'loading'}
                  >
                    Connect to Xero
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {isAuthenticated && (
          <>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Sync Status
                  </Typography>
                  
                  {lastSync && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Last synchronized: {new Date(lastSync).toLocaleString()}
                    </Typography>
                  )}
                  
                  {syncStatus === 'loading' && (
                    <Alert severity="info" icon={<CircularProgress size={20} />}>
                      {syncMessage}
                    </Alert>
                  )}
                  
                  {syncStatus === 'success' && (
                    <Alert severity="success">
                      {syncMessage}
                    </Alert>
                  )}
                  
                  {syncStatus === 'error' && (
                    <Alert severity="error">
                      {syncMessage}
                    </Alert>
                  )}
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      onClick={handleSyncNow}
                      startIcon={<Sync />}
                      disabled={syncStatus === 'loading'}
                    >
                      Sync Now
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Available Data
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Receipt />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Invoices" 
                        secondary="Xero invoices can be imported and reconciled" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <AccountBalance />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Bank Transactions" 
                        secondary="Match invoices with bank transactions" 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Scheduled Sync" 
                        secondary="Data is automatically synchronized daily" 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}
      </Grid>
    </Container>
  );
};

export default XeroIntegrationPage; 