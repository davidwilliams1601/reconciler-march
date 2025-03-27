import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Container
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from 'axios';

const UploadInvoice: React.FC = () => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a PDF, JPEG, or PNG file.');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File is too large. Maximum size is 5MB.');
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        const formData = new FormData();
        formData.append('invoice', file);

        try {
            const response = await axios.post('http://localhost:5001/api/invoices/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setSuccess('Invoice uploaded successfully! Processing will begin shortly.');
            console.log('Upload response:', response.data);
            
            // Clear the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload invoice');
            console.error('Upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" gutterBottom>
                Upload Invoice
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

            <Paper
                sx={{
                    p: 4,
                    textAlign: 'center',
                    backgroundColor: '#fff',
                    border: '2px dashed #ccc',
                }}
            >
                <Box sx={{ mb: 2 }}>
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                </Box>
                {uploading ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <CircularProgress size={24} sx={{ mb: 1 }} />
                        <Typography>Uploading...</Typography>
                    </Box>
                ) : (
                    <>
                        <Typography variant="h6" gutterBottom>
                            Select an invoice to upload
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                            Supported formats: PDF, JPEG, PNG (max 5MB)
                        </Typography>
                        <Button
                            variant="contained"
                            component="label"
                            disabled={uploading}
                            sx={{ mt: 2 }}
                        >
                            Select File
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileUpload}
                            />
                        </Button>
                    </>
                )}
            </Paper>
        </Container>
    );
};

export default UploadInvoice; 