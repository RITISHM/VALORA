/**
 * @file ChartOfAccounts.jsx
 * @description Master Chart of Accounts (COA) interface for Valora ERP.
 * Displays financial ledger accounts (Assets, Liabilities, Equity, Income, Expenses)
 * categorized by account types and codes.
 * @module pages/masters/ChartOfAccounts
 */

import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

/**
 * ChartOfAccounts Component
 * 
 * Renders the ledger accounts table displaying account IDs, names, and styled account type badges.
 * 
 * @component
 * @returns {JSX.Element} The rendered Chart of Accounts interface.
 */
export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * Fetches accounts from the API service and populates state.
     * 
     * @async
     * @function loadAccounts
     * @returns {Promise<void>} Resolves when accounts are loaded.
     */
    const loadAccounts = async () => {
      setIsLoading(true);
      const data = await api.getChartOfAccounts();
      setAccounts(data);
      setIsLoading(false);
    };
    loadAccounts();
  }, []);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Account Name', accessor: 'name' },
    { header: 'Type', render: (row) => (
      <span style={{ 
        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
        backgroundColor: 'var(--valora-primary-light)',
        color: 'var(--valora-primary-dark)',
        fontWeight: '500'
      }}>{row.type}</span>
    )}
  ];

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chart of Accounts</h1>
          <p style={{ color: 'var(--valora-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Pre-configured master accounts for the Urban Furniture system.
          </p>
        </div>
      </div>
      {isLoading ? (
        <p>Loading accounts...</p>
      ) : (
        <DataTable 
          title="Account" 
          columns={columns} 
          data={accounts} 
          searchPlaceholder="Search accounts..."
        />
      )}
    </div>
  );
}
