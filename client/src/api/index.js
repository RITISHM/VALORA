export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('valora_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    // Optionally trigger a logout or redirect here if token is invalid
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
  // Contacts
  getContacts: async () => {
    const response = await fetch(`${BACKEND_URL}/contacts`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
  createContact: async (contact) => {
    // Map string values back to enums if necessary, though backend Zod should handle it if matching.
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
  deleteContact: async (id) => {
    const response = await fetch(`${BACKEND_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Products
  getProducts: async () => {
    const response = await fetch(`${BACKEND_URL}/products`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },
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
  deleteProduct: async (id) => {
    const response = await fetch(`${BACKEND_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  // Chart of Accounts (Read only)
  getChartOfAccounts: async () => {
    const response = await fetch(`${BACKEND_URL}/accounts`, { headers: getAuthHeaders() });
    return handleResponse(response);
  },

  // Journals (Read only for now)
  getJournals: async () => {
    const response = await fetch(`${BACKEND_URL}/journals`, { headers: getAuthHeaders() });
    return handleResponse(response);
  }
};
