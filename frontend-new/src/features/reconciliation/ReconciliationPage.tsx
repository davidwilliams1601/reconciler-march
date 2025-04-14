import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TablePagination,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Search,
  Refresh,
  CheckCircle,
  Cancel,
  LinkOff,
  Link as LinkIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import api from '../../services/api';

const ReconciliationPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [bankTransactions, setBankTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reconciliationStatus, setReconciliationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [reconciliationMessage, setReconciliationMessage] = useState('');
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({ key: 'Date', direction: 'desc' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch invoices and bank transactions in parallel
      const [invoicesResponse, transactionsResponse] = await Promise.all([
        api.get('/api/xero/invoices'),
        api.get('/api/xero/bank-transactions')
      ]);
      
      setInvoices(invoicesResponse.data || []);
      setBankTransactions(transactionsResponse.data || []);
    } catch (err) {
      console.error('Failed to fetch reconciliation data:', err);
      setError('Failed to load reconciliation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIcon = (columnName: string) => {
    if (sortConfig.key !== columnName) return null;
    return sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
  };

  const selectInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    if (selectedTransaction) {
      setOpenDialog(true);
    }
  };

  const selectTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    if (selectedInvoice) {
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleReconcile = async () => {
    if (!selectedInvoice || !selectedTransaction) return;
    
    try {
      setReconciliationStatus('loading');
      
      const response = await api.post('/api/xero/reconcile', {
        invoice_id: selectedInvoice.InvoiceID,
        bank_transaction_id: selectedTransaction.BankTransactionID
      });
      
      setReconciliationStatus('success');
      setReconciliationMessage('Invoice successfully reconciled with bank transaction');
      
      // Refresh data after reconciliation
      fetchData();
      
      // Close dialog after a short delay
      setTimeout(() => {
        setOpenDialog(false);
        setSelectedInvoice(null);
        setSelectedTransaction(null);
        setReconciliationStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to reconcile:', err);
      setReconciliationStatus('error');
      setReconciliationMessage('Failed to reconcile invoice with bank transaction');
    }
  };

  // Filter and sort invoices
  const filteredInvoices = invoices
    .filter(invoice => 
      invoice.InvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.Contact?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(invoice.Total).includes(searchTerm)
    )
    .sort((a, b) => {
      const key = sortConfig.key;
      
      if (key === 'Contact') {
        const aValue = a.Contact?.Name || '';
        const bValue = b.Contact?.Name || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (key === 'Date' || key === 'DueDate') {
        const aValue = new Date(a[key] || 0).getTime();
        const bValue = new Date(b[key] || 0).getTime();
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (key === 'Total' || key === 'AmountDue') {
        const aValue = parseFloat(a[key] || 0);
        const bValue = parseFloat(b[key] || 0);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aValue = a[key] || '';
      const bValue = b[key] || '';
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // Filter bank transactions based on search term
  const filteredTransactions = bankTransactions
    .filter(transaction => 
      transaction.Contact?.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(transaction.Total).includes(searchTerm)
    )
    .sort((a, b) => {
      const key = sortConfig.key === 'Date' ? 'Date' : sortConfig.key;
      
      if (key === 'Contact') {
        const aValue = a.Contact?.Name || '';
        const bValue = b.Contact?.Name || '';
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (key === 'Date') {
        const aValue = new Date(a[key] || 0).getTime();
        const bValue = new Date(b[key] || 0).getTime();
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (key === 'Total') {
        const aValue = parseFloat(a[key] || 0);
        const bValue = parseFloat(b[key] || 0);
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aValue = a[key] || '';
      const bValue = b[key] || '';
      return sortConfig.direction === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  // Paginate invoices
  const paginatedInvoices = filteredInvoices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Format currency
  const formatCurrency = (amount: number, currencyCode: string = 'GBP') => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Xero Reconciliation
      </Typography>
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Invoices Table */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Invoices
          </Typography>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort('InvoiceNumber')} sx={{ cursor: 'pointer' }}>
                      Invoice # {getSortIcon('InvoiceNumber')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Contact')} sx={{ cursor: 'pointer' }}>
                      Vendor {getSortIcon('Contact')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Date')} sx={{ cursor: 'pointer' }}>
                      Date {getSortIcon('Date')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('DueDate')} sx={{ cursor: 'pointer' }}>
                      Due Date {getSortIcon('DueDate')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Total')} sx={{ cursor: 'pointer' }}>
                      Total {getSortIcon('Total')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Status')} sx={{ cursor: 'pointer' }}>
                      Status {getSortIcon('Status')}
                    </TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((invoice) => (
                      <TableRow 
                        key={invoice.InvoiceID}
                        selected={selectedInvoice?.InvoiceID === invoice.InvoiceID}
                        hover
                      >
                        <TableCell>{invoice.InvoiceNumber}</TableCell>
                        <TableCell>{invoice.Contact?.Name}</TableCell>
                        <TableCell>{formatDate(invoice.Date)}</TableCell>
                        <TableCell>{formatDate(invoice.DueDate)}</TableCell>
                        <TableCell>{formatCurrency(invoice.Total, invoice.CurrencyCode)}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={invoice.Status} 
                            color={invoice.Status === 'PAID' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={selectedInvoice?.InvoiceID === invoice.InvoiceID ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => selectInvoice(invoice)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No invoices found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredInvoices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
        
        {/* Bank Transactions */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Bank Transactions
          </Typography>
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort('Date')} sx={{ cursor: 'pointer' }}>
                      Date {getSortIcon('Date')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Contact')} sx={{ cursor: 'pointer' }}>
                      Payee {getSortIcon('Contact')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('Total')} sx={{ cursor: 'pointer' }}>
                      Amount {getSortIcon('Total')}
                    </TableCell>
                    <TableCell>
                      Account
                    </TableCell>
                    <TableCell onClick={() => handleSort('IsReconciled')} sx={{ cursor: 'pointer' }}>
                      Reconciled {getSortIcon('IsReconciled')}
                    </TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.BankTransactionID}
                        selected={selectedTransaction?.BankTransactionID === transaction.BankTransactionID}
                        hover
                      >
                        <TableCell>{formatDate(transaction.Date)}</TableCell>
                        <TableCell>{transaction.Contact?.Name}</TableCell>
                        <TableCell>{formatCurrency(transaction.Total)}</TableCell>
                        <TableCell>{transaction.BankAccount?.Name}</TableCell>
                        <TableCell>
                          {transaction.IsReconciled ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="action" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant={selectedTransaction?.BankTransactionID === transaction.BankTransactionID ? "contained" : "outlined"}
                            color="primary"
                            onClick={() => selectTransaction(transaction)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No bank transactions found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Reconciliation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md">
        <DialogTitle>
          Reconcile Invoice with Bank Transaction
        </DialogTitle>
        <DialogContent>
          {reconciliationStatus === 'loading' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : reconciliationStatus === 'success' ? (
            <Alert severity="success" sx={{ my: 2 }}>
              {reconciliationMessage}
            </Alert>
          ) : reconciliationStatus === 'error' ? (
            <Alert severity="error" sx={{ my: 2 }}>
              {reconciliationMessage}
            </Alert>
          ) : (
            <>
              <DialogContentText>
                Are you sure you want to reconcile the following invoice with this bank transaction?
              </DialogContentText>
              
              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Invoice
                    </Typography>
                    {selectedInvoice && (
                      <Box>
                        <Typography variant="body2">
                          <strong>Number:</strong> {selectedInvoice.InvoiceNumber}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Vendor:</strong> {selectedInvoice.Contact?.Name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(selectedInvoice.Date)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Due Date:</strong> {formatDate(selectedInvoice.DueDate)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Amount:</strong> {formatCurrency(selectedInvoice.Total, selectedInvoice.CurrencyCode)}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Bank Transaction
                    </Typography>
                    {selectedTransaction && (
                      <Box>
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(selectedTransaction.Date)}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Payee:</strong> {selectedTransaction.Contact?.Name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Account:</strong> {selectedTransaction.BankAccount?.Name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Amount:</strong> {formatCurrency(selectedTransaction.Total)}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
              
              {selectedInvoice && selectedTransaction && (
                <Box sx={{ mt: 3 }}>
                  {Math.abs(selectedInvoice.Total - selectedTransaction.Total) > 0.01 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">
                        Amount Mismatch Detected
                      </Typography>
                      <Typography variant="body2">
                        The invoice amount ({formatCurrency(selectedInvoice.Total)}) does not match the bank transaction amount ({formatCurrency(selectedTransaction.Total)}).
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={reconciliationStatus === 'loading'}>
            Cancel
          </Button>
          <Button 
            onClick={handleReconcile} 
            variant="contained" 
            color="primary"
            startIcon={<LinkIcon />}
            disabled={reconciliationStatus !== 'idle'}
          >
            Reconcile
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ReconciliationPage; 