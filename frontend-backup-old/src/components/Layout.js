import React from 'react';
import { Link } from 'react-router-dom';
import {
    Box,
    Container,
    AppBar,
    Toolbar,
    Typography,
    Button
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Settings as SettingsIcon,
    CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

const Layout = ({ children }) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Invoice Reconciliation
                    </Typography>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/"
                        startIcon={<DashboardIcon />}
                    >
                        Dashboard
                    </Button>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/upload"
                        startIcon={<CloudUploadIcon />}
                    >
                        Upload
                    </Button>
                    <Button
                        color="inherit"
                        component={Link}
                        to="/settings"
                        startIcon={<SettingsIcon />}
                    >
                        Settings
                    </Button>
                </Toolbar>
            </AppBar>
            <Container component="main" sx={{ mt: 4, mb: 4 }}>
                {children}
            </Container>
        </Box>
    );
};

export default Layout; 