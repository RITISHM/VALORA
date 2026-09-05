import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    lines: [
      { analytic_account_id: '', planned_amount: 10000 }
    ]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, aData] = await Promise.all([
        api.getBudgets(),
        api.getAnalyticAccounts()
      ]);
      setBudgets(bData);
      setAnalyticAccounts(aData);
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
    setIsSaving(true);
    try {
      await api.createBudget({
        ...formData,
        lines: formData.lines.map(l => ({
          analytic_account_id: l.analytic_account_id,
          planned_amount: Number(l.planned_amount)
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
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      lines: [{ analytic_account_id: '', planned_amount: 10000 }]
    });
  };

  const columns = [
    { header: 'Budget Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Start Date', render: (row) => new Date(row.start_date).toLocaleDateString() },
    { header: 'End Date', render: (row) => new Date(row.end_date).toLocaleDateString() },
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
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Start Date</label>
              <input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
            </div>
            <div className="form-field">
              <label>End Date</label>
              <input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
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
                <input type="number" value={line.planned_amount} onChange={e => {
                  const newLines = [...formData.lines];
                  newLines[idx].planned_amount = e.target.value;
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
