import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  AlertTitle,
  Grid,
  Paper,
} from '@mui/material';
import {
  connectToXero,
  fetchXeroStatus,
  selectXero,
  disconnectXero,
} from '../xero/xeroSlice';
import { AppDispatch } from '../../app/store';
import { useLocation } from 'react-router-dom';
import CustomIcon from '../../components/CustomIcon';

const XeroIntegrationPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const xeroState = useSelector(selectXero);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const location = useLocation();

  useEffect(() => {
    dispatch(fetchXeroStatus());
  }, [dispatch]);

  useEffect(() => {
    // Check URL parameters when component mounts
    const params = new URLSearchParams(location.search);
    console.log('Checking URL parameters:', Object.fromEntries(params.entries()));
    
    // Handle demo mode
    if (params.get('demo') === 'true') {
      console.log('Demo mode activated via URL parameter');
      localStorage.setItem('demoMode', 'true');
    }
    
    // Handle success or error parameter for status feedback
    if (params.get('success') === 'true') {
      setStatusMessage('Successfully connected to Xero!');
      // Refresh Xero status
      dispatch(fetchXeroStatus());
    } else if (params.get('error')) {
      const errorType = params.get('error');
      let errorMessage = 'Failed to connect to Xero';
      
      switch (errorType) {
        case 'no_code':
          errorMessage = 'No authorization code received from Xero';
          break;
        case 'token_exchange_failed':
          errorMessage = 'Failed to exchange authorization code for tokens';
          break;
        case 'tenant_fetch_failed':
          errorMessage = 'Failed to fetch Xero organization details';
          break;
        case 'no_tenants':
          errorMessage = 'No Xero organizations were found linked to your account';
          break;
        case 'unauthorized_client':
          errorMessage = 'The Xero app is not properly configured. Please contact support.';
          break;
        default:
          errorMessage = `Connection to Xero failed: ${errorType}`;
      }
      
      setStatusMessage(errorMessage);
    }
  }, [location, dispatch]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const resultAction = await dispatch(connectToXero());
      if (connectToXero.fulfilled.match(resultAction)) {
        const authUrl = resultAction.payload.authorizationUrl;
        console.log('Redirecting to Xero:', authUrl);
        window.location.href = authUrl;
      } else {
        setStatusMessage('Failed to start Xero connection process');
        console.error('Connection error:', resultAction.error);
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error);
      setStatusMessage('Error connecting to Xero');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await dispatch(disconnectXero());
      setStatusMessage('Successfully disconnected from Xero');
    } catch (error) {
      console.error('Error disconnecting Xero:', error);
      setStatusMessage('Error disconnecting Xero');
    }
  };

  const renderConnectionStatus = () => {
    if (xeroState.loading) {
      return (
        <Box display="flex" alignItems="center">
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography>Checking connection status...</Typography>
        </Box>
      );
    }

    if (xeroState.connected) {
      return (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="success" sx={{ mb: 3 }}>
              <AlertTitle>Connected to Xero</AlertTitle>
              Your Reconciler account is now linked to your Xero organization{' '}
              <strong>{xeroState.tenantName || 'Unknown'}</strong>
            </Alert>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomIcon iconName="DescriptionOutlined" sx={{ mr: 1 }} /> 
                Connection Details
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Organization:</strong> {xeroState.tenantName}
                </Typography>
                <Typography variant="body2">
                  <strong>Connected:</strong> {new Date(xeroState.lastSync).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> Active
                </Typography>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomIcon iconName="SyncOutlined" sx={{ mr: 1 }} />
                Sync Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Last Sync:</strong> {xeroState.lastSync ? new Date(xeroState.lastSync).toLocaleString() : 'Never'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Next Sync:</strong> Automatic with new invoices
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => dispatch(fetchXeroStatus())}
                >
                  Refresh Status
                </Button>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                startIcon={<CustomIcon iconName="LinkOffOutlined" />}
              >
                Disconnect from Xero
              </Button>
            </Box>
          </Grid>
        </Grid>
      );
    }

    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Not Connected</AlertTitle>
          Connect your Reconciler account to Xero to automatically sync invoices and payments.
        </Alert>
        
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomIcon iconName="InfoOutlined" sx={{ mr: 1 }} />
            How It Works
          </Typography>
          <Typography variant="body2" paragraph>
            When you connect to Xero, you'll be redirected to Xero's website to authorize access. 
            Once authorized, we'll be able to:
          </Typography>
          <ul>
            <li>
              <Typography variant="body2">Import your invoices and bills from Xero</Typography>
            </li>
            <li>
              <Typography variant="body2">Sync payment status between systems</Typography>
            </li>
            <li>
              <Typography variant="body2">Update invoice classifications</Typography>
            </li>
          </ul>
          <Typography variant="body2" sx={{ mt: 2 }}>
            You can disconnect at any time from this page.
          </Typography>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnect}
            disabled={isConnecting}
            startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <CustomIcon iconName="LinkOutlined" />}
            size="large"
            sx={{ px: 4, py: 1 }}
          >
            {isConnecting ? 'Connecting...' : 'Connect to Xero'}
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Xero Integration
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect your account to Xero for automatic invoice syncing
          </Typography>
        </Box>

        {statusMessage && (
          <Alert 
            severity={statusMessage.includes('Success') ? 'success' : 'error'} 
            sx={{ mb: 3 }}
            onClose={() => setStatusMessage(null)}
          >
            {statusMessage}
          </Alert>
        )}

        {renderConnectionStatus()}
      </CardContent>
    </Card>
  );
};

export default XeroIntegrationPage; 