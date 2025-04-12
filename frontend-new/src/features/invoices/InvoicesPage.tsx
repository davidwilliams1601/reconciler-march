import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { fetchInvoices, reconcileInvoice, FetchInvoicesParams } from './invoicesSlice';
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
  TablePagination,
  TextField,
  Button,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Visibility as VisibilityIcon, 
  Sync as SyncIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Invoice } from './invoicesSlice';
import CostCenterTrainingDialog from './CostCenterTrainingDialog';
import InvoiceDetails from './InvoiceDetails';

const InvoicesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: invoices, pagination, status, error } = useAppSelector((state) => state.invoices);
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Filtering and pagination state
  const [filters, setFilters] = useState<FetchInvoicesParams>({
    page: 1,
    limit: 10,
    status: '',
    vendor: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    dispatch(fetchInvoices(filters));
  }, [filters, dispatch]);

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
  
  const handleReconcileClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setReconcileDialogOpen(true);
  };
  
  const handleReconcileClose = () => {
    setReconcileDialogOpen(false);
    setSelectedInvoice(null);
    setTransactionId('');
  };
  
  const handleReconcileSubmit = async () => {
    if (!selectedInvoice || !transactionId) return;
    
    try {
      await dispatch(reconcileInvoice({
        invoiceId: selectedInvoice._id,
        transactionId,
        updateCostCenter: true
      })).unwrap();
      
      setSnackbarMessage('Invoice reconciled successfully');
      setSnackbarOpen(true);
      handleReconcileClose();
    } catch (err) {
      setSnackbarMessage('Failed to reconcile invoice');
      setSnackbarOpen(true);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      limit: parseInt(event.target.value, 10),
      page: 1
    }));
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };
  
  const handleStatusChange = (e: any) => {
    setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
  };
  
  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      status: '',
      vendor: '',
      fromDate: '',
      toDate: ''
    });
  };

  if (status === 'loading' && (!invoices || invoices.length === 0)) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && (!invoices || invoices.length === 0)) {
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
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              name="vendor"
              label="Vendor"
              value={filters.vendor || ''}
              onChange={handleFilterChange}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="review">Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="reconciled">Reconciled</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              name="fromDate"
              label="From Date"
              type="date"
              value={filters.fromDate || ''}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              name="toDate"
              label="To Date"
              type="date"
              value={filters.toDate || ''}
              onChange={handleFilterChange}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                startIcon={<SearchIcon />}
                onClick={() => dispatch(fetchInvoices(filters))}
              >
                Search
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<ClearIcon />}
                onClick={clearFilters}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Invoice Number</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Cost Center</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Xero Match</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {status === 'loading' ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <CircularProgress size={24} sx={{ my: 2 }} />
                </TableCell>
              </TableRow>
            ) : invoices && invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              Array.isArray(invoices) && invoices.length > 0 ? invoices.map((invoice: Invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.vendor}</TableCell>
                  <TableCell>{invoice.currency} {invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {invoice.costCenter?.code ? (
                        <Chip
                          label={invoice.costCenter.code}
                          size="small"
                          color={invoice.costCenter.manuallySet ? "success" : "default"}
                          variant={invoice.costCenter.manuallySet ? "filled" : "outlined"}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not assigned
                        </Typography>
                      )}
                      {invoice.costCenter && !invoice.costCenter.manuallySet && (
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
                    <Chip
                      label={invoice.status}
                      size="small"
                      color={
                        invoice.status === 'reconciled' ? 'success' :
                        invoice.status === 'review' ? 'warning' :
                        invoice.status === 'approved' ? 'info' : 
                        invoice.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {invoice.matchedTransactions && invoice.matchedTransactions.length > 0 ? (
                      <Chip 
                        label="Matched" 
                        color="success" 
                        size="small" 
                      />
                    ) : (
                      <Chip 
                        label="No match" 
                        color="error" 
                        size="small" 
                        variant="outlined" 
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleDetailsClick(invoice)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {invoice.status !== 'reconciled' && (
                        <Tooltip title="Reconcile with Xero">
                          <IconButton
                            size="small"
                            onClick={() => handleReconcileClick(invoice)}
                          >
                            <SyncIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No invoices available
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={pagination.total}
          rowsPerPage={pagination.limit}
          page={pagination.page - 1}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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
          <Dialog open={reconcileDialogOpen} onClose={handleReconcileClose}>
            <DialogTitle>Reconcile Invoice with Xero</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1 }}>
                <Typography gutterBottom>
                  Enter the Xero transaction ID to reconcile with invoice <strong>{selectedInvoice.invoiceNumber}</strong>
                </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Xero Transaction ID"
                  fullWidth
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleReconcileClose}>Cancel</Button>
              <Button 
                onClick={handleReconcileSubmit} 
                variant="contained" 
                disabled={!transactionId}
              >
                Reconcile
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default InvoicesPage; 