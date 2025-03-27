import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../services/api';

interface EmailProcessingSettings {
  enabled: boolean;
  emailAddress: string;
  emailProvider: 'gmail' | 'outlook' | 'custom';
  smtpConfig: {
    host: string;
    port: number;
    secure: boolean;
    username: string;
    password: string;
  };
  processingRules: {
    allowedSenders: string[];
    allowedFileTypes: string[];
    autoProcess: boolean;
    defaultCostCenter: string;
    defaultCategory: string;
  };
}

const EmailProcessingSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<EmailProcessingSettings>({
    enabled: false,
    emailAddress: '',
    emailProvider: 'gmail',
    smtpConfig: {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
    },
    processingRules: {
      allowedSenders: [],
      allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
      autoProcess: false,
      defaultCostCenter: '',
      defaultCategory: '',
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newSender, setNewSender] = useState('');
  const [newFileType, setNewFileType] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      console.log('Fetching email processing settings...');
      const response = await api.get('/settings/email-processing');
      console.log('Response received:', response);
      
      if (response.data) {
        console.log('Settings data:', response.data);
        setSettings(response.data);
      } else {
        console.log('No settings data received, using defaults');
        setSettings({
          enabled: false,
          emailAddress: '',
          emailProvider: 'gmail',
          smtpConfig: {
            host: '',
            port: 587,
            secure: false,
            username: '',
            password: '',
          },
          processingRules: {
            allowedSenders: [],
            allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
            autoProcess: false,
            defaultCostCenter: '',
            defaultCategory: '',
          },
        });
      }
    } catch (err: any) {
      console.error('Error fetching email settings:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      // If the endpoint doesn't exist (404), use default settings
      if (err.response?.status === 404) {
        console.log('Email processing settings endpoint not found, using defaults');
        setSettings({
          enabled: false,
          emailAddress: '',
          emailProvider: 'gmail',
          smtpConfig: {
            host: '',
            port: 587,
            secure: false,
            username: '',
            password: '',
          },
          processingRules: {
            allowedSenders: [],
            allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
            autoProcess: false,
            defaultCostCenter: '',
            defaultCategory: '',
          },
        });
      } else {
        setError(err.response?.data?.message || 'Failed to fetch email settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => {
        const parentKey = parent as keyof EmailProcessingSettings;
        const parentObj = prev[parentKey];
        
        // Type guard to ensure parentObj is an object
        if (!parentObj || typeof parentObj !== 'object') {
          return prev;
        }

        // Create a new object with the updated value
        const updatedParentObj = {
          ...parentObj,
          [child]: type === 'checkbox' ? checked : value
        };

        return {
          ...prev,
          [parentKey]: updatedParentObj
        };
      });
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddSender = () => {
    if (newSender && !settings.processingRules.allowedSenders.includes(newSender)) {
      setSettings(prev => ({
        ...prev,
        processingRules: {
          ...prev.processingRules,
          allowedSenders: [...prev.processingRules.allowedSenders, newSender]
        }
      }));
      setNewSender('');
    }
  };

  const handleRemoveSender = (sender: string) => {
    setSettings(prev => ({
      ...prev,
      processingRules: {
        ...prev.processingRules,
        allowedSenders: prev.processingRules.allowedSenders.filter(s => s !== sender)
      }
    }));
  };

  const handleAddFileType = () => {
    if (newFileType && !settings.processingRules.allowedFileTypes.includes(newFileType)) {
      setSettings(prev => ({
        ...prev,
        processingRules: {
          ...prev.processingRules,
          allowedFileTypes: [...prev.processingRules.allowedFileTypes, newFileType]
        }
      }));
      setNewFileType('');
    }
  };

  const handleRemoveFileType = (fileType: string) => {
    setSettings(prev => ({
      ...prev,
      processingRules: {
        ...prev.processingRules,
        allowedFileTypes: prev.processingRules.allowedFileTypes.filter(f => f !== fileType)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      await api.put('/settings/email-processing', settings);
      setSuccess('Email processing settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update email settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      await api.post('/settings/email-processing/test');
      setSuccess('Email configuration test successful');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to test email configuration');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Email Processing Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={handleChange}
                    name="enabled"
                  />
                }
                label="Enable Email Processing"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="emailAddress"
                value={settings.emailAddress}
                onChange={handleChange}
                disabled={!settings.enabled}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Provider"
                name="emailProvider"
                value={settings.emailProvider}
                onChange={handleChange}
                select
                disabled={!settings.enabled}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="custom">Custom SMTP</option>
              </TextField>
            </Grid>

            {settings.emailProvider === 'custom' && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    name="smtpConfig.host"
                    value={settings.smtpConfig.host}
                    onChange={handleChange}
                    disabled={!settings.enabled}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    name="smtpConfig.port"
                    type="number"
                    value={settings.smtpConfig.port}
                    onChange={handleChange}
                    disabled={!settings.enabled}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="smtpConfig.username"
                value={settings.smtpConfig.username}
                onChange={handleChange}
                disabled={!settings.enabled}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="smtpConfig.password"
                type="password"
                value={settings.smtpConfig.password}
                onChange={handleChange}
                disabled={!settings.enabled}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        onClick={handleTestConnection}
                        disabled={!settings.enabled || saving}
                      >
                        Test Connection
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Processing Rules
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Allowed Senders
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Add Email Address"
                    value={newSender}
                    onChange={(e) => setNewSender(e.target.value)}
                    disabled={!settings.enabled}
                  />
                  <IconButton onClick={handleAddSender} disabled={!settings.enabled}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {settings.processingRules.allowedSenders.map((sender) => (
                    <Chip
                      key={sender}
                      label={sender}
                      onDelete={() => handleRemoveSender(sender)}
                      disabled={!settings.enabled}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Allowed File Types
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    label="Add File Type"
                    value={newFileType}
                    onChange={(e) => setNewFileType(e.target.value)}
                    disabled={!settings.enabled}
                  />
                  <IconButton onClick={handleAddFileType} disabled={!settings.enabled}>
                    <AddIcon />
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {settings.processingRules.allowedFileTypes.map((fileType) => (
                    <Chip
                      key={fileType}
                      label={fileType}
                      onDelete={() => handleRemoveFileType(fileType)}
                      disabled={!settings.enabled}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.processingRules.autoProcess}
                    onChange={handleChange}
                    name="processingRules.autoProcess"
                    disabled={!settings.enabled}
                  />
                }
                label="Auto-process Invoices"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Cost Center"
                name="processingRules.defaultCostCenter"
                value={settings.processingRules.defaultCostCenter}
                onChange={handleChange}
                disabled={!settings.enabled}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Default Category"
                name="processingRules.defaultCategory"
                value={settings.processingRules.defaultCategory}
                onChange={handleChange}
                disabled={!settings.enabled}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving || !settings.enabled}
                  sx={{ minWidth: 120 }}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EmailProcessingSettingsPage; 