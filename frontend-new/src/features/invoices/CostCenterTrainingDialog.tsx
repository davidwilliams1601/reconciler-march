import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import api from '../../services/api';

interface CostCenterTrainingDialogProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  lineItemId?: string;
  currentCostCenter: {
    code: string;
    name: string;
    confidence: number;
    predictedAt: string;
    manuallySet: boolean;
  };
}

const CostCenterTrainingDialog: React.FC<CostCenterTrainingDialogProps> = ({
  open,
  onClose,
  invoiceId,
  lineItemId,
  currentCostCenter,
}) => {
  const [costCenters, setCostCenters] = useState<Array<{ code: string; name: string }>>([]);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCostCenters();
      setSelectedCostCenter(currentCostCenter.code || '');
    }
  }, [open, currentCostCenter.code]);

  const fetchCostCenters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/settings/cost-centers');
      setCostCenters(response.data);
    } catch (err) {
      setError('Failed to fetch cost centers');
      console.error('Error fetching cost centers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const endpoint = lineItemId
        ? `/invoices/${invoiceId}/line-items/${lineItemId}/train`
        : `/invoices/${invoiceId}/train`;

      await api.post(endpoint, {
        costCenter: {
          code: selectedCostCenter,
          name: costCenters.find(cc => cc.code === selectedCostCenter)?.name || '',
        },
      });
      setSuccess(true);
      onClose();
    } catch (err) {
      setError('Failed to train the model');
      console.error('Error training model:', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Train Cost Center Model</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Current Prediction:
          </Typography>
          <Typography variant="body1">
            {currentCostCenter.name} ({currentCostCenter.code})
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Confidence: {(currentCostCenter.confidence * 100).toFixed(1)}%
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth>
          <InputLabel>Select Correct Cost Center</InputLabel>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <Select
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              label="Select Correct Cost Center"
            >
              {costCenters.map((costCenter) => (
                <MenuItem key={costCenter.code} value={costCenter.code}>
                  {costCenter.name} ({costCenter.code})
                </MenuItem>
              ))}
            </Select>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedCostCenter || selectedCostCenter === currentCostCenter.code || loading}
        >
          Train Model
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CostCenterTrainingDialog; 