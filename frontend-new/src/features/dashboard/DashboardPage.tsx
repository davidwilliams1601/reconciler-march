import React from 'react';
import { Container, Typography, Box, Grid, Paper, Card, CardContent } from '@mui/material';
import { Receipt, HourglassEmpty, Savings } from '@mui/icons-material';

const DashboardPage: React.FC = () => {
  // TODO: Replace with actual data from API
  const stats = {
    totalProcessed: 150,
    inReview: 25,
    moneySaved: 175, // (150 + 25) * £1 per minute
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
          {value}
        </Typography>
        {title === 'Money Saved' && (
          <Typography variant="body2" color="text.secondary">
            Based on £1 per minute saved
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Invoice Reconciler
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Invoices Processed"
            value={stats.totalProcessed}
            icon={<Receipt />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="In Review"
            value={stats.inReview}
            icon={<HourglassEmpty />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard
            title="Money Saved"
            value={stats.moneySaved}
            icon={<Savings />}
            color="#2e7d32"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Activity feed will be implemented in the next update.
        </Typography>
      </Paper>
    </Container>
  );
};

export default DashboardPage; 