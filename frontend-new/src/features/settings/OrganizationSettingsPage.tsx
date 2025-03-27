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
} from '@mui/material';
import api from '../../services/api';

interface OrganizationData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
  notifications: {
    emailNotifications: boolean;
    dueDateReminders: boolean;
    statusChangeAlerts: boolean;
  };
}

const OrganizationSettingsPage: React.FC = () => {
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
    defaultCurrency: 'GBP',
    defaultLanguage: 'en',
    timezone: 'Europe/London',
    notifications: {
      emailNotifications: true,
      dueDateReminders: true,
      statusChangeAlerts: true,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    try {
      const response = await api.get('/settings/organization');
      setOrgData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch organization data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    if (name.startsWith('notifications.')) {
      const notificationKey = name.split('.')[1];
      setOrgData((prev) => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationKey]: checked,
        },
      }));
    } else {
      setOrgData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.put('/settings/organization', orgData);
      setSuccess('Organization settings updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update organization settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Organization Settings
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
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Organization Name"
                name="name"
                value={orgData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tax Number"
                name="taxNumber"
                value={orgData.taxNumber}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={orgData.address}
                onChange={handleChange}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={orgData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={orgData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={orgData.website}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Preferences
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Default Currency"
                name="defaultCurrency"
                value={orgData.defaultCurrency}
                onChange={handleChange}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Default Language"
                name="defaultLanguage"
                value={orgData.defaultLanguage}
                onChange={handleChange}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Timezone"
                name="timezone"
                value={orgData.timezone}
                onChange={handleChange}
                select
                SelectProps={{
                  native: true,
                }}
              >
                <option value="Europe/London">London (GMT)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Notifications
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={orgData.notifications.emailNotifications}
                    onChange={handleChange}
                    name="notifications.emailNotifications"
                  />
                }
                label="Enable Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={orgData.notifications.dueDateReminders}
                    onChange={handleChange}
                    name="notifications.dueDateReminders"
                  />
                }
                label="Enable Due Date Reminders"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={orgData.notifications.statusChangeAlerts}
                    onChange={handleChange}
                    name="notifications.statusChangeAlerts"
                  />
                }
                label="Enable Status Change Alerts"
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? (
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

export default OrganizationSettingsPage; 