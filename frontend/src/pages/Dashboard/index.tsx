import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 4,
            }}
          >
            <ConstructionIcon
              sx={{
                fontSize: 60,
                color: theme.palette.primary.main,
                mb: 2,
              }}
            />
            <Typography variant="h5" gutterBottom>
              Dashboard Under Construction
            </Typography>
            <Typography color="textSecondary" align="center">
              We're working on bringing you a beautiful dashboard experience.
              Check back soon for updates!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard; 