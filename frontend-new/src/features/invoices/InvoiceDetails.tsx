import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import CostCenterTrainingDialog from './CostCenterTrainingDialog';
import api from '../../services/api';

interface LineItem {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  costCenter: {
    code: string;
    name: string;
    confidence: number;
    predictedAt: string;
    manuallySet: boolean;
  };
  categorization: {
    category: string;
    subcategory: string;
    confidence: number;
    predictedAt: string;
    manuallySet: boolean;
    keywords: string[];
  };
}

interface InvoiceDetailsProps {
  open: boolean;
  onClose: () => void;
  invoice: {
    _id: string;
    invoiceNumber: string;
    vendor: string;
    amount: number;
    currency: string;
    issueDate: string;
    lineItems?: LineItem[];
    costCenter: {
      code: string;
      name: string;
      confidence: number;
      predictedAt: string;
      manuallySet: boolean;
    };
    categorization: {
      category: string;
      subcategory: string;
      confidence: number;
      predictedAt: string;
      manuallySet: boolean;
      keywords: string[];
    };
  };
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  open,
  onClose,
  invoice,
}) => {
  const [selectedLineItem, setSelectedLineItem] = useState<LineItem | null>(null);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleTrainingClick = (lineItem: LineItem) => {
    setSelectedLineItem(lineItem);
    setTrainingDialogOpen(true);
  };

  const handleTrainingClose = () => {
    setTrainingDialogOpen(false);
    setSelectedLineItem(null);
  };

  const handleCostCenterUpdate = async (lineItemId: string, costCenter: { code: string; name: string }) => {
    try {
      await api.put(`/invoices/${invoice._id}/line-items/${lineItemId}/cost-center`, {
        costCenter,
      });
      setSuccess('Cost center updated successfully');
      onClose();
    } catch (err) {
      setError('Failed to update cost center');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Invoice Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Typography>Invoice Number: {invoice.invoiceNumber}</Typography>
          <Typography>Vendor: {invoice.vendor}</Typography>
          <Typography>Amount: {invoice.currency} {invoice.amount.toFixed(2)}</Typography>
          <Typography>Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Cost Center
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography variant="body2">
                {invoice.costCenter.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Confidence: {(invoice.costCenter.confidence * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Overall Categorization
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
              {invoice.categorization.category}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {invoice.categorization.subcategory}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Confidence: {(invoice.categorization.confidence * 100).toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        {invoice.lineItems && invoice.lineItems.length > 0 ? (
          <>
            <Typography variant="h6" gutterBottom>
              Line Items
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Cost Center</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.lineItems.map((lineItem) => (
                    <TableRow key={lineItem._id}>
                      <TableCell>{lineItem.description}</TableCell>
                      <TableCell align="right">{lineItem.quantity}</TableCell>
                      <TableCell align="right">{lineItem.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">{lineItem.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2">
                              {lineItem.costCenter.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Confidence: {(lineItem.costCenter.confidence * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                          {!lineItem.costCenter.manuallySet && (
                            <Tooltip title="Train model with correct cost center">
                              <IconButton
                                size="small"
                                onClick={() => handleTrainingClick(lineItem)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2">
                            {lineItem.categorization.category}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {lineItem.categorization.subcategory}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Confidence: {(lineItem.categorization.confidence * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {/* Add any additional actions here */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : (
          <Typography color="textSecondary">
            No line items available for this invoice.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {selectedLineItem && (
        <CostCenterTrainingDialog
          open={trainingDialogOpen}
          onClose={handleTrainingClose}
          invoiceId={invoice._id}
          lineItemId={selectedLineItem._id}
          currentCostCenter={selectedLineItem.costCenter}
        />
      )}
    </Dialog>
  );
};

export default InvoiceDetails; 