import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    responsible_contact_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    lines: [
      { analytic_account_id: '', allowed_amount: 10000 }
    ]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, aData, cData] = await Promise.all([
        api.getBudgets(),
        api.getAnalyticAccounts(),
        api.getContacts()
      ]);
      setBudgets(bData);
      setAnalyticAccounts(aData);
      setContacts(cData);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Budget Name is required');
    if (!formData.responsible_contact_id) return alert('Responsible Contact is required');
    setIsSaving(true);
    try {
      await api.createBudget({
        ...formData,
        lines: formData.lines.map(l => ({
          analytic_account_id: l.analytic_account_id,
          allowed_amount: Number(l.allowed_amount)
        }))
      });
      await loadData();
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      name: '',
      responsible_contact_id: '',
      period_start: new Date().toISOString().split('T')[0],
      period_end: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      lines: [{ analytic_account_id: '', allowed_amount: 10000 }]
    });
  };

  const columns = [
    { header: 'Budget Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Start Date', render: (row) => new Date(row.period_start).toLocaleDateString() },
    { header: 'End Date', render: (row) => new Date(row.period_end).toLocaleDateString() },
    { header: 'Status', render: (row) => (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '700',
        backgroundColor: '#D1FAE5',
        color: '#059669'
      }}>
        {row.status || 'CONFIRMED'}
      </span>
    )}
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title="New Analytical Budget" 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Budget Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Q3 Furniture Procurement" required />
            </div>
            <div className="form-field">
              <label>Responsible Contact *</label>
              <select value={formData.responsible_contact_id} onChange={e => setFormData({...formData, responsible_contact_id: e.target.value})} required>
                <option value="">-- Select Contact --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Start Date</label>
              <input type="date" value={formData.period_start} onChange={e => setFormData({...formData, period_start: e.target.value})} />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input type="date" value={formData.period_end} onChange={e => setFormData({...formData, period_end: e.target.value})} />
            </div>
          </div>

          <h4 style={{ margin: '20px 0 10px 0', fontSize: '1rem', fontWeight: '700' }}>Budget Lines</h4>
          {formData.lines.map((line, idx) => (
            <div key={idx} className="form-row">
              <div className="form-field">
                <label>Analytic Account</label>
                <select value={line.analytic_account_id} onChange={e => {
                  const newLines = [...formData.lines];
                  newLines[idx].analytic_account_id = e.target.value;
                  setFormData({...formData, lines: newLines});
                }}>
                  <option value="">-- Select Analytics --</option>
                  {analyticAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>Planned Budget Amount (₹)</label>
                <input type="number" value={line.allowed_amount} onChange={e => {
                  const newLines = [...formData.lines];
                  newLines[idx].allowed_amount = e.target.value;
                  setFormData({...formData, lines: newLines});
                }} />
              </div>
            </div>
          ))}
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Analytical Budgets</h1></div>
      {isLoading ? <p>Loading budgets...</p> : (
        <DataTable title="Budget" columns={columns} data={budgets} onNewClick={() => setIsFormOpen(true)} searchPlaceholder="Search budgets..." />
      )}
    </div>
  );
}
