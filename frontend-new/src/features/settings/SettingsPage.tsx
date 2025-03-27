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
} from '@mui/material';
import { AccountCircle, Business, Category, Settings as SettingsIcon, Person, Email, AccountBalance } from '@mui/icons-material';
import { Link as RouterLink, Routes, Route, useLocation } from 'react-router-dom';
import ProfileSettingsPage from './ProfileSettingsPage';
import OrganizationSettingsPage from './OrganizationSettingsPage';
import CostCentersPage from './CostCentersPage';
import EmailProcessingSettingsPage from './EmailProcessingSettingsPage';

interface APIConfig {
  // Xero API Configuration
  xeroClientId: string;
  xeroClientSecret: string;
  xeroTenantId: string;
  xeroRedirectUri: string;
  
  // Dext API Configuration
  dextApiKey: string;
  dextClientId: string;
  dextClientSecret: string;
  dextEnvironment: string;
  dextWebhookUrl: string;
  dextWebhookSecret: string;
  
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
    
    // Dext API initial values
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
    
    // Reconciliation Settings
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
    { text: 'API Settings', icon: <SettingsIcon />, path: '/settings/api' },
  ];

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
      await dispatch(testXeroConnection({
        clientId: config.xeroClientId,
        clientSecret: config.xeroClientSecret,
        tenantId: config.xeroTenantId
      })).unwrap();
    } catch (error) {
      console.error('Failed to test Xero connection:', error);
    }
  };

  const handleTestDextConnection = async () => {
    try {
      await dispatch(testDextConnection({
        apiKey: config.dextApiKey,
        clientId: config.dextClientId,
        clientSecret: config.dextClientSecret
      })).unwrap();
    } catch (error) {
      console.error('Failed to test Dext connection:', error);
    }
  };

  const handleTestGoogleVisionConnection = async () => {
    try {
      await dispatch(testGoogleVisionConnection({
        apiKey: config.googleVisionApiKey,
        projectId: config.googleVisionProjectId
      })).unwrap();
    } catch (error) {
      console.error('Failed to test Google Vision connection:', error);
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
                        Xero API Configuration
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Configure your Xero API integration settings for accounting synchronization.
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Client ID"
                        name="xeroClientId"
                        value={config.xeroClientId}
                        onChange={handleChange}
                        helperText="Your Xero OAuth 2.0 client ID"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Client Secret"
                        name="xeroClientSecret"
                        value={config.xeroClientSecret}
                        onChange={handleChange}
                        type="password"
                        helperText="Your Xero OAuth 2.0 client secret"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Tenant ID"
                        name="xeroTenantId"
                        value={config.xeroTenantId}
                        onChange={handleChange}
                        helperText="Your Xero organization's tenant ID"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Redirect URI"
                        name="xeroRedirectUri"
                        value={config.xeroRedirectUri}
                        onChange={handleChange}
                        helperText="OAuth 2.0 redirect URI"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleTestXeroConnection}
                          disabled={!config.xeroClientId || !config.xeroClientSecret || !config.xeroTenantId}
                        >
                          Test Xero Connection
                        </Button>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 3 }} />
                    </Grid>

                    {/* Dext API Configuration */}
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Dext API Configuration
                      </Typography>
                      <Typography variant="body2" color="textSecondary" paragraph>
                        Configure your Dext (Receipt Bank) API settings for document processing.
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="API Key"
                        name="dextApiKey"
                        value={config.dextApiKey}
                        onChange={handleChange}
                        type="password"
                        helperText="Your Dext API key"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Client ID"
                        name="dextClientId"
                        value={config.dextClientId}
                        onChange={handleChange}
                        helperText="Your Dext client ID"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Client Secret"
                        name="dextClientSecret"
                        value={config.dextClientSecret}
                        onChange={handleChange}
                        type="password"
                        helperText="Your Dext client secret"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Environment"
                        name="dextEnvironment"
                        value={config.dextEnvironment}
                        onChange={handleChange}
                        helperText="Dext environment (production/sandbox)"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Webhook URL"
                        name="dextWebhookUrl"
                        value={config.dextWebhookUrl}
                        onChange={handleChange}
                        helperText="URL to receive Dext webhook notifications"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Webhook Secret"
                        name="dextWebhookSecret"
                        value={config.dextWebhookSecret}
                        onChange={handleChange}
                        type="password"
                        helperText="Secret for validating Dext webhook requests"
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleTestDextConnection}
                          disabled={!config.dextApiKey || !config.dextClientId || !config.dextClientSecret}
                        >
                          Test Dext Connection
                        </Button>
                      </Box>
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
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleTestGoogleVisionConnection}
                          disabled={!config.googleVisionApiKey || !config.googleVisionProjectId}
                        >
                          Test Google Vision Connection
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
                      Xero API Configuration
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Configure your Xero API integration settings for accounting synchronization.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      name="xeroClientId"
                      value={config.xeroClientId}
                      onChange={handleChange}
                      helperText="Your Xero OAuth 2.0 client ID"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client Secret"
                      name="xeroClientSecret"
                      value={config.xeroClientSecret}
                      onChange={handleChange}
                      type="password"
                      helperText="Your Xero OAuth 2.0 client secret"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Tenant ID"
                      name="xeroTenantId"
                      value={config.xeroTenantId}
                      onChange={handleChange}
                      helperText="Your Xero organization's tenant ID"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Redirect URI"
                      name="xeroRedirectUri"
                      value={config.xeroRedirectUri}
                      onChange={handleChange}
                      helperText="OAuth 2.0 redirect URI"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleTestXeroConnection}
                        disabled={!config.xeroClientId || !config.xeroClientSecret || !config.xeroTenantId}
                      >
                        Test Xero Connection
                      </Button>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 3 }} />
                  </Grid>

                  {/* Dext API Configuration */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Dext API Configuration
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Configure your Dext (Receipt Bank) API settings for document processing.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Key"
                      name="dextApiKey"
                      value={config.dextApiKey}
                      onChange={handleChange}
                      type="password"
                      helperText="Your Dext API key"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      name="dextClientId"
                      value={config.dextClientId}
                      onChange={handleChange}
                      helperText="Your Dext client ID"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Client Secret"
                      name="dextClientSecret"
                      value={config.dextClientSecret}
                      onChange={handleChange}
                      type="password"
                      helperText="Your Dext client secret"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Environment"
                      name="dextEnvironment"
                      value={config.dextEnvironment}
                      onChange={handleChange}
                      helperText="Dext environment (production/sandbox)"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Webhook URL"
                      name="dextWebhookUrl"
                      value={config.dextWebhookUrl}
                      onChange={handleChange}
                      helperText="URL to receive Dext webhook notifications"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Webhook Secret"
                      name="dextWebhookSecret"
                      value={config.dextWebhookSecret}
                      onChange={handleChange}
                      type="password"
                      helperText="Secret for validating Dext webhook requests"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleTestDextConnection}
                        disabled={!config.dextApiKey || !config.dextClientId || !config.dextClientSecret}
                      >
                        Test Dext Connection
                      </Button>
                    </Box>
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleTestGoogleVisionConnection}
                        disabled={!config.googleVisionApiKey || !config.googleVisionProjectId}
                      >
                        Test Google Vision Connection
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
          <Paper sx={{ p: 2 }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path}
                    selected={location.pathname === item.path}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Routes>
            <Route path="profile" element={<ProfileSettingsPage />} />
            <Route path="organization" element={<OrganizationSettingsPage />} />
            <Route path="email-processing" element={<EmailProcessingSettingsPage />} />
            <Route path="cost-centers" element={<CostCentersPage />} />
            <Route path="api" element={renderContent()} />
          </Routes>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SettingsPage; 