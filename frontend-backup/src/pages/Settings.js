import React, { useState, useEffect, useCallback } from 'react';
import axios from '../config/axios';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Grid,
    Divider
} from '@mui/material';

const Settings = () => {
    const [settings, setSettings] = useState({
        googleVisionApiKey: '',
        dextApiKey: '',
        xeroConfig: {
            clientId: '',
            clientSecret: '',
            redirectUri: window.location.origin + '/xero-callback',
            scope: 'offline_access accounting.transactions accounting.settings'
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [xeroConnecting, setXeroConnecting] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/settings');
            setSettings(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load settings. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            await axios.post('/api/settings', settings);
            setSuccess(true);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('xeroConfig.')) {
            const field = name.split('.')[1];
            setSettings(prev => ({
                ...prev,
                xeroConfig: {
                    ...prev.xeroConfig,
                    [field]: value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleXeroConnect = async () => {
        try {
            setXeroConnecting(true);
            const response = await axios.get('/api/xero/auth-url');
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Error getting Xero auth URL:', error);
            setError('Failed to connect to Xero. Please try again.');
        } finally {
            setXeroConnecting(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Paper elevation={3}>
                <Box p={3}>
                    <Typography variant="h5" gutterBottom>
                        API Settings
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Settings saved successfully!
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Google Vision API Section */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Google Vision API
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="API Key"
                                    name="googleVisionApiKey"
                                    value={settings.googleVisionApiKey}
                                    onChange={handleChange}
                                    type="password"
                                    required
                                    margin="normal"
                                />
                                <Typography variant="body2" color="textSecondary">
                                    Used for OCR processing of invoice images
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            {/* Dext API Section */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Dext API
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="API Key"
                                    name="dextApiKey"
                                    value={settings.dextApiKey}
                                    onChange={handleChange}
                                    type="password"
                                    required
                                    margin="normal"
                                />
                                <Typography variant="body2" color="textSecondary">
                                    Used for invoice processing and data extraction
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider />
                            </Grid>

                            {/* Xero API Section */}
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom>
                                    Xero API
                                </Typography>
                                <TextField
                                    fullWidth
                                    label="Client ID"
                                    name="xeroConfig.clientId"
                                    value={settings.xeroConfig.clientId}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Client Secret"
                                    name="xeroConfig.clientSecret"
                                    value={settings.xeroConfig.clientSecret}
                                    onChange={handleChange}
                                    type="password"
                                    required
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Redirect URI"
                                    name="xeroConfig.redirectUri"
                                    value={settings.xeroConfig.redirectUri}
                                    onChange={handleChange}
                                    required
                                    margin="normal"
                                />
                                <Box mt={2} mb={2}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleXeroConnect}
                                        disabled={xeroConnecting || !settings.xeroConfig.clientId || !settings.xeroConfig.clientSecret}
                                    >
                                        {xeroConnecting ? 'Connecting...' : 'Connect to Xero'}
                                    </Button>
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    Used for accounting integration and invoice reconciliation
                                </Typography>
                            </Grid>

                            <Grid item xs={12}>
                                <Box mt={2}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={saving}
                                        size="large"
                                    >
                                        {saving ? 'Saving...' : 'Save Settings'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </form>
                </Box>
            </Paper>
        </Box>
    );
};

export default Settings; 