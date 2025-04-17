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
  AlertTitle,
  Link
} from '@mui/material';

// Import custom icon components instead of Material-UI icons
import {
  CheckCircleIcon as CheckCircle,
  ErrorIcon as Error,
  SyncIcon as Sync,
  AccountBalanceIcon as AccountBalance,
  ReceiptIcon as Receipt,
  CloudDownloadIcon as CloudDownload,
  VerifiedUserIcon as VerifiedUser,
  ScheduleIcon as Schedule
} from '../../components/IconProvider';

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
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Check for demo mode parameters in URL
  useEffect(() => {
    console.log('Checking URL parameters for demo mode');
    const params = new URLSearchParams(window.location.search);
    
    // Log all URL parameters for debugging
    console.log('All URL parameters:', Object.fromEntries(params.entries()));
    
    // Handle errors from Xero callback
    if (params.has('error')) {
      const errorType = params.get('error');
      const errorMessage = params.get('message');
      console.error(`Xero error: ${errorType}`, errorMessage);
      
      // Set error state
      let displayMessage = 'An error occurred while connecting to Xero.';
      
      switch (errorType) {
        case 'no_code':
          displayMessage = 'No authorization code was received from Xero.';
          break;
        case 'no_settings':
          displayMessage = 'Application settings are missing. Please contact support.';
          break;
        case 'token_exchange_failed':
          displayMessage = 'Failed to exchange authorization code for tokens.';
          break;
        case 'tenant_fetch_failed':
          displayMessage = 'Failed to retrieve your Xero organization information.';
          break;
        case 'no_tenants':
          displayMessage = 'No Xero organizations connected. Please ensure your Xero account has at least one organization.';
          break;
        case 'server_error':
          displayMessage = `Server error: ${errorMessage || 'Unknown error'}`;
          break;
        default:
          displayMessage = `Connection error: ${errorMessage || errorType || 'Unknown error'}`;
      }
      
      dispatch({ 
        type: 'xero/fetchStatus/rejected', 
        payload: displayMessage
      });
      
      // Clean up error parameters
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('Cleaned URL parameters after handling error');
      }
    }
    
    if (params.has('demo') && params.get('demo') === 'true') {
      console.log('Demo mode activated from URL parameter');
      setIsDemoMode(true);
      
      // Simulate a successful Xero connection in demo mode
      simulateDemoConnection();
      
      // Clean up URL parameters after processing them
      // This prevents issues with refreshing the page and duplicate processing
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('Cleaned URL parameters after processing demo mode');
      }
    }
    
    // Also check for success parameter which might come from a redirect
    if (params.has('success') && params.get('success') === 'true') {
      console.log('Success parameter detected in URL, refreshing status');
      dispatch(fetchXeroStatus());
      
      // Clean up success parameter
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log('Cleaned URL parameters after processing success');
      }
    }
  }, []);

  // Function to simulate a successful Xero connection in demo mode
  const simulateDemoConnection = async () => {
    console.log('Starting demo connection simulation');
    
    // Initialize UI state immediately for better UX
    setSyncStatus('loading');
    setSyncMessage('Establishing demo connection...');
    
    try {
      // First try with the API endpoint
      console.log('Attempting to call demo-connect API endpoint');
      const response = await api.post('/api/xero/demo-connect', {
        demo: true
      });
      
      console.log('API response from demo-connect:', response.data);
      
      if (response.data && response.data.success) {
        // Update local state for immediate UI feedback
        setSyncStatus('success');
        setSyncMessage('Demo connection established successfully');
        setLastSync(new Date().toISOString());
        
        // Refresh the Xero status to show as connected
        dispatch(fetchXeroStatus());
        
        console.log('Successfully simulated Xero connection in demo mode via API');
      } else {
        console.error('API responded but without success flag');
        // Instead of throwing, just handle it like other errors
        fallbackToClientSideSimulation();
      }
    } catch (error) {
      console.error('Error in demo mode connection via API:', error);
      fallbackToClientSideSimulation();
    }
  };

  // Extracted method to handle fallback simulation
  const fallbackToClientSideSimulation = () => {
    console.log('Falling back to client-side simulation');
    // Even if the backend call fails, we can still simulate the connection in the UI
    // This is just for demonstration purposes
    
    // Simulate a successful response without the API
    const mockPayload = {
      isAuthenticated: true,
      tenantId: 'demo-tenant-id',
      tenantName: 'Demo Company Ltd',
      tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };
    
    // Set the mock data in the Redux store
    console.log('Dispatching mock data to Redux:', mockPayload);
    dispatch({ 
      type: 'xero/fetchStatus/fulfilled', 
      payload: mockPayload
    });
    
    // Also update local state to force re-render
    console.log('Updating local state for demo mode');
    setIsDemoMode(true);
    setLastSync(new Date().toISOString());
    setSyncStatus('success');
    setSyncMessage('Demo connection established successfully');
  };

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
    console.log('Connect to Xero button clicked');
    try {
      console.log('Dispatching getXeroAuthUrl action');
      const result = await dispatch(getXeroAuthUrl()).unwrap();
      console.log('Auth URL result:', result);
      
      // Check if we're in demo mode
      if (result && result.isDemoMode) {
        console.log('Demo mode detected. Simulating Xero connection...');
        setIsDemoMode(true);
        window.location.href = result.url;
        return;
      }
      
      if (result && result.url) {
        console.log('Redirecting to Xero auth URL:', result.url);
        // Redirect to Xero for authorization
        window.location.href = result.url;
      } else {
        console.error('No URL returned from getXeroAuthUrl');
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
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
      
      // Type-safe way to handle different error types
      let errorMessage = 'Failed to sync with Xero';
      
      // @ts-ignore
      if (err && typeof err === 'object' && 'message' in err) {
        // @ts-ignore
        errorMessage = err.message;
      }
      
      setSyncMessage(errorMessage);
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

  const renderSetupGuide = () => {
    if (isAuthenticated) {
      return null;
    }

    return (
      <Box sx={{ mt: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Setup Guide
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Before connecting to Xero:</AlertTitle>
          <Typography variant="body2">
            You need to set up a Xero Developer app and configure your environment correctly.
          </Typography>
        </Alert>
        
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Option 1: Use our setup utility (recommended)
          </Typography>
          <Typography variant="body2" paragraph>
            The setup utility guides you through the process of setting up Xero integration:
          </Typography>
          <ol>
            <li>Go to your project directory in the terminal</li>
            <li>Run <code>cd scripts</code></li>
            <li>Run <code>node install-xero-setup.js</code> to install dependencies</li>
            <li>Run <code>node setup-xero.js</code> to start the setup process</li>
            <li>Follow the prompts and complete the authorization</li>
            <li>Restart your application</li>
          </ol>
        </Paper>
        
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Option 2: Manual setup
          </Typography>
          <Typography variant="body2" paragraph>
            If you prefer to set up manually:
          </Typography>
          <ol>
            <li>Create a Xero Developer app at <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer">Xero Developer Portal</a></li>
            <li>Configure the redirect URI to <code>https://reconciler-march.onrender.com/api/xero/callback</code> (or <code>http://localhost:5001/api/xero/callback</code> for local development)</li>
            <li>Create a <code>.env</code> file with your Xero credentials (XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_REDIRECT_URI)</li>
            <li>Restart your application</li>
          </ol>
        </Paper>
      </Box>
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
                  <>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Button clicked directly');
                        handleConnect();
                      }}
                      startIcon={<AccountBalance />}
                      disabled={status === 'loading'}
                      sx={{ mr: 2 }}
                    >
                      Connect to Xero
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('Direct demo button clicked');
                        simulateDemoConnection();
                      }}
                    >
                      Demo Connection
                    </Button>
                  </>
                )}
              </Box>
            </Box>
            
            {/* Render setup guide when not authenticated */}
            {!isAuthenticated && renderSetupGuide()}
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