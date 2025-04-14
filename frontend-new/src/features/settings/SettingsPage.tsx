import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { 
  fetchSettings, 
  saveSettings, 
  testXeroConnection, 
  testDextConnection,
  testGoogleVisionConnection 
} from './settingsSlice';
import type { Settings } from './settingsSlice';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Snackbar,
  Divider,
  Slider,
  FormControlLabel,
  Switch,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  AlertTitle,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import { AccountCircle, Business, Category, Settings as SettingsIcon, Person, Email, AccountBalance } from '@mui/icons-material';
import { Link as RouterLink, Routes, Route, useLocation } from 'react-router-dom';
import ProfileSettingsPage from './ProfileSettingsPage';
import OrganizationSettingsPage from './OrganizationSettingsPage';
import CostCentersPage from './CostCentersPage';
import EmailProcessingSettingsPage from './EmailProcessingSettingsPage';
import XeroIntegrationPage from './XeroIntegrationPage';

interface APIConfig {
  // Xero API Configuration
  xeroClientId: string;
  xeroClientSecret: string;
  xeroTenantId: string;
  xeroRedirectUri: string;
  
  // Dext API Configuration (optional)
  dextApiKey?: string;
  dextClientId?: string;
  dextClientSecret?: string;
  dextEnvironment?: string;
  dextWebhookUrl?: string;
  dextWebhookSecret?: string;
  
  // Google Vision API Configuration
  googleVisionApiKey: string;
  googleVisionProjectId: string;
  googleVisionKeyFilePath: string;
  googleVisionConfidenceThreshold: number;
  
  // Reconciliation Settings
  autoReconcileEnabled: boolean;
  reconciliationConfidenceThreshold: number;
  reconciliationDateRange: number;
  reconciliationAccountCodes: string;
}

const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, status, error } = useAppSelector((state) => state.settings);
  const [config, setConfig] = useState<Settings>({
    // Xero API initial values
    xeroClientId: '',
    xeroClientSecret: '',
    xeroTenantId: '',
    xeroRedirectUri: '',
    
    // Dext API initial values (kept for compatibility)
    dextApiKey: '',
    dextClientId: '',
    dextClientSecret: '',
    dextEnvironment: '',
    dextWebhookUrl: '',
    dextWebhookSecret: '',
    
    // Google Vision API initial values
    googleVisionApiKey: '',
    googleVisionProjectId: '',
    googleVisionKeyFilePath: '',
    googleVisionConfidenceThreshold: 0.95,
    
    // Reconciliation Settings initial values
    autoReconcileEnabled: true,
    reconciliationConfidenceThreshold: 0.95,
    reconciliationDateRange: 30,
    reconciliationAccountCodes: '',
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const location = useLocation();

  const menuItems = [
    { text: 'Profile', icon: <Person />, path: '/settings/profile' },
    { text: 'Organization', icon: <Business />, path: '/settings/organization' },
    { text: 'Email Processing', icon: <Email />, path: '/settings/email-processing' },
    { text: 'Cost Centers', icon: <AccountBalance />, path: '/settings/cost-centers' },
    { text: 'Xero Integration', icon: <AccountCircle />, path: '/settings/xero' },
    { text: 'API Settings', icon: <SettingsIcon />, path: '/settings/api' },
  ];

  const [xeroTestStatus, setXeroTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [xeroTestMessage, setXeroTestMessage] = useState('');
  const [googleVisionTestStatus, setGoogleVisionTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [googleVisionTestMessage, setGoogleVisionTestMessage] = useState('');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchSettings());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (settings) {
      setConfig(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user makes changes
    setSaveError(null);
  };

  const handleSliderChange = (name: string) => (event: Event, value: number | number[]) => {
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user makes changes
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveError(null);
      await dispatch(saveSettings(config)).unwrap();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestXeroConnection = async () => {
    try {
      setXeroTestStatus('testing');
      const result = await dispatch(testXeroConnection({
        clientId: config.xeroClientId,
        clientSecret: config.xeroClientSecret,
        tenantId: config.xeroTenantId
      })).unwrap();
      
      if (result && result.success) {
        setXeroTestStatus('success');
        setXeroTestMessage(result.message || 'Connection test successful');
      } else {
        setXeroTestStatus('error');
        setXeroTestMessage((result && result.message) || 'Connection test failed');
      }
    } catch (error) {
      console.error('Failed to test Xero connection:', error);
      setXeroTestStatus('error');
      setXeroTestMessage('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleTestGoogleVisionConnection = async () => {
    try {
      setGoogleVisionTestStatus('testing');
      const result = await dispatch(testGoogleVisionConnection({
        apiKey: config.googleVisionApiKey,
        projectId: config.googleVisionProjectId
      })).unwrap();
      
      if (result && result.success) {
        setGoogleVisionTestStatus('success');
        setGoogleVisionTestMessage(result.message || 'Connection test successful');
      } else {
        setGoogleVisionTestStatus('error');
        setGoogleVisionTestMessage((result && result.message) || 'Connection test failed');
      }
    } catch (error) {
      console.error('Failed to test Google Vision connection:', error);
      setGoogleVisionTestStatus('error');
      setGoogleVisionTestMessage('Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleTestDextConnection = async () => {
    try {
      await dispatch(testDextConnection({
        apiKey: '',
        clientId: '',
        clientSecret: ''
      })).unwrap();
    } catch (error) {
      console.error('Failed to test Dext connection:', error);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'idle':
      case 'loading':
        return (
          <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress />
          </Container>
        );
      case 'failed':
        if (error?.includes('404')) {
          return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                API Settings
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                No existing settings found. Please configure your API settings below.
              </Alert>
              <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    {/* Xero API Configuration */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Xero Integration
                      </Typography>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <AlertTitle>Xero Settings Moved</AlertTitle>
                        Xero integration settings have been moved to the dedicated <strong>Xero Integration</strong> page in the settings menu.
                        Please use that page to connect and manage your Xero account.
                      </Alert>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 3 }} />
                    </Grid>

                    {/* Google Vision API Configuration */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Google Vision API Configuration
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Configure Google Cloud Vision API for OCR and document analysis.
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Key"
                        name="googleVisionApiKey"
                        value={config.googleVisionApiKey}
                        onChange={handleChange}
                        type="password"
                        helperText="Your Google Cloud Vision API key"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Project ID"
                        name="googleVisionProjectId"
                        value={config.googleVisionProjectId}
                        onChange={handleChange}
                        helperText="Your Google Cloud project ID"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Service Account Key File Path"
                        name="googleVisionKeyFilePath"
                        value={config.googleVisionKeyFilePath}
                        onChange={handleChange}
                        helperText="Path to your Google Cloud service account key file"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, alignItems: 'center', gap: 2 }}>
                        {googleVisionTestStatus === 'success' && (
                          <Alert severity="success" sx={{ flexGrow: 1 }}>
                            {googleVisionTestMessage}
                          </Alert>
                        )}
                        {googleVisionTestStatus === 'error' && (
                          <Alert severity="error" sx={{ flexGrow: 1 }}>
                            {googleVisionTestMessage}
                          </Alert>
                        )}
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleTestGoogleVisionConnection}
                          disabled={!config.googleVisionApiKey || !config.googleVisionProjectId || googleVisionTestStatus === 'testing'}
                        >
                          {googleVisionTestStatus === 'testing' ? (
                            <>
                              <CircularProgress size={24} sx={{ mr: 1 }} />
                              Testing...
                            </>
                          ) : (
                            'Test Google Vision Connection'
                          )}
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        OCR Confidence Threshold: {config.googleVisionConfidenceThreshold * 100}%
                      </Typography>
                      <Slider
                        value={config.googleVisionConfidenceThreshold}
                        onChange={handleSliderChange('googleVisionConfidenceThreshold')}
                        min={0.5}
                        max={1}
                        step={0.05}
                        marks
                      />
                      <Typography variant="caption" color="textSecondary">
                        Minimum confidence level required for OCR text extraction
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 3 }} />
                    </Grid>

                    {/* Reconciliation Settings */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Reconciliation Settings
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Configure automatic reconciliation settings for invoice matching.
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={config.autoReconcileEnabled}
                            onChange={handleChange}
                            name="autoReconcileEnabled"
                          />
                        }
                        label="Enable Automatic Reconciliation"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        Reconciliation Confidence Threshold: {config.reconciliationConfidenceThreshold * 100}%
                      </Typography>
                      <Slider
                        value={config.reconciliationConfidenceThreshold}
                        onChange={handleSliderChange('reconciliationConfidenceThreshold')}
                        min={0.5}
                        max={1}
                        step={0.05}
                        marks
                      />
                      <Typography variant="caption" color="textSecondary">
                        Minimum confidence level required for automatic reconciliation
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography gutterBottom>
                        Transaction Date Range (days): {config.reconciliationDateRange}
                      </Typography>
                      <Slider
                        value={config.reconciliationDateRange}
                        onChange={handleSliderChange('reconciliationDateRange')}
                        min={1}
                        max={90}
                        step={1}
                        marks
                      />
                      <Typography variant="caption" color="textSecondary">
                        Number of days to look back when matching transactions
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Account Codes"
                        name="reconciliationAccountCodes"
                        value={config.reconciliationAccountCodes}
                        onChange={handleChange}
                        helperText="Comma-separated list of Xero account codes to include in reconciliation"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled={isSaving}
                        >
                          {isSaving ? 'Saving...' : 'Save All Settings'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </form>
              </Paper>

              <Snackbar
                open={showSuccess}
                autoHideDuration={6000}
                onClose={() => setShowSuccess(false)}
              >
                <Alert severity="success" onClose={() => setShowSuccess(false)}>
                  API settings saved successfully!
                </Alert>
              </Snackbar>

              {saveError && (
                <Snackbar
                  open={!!saveError}
                  autoHideDuration={6000}
                  onClose={() => setSaveError(null)}
                >
                  <Alert severity="error" onClose={() => setSaveError(null)}>
                    {saveError}
                  </Alert>
                </Snackbar>
              )}
            </Container>
          );
        }
        return (
          <Container>
            <Alert severity="error" sx={{ mt: 2 }}>
              {error || 'Failed to load settings'}
            </Alert>
          </Container>
        );
      case 'succeeded':
        return (
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              API Settings
            </Typography>

            <Paper sx={{ p: 3 }}>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Xero API Configuration */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Xero Integration
                    </Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <AlertTitle>Xero Settings Moved</AlertTitle>
                      Xero integration settings have been moved to the dedicated <strong>Xero Integration</strong> page in the settings menu.
                      Please use that page to connect and manage your Xero account.
                    </Alert>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                  </Grid>

                  {/* Google Vision API Configuration */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Google Vision API Configuration
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Configure Google Cloud Vision API for OCR and document analysis.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Key"
                      name="googleVisionApiKey"
                      value={config.googleVisionApiKey}
                      onChange={handleChange}
                      type="password"
                      helperText="Your Google Cloud Vision API key"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Project ID"
                      name="googleVisionProjectId"
                      value={config.googleVisionProjectId}
                      onChange={handleChange}
                      helperText="Your Google Cloud project ID"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Service Account Key File Path"
                      name="googleVisionKeyFilePath"
                      value={config.googleVisionKeyFilePath}
                      onChange={handleChange}
                      helperText="Path to your Google Cloud service account key file"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, alignItems: 'center', gap: 2 }}>
                      {googleVisionTestStatus === 'success' && (
                        <Alert severity="success" sx={{ flexGrow: 1 }}>
                          {googleVisionTestMessage}
                        </Alert>
                      )}
                      {googleVisionTestStatus === 'error' && (
                        <Alert severity="error" sx={{ flexGrow: 1 }}>
                          {googleVisionTestMessage}
                        </Alert>
                      )}
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleTestGoogleVisionConnection}
                        disabled={!config.googleVisionApiKey || !config.googleVisionProjectId || googleVisionTestStatus === 'testing'}
                      >
                        {googleVisionTestStatus === 'testing' ? (
                          <>
                            <CircularProgress size={24} sx={{ mr: 1 }} />
                            Testing...
                          </>
                        ) : (
                          'Test Google Vision Connection'
                        )}
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      OCR Confidence Threshold: {config.googleVisionConfidenceThreshold * 100}%
                    </Typography>
                    <Slider
                      value={config.googleVisionConfidenceThreshold}
                      onChange={handleSliderChange('googleVisionConfidenceThreshold')}
                      min={0.5}
                      max={1}
                      step={0.05}
                      marks
                    />
                    <Typography variant="caption" color="textSecondary">
                      Minimum confidence level required for OCR text extraction
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                  </Grid>

                  {/* Reconciliation Settings */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Reconciliation Settings
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Configure automatic reconciliation settings for invoice matching.
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={config.autoReconcileEnabled}
                          onChange={handleChange}
                          name="autoReconcileEnabled"
                        />
                      }
                      label="Enable Automatic Reconciliation"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Reconciliation Confidence Threshold: {config.reconciliationConfidenceThreshold * 100}%
                    </Typography>
                    <Slider
                      value={config.reconciliationConfidenceThreshold}
                      onChange={handleSliderChange('reconciliationConfidenceThreshold')}
                      min={0.5}
                      max={1}
                      step={0.05}
                      marks
                    />
                    <Typography variant="caption" color="textSecondary">
                      Minimum confidence level required for automatic reconciliation
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography gutterBottom>
                      Transaction Date Range (days): {config.reconciliationDateRange}
                    </Typography>
                    <Slider
                      value={config.reconciliationDateRange}
                      onChange={handleSliderChange('reconciliationDateRange')}
                      min={1}
                      max={90}
                      step={1}
                      marks
                    />
                    <Typography variant="caption" color="textSecondary">
                      Number of days to look back when matching transactions
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Account Codes"
                      name="reconciliationAccountCodes"
                      value={config.reconciliationAccountCodes}
                      onChange={handleChange}
                      helperText="Comma-separated list of Xero account codes to include in reconciliation"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save All Settings'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </Paper>

            <Snackbar
              open={showSuccess}
              autoHideDuration={6000}
              onClose={() => setShowSuccess(false)}
            >
              <Alert severity="success" onClose={() => setShowSuccess(false)}>
                API settings saved successfully!
              </Alert>
            </Snackbar>

            {saveError && (
              <Snackbar
                open={!!saveError}
                autoHideDuration={6000}
                onClose={() => setSaveError(null)}
              >
                <Alert severity="error" onClose={() => setSaveError(null)}>
                  {saveError}
                </Alert>
              </Snackbar>
            )}
          </Container>
        );
      default:
        return (
          <Container>
            <Alert severity="info" sx={{ mt: 2 }}>
              No settings available. Please try refreshing the page.
            </Alert>
          </Container>
        );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ mb: 3 }}>
            <List component="nav">
              <ListItem>
                <Typography variant="h6">Settings</Typography>
              </ListItem>
              <Divider />
              {menuItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  selected={location.pathname === item.path}
                  component={RouterLink}
                  to={item.path}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Routes>
              <Route path="/profile" element={<ProfileSettingsPage />} />
              <Route path="/organization" element={<OrganizationSettingsPage />} />
              <Route path="/email-processing" element={<EmailProcessingSettingsPage />} />
              <Route path="/cost-centers" element={<CostCentersPage />} />
              <Route path="/xero" element={<XeroIntegrationPage />} />
              <Route path="/api" element={renderContent()} />
              <Route path="*" element={<ProfileSettingsPage />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage; 