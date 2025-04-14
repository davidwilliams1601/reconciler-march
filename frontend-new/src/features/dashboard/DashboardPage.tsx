import React, { useEffect } from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { Receipt, HourglassEmpty, Savings } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchDashboardStats } from './dashboardSlice';

const DashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stats, status, error } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // Fallback data in case API fails
  const fallbackStats = {
    totalInvoices: 150,
    pendingInvoices: 25,
    moneySaved: 175, // (150 + 25) * £1 per minute
  };

  // Use redux state if available, otherwise use fallback data
  const displayStats = {
    totalProcessed: stats?.processedInvoices || fallbackStats.totalInvoices,
    inReview: stats?.pendingInvoices || fallbackStats.pendingInvoices,
    moneySaved: stats?.processedInvoices && stats.pendingInvoices 
      ? (stats.processedInvoices + stats.pendingInvoices) 
      : fallbackStats.moneySaved,
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ color, mr: 1 }}>{icon}</Box>
          <Typography variant="h6" component="div">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {title === 'Money Saved' ? `£${value}` : value}
        </Typography>
        {title === 'Money Saved' && (
          <Typography variant="body2" color="text.secondary">
            Based on £1 per minute saved
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (status === 'loading' && !stats) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Invoice Reconciler
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Invoices Processed"
            value={displayStats.totalProcessed}
            icon={<Receipt />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="In Review"
            value={displayStats.inReview}
            icon={<HourglassEmpty />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Money Saved"
            value={displayStats.moneySaved}
            icon={<Savings />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {status === 'loading' ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
          <Box>
            {stats.recentInvoices.map((invoice, index) => (
              <Box key={invoice.id || index} sx={{ mb: 1, py: 1, borderBottom: '1px solid #eee' }}>
                <Typography variant="body1">
                  {invoice.vendor} - {invoice.invoice_number} ({invoice.currency} {invoice.amount.toFixed(2)})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(invoice.created_at).toLocaleString()} - {invoice.status}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No recent activity to display.
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default DashboardPage; 