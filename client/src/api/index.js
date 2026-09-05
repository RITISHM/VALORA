export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('valora_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const fetchWithCache = async (key, url) => {
  if (cache[key]) return cache[key];
  const response = await fetch(url, { headers: getAuthHeaders() });
  const data = await handleResponse(response);
  cache[key] = data;
  return data;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    console.error('Unauthorized access');
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data;
};

export const api = {
  // Users
  getUsers: async () => {
    const response = await fetch(`${BACKEND_URL}/auth/users`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  updateUser: async (id, userData) => {
    const response = await fetch(`${BACKEND_URL}/auth/users/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },
  deleteUser: async (id) => {
    const response = await fetch(`${BACKEND_URL}/auth/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Contacts
  getContacts: async () => fetchWithCache("contacts", `${BACKEND_URL}/contacts`),
  createContact: async (contact) => { clearCache("contacts");
    const response = await fetch(`${BACKEND_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...contact,
        type: contact.type ? contact.type.toUpperCase() : 'CUSTOMER'
      })
    });
    return handleResponse(response);
  },
  updateContact: async (id, contact) => { clearCache("contacts");
    const response = await fetch(`${BACKEND_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...contact,
        type: contact.type ? contact.type.toUpperCase() : 'CUSTOMER'
      })
    });
    return handleResponse(response);
  },
  deleteContact: async (id) => { clearCache("contacts");
    const response = await fetch(`${BACKEND_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Products
  getProducts: async () => fetchWithCache("products", `${BACKEND_URL}/products`),
  createProduct: async (product) => { clearCache("products");
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...product,
        type: product.type ? product.type.toUpperCase() : 'GOODS'
      })
    });
    return handleResponse(response);
  },
  updateProduct: async (id, product) => { clearCache("products");
    const response = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...product,
        type: product.type ? product.type.toUpperCase() : 'GOODS'
      })
    });
    return handleResponse(response);
  },
  deleteProduct: async (id) => { clearCache("products");
    const response = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Chart of Accounts
  getChartOfAccounts: async () => fetchWithCache("accounts", `${BACKEND_URL}/accounts`),
  createAccount: async (accountData) => { clearCache("accounts");
    const response = await fetch(`${BACKEND_URL}/accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(accountData)
    });
    return handleResponse(response);
  },

  // Journals
  getJournals: async () => {
    const response = await fetch(`${BACKEND_URL}/journals`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createJournal: async (journalData) => {
    const response = await fetch(`${BACKEND_URL}/journals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(journalData)
    });
    return handleResponse(response);
  },

  // Journal Entries
  getJournalEntries: async () => {
    const response = await fetch(`${BACKEND_URL}/journal-entries`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createJournalEntry: async (entryData) => {
    const response = await fetch(`${BACKEND_URL}/journal-entries`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(entryData)
    });
    return handleResponse(response);
  },

  // Sales Orders
  getSalesOrderById: async (id) => { const response = await fetch(`${BACKEND_URL}/sales-orders/${id}`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getSalesOrders: async () => {
    const response = await fetch(`${BACKEND_URL}/sales-orders`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createSalesOrder: async (soData) => {
    const response = await fetch(`${BACKEND_URL}/sales-orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(soData)
    });
    return handleResponse(response);
  },
  confirmSalesOrder: async (id) => {
    const response = await fetch(`${BACKEND_URL}/sales-orders/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  createInvoiceFromSalesOrder: async (id) => {
    const response = await fetch(`${BACKEND_URL}/sales-orders/${id}/create-invoice`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Customer Invoices
  getCustomerInvoiceById: async (id) => { const response = await fetch(`${BACKEND_URL}/customer-invoices/${id}`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getCustomerInvoices: async () => {
    const response = await fetch(`${BACKEND_URL}/customer-invoices`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createCustomerInvoice: async (invData) => {
    const response = await fetch(`${BACKEND_URL}/customer-invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(invData)
    });
    return handleResponse(response);
  },
  confirmCustomerInvoice: async (id) => {
    const response = await fetch(`${BACKEND_URL}/customer-invoices/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  payCustomerInvoice: async (id, paymentData) => {
    const response = await fetch(`${BACKEND_URL}/customer-invoices/${id}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
  },

  // Purchase Orders
  getPurchaseOrderById: async (id) => { const response = await fetch(`${BACKEND_URL}/purchase-orders/${id}`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getPurchaseOrders: async () => {
    const response = await fetch(`${BACKEND_URL}/purchase-orders`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createPurchaseOrder: async (poData) => {
    const response = await fetch(`${BACKEND_URL}/purchase-orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(poData)
    });
    return handleResponse(response);
  },
  confirmPurchaseOrder: async (id) => {
    const response = await fetch(`${BACKEND_URL}/purchase-orders/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Vendor Bills
  getVendorBillById: async (id) => { const response = await fetch(`${BACKEND_URL}/vendor-bills/${id}`, { headers: getAuthHeaders() }); return handleResponse(response); },
  getVendorBills: async () => {
    const response = await fetch(`${BACKEND_URL}/vendor-bills`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createVendorBill: async (billData) => {
    const response = await fetch(`${BACKEND_URL}/vendor-bills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(billData)
    });
    return handleResponse(response);
  },
  confirmVendorBill: async (id) => {
    const response = await fetch(`${BACKEND_URL}/vendor-bills/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },
  payVendorBill: async (id, paymentData) => {
    const response = await fetch(`${BACKEND_URL}/vendor-bills/${id}/pay`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
  },

  // Payments
  getPayments: async () => {
    const response = await fetch(`${BACKEND_URL}/payments`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createPayment: async (paymentData) => {
    const response = await fetch(`${BACKEND_URL}/payments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData)
    });
    return handleResponse(response);
  },

  // Analytic Accounts & Budgets
  getAnalyticAccounts: async () => fetchWithCache("analyticAccounts", `${BACKEND_URL}/analytic-accounts`),
  createAnalyticAccount: async (data) => { clearCache("analyticAccounts");
    const response = await fetch(`${BACKEND_URL}/analytic-accounts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },
  getBudgets: async () => fetchWithCache("budgets", `${BACKEND_URL}/budgets`),
  createBudget: async (data) => { clearCache("budgets");
    const response = await fetch(`${BACKEND_URL}/budgets`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  // Reports
  getBalanceSheet: async (year = new Date().getFullYear()) => {
    const response = await fetch(`${BACKEND_URL}/reports/balance-sheet?year=${year}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getProfitAndLoss: async (year = new Date().getFullYear()) => {
    const response = await fetch(`${BACKEND_URL}/reports/profit-and-loss?year=${year}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getDashboardAnalytics: async () => {
    const response = await fetch(`${BACKEND_URL}/reports/dashboard`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  getBudgetReport: async () => {
    const response = await fetch(`${BACKEND_URL}/reports/budget`, { headers: getAuthHeaders() });
    return handleResponse(response);
  }
};
