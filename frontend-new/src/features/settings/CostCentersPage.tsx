import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../services/api';

interface CostCenter {
  code: string;
  name: string;
  keywords: string[];
}

const CostCentersPage: React.FC = () => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [formData, setFormData] = useState<CostCenter>({
    code: '',
    name: '',
    keywords: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      const response = await api.get('/settings/cost-centers');
      setCostCenters(response.data);
    } catch (err) {
      setError('Failed to fetch cost centers');
      console.error('Error fetching cost centers:', err);
    }
  };

  const handleOpen = (costCenter?: CostCenter) => {
    if (costCenter) {
      setEditingCostCenter(costCenter);
      setFormData(costCenter);
    } else {
      setEditingCostCenter(null);
      setFormData({
        code: '',
        name: '',
        keywords: [],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCostCenter(null);
    setFormData({
      code: '',
      name: '',
      keywords: [],
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCostCenter) {
        await api.put(`/settings/cost-centers/${editingCostCenter.code}`, formData);
        setSuccess('Cost center updated successfully');
      } else {
        await api.post('/settings/cost-centers', formData);
        setSuccess('Cost center added successfully');
      }
      fetchCostCenters();
      handleClose();
    } catch (err) {
      setError(editingCostCenter ? 'Failed to update cost center' : 'Failed to add cost center');
      console.error('Error saving cost center:', err);
    }
  };

  const handleDelete = async (code: string) => {
    if (window.confirm('Are you sure you want to delete this cost center?')) {
      try {
        await api.delete(`/settings/cost-centers/${code}`);
        setSuccess('Cost center deleted successfully');
        fetchCostCenters();
      } catch (err) {
        setError('Failed to delete cost center');
        console.error('Error deleting cost center:', err);
      }
    }
  };

  const handleKeywordsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const keywords = event.target.value.split(',').map(k => k.trim()).filter(k => k);
    setFormData({ ...formData, keywords });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Cost Centers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Cost Center
        </Button>
      </Box>

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Keywords</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {costCenters.map((costCenter) => (
              <TableRow key={costCenter.code}>
                <TableCell>{costCenter.code}</TableCell>
                <TableCell>{costCenter.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {costCenter.keywords.map((keyword) => (
                      <Chip key={keyword} label={keyword} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpen(costCenter)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(costCenter.code)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {editingCostCenter ? 'Edit Cost Center' : 'Add Cost Center'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              fullWidth
              required
              disabled={!!editingCostCenter}
            />
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Keywords (comma-separated)"
              value={formData.keywords.join(', ')}
              onChange={handleKeywordsChange}
              fullWidth
              helperText="Enter keywords separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCostCenter ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CostCentersPage; 