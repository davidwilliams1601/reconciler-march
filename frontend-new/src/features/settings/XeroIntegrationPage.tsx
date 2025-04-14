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
  Chip,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Lock, LockOpen, OpenInNew } from '@mui/icons-material';
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
  
  // Developer setup mode
  const [devMode, setDevMode] = useState(false);
  const [showDevSetupDialog, setShowDevSetupDialog] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const devSteps = [
    'Get Xero Developer Account', 
    'Create an Application', 
    'Configure API Keys',
    'Connect Application'
  ];

  useEffect(() => {
    checkXeroStatus();
    // Set default redirect URI based on current hostname
    const baseUrl = window.location.origin;
    setRedirectUri(`${baseUrl}/xero-callback`);
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

  const handleSaveApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.post('/api/settings', {
        xeroClientId: clientId,
        xeroClientSecret: clientSecret,
        xeroRedirectUri: redirectUri
      });
      
      // Move to next step
      setActiveStep(3);
      // Close the dialog
      setShowDevSetupDialog(false);
      // Generate auth URL for connection
      await getAuthUrl();
      
    } catch (err) {
      console.error('Failed to save API keys:', err);
      setError('Failed to save API keys. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, devSteps.length - 1));
  };

  const handleBackStep = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const renderDeveloperSetup = () => (
    <Card variant="outlined" sx={{ mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Developer Setup
          </Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={() => setShowDevSetupDialog(true)}
            startIcon={<OpenInNew />}
          >
            Configure API Keys
          </Button>
        </Box>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {devSteps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {activeStep === 0 && (
          <Box>
            <Typography paragraph>
              First, you need a Xero Developer account to create applications and get API keys.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              startIcon={<OpenInNew />}
              onClick={() => window.open('https://developer.xero.com/app/manage/', '_blank')}
              sx={{ mr: 2 }}
            >
              Xero Developer Portal
            </Button>
            <Button variant="outlined" onClick={handleNextStep}>
              I have a Xero Developer Account
            </Button>
          </Box>
        )}
        
        {activeStep === 1 && (
          <Box>
            <Typography paragraph>
              Create a new application in the Xero Developer portal with the following settings:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2">Required Application Settings:</Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="App Type" 
                    secondary="Web App" 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Redirect URI" 
                    secondary={redirectUri} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Required Scopes" 
                    secondary="accounting.transactions, accounting.settings, offline_access" 
                  />
                </ListItem>
              </List>
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBackStep}>Back</Button>
              <Button variant="outlined" onClick={handleNextStep}>
                I've Created the Application
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 2 && (
          <Box>
            <Typography paragraph>
              Get your Client ID and Client Secret from the application details page.
            </Typography>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Xero Client ID"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your Xero Client Secret"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Redirect URI"
                    value={redirectUri}
                    onChange={(e) => setRedirectUri(e.target.value)}
                    helperText="This should match exactly what you entered in Xero"
                  />
                </Grid>
              </Grid>
            </Paper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBackStep}>Back</Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveApiKeys}
                disabled={!clientId || !clientSecret || !redirectUri}
              >
                Save API Keys
              </Button>
            </Box>
          </Box>
        )}
        
        {activeStep === 3 && (
          <Box>
            <Typography paragraph>
              Now you can connect your application to Xero. Click the button below to authorize.
            </Typography>
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
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Xero Integration
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => setDevMode(!devMode)}
        >
          {devMode ? 'Hide Developer Options' : 'Show Developer Options'}
        </Button>
      </Box>
      
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
      
      {devMode && renderDeveloperSetup()}
      
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
      
      {/* Developer Setup Dialog */}
      <Dialog 
        open={showDevSetupDialog} 
        onClose={() => setShowDevSetupDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Xero API Keys</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your Xero Client ID"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Xero Client Secret"
                type="password"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Redirect URI"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
                helperText="Use this exact redirect URI in your Xero application settings"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                Learn more about setting up Xero API keys in the{" "}
                <Link 
                  href="https://developer.xero.com/documentation/getting-started-guide" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xero Developer Documentation
                </Link>
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDevSetupDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveApiKeys} 
            variant="contained" 
            color="primary"
            disabled={!clientId || !clientSecret || !redirectUri}
          >
            Save API Keys
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default XeroIntegrationPage; 