import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardStats } from './dashboardSlice';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, status, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchDashboardStats());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (status === 'failed') {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error || 'Failed to load dashboard data'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Total Invoices Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ReceiptIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" component="div">
              Total Invoices
            </Typography>
            <Typography variant="h4" component="div">
              {stats?.totalInvoices || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Pending Invoices Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PendingIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" component="div">
              Pending
            </Typography>
            <Typography variant="h4" component="div">
              {stats?.pendingInvoices || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Matched Invoices Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" component="div">
              Matched
            </Typography>
            <Typography variant="h4" component="div">
              {stats?.matchedInvoices || 0}
            </Typography>
          </Paper>
        </Grid>

        {/* Total Amount Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <AttachMoneyIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" component="div">
              Total Amount
            </Typography>
            <Typography variant="h4" component="div">
              £{stats?.totalAmount?.toLocaleString() || '0'}
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Box sx={{ mt: 2 }}>
              {stats?.recentActivity?.map((activity) => (
                <Box key={activity.id} sx={{ mb: 1 }}>
                  <Typography variant="body1">
                    {activity.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage; 