import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  useTheme,
} from '@mui/material';
import {
  Description as InvoiceIcon,
  CheckCircle as ApprovedIcon,
  Pending as PendingIcon,
  Error as RejectedIcon,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const theme = useTheme();

  // TODO: Replace with actual data from Redux store
  const stats = {
    total: 150,
    approved: 80,
    pending: 50,
    rejected: 20,
  };

  const cards = [
    {
      title: 'Total Invoices',
      value: stats.total,
      icon: <InvoiceIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: <ApprovedIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: <RejectedIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${card.color}15`,
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      mr: 2,
                      '& .MuiSvgIcon-root': {
                        color: card.color,
                      },
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4">{card.value}</Typography>
                    <Typography color="textSecondary" variant="subtitle2">
                      {card.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 