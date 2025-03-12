import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    CircularProgress
} from '@mui/material';
import {
    Description as DescriptionIcon,
    Timer as TimerIcon,
    AttachMoney as MoneyIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalInvoices: 0,
        pendingReview: 0,
        totalValue: 0,
        minutesSaved: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
        // Fetch stats every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/api/dashboard/stats');
            console.log('Dashboard stats:', response.data);
            
            // Ensure we have a valid response with all required fields
            const data = response.data || {};
            setStats({
                totalInvoices: Number(data.totalInvoices) || 0,
                pendingReview: Number(data.pendingReview) || 0,
                totalValue: Number(data.totalValue) || 0,
                minutesSaved: Number(data.minutesSaved) || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Failed to load dashboard statistics');
            setStats({
                totalInvoices: 0,
                pendingReview: 0,
                totalValue: 0,
                minutesSaved: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value) => {
        if (typeof value !== 'number') return '0';
        return value.toLocaleString();
    };

    const formatCurrency = (value) => {
        if (typeof value !== 'number') return '£0';
        return `£${value.toLocaleString()}`;
    };

    const StatCard = ({ title, value, icon: Icon }) => (
        <Card elevation={3}>
            <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                    <Icon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h4">
                    {value}
                </Typography>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <Typography color="error" variant="h6">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h1" gutterBottom>
                Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Invoices"
                        value={formatValue(stats.totalInvoices)}
                        icon={DescriptionIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Review"
                        value={formatValue(stats.pendingReview)}
                        icon={AssessmentIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Value"
                        value={formatCurrency(stats.totalValue)}
                        icon={MoneyIcon}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Minutes Saved"
                        value={formatValue(stats.minutesSaved)}
                        icon={TimerIcon}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard; 