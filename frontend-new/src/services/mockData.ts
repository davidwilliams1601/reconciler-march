/**
 * Mock data for development and testing when the backend is unavailable
 */

export const mockInvoices = {
  items: [
    {
      _id: "mock1",
      invoiceNumber: "INV-001",
      vendor: "Acme Inc",
      amount: 1250.99,
      currency: "GBP",
      status: "Pending",
      issueDate: "2023-05-15",
      dueDate: "2023-06-15",
      processedDate: null,
      reconciled: false,
      tags: ["Office Supplies", "Q2"],
      notes: "Monthly office supplies",
      attachments: [],
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-05-15T10:30:00Z"
    },
    {
      _id: "mock2",
      invoiceNumber: "INV-002",
      vendor: "Tech Solutions Ltd",
      amount: 3499.50,
      currency: "GBP",
      status: "Approved",
      issueDate: "2023-05-10",
      dueDate: "2023-06-10",
      processedDate: "2023-05-12T09:15:00Z",
      reconciled: true,
      tags: ["Software", "Subscription"],
      notes: "Annual software license renewal",
      attachments: [],
      createdAt: "2023-05-10T14:45:00Z",
      updatedAt: "2023-05-12T09:15:00Z"
    },
    {
      _id: "mock3",
      invoiceNumber: "INV-003",
      vendor: "City Utilities",
      amount: 328.75,
      currency: "GBP",
      status: "Paid",
      issueDate: "2023-05-01",
      dueDate: "2023-05-21",
      processedDate: "2023-05-05T11:20:00Z",
      reconciled: true,
      tags: ["Utilities"],
      notes: "Monthly utility bill",
      attachments: [],
      createdAt: "2023-05-01T09:00:00Z",
      updatedAt: "2023-05-05T11:20:00Z"
    },
    {
      _id: "mock4",
      invoiceNumber: "INV-004",
      vendor: "Marketing Experts",
      amount: 5750.00,
      currency: "GBP",
      status: "Pending",
      issueDate: "2023-05-20",
      dueDate: "2023-06-19",
      processedDate: null,
      reconciled: false,
      tags: ["Marketing", "Campaign"],
      notes: "Q2 marketing campaign",
      attachments: [],
      createdAt: "2023-05-20T16:10:00Z",
      updatedAt: "2023-05-20T16:10:00Z"
    },
    {
      _id: "mock5",
      invoiceNumber: "INV-005",
      vendor: "Furniture Plus",
      amount: 2199.99,
      currency: "GBP",
      status: "Review",
      issueDate: "2023-05-18",
      dueDate: "2023-06-17",
      processedDate: null,
      reconciled: false,
      tags: ["Office Equipment"],
      notes: "New office chairs",
      attachments: [],
      createdAt: "2023-05-18T13:25:00Z",
      updatedAt: "2023-05-18T13:25:00Z"
    }
  ],
  total: 5,
  page: 1,
  limit: 10,
  totalPages: 1
};

export const mockDashboardStats = {
  totalInvoices: 150,
  processedInvoices: 125,
  pendingInvoices: 25,
  totalAmount: 45750.25,
  currency: "GBP",
  recentActivity: [
    {
      _id: "act1",
      action: "Invoice Added",
      invoiceNumber: "INV-001",
      amount: 1250.99,
      date: "2023-05-15T10:30:00Z"
    },
    {
      _id: "act2",
      action: "Invoice Approved",
      invoiceNumber: "INV-002",
      amount: 3499.50,
      date: "2023-05-12T09:15:00Z"
    },
    {
      _id: "act3",
      action: "Invoice Paid",
      invoiceNumber: "INV-003",
      amount: 328.75,
      date: "2023-05-05T11:20:00Z"
    }
  ]
}; 