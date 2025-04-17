/**
 * Mock data for development and testing when the backend is unavailable
 */

export const mockInvoices = {
  data: [
    {
      _id: "mock1",
      invoiceNumber: "INV-001",
      vendor: "Acme Inc",
      amount: 1250.99,
      currency: "GBP",
      status: "pending",
      issueDate: "2023-05-15",
      dueDate: "2023-06-15",
      processedDate: null,
      reconciled: false,
      tags: ["Office Supplies", "Q2"],
      notes: "Monthly office supplies",
      attachments: [],
      lineItems: [],
      costCenter: {
        code: "MKT",
        name: "Marketing",
        confidence: 0.95,
        predictedAt: "2023-05-15T10:30:00Z",
        manuallySet: false
      },
      categorization: {
        category: "Office Supplies",
        subcategory: "Stationery",
        confidence: 0.92,
        predictedAt: "2023-05-15T10:30:00Z",
        manuallySet: false,
        keywords: ["paper", "pens", "office"]
      },
      file: {
        originalName: "invoice-001.pdf",
        mimeType: "application/pdf",
        size: 124500
      },
      ocrResults: {
        confidence: 0.94,
        rawText: "Invoice details...",
        processedAt: "2023-05-15T10:30:00Z",
        extractedData: {
          detectedInvoiceNumber: "INV-001",
          detectedVendor: "Acme Inc",
          detectedAmount: 1250.99,
          detectedDate: "2023-05-15",
          confidence: {
            invoiceNumber: 0.97,
            vendor: 0.95,
            amount: 0.98,
            date: 0.96
          }
        }
      },
      xeroMatching: {
        status: "pending"
      },
      createdAt: "2023-05-15T10:30:00Z",
      updatedAt: "2023-05-15T10:30:00Z"
    },
    {
      _id: "mock2",
      invoiceNumber: "INV-002",
      vendor: "Tech Solutions Ltd",
      amount: 3499.50,
      currency: "GBP",
      status: "approved",
      issueDate: "2023-05-10",
      dueDate: "2023-06-10",
      processedDate: "2023-05-12T09:15:00Z",
      reconciled: true,
      tags: ["Software", "Subscription"],
      notes: "Annual software license renewal",
      attachments: [],
      lineItems: [],
      costCenter: {
        code: "ENG",
        name: "Engineering",
        confidence: 0.98,
        predictedAt: "2023-05-10T14:45:00Z",
        manuallySet: true
      },
      categorization: {
        category: "Software",
        subcategory: "Licenses",
        confidence: 0.97,
        predictedAt: "2023-05-10T14:45:00Z",
        manuallySet: true,
        keywords: ["license", "software", "annual"]
      },
      file: {
        originalName: "invoice-002.pdf",
        mimeType: "application/pdf",
        size: 156700
      },
      ocrResults: {
        confidence: 0.96,
        rawText: "Invoice details...",
        processedAt: "2023-05-10T14:45:00Z",
        extractedData: {
          detectedInvoiceNumber: "INV-002",
          detectedVendor: "Tech Solutions Ltd",
          detectedAmount: 3499.50,
          detectedDate: "2023-05-10",
          confidence: {
            invoiceNumber: 0.98,
            vendor: 0.97,
            amount: 0.99,
            date: 0.97
          }
        }
      },
      matchedTransactions: [
        {
          id: "tx123",
          reference: "INV-002",
          amount: 3499.50,
          date: "2023-05-12T09:15:00Z",
          confidence: 0.97
        }
      ],
      xeroMatching: {
        matchedTransactionId: "tx123",
        confidence: 0.97,
        matchedAt: "2023-05-12T09:15:00Z",
        status: "matched"
      },
      createdAt: "2023-05-10T14:45:00Z",
      updatedAt: "2023-05-12T09:15:00Z"
    },
    {
      _id: "mock3",
      invoiceNumber: "INV-003",
      vendor: "City Utilities",
      amount: 328.75,
      currency: "GBP",
      status: "paid",
      issueDate: "2023-05-01",
      dueDate: "2023-05-21",
      processedDate: "2023-05-05T11:20:00Z",
      reconciled: true,
      tags: ["Utilities"],
      notes: "Monthly utility bill",
      attachments: [],
      lineItems: [],
      costCenter: {
        code: "OPS",
        name: "Operations",
        confidence: 0.93,
        predictedAt: "2023-05-01T09:00:00Z",
        manuallySet: false
      },
      categorization: {
        category: "Utilities",
        subcategory: "Electricity",
        confidence: 0.94,
        predictedAt: "2023-05-01T09:00:00Z",
        manuallySet: false,
        keywords: ["electricity", "utility", "monthly"]
      },
      file: {
        originalName: "invoice-003.pdf",
        mimeType: "application/pdf",
        size: 98300
      },
      ocrResults: {
        confidence: 0.92,
        rawText: "Invoice details...",
        processedAt: "2023-05-01T09:00:00Z",
        extractedData: {
          detectedInvoiceNumber: "INV-003",
          detectedVendor: "City Utilities",
          detectedAmount: 328.75,
          detectedDate: "2023-05-01",
          confidence: {
            invoiceNumber: 0.94,
            vendor: 0.92,
            amount: 0.95,
            date: 0.93
          }
        }
      },
      matchedTransactions: [
        {
          id: "tx456",
          reference: "INV-003",
          amount: 328.75,
          date: "2023-05-05T11:20:00Z",
          confidence: 0.95
        }
      ],
      xeroMatching: {
        matchedTransactionId: "tx456",
        confidence: 0.95,
        matchedAt: "2023-05-05T11:20:00Z",
        status: "matched"
      },
      createdAt: "2023-05-01T09:00:00Z",
      updatedAt: "2023-05-05T11:20:00Z"
    },
    {
      _id: "mock4",
      invoiceNumber: "INV-004",
      vendor: "Marketing Experts",
      amount: 5750.00,
      currency: "GBP",
      status: "pending",
      issueDate: "2023-05-20",
      dueDate: "2023-06-19",
      processedDate: null,
      reconciled: false,
      tags: ["Marketing", "Campaign"],
      notes: "Q2 marketing campaign",
      attachments: [],
      lineItems: [],
      costCenter: {
        code: "MKT",
        name: "Marketing",
        confidence: 0.99,
        predictedAt: "2023-05-20T16:10:00Z",
        manuallySet: false
      },
      categorization: {
        category: "Marketing",
        subcategory: "Consulting",
        confidence: 0.96,
        predictedAt: "2023-05-20T16:10:00Z",
        manuallySet: false,
        keywords: ["campaign", "marketing", "consulting"]
      },
      file: {
        originalName: "invoice-004.pdf",
        mimeType: "application/pdf",
        size: 178900
      },
      ocrResults: {
        confidence: 0.95,
        rawText: "Invoice details...",
        processedAt: "2023-05-20T16:10:00Z",
        extractedData: {
          detectedInvoiceNumber: "INV-004",
          detectedVendor: "Marketing Experts",
          detectedAmount: 5750.00,
          detectedDate: "2023-05-20",
          confidence: {
            invoiceNumber: 0.96,
            vendor: 0.97,
            amount: 0.98,
            date: 0.95
          }
        }
      },
      xeroMatching: {
        status: "pending"
      },
      createdAt: "2023-05-20T16:10:00Z",
      updatedAt: "2023-05-20T16:10:00Z"
    },
    {
      _id: "mock5",
      invoiceNumber: "INV-005",
      vendor: "Furniture Plus",
      amount: 2199.99,
      currency: "GBP",
      status: "review",
      issueDate: "2023-05-18",
      dueDate: "2023-06-17",
      processedDate: null,
      reconciled: false,
      tags: ["Office Equipment"],
      notes: "New office chairs",
      attachments: [],
      lineItems: [],
      costCenter: {
        code: "ADM",
        name: "Administration",
        confidence: 0.87,
        predictedAt: "2023-05-18T13:25:00Z",
        manuallySet: false
      },
      categorization: {
        category: "Office Equipment",
        subcategory: "Furniture",
        confidence: 0.91,
        predictedAt: "2023-05-18T13:25:00Z",
        manuallySet: false,
        keywords: ["furniture", "chairs", "office"]
      },
      file: {
        originalName: "invoice-005.pdf",
        mimeType: "application/pdf",
        size: 145600
      },
      ocrResults: {
        confidence: 0.93,
        rawText: "Invoice details...",
        processedAt: "2023-05-18T13:25:00Z",
        extractedData: {
          detectedInvoiceNumber: "INV-005",
          detectedVendor: "Furniture Plus",
          detectedAmount: 2199.99,
          detectedDate: "2023-05-18",
          confidence: {
            invoiceNumber: 0.94,
            vendor: 0.92,
            amount: 0.95,
            date: 0.93
          }
        }
      },
      xeroMatching: {
        status: "pending"
      },
      createdAt: "2023-05-18T13:25:00Z",
      updatedAt: "2023-05-18T13:25:00Z"
    }
  ],
  page: 1,
  limit: 10,
  total: 5,
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
      id: "act1",
      type: "invoice_added",
      description: "Invoice INV-001 was added",
      timestamp: "2023-05-15T10:30:00Z"
    },
    {
      id: "act2",
      type: "invoice_approved",
      description: "Invoice INV-002 was approved",
      timestamp: "2023-05-12T09:15:00Z"
    },
    {
      id: "act3",
      type: "invoice_paid",
      description: "Invoice INV-003 was paid",
      timestamp: "2023-05-05T11:20:00Z"
    }
  ]
};

// Mock data for Xero integration
export const mockXeroIntegration = {
  status: {
    status: 'idle',
    isAuthenticated: false,
    connected: false,
    authUrl: null,
    tenantId: null,
    tenantName: null,
    tokenExpiry: null,
    error: null,
    loading: false,
    lastSync: null
  },
  authUrl: {
    url: 'https://login.xero.com/identity/connect/authorize?demo=true',
    isDemoMode: true,
    message: 'Demo mode: This would redirect to Xero in production'
  }
};

// Mock data for Xero invoices - REMOVED
export const mockXeroInvoices = [];

// Mock data for Xero bank transactions - REMOVED
export const mockXeroBankTransactions = []; 