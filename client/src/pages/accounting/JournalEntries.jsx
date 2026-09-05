/**
 * @file JournalEntries.jsx
 * @description General Ledger and Double-Entry Bookkeeping Journal Entries view for Valora ERP.
 * Displays financial journal transactions, including dates, references, journal names,
 * posting status, and total debit amounts computed across journal line items.
 * @module pages/accounting/JournalEntries
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

/**
 * JournalEntries Component
 * 
 * Renders the list of posted and draft accounting journal entries in a data table.
 * 
 * @component
 * @returns {JSX.Element} The rendered Journal Entries table interface.
 */
export default function JournalEntries() {
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    journalId: '',
    reference: '',
    lines: [
      { accountId: '', contactId: '', debit: 0, credit: 0, description: '' },
      { accountId: '', contactId: '', debit: 0, credit: 0, description: '' }
    ]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eData, jData, aData, cData] = await Promise.all([
        api.getJournalEntries(),
        api.getJournals(),
        api.getChartOfAccounts(),
        api.getContacts()
      ]);
      setEntries(eData);
      setJournals(jData);
      setAccounts(aData);
      setContacts(cData);

      if (jData.length > 0 && !formData.journalId) {
        setFormData(prev => ({ ...prev, journalId: jData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load journal entry data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get('new') === 'true' || location.pathname.endsWith('/new')) {
      setIsFormOpen(true);
    }
  }, [location]);

  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { accountId: '', contactId: '', debit: 0, credit: 0, description: '' }]
    }));
  };

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 2) return alert('At least 2 lines are required for a double-entry journal.');
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const handleLineChange = (idx, field, value) => {
    setFormData(prev => {
      const newLines = [...prev.lines];
      newLines[idx] = { ...newLines[idx], [field]: value };
      return { ...prev, lines: newLines };
    });
  };

  const totalDebit = formData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handlePost = async () => {
    if (!isBalanced) {
      return alert('Debit and Credit totals must be equal and greater than 0 before posting.');
    }
    if (!formData.journalId) return alert('Please select a journal.');

    setIsSaving(true);
    try {
      const payload = {
        journalId: formData.journalId,
        reference: formData.reference || 'Manual Entry',
        entryDate: formData.entryDate,
        status: 'POSTED',
        lines: formData.lines.map(l => ({
          accountId: l.accountId,
          contactId: l.contactId || null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || ''
        }))
      };

      await api.createJournalEntry(payload);
      await loadData();
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to post journal entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      entryDate: new Date().toISOString().split('T')[0],
      journalId: journals[0]?.id || '',
      reference: '',
      lines: [
        { accountId: '', contactId: '', debit: 0, credit: 0, description: '' },
        { accountId: '', contactId: '', debit: 0, credit: 0, description: '' }
      ]
    });
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.entry_date).toLocaleDateString() },
    { header: 'Number / Ref', render: (row) => row.entry_number || row.reference || '-' },
    { header: 'Journal', render: (row) => row.journal?.name || '-' },
    { header: 'Total', render: (row) => {
      if (!row.journal_items || row.journal_items.length === 0) return '-';
      const total = row.journal_items.reduce((sum, item) => sum + item.debit, 0);
      return `₹ ${Number(total).toLocaleString()}`;
    }},
    { header: 'Status', render: (row) => (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '700',
        backgroundColor: row.status === 'POSTED' ? '#D1FAE5' : '#FEF3C7',
        color: row.status === 'POSTED' ? '#059669' : '#D97706'
      }}>
        {row.status}
      </span>
    )}
  ];

  if (isFormOpen) {
    return (
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={handleCloseForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>New Journal Entry</h2>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="secondary-btn" onClick={handleCloseForm} disabled={isSaving}>
              Cancel
            </button>
            <button 
              className="primary-btn" 
              onClick={handlePost} 
              disabled={!isBalanced || isSaving}
              style={{
                backgroundColor: isBalanced ? '#059669' : '#94A3B8',
                cursor: isBalanced ? 'pointer' : 'not-allowed'
              }}
            >
              {isSaving ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>

        {/* Blocking warning if debit and credit amount don't match */}
        {!isBalanced && (
          <div style={{
            background: '#FEF2F2',
            border: '2px solid #EF4444',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991B1B'
          }}>
            <AlertTriangle size={24} color="#DC2626" />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Blocking Warning: Debit and Credit totals do not match!</strong>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                Total Debit: <strong>₹ {totalDebit.toLocaleString()}</strong> | Total Credit: <strong>₹ {totalCredit.toLocaleString()}</strong>
                <br />The transaction must be balanced before it can be posted to the ledger.
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Accounting Date *</label>
              <input 
                type="date" 
                value={formData.entryDate} 
                onChange={e => setFormData({...formData, entryDate: e.target.value})} 
                required 
              />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Journal *</label>
              <select 
                value={formData.journalId} 
                onChange={e => setFormData({...formData, journalId: e.target.value})}
                required
              >
                <option value="">-- Select Journal --</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name} ({j.type})</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Reference / Memo</label>
              <input 
                type="text" 
                value={formData.reference} 
                onChange={e => setFormData({...formData, reference: e.target.value})} 
                placeholder="Reference info" 
              />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Journal Items</h3>
          
          <table className="valora-table" style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Account (Selection from CoA)</th>
                <th>Partner (Contact Master)</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Debit (₹)</th>
                <th style={{ textAlign: 'right' }}>Credit (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select 
                      value={line.accountId} 
                      onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="">-- Select Account --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select 
                      value={line.contactId} 
                      onChange={e => handleLineChange(idx, 'contactId', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    >
                      <option value="">-- Select Contact --</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      value={line.description} 
                      onChange={e => handleLineChange(idx, 'description', e.target.value)}
                      placeholder="Note"
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input 
                      type="number" 
                      value={line.debit || ''} 
                      onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100px', textAlign: 'right', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <input 
                      type="number" 
                      value={line.credit || ''} 
                      onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                      placeholder="0.00"
                      style={{ width: '100px', textAlign: 'right', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: '700', background: '#F8FAFC' }}>
                <td colSpan={3} style={{ textAlign: 'right' }}>Totals:</td>
                <td style={{ textAlign: 'right', color: isBalanced ? '#059669' : '#DC2626' }}>₹ {totalDebit.toLocaleString()}</td>
                <td style={{ textAlign: 'right', color: isBalanced ? '#059669' : '#DC2626' }}>₹ {totalCredit.toLocaleString()}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <button 
            type="button" 
            className="secondary-btn" 
            onClick={handleAddLine}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={16} /> Add Line
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Journal Entries</h1>
      </div>
      {isLoading ? (
        <p>Loading journal entries...</p>
      ) : (
        <DataTable 
          title="Journal Entry" 
          columns={columns} 
          data={entries} 
          onNewClick={() => setIsFormOpen(true)}
          searchPlaceholder="Search journal entries..."
        />
      )}
    </div>
  );
}
