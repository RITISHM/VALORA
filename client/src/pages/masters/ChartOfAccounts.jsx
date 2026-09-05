/**
 * @file ChartOfAccounts.jsx
 * @description Master Chart of Accounts (COA) interface for Valora ERP.
 * Displays financial ledger accounts with pre-configured defaults and an account creation modal.
 * Whatever Account Type is selected automatically infers association with Balance Sheet or Profit & Loss.
 * @module pages/masters/ChartOfAccounts
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

/**
 * Helper function to infer report association from account type.
 * @param {string} type - The account type (e.g. Asset, Liability, Income, Expenses)
 * @returns {'Balancesheet' | 'Profit and Loss'} The inferred financial report category.
 */
const inferReportCategory = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('income') || t.includes('expense')) {
    return 'Profit and Loss';
  }
  return 'Balancesheet';
};

export default function ChartOfAccounts() {
  const location = useLocation();
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Asset'
  });

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getChartOfAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('new') === 'true' || location.pathname.endsWith('/new')) {
      setIsModalOpen(true);
    }
  }, [location]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return alert('Account Name is required');
    
    setIsSaving(true);
    const category = inferReportCategory(formData.type);

    try {
      await api.createAccount({
        name: formData.name,
        type: formData.type,
        category: category
      });
      alert('Account created successfully!');
      setIsModalOpen(false);
      setFormData({ name: '', type: 'Asset' });
      await loadAccounts();
    } catch (err) {
      alert(err.message || 'Failed to create account');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { header: 'Account Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { 
      header: 'Type', 
      render: (row) => (
        <span style={{ 
          padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem',
          backgroundColor: row.type === 'ASSET' || row.type === 'Asset' || row.type === 'Bank' || row.type === 'Cash' ? '#DBEAFE' :
                           row.type === 'LIABILITY' || row.type === 'Liability' ? '#FEF3C7' :
                           row.type === 'INCOME' || row.type === 'Income' ? '#D1FAE5' :
                           row.type === 'CAPITAL' || row.type === 'Capital' ? '#F3E8FF' : '#FEE2E2',
          color: row.type === 'ASSET' || row.type === 'Asset' || row.type === 'Bank' || row.type === 'Cash' ? '#1E40AF' :
                 row.type === 'LIABILITY' || row.type === 'Liability' ? '#92400E' :
                 row.type === 'INCOME' || row.type === 'Income' ? '#065F46' :
                 row.type === 'CAPITAL' || row.type === 'Capital' ? '#6B21A8' : '#991B1B',
          fontWeight: '700'
        }}>
          {row.type}
        </span>
      ) 
    },
    { 
      header: 'Financial Statement Association', 
      render: (row) => {
        const category = inferReportCategory(row.type);
        return (
          <span style={{ 
            fontSize: '0.85rem',
            fontWeight: '600',
            color: category === 'Balancesheet' ? '#2563EB' : '#059669'
          }}>
            {category === 'Balancesheet' ? 'Balance Sheet' : 'Profit & Loss'}
          </span>
        );
      }
    }
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
        <p style={{ padding: '24px' }}>Loading accounts...</p>
      ) : (
        <DataTable 
          title="Chart of Accounts" 
          columns={columns} 
          data={accounts} 
          onNewClick={() => setIsModalOpen(true)}
          searchPlaceholder="Search accounts..."
        />
      )}

      {/* Modal for Adding New Account */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '2px solid #1E293B', padding: '32px', width: '480px' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem', fontWeight: '800', color: '#111116' }}>Add New Account</h2>
            
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>
                  Account Name *
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Bank A/c, Cash A/c, Sales Income A/c"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem' }}
                />
              </div>

              {/* Type Dropdown */}
              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: '#374151' }}>
                  Type *
                </label>
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '0.95rem', backgroundColor: '#FFFFFF' }}
                >
                  <optgroup label="Balancesheet">
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Bank">Bank</option>
                    <option value="Capital">Capital</option>
                    <option value="Cash">Cash</option>
                  </optgroup>
                  <optgroup label="Profit and Loss">
                    <option value="Income">Income</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Other Expenses">Other Expenses</option>
                  </optgroup>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button 
                  type="button" 
                  className="secondary-btn" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
