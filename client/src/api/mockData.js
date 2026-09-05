/**
 * @file mockData.js
 * @description Mock seed dataset and browser localStorage persistence bootstrap for offline / mock testing.
 * Provides fallback initial records for Contacts, Products, Chart of Accounts, and Journals.
 * @module api/mockData
 */

/**
 * Initial static dataset used for bootstrapping mock business entities.
 * @type {Object}
 * @property {Array<Object>} contacts - Seed contact entities (vendors and customers).
 * @property {Array<Object>} products - Seed inventory products and services.
 * @property {Array<Object>} chartOfAccounts - Standard default GL account definitions.
 * @property {Array<Object>} journals - Default transaction journals.
 */
export const initialData = {
  contacts: [
    { id: '1', name: 'Azure Furniture', type: 'Vendor', email: 'billing@azure.com', mobile: '9876543210', city: 'Mumbai', state: 'MH' },
    { id: '2', name: 'Nimesh Pathak', type: 'Customer', email: 'nimesh@gmail.com', mobile: '9123456789', city: 'Delhi', state: 'DL' }
  ],
  products: [
    { id: '1', name: 'Office Chair Model X', type: 'Goods', category: 'Seating', salesPrice: 5000, cost: 3500 },
    { id: '2', name: 'Desk Assembly Service', type: 'Service', category: 'Labor', salesPrice: 1500, cost: 800 }
  ],
  chartOfAccounts: [
    { id: '1', name: 'Cash', type: 'Asset' },
    { id: '2', name: 'Bank', type: 'Asset' },
    { id: '3', name: 'Debtors', type: 'Asset' },
    { id: '4', name: 'Creditors', type: 'Liability' },
    { id: '5', name: 'Capital', type: 'Capital' },
    { id: '6', name: 'Sales Income', type: 'Income' },
    { id: '7', name: 'Purchase Expense', type: 'Expense' },
    { id: '8', name: 'Other Expenses', type: 'Expense' }
  ],
  journals: [
    { id: '1', name: 'Sales Journal', type: 'Sales', defaultAccount: 'Sales Income' },
    { id: '2', name: 'Purchase Journal', type: 'Purchase', defaultAccount: 'Purchase Expense' },
    { id: '3', name: 'Bank Journal', type: 'Bank', defaultAccount: 'Bank' },
    { id: '4', name: 'Cash Journal', type: 'Cash', defaultAccount: 'Cash' }
  ]
};

/**
 * Automatically populates browser localStorage with initial mock records if not already initialized.
 */
if (!localStorage.getItem('valora_data')) {
  localStorage.setItem('valora_data', JSON.stringify(initialData));
}
