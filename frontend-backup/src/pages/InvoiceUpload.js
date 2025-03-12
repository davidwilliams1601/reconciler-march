import React, { useState } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import axios from '../config/axios';

const InvoiceUpload = () => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        handleFile(droppedFile);
    };

    const handleFileInput = (e) => {
        const selectedFile = e.target.files[0];
        handleFile(selectedFile);
    };

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setFile(file);
            setError(null);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please upload an image file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('invoice', file);

        try {
            setLoading(true);
            setError(null);
            setResult(null);

            const response = await axios.post('/api/invoices/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResult(response.data);
        } catch (err) {
            console.error('Error uploading invoice:', err);
            setError(err.response?.data?.message || 'Failed to process invoice');
        } finally {
            setLoading(false);
        }
    };

    const preventDefault = (e) => {
        e.preventDefault();
    };

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Upload Invoice
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper
                elevation={3}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '2px dashed #ccc',
                    backgroundColor: '#fafafa',
                    cursor: 'pointer',
                }}
                onDrop={handleDrop}
                onDragOver={preventDefault}
                onClick={() => document.getElementById('file-input').click()}
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    minHeight="200px"
                >
                    <input
                        type="file"
                        id="file-input"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileInput}
                    />
                    <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                        Drag and drop an invoice image here
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        or click to select a file
                    </Typography>
                </Box>
            </Paper>

            {preview && (
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Preview
                    </Typography>
                    <Box
                        component="img"
                        src={preview}
                        alt="Invoice preview"
                        sx={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain',
                        }}
                    />
                    <Box mt={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleUpload}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Process Invoice'}
                        </Button>
                    </Box>
                </Paper>
            )}

            {loading && (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress />
                </Box>
            )}

            {result && (
                <Card elevation={3}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Extracted Data
                        </Typography>
                        <Box component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                            <Typography variant="body2">
                                Invoice Number: {result.invoice.invoiceNumber}
                            </Typography>
                            <Typography variant="body2">
                                Vendor: {result.invoice.vendor}
                            </Typography>
                            <Typography variant="body2">
                                Amount: £{result.invoice.amount.toFixed(2)}
                            </Typography>
                            <Typography variant="body2">
                                Date: {new Date(result.invoice.issueDate).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                Status: {result.invoice.status}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default InvoiceUpload; 