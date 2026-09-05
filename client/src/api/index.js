/**
 * @file index.js
 * @description Centralized API client service module for communicating with the Valora ERP backend.
 * Encapsulates authentication headers, response parsing, error handling, and domain-specific
 * HTTP request methods for Contacts, Products, Accounting, and Financial Reports.
 * @module api
 */

/**
 * Base URL for all backend HTTP requests.
 * Uses VITE_BACKEND_URL environment variable with fallback to local port 5000.
 * @type {string}
 */
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Retrieves standard authorization and content headers for API requests.
 * Extracts stored JWT token from localStorage if present.
 * 
 * @function getAuthHeaders
 * @returns {Record<string, string>} Header object with Content-Type and optional Bearer Authorization.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('valora_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Global response handler for fetch promises.
 * Processes 204 No Content, logs 401 Unauthorized, checks HTTP status, and extracts JSON data.
 * 
 * @async
 * @function handleResponse
 * @param {Response} response - Native Fetch Response object.
 * @returns {Promise<any>} Parsed JSON response body or null for empty responses.
 * @throws {Error} Throws error with backend error message if response.ok is false.
 */
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

/**
 * API client object aggregating endpoint calls grouped by domain model.
 */
export const api = {
  // ==========================================
  // Contacts Management
  // ==========================================

  /**
   * Fetches the complete list of business contacts.
   * @async
   * @function getContacts
   * @returns {Promise<Array<Object>>} List of contact records.
   */
  getContacts: async () => {
    const response = await fetch(`${BACKEND_URL}/contacts`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Creates a new business contact record.
   * @async
   * @function createContact
   * @param {Object} contact - Contact payload containing name, type, email, phone, etc.
   * @param {string} contact.type - Contact classification ('customer', 'vendor', etc.).
   * @returns {Promise<Object>} Created contact record returned by backend.
   */
  createContact: async (contact) => {
    const response = await fetch(`${BACKEND_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...contact,
        type: contact.type.toUpperCase()
      })
    });
    return handleResponse(response);
  },

  /**
   * Updates an existing contact by unique identifier.
   * @async
   * @function updateContact
   * @param {string|number} id - Target contact ID.
   * @param {Object} contact - Updated contact fields.
   * @returns {Promise<Object>} Updated contact record.
   */
  updateContact: async (id, contact) => {
    const response = await fetch(`${BACKEND_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...contact,
        type: contact.type.toUpperCase()
      })
    });
    return handleResponse(response);
  },

  /**
   * Deletes a contact record by ID.
   * @async
   * @function deleteContact
   * @param {string|number} id - Target contact ID to remove.
   * @returns {Promise<null>} Resolves on successful deletion.
   */
  deleteContact: async (id) => {
    const response = await fetch(`${BACKEND_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // ==========================================
  // Products & Inventory
  // ==========================================

  /**
   * Fetches all registered products from the catalogue.
   * @async
   * @function getProducts
   * @returns {Promise<Array<Object>>} List of product records.
   */
  getProducts: async () => {
    const response = await fetch(`${BACKEND_URL}/products`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Creates a new product entry in the catalogue.
   * @async
   * @function createProduct
   * @param {Object} product - Product properties (name, type, sales_price, cost_price, etc.).
   * @param {string} product.type - Product type classification.
   * @returns {Promise<Object>} Created product record.
   */
  createProduct: async (product) => {
    const response = await fetch(`${BACKEND_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...product,
        type: product.type.toUpperCase()
      })
    });
    return handleResponse(response);
  },

  /**
   * Updates an existing product by unique ID.
   * @async
   * @function updateProduct
   * @param {string|number} id - Product identifier.
   * @param {Object} product - Updated product properties.
   * @returns {Promise<Object>} Updated product record.
   */
  updateProduct: async (id, product) => {
    const response = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ...product,
        type: product.type.toUpperCase()
      })
    });
    return handleResponse(response);
  },

  /**
   * Deletes a product from the catalogue by ID.
   * @async
   * @function deleteProduct
   * @param {string|number} id - Product identifier.
   * @returns {Promise<null>} Resolves on successful removal.
   */
  deleteProduct: async (id) => {
    const response = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // ==========================================
  // Chart of Accounts (CoA)
  // ==========================================

  /**
   * Fetches the hierarchical Chart of Accounts (Assets, Liabilities, Equity, Income, Expense).
   * @async
   * @function getChartOfAccounts
   * @returns {Promise<Array<Object>>} List of GL account definitions.
   */
  getChartOfAccounts: async () => {
    const response = await fetch(`${BACKEND_URL}/accounts`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // ==========================================
  // Journals & General Ledger Entries
  // ==========================================

  /**
   * Fetches defined accounting journals (Sales, Purchase, Bank, Cash, Miscellaneous).
   * @async
   * @function getJournals
   * @returns {Promise<Array<Object>>} List of configured journals.
   */
  getJournals: async () => {
    const response = await fetch(`${BACKEND_URL}/journals`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Fetches posted double-entry journal entries and audit trails.
   * @async
   * @function getJournalEntries
   * @returns {Promise<Array<Object>>} List of journal entries with debit/credit line items.
   */
  getJournalEntries: async () => {
    const response = await fetch(`${BACKEND_URL}/journal-entries`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // ==========================================
  // Financial Reporting
  // ==========================================

  /**
   * Generates Balance Sheet statement report for a given fiscal year.
   * @async
   * @function getBalanceSheet
   * @param {number} [year=currentYear] - Fiscal year for calculation.
   * @returns {Promise<Object>} Balance Sheet report data with Assets, Liabilities, and Equity balances.
   */
  getBalanceSheet: async (year = new Date().getFullYear()) => {
    const response = await fetch(`${BACKEND_URL}/reports/balance-sheet?year=${year}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  /**
   * Generates Profit and Loss (Income Statement) report for a given fiscal year.
   * @async
   * @function getProfitAndLoss
   * @param {number} [year=currentYear] - Fiscal year for calculation.
   * @returns {Promise<Object>} Profit and Loss statement with Income, Expenses, and Net Profit.
   */
  getProfitAndLoss: async (year = new Date().getFullYear()) => {
    const response = await fetch(`${BACKEND_URL}/reports/profit-and-loss?year=${year}`, { headers: getAuthHeaders() });
    return handleResponse(response);
  }
};
