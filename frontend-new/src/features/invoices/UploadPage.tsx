import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Grid,
  Divider,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import api from '../../services/api';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [metadata, setMetadata] = useState({
    vendor: '',
    invoiceNumber: '',
    amount: '',
    currency: 'GBP',
    issueDate: '',
    dueDate: '',
    description: ''
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    // Use 'document' as field name to match the backend
    formData.append('document', file);
    
    // Add metadata to the form data
    Object.entries(metadata).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    try {
      const response = await api.post('/invoices/upload', formData);
      console.log('Upload response:', response.data);

      setSuccess(true);
      setTimeout(() => {
        navigate('/invoices');
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to upload invoice. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Upload Invoice
      </Typography>

      <Paper sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Invoice uploaded successfully! Redirecting...
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Document
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 3,
              border: '1px dashed #ccc',
              borderRadius: 1,
              backgroundColor: '#f9f9f9'
            }}
          >
            <input
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              id="invoice-file"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="invoice-file">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploading}
              >
                Select File
              </Button>
            </label>

            {file && (
              <Typography variant="body1">
                Selected file: {file.name}
              </Typography>
            )}

            <Typography variant="body2" color="textSecondary">
              Supported formats: PDF, JPG, JPEG, PNG
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Invoice Details (Optional)
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          You can provide these details or let our system extract them automatically.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Vendor"
              name="vendor"
              value={metadata.vendor}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Invoice Number"
              name="invoiceNumber"
              value={metadata.invoiceNumber}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              name="amount"
              type="number"
              value={metadata.amount}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Currency"
              name="currency"
              value={metadata.currency}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Issue Date"
              name="issueDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={metadata.issueDate}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Due Date"
              name="dueDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={metadata.dueDate}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={2}
              value={metadata.description}
              onChange={handleInputChange}
              disabled={uploading}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              'Upload Invoice'
            )}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default UploadPage; 