import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchSettings, updateSettings } from '../../store/slices/settingsSlice';

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { settings, loading, error } = useAppSelector((state) => state.settings);
  const [showSuccess, setShowSuccess] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (section: keyof typeof settings, field: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await dispatch(updateSettings(localSettings)).unwrap();
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Invoice Defaults */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Invoice Defaults
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="Default Currency"
              select
              fullWidth
              value={localSettings.invoiceDefaults.defaultCurrency}
              onChange={(e) =>
                handleChange('invoiceDefaults', 'defaultCurrency', e.target.value)
              }
            >
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </TextField>
            <TextField
              label="Default Due Days"
              type="number"
              fullWidth
              value={localSettings.invoiceDefaults.defaultDueDays}
              onChange={(e) =>
                handleChange('invoiceDefaults', 'defaultDueDays', parseInt(e.target.value))
              }
            />
            <TextField
              label="Default Status"
              select
              fullWidth
              value={localSettings.invoiceDefaults.defaultStatus}
              onChange={(e) =>
                handleChange('invoiceDefaults', 'defaultStatus', e.target.value)
              }
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          </Box>
        </Paper>

        {/* Notifications */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notifications
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.emailNotifications}
                  onChange={(e) =>
                    handleChange('notifications', 'emailNotifications', e.target.checked)
                  }
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.dueDateReminders}
                  onChange={(e) =>
                    handleChange('notifications', 'dueDateReminders', e.target.checked)
                  }
                />
              }
              label="Due Date Reminders"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.notifications.statusChangeAlerts}
                  onChange={(e) =>
                    handleChange('notifications', 'statusChangeAlerts', e.target.checked)
                  }
                />
              }
              label="Status Change Alerts"
            />
          </Box>
        </Paper>

        {/* Display Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Display Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <TextField
              label="Date Format"
              select
              fullWidth
              value={localSettings.display.dateFormat}
              onChange={(e) => handleChange('display', 'dateFormat', e.target.value)}
            >
              <MenuItem value="dd/MM/yyyy">DD/MM/YYYY</MenuItem>
              <MenuItem value="MM/dd/yyyy">MM/DD/YYYY</MenuItem>
              <MenuItem value="yyyy-MM-dd">YYYY-MM-DD</MenuItem>
            </TextField>
            <TextField
              label="Items per Page"
              select
              fullWidth
              value={localSettings.display.itemsPerPage}
              onChange={(e) =>
                handleChange('display', 'itemsPerPage', parseInt(e.target.value))
              }
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </TextField>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={() => setShowSuccess(false)}
      >
        <Alert severity="success" onClose={() => setShowSuccess(false)}>
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 