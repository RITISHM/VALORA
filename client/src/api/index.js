import './mockData'; // Ensure it's initialized

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const getData = () => JSON.parse(localStorage.getItem('valora_data'));
const saveData = (data) => localStorage.setItem('valora_data', JSON.stringify(data));

export const api = {
  // Contacts
  getContacts: async () => {
    await delay();
    return getData().contacts;
  },
  createContact: async (contact) => {
    await delay(800);
    const data = getData();
    const newContact = { ...contact, id: Date.now().toString() };
    data.contacts.push(newContact);
    saveData(data);
    return newContact;
  },

  // Products
  getProducts: async () => {
    await delay();
    return getData().products;
  },
  createProduct: async (product) => {
    await delay(800);
    const data = getData();
    const newProduct = { ...product, id: Date.now().toString() };
    data.products.push(newProduct);
    saveData(data);
    return newProduct;
  },

  // Chart of Accounts (Read only)
  getChartOfAccounts: async () => {
    await delay();
    return getData().chartOfAccounts;
  },

  // Journals (Read only for now)
  getJournals: async () => {
    await delay();
    return getData().journals;
  }
};
