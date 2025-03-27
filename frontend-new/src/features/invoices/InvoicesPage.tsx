import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchInvoices } from './invoicesSlice';
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
  CircularProgress,
  Alert,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { Invoice } from './invoicesSlice';
import CostCenterTrainingDialog from './CostCenterTrainingDialog';
import InvoiceDetails from './InvoiceDetails';

const InvoicesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: invoices, status, error } = useAppSelector((state) => state.invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchInvoices());
    }
  }, [status, dispatch]);

  const handleTrainingClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setTrainingDialogOpen(true);
  };

  const handleTrainingClose = () => {
    setTrainingDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDetailsClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDetailsDialogOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsDialogOpen(false);
    setSelectedInvoice(null);
  };

  if (status === 'loading') {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Invoices
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice Number</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Cost Center</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Xero Match</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((invoice: Invoice) => (
              <TableRow key={invoice._id}>
                <TableCell>{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.vendor}</TableCell>
                <TableCell>£{invoice.amount.toFixed(2)}</TableCell>
                <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Typography variant="body2">
                        {invoice.costCenter.name}
                      </Typography>
                      <Chip
                        label={invoice.costCenter.code}
                        size="small"
                        color={invoice.costCenter.manuallySet ? "success" : "default"}
                        variant={invoice.costCenter.manuallySet ? "filled" : "outlined"}
                      />
                    </Box>
                    {!invoice.costCenter.manuallySet && (
                      <Tooltip title="Train model with correct cost center">
                        <IconButton
                          size="small"
                          onClick={() => handleTrainingClick(invoice)}
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
                      {invoice.categorization.category}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {invoice.categorization.subcategory}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{invoice.status}</TableCell>
                <TableCell>
                  {invoice.xeroMatching.status === 'matched' && (
                    <Typography color="success.main">Matched</Typography>
                  )}
                  {invoice.xeroMatching.status === 'multiple_matches' && (
                    <Typography color="warning.main">Multiple Matches</Typography>
                  )}
                  {invoice.xeroMatching.status === 'pending' && (
                    <Typography color="info.main">Pending</Typography>
                  )}
                  {invoice.xeroMatching.status === 'no_match' && (
                    <Typography color="error.main">No Match</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleDetailsClick(invoice)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedInvoice && (
        <>
          <CostCenterTrainingDialog
            open={trainingDialogOpen}
            onClose={handleTrainingClose}
            invoiceId={selectedInvoice._id}
            currentCostCenter={selectedInvoice.costCenter}
          />
          <InvoiceDetails
            open={detailsDialogOpen}
            onClose={handleDetailsClose}
            invoice={selectedInvoice}
          />
        </>
      )}
    </Container>
  );
};

export default InvoicesPage; 