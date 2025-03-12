import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { RootState, AppDispatch } from '../../store';
import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from '../../store/slices/invoiceSlice';

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  currency: string;
  status: 'pending' | 'review' | 'approved' | 'rejected';
  issueDate: string;
  dueDate?: string;
  description?: string;
  notes?: string;
}

const Invoices: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { invoices, loading } = useSelector((state: RootState) => state.invoices);
  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    vendor: '',
    amount: 0,
    currency: 'GBP',
    status: 'pending',
    issueDate: '',
    dueDate: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  useEffect(() => {
    if (selectedInvoice) {
      setFormData(selectedInvoice);
    } else {
      setFormData({
        invoiceNumber: '',
        vendor: '',
        amount: 0,
        currency: 'GBP',
        status: 'pending',
        issueDate: '',
        dueDate: '',
        description: '',
        notes: '',
      });
    }
  }, [selectedInvoice]);

  const handleOpen = (invoice?: Invoice) => {
    setSelectedInvoice(invoice || null);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedInvoice(null);
    setOpen(false);
    setFormData({
      invoiceNumber: '',
      vendor: '',
      amount: 0,
      currency: 'GBP',
      status: 'pending',
      issueDate: '',
      dueDate: '',
      description: '',
      notes: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (selectedInvoice) {
      await dispatch(updateInvoice({ ...formData, id: selectedInvoice.id } as Invoice));
    } else {
      await dispatch(createInvoice(formData as Omit<Invoice, 'id'>));
    }
    handleClose();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await dispatch(deleteInvoice(id));
    }
  };

  const columns: GridColDef[] = [
    { field: 'invoiceNumber', headerName: 'Invoice Number', flex: 1 },
    { field: 'vendor', headerName: 'Vendor', flex: 1 },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Typography>
          {new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: params.row.currency,
          }).format(params.row.amount)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => {
        const statusColors: Record<string, string> = {
          pending: 'warning.main',
          review: 'info.main',
          approved: 'success.main',
          rejected: 'error.main',
        };
        return (
          <Typography sx={{ color: statusColors[params.row.status] }}>
            {params.row.status.charAt(0).toUpperCase() + params.row.status.slice(1)}
          </Typography>
        );
      },
    },
    {
      field: 'issueDate',
      headerName: 'Issue Date',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        format(new Date(params.row.issueDate), 'dd/MM/yyyy'),
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      flex: 1,
      renderCell: (params: GridRenderCellParams) =>
        params.row.dueDate
          ? format(new Date(params.row.dueDate), 'dd/MM/yyyy')
          : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <IconButton
            color="primary"
            size="small"
            onClick={() => handleOpen(params.row)}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            color="error"
            size="small"
            onClick={() => handleDelete(params.row.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Invoices</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Invoice
        </Button>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 200px)', width: '100%' }}>
        <DataGrid
          rows={invoices}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          getRowId={(row: Invoice) => row.id}
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedInvoice ? 'Edit Invoice' : 'Add Invoice'}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: 'repeat(2, 1fr)',
              mt: 2,
            }}
          >
            <TextField
              label="Invoice Number"
              name="invoiceNumber"
              required
              fullWidth
              value={formData.invoiceNumber}
              onChange={handleInputChange}
            />
            <TextField
              label="Vendor"
              name="vendor"
              required
              fullWidth
              value={formData.vendor}
              onChange={handleInputChange}
            />
            <TextField
              label="Amount"
              name="amount"
              required
              fullWidth
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
            />
            <TextField
              label="Currency"
              name="currency"
              select
              required
              fullWidth
              value={formData.currency}
              onChange={handleInputChange}
            >
              <MenuItem value="GBP">GBP</MenuItem>
              <MenuItem value="USD">USD</MenuItem>
              <MenuItem value="EUR">EUR</MenuItem>
            </TextField>
            <TextField
              label="Status"
              name="status"
              select
              required
              fullWidth
              value={formData.status}
              onChange={handleInputChange}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
            <TextField
              label="Issue Date"
              name="issueDate"
              type="date"
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.issueDate}
              onChange={handleInputChange}
            />
            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={handleInputChange}
            />
            <TextField
              label="Description"
              name="description"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={handleInputChange}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="Notes"
              name="notes"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleInputChange}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices; 