/**
 * Mock data for settings and organization related endpoints
 */

export const mockSettings = {
  xero: {
    connected: true,
    clientId: "MOCK_CLIENT_ID",
    clientSecret: "********",
    redirectUri: "https://example.com/callback",
    scopes: ["accounting.transactions", "accounting.settings"],
    tokenSet: {
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      expires_at: new Date().getTime() + 3600000
    }
  },
  dext: {
    connected: true,
    apiKey: "********",
    baseUrl: "https://api.dext.com/v1"
  },
  googleVision: {
    enabled: true,
    apiKey: "********"
  },
  reconciliation: {
    autoReconcile: true,
    matchThreshold: 0.85,
    categories: ["Office Supplies", "Travel", "Marketing", "Software", "Hardware"]
  }
};

export const mockOrganization = {
  _id: "org123",
  name: "Acme Corporation",
  address: {
    line1: "123 Business Street",
    line2: "Suite 100",
    city: "London",
    state: "Greater London",
    postalCode: "EC1A 1BB",
    country: "United Kingdom"
  },
  contactEmail: "accounts@acmecorp.example",
  phone: "+44 20 1234 5678",
  taxId: "GB123456789",
  logoUrl: "https://via.placeholder.com/150",
  settings: {
    currency: "GBP",
    fiscalYearEnd: "12-31"
  },
  createdAt: "2022-01-01T00:00:00Z",
  updatedAt: "2023-04-15T10:30:00Z"
};

export const mockEmailProcessing = {
  enabled: true,
  connectedEmail: "invoices@acmecorp.example",
  processingRules: [
    {
      _id: "rule1",
      name: "Vendor Detection",
      description: "Detect vendor from email address domain",
      condition: "FROM_DOMAIN",
      action: "TAG_VENDOR",
      enabled: true
    },
    {
      _id: "rule2",
      name: "Invoice Attachment",
      description: "Process PDF attachments as invoices",
      condition: "HAS_PDF_ATTACHMENT",
      action: "PROCESS_AS_INVOICE",
      enabled: true
    }
  ],
  processingSchedule: "REALTIME",
  lastProcessedDate: "2023-05-20T15:45:00Z",
  stats: {
    totalProcessed: 247,
    successRate: 0.93,
    averageProcessingTime: 12.5
  }
};

export const mockCostCenters = {
  items: [
    {
      _id: "cc1",
      name: "Marketing",
      code: "MKT",
      description: "Marketing department expenses",
      manager: "Jane Smith",
      budget: 150000,
      currency: "GBP",
      active: true
    },
    {
      _id: "cc2",
      name: "Engineering",
      code: "ENG",
      description: "Engineering department expenses",
      manager: "John Doe",
      budget: 200000,
      currency: "GBP",
      active: true
    },
    {
      _id: "cc3",
      name: "Operations",
      code: "OPS",
      description: "Operations department expenses",
      manager: "Sarah Johnson",
      budget: 120000,
      currency: "GBP",
      active: true
    },
    {
      _id: "cc4",
      name: "Sales",
      code: "SLS",
      description: "Sales department expenses",
      manager: "Michael Brown",
      budget: 180000,
      currency: "GBP",
      active: true
    },
    {
      _id: "cc5",
      name: "Administration",
      code: "ADM",
      description: "Administrative expenses",
      manager: "Robert Wilson",
      budget: 90000,
      currency: "GBP",
      active: true
    }
  ],
  total: 5
}; 