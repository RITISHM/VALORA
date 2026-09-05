import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle, RefreshCw, XCircle, AlertTriangle, Link } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

const STATUS_COLORS = {
  DRAFT:     { bg: '#FEF3C7', color: '#D97706' },
  CONFIRMED: { bg: '#D1FAE5', color: '#059669' },
  REVISED:   { bg: '#DBEAFE', color: '#2563EB' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg: '#F1F5F9', color: '#64748B' };
  return (
    <span style={{
      padding: '4px 10px', borderRadius: '6px',
      fontSize: '0.8rem', fontWeight: '700',
      backgroundColor: s.bg, color: s.color
    }}>
      {status}
    </span>
  );
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // view: 'list' | 'form' | 'view'
  const [view, setView] = useState('list');
  const [selectedBudget, setSelectedBudget] = useState(null);

  const emptyForm = {
    name: '',
    responsible_contact_id: '',
    period_start: new Date().toISOString().split('T')[0],
    period_end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    lines: [{ analytic_account_id: '', type: 'EXPENSE', committed_amount: '', allowed_amount: '' }]
  };
  const [formData, setFormData] = useState(emptyForm);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, aData, cData] = await Promise.all([
        api.getBudgets(),
        api.getAnalyticAccounts(),
        api.getContacts()
      ]);
      setBudgets(bData || []);
      setAnalyticAccounts(aData || []);
      setContacts(cData || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const refreshSelected = async (id) => {
    try {
      const fresh = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/budgets/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('valora_token')}` }
      });
      const data = await fresh.json();
      setSelectedBudget(data);
    } catch (e) { /* silent */ }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.name) return alert('Budget Name is required');
    if (!formData.responsible_contact_id) return alert('Responsible Contact is required');
    if (formData.lines.some(l => !l.analytic_account_id)) return alert('Select an Analytic Account for every line');
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        lines: formData.lines.map(l => ({
          analytic_account_id: l.analytic_account_id,
          type: l.type || 'EXPENSE',
          committed_amount: Number(l.committed_amount) || 0,
          allowed_amount: Number(l.allowed_amount) || 0,
        }))
      };
      await api.createBudget(payload);
      await loadData();
      setView('list');
      setFormData(emptyForm);
    } catch (err) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = async (action, id) => {
    setIsSaving(true);
    try {
      let result;
      const base = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/budgets`;
      const headers = {
        Authorization: `Bearer ${localStorage.getItem('valora_token')}`,
        'Content-Type': 'application/json'
      };
      if (action === 'confirm') {
        const res = await fetch(`${base}/${id}/confirm`, { method: 'POST', headers });
        result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed');
      } else if (action === 'revise') {
        const res = await fetch(`${base}/${id}/revise`, { method: 'POST', headers, body: JSON.stringify({}) });
        result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed');
      } else if (action === 'cancel') {
        if (!window.confirm('Archive/cancel this budget?')) return;
        const res = await fetch(`${base}/${id}/cancel`, { method: 'POST', headers });
        result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed');
      }
      await loadData();
      if (result) setSelectedBudget(result);
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setIsSaving(false);
    }
  };

  const openView = async (row) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/budgets/${row.id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('valora_token')}` } }
      );
      const data = await res.json();
      setSelectedBudget(data);
      setView('view');
    } catch (e) {
      alert('Failed to load budget details');
    } finally {
      setIsLoading(false);
    }
  };

  const addLine = () => setFormData(prev => ({
    ...prev,
    lines: [...prev.lines, { analytic_account_id: '', type: 'EXPENSE', committed_amount: '', allowed_amount: '' }]
  }));

  const removeLine = (idx) => setFormData(prev => ({
    ...prev,
    lines: prev.lines.filter((_, i) => i !== idx)
  }));

  const updateLine = (idx, field, value) => {
    const newLines = [...formData.lines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    setFormData(prev => ({ ...prev, lines: newLines }));
  };

  // ─── List View ───────────────────────────────────────────────────────────────

  const columns = [
    { header: 'Budget Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Start Date', render: (row) => new Date(row.period_start).toLocaleDateString() },
    { header: 'End Date', render: (row) => new Date(row.period_end).toLocaleDateString() },
    { header: 'Responsible', render: (row) => row.responsible_contact?.name || '—' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Revised From', render: (row) => row.revised_from
        ? <span style={{ fontSize: '0.8rem', color: '#2563EB' }}>{row.revised_from.name}</span>
        : '—'
    },
    {
      header: 'Action', render: (row) => (
        <button className="secondary-btn" style={{ padding: '4px 10px', fontSize: '0.8rem' }}
          onClick={() => openView(row)}>
          View Form
        </button>
      )
    }
  ];

  if (view === 'list') {
    return (
      <div className="page-content" style={{ padding: 0 }}>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Analytical Budgets</h1>
          <button
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => { setFormData(emptyForm); setView('form'); }}
          >
            <Plus size={18} /> New Budget
          </button>
        </div>
        {isLoading ? <p style={{ padding: '24px', color: '#64748B' }}>Loading budgets...</p> : (
          <DataTable
            title="Budget"
            columns={columns}
            data={budgets}
            searchPlaceholder="Search budgets..."
          />
        )}
      </div>
    );
  }

  // ─── New Budget Form ─────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>New Budget</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="secondary-btn" onClick={() => setView('list')}>Cancel</button>
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
          {/* Header Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Budget Name *</label>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="E.g. January 2026" />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Responsible (Contact) *</label>
              <select value={formData.responsible_contact_id}
                onChange={e => setFormData({ ...formData, responsible_contact_id: e.target.value })}>
                <option value="">-- Select Contact --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Budget Period — Start Date</label>
              <input type="date" value={formData.period_start}
                onChange={e => setFormData({ ...formData, period_start: e.target.value })} />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Budget Period — End Date</label>
              <input type="date" value={formData.period_end}
                onChange={e => setFormData({ ...formData, period_end: e.target.value })} />
            </div>
          </div>

          {/* Budget Lines */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Budget Lines</h3>
          <table className="valora-table" style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Analytic Account</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Committed Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>Allowed Amount (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select value={line.analytic_account_id}
                      onChange={e => updateLine(idx, 'analytic_account_id', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <option value="">-- Select Analytic --</option>
                      {analyticAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={line.type} onChange={e => updateLine(idx, 'type', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <option value="EXPENSE">Expense</option>
                      <option value="INCOME">Income</option>
                    </select>
                  </td>
                  <td>
                    <input type="number" value={line.committed_amount}
                      onChange={e => updateLine(idx, 'committed_amount', e.target.value)}
                      placeholder="200000"
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', textAlign: 'right' }} />
                  </td>
                  <td>
                    <input type="number" value={line.allowed_amount}
                      onChange={e => updateLine(idx, 'allowed_amount', e.target.value)}
                      placeholder="10000"
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1', textAlign: 'right' }} />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button type="button" onClick={() => removeLine(idx)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="secondary-btn" onClick={addLine}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Line
          </button>
        </div>
      </div>
    );
  }

  // ─── View / Detail Form ───────────────────────────────────────────────────────

  if (view === 'view' && selectedBudget) {
    const b = selectedBudget;
    const isReadOnly = b.status === 'REVISED' || b.status === 'CANCELLED';
    const isConfirmed = b.status === 'CONFIRMED';
    const isDraft = b.status === 'DRAFT';

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
    const fmtMoney = (n) => `₹ ${Number(n || 0).toLocaleString()}`;

    return (
      <div className="page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => { setView('list'); setSelectedBudget(null); loadData(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>
              Budget Form View &nbsp;<StatusBadge status={b.status} />
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isDraft && (
              <button className="primary-btn"
                style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => handleAction('confirm', b.id)}>
                <CheckCircle size={16} /> Confirm
              </button>
            )}
            {isConfirmed && (
              <button className="primary-btn"
                style={{ backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => handleAction('revise', b.id)}>
                <RefreshCw size={16} /> Revise
              </button>
            )}
            {!isReadOnly && (
              <button className="secondary-btn"
                style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => handleAction('cancel', b.id)}>
                <XCircle size={16} /> Cancel
              </button>
            )}
          </div>
        </div>

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
          {/* Revised-from banner */}
          {b.revised_from && (
            <div style={{ background: '#DBEAFE', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#1E40AF', fontSize: '0.875rem' }}>
              <Link size={16} />
              <span>Revised From: <strong>{b.revised_from.name}</strong></span>
            </div>
          )}

          {/* Header Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Budget Name</label>
              <input value={b.name} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Revision Of (Original Budget)</label>
              <input value={b.revised_from?.name || '—'} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Responsible</label>
              <input value={b.responsible_contact?.name || '—'} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Start Date</label>
              <input value={fmtDate(b.period_start)} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>End Date</label>
              <input value={fmtDate(b.period_end)} disabled />
            </div>
          </div>

          {/* Lines Table — per spec: Analytic | Type | Committed Amount | Achieved Amount | Achieved % | Amount To Achieve */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Budget Lines</h3>
          <table className="valora-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Analytic</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Committed Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>Achieved Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>Achieved %</th>
                <th style={{ textAlign: 'right' }}>Amount To Achieve (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(b.budget_lines || []).length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>No budget lines.</td></tr>
              )}
              {(b.budget_lines || []).map((line) => {
                const isOver = line.is_over_budget;
                return (
                  <tr key={line.id}>
                    <td><strong>{line.analytic_account?.name || '—'}</strong></td>
                    <td>
                      <span style={{
                        padding: '3px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '700',
                        backgroundColor: line.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2',
                        color: line.type === 'INCOME' ? '#059669' : '#DC2626'
                      }}>{line.type}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtMoney(line.committed_amount)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600', color: isOver ? '#DC2626' : '#059669' }}>
                      {fmtMoney(line.achieved_amount)}
                      {isOver && <AlertTriangle size={14} style={{ marginLeft: '6px', verticalAlign: 'middle', color: '#D97706' }} />}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: isOver ? '#DC2626' : '#1D4ED8' }}>
                      {Number(line.allowed_pct || 0).toFixed(1)}%
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: line.amount_to_attain < 0 ? '#DC2626' : '#059669' }}>
                      {fmtMoney(line.amount_to_attain)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Read-only notice */}
          {isReadOnly && (
            <div style={{ marginTop: '20px', padding: '12px 16px', background: '#FEF3C7', borderRadius: '8px', color: '#92400E', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
              This budget is <strong style={{ marginLeft: '4px' }}>{b.status}</strong> and cannot be modified.
              {b.status === 'REVISED' && ' A new revised budget has been created.'}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="page-content"><p>Loading...</p></div>;
}
