/**
 * Budgets.jsx — Analytical Budget management
 *
 * DATA MODEL (per spec §2.7):
 *   allowed_amount  = Budget CAP set by user ("You are allowed ₹X for this analytic")
 *   committed_amount = Auto-summed from PO/Bill/Invoice lines in period (live, read-only)
 *   Allowed %       = (Allowed Amount / Committed Amount) × 100
 *   Amount to Attain = Committed Amount − Allowed Amount  (positive = over budget)
 *
 * STATUS LIFECYCLE:
 *   DRAFT → CONFIRMED → REVISED → CANCELLED
 *
 * REVISE LOGIC:
 *   Only CONFIRMED budgets can be revised.
 *   Clicking Revise → opens a pre-filled form where user adjusts allowed_amounts.
 *   On saving: original becomes REVISED (archived, traceability link preserved),
 *   new budget created as CONFIRMED with revised_from_id → original.
 *   Name rule: strip existing " Revised" suffix, then add " Revised" once.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle, RefreshCw, XCircle, AlertTriangle, ExternalLink, LayoutList, LayoutGrid, Calendar, User } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const STATUS_STYLE = {
  DRAFT:     { bg: '#FEF3C7', color: '#D97706', label: 'DRAFT' },
  CONFIRMED: { bg: '#D1FAE5', color: '#059669', label: 'CONFIRMED' },
  REVISED:   { bg: '#DBEAFE', color: '#2563EB', label: 'REVISED' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626', label: 'CANCELLED' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: '#F1F5F9', color: '#64748B', label: status };
  return (
    <span style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="form-field">
      <label style={{ fontWeight: '600', fontSize: '0.85rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const fmtMoney = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('valora_token')}`,
  'Content-Type': 'application/json',
});

// Strip existing " Revised" suffix so we never get "Budget Revised Revised"
const makeRevisedName = (name) => `${name.replace(/\s+Revised$/i, '').trim()} Revised`;

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'form' | 'view' | 'revise'
  const [listMode, setListMode] = useState('list'); // 'list' | 'kanban'
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [reviseData, setReviseData] = useState(null);

  const today = new Date().toISOString().split('T')[0];
  const yearEnd = `${new Date().getFullYear()}-12-31`;

  const emptyForm = {
    name: '',
    responsible_contact_id: '',
    period_start: today,
    period_end: yearEnd,
    // Lines: user only sets allowed_amount (the budget cap)
    lines: [{ analytic_account_id: '', type: 'EXPENSE', allowed_amount: '' }],
  };
  const [formData, setFormData] = useState(emptyForm);

  // ─── Data Loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bData, aData, cData] = await Promise.all([
        api.getBudgets(),
        api.getAnalyticAccounts(),
        api.getContacts(),
      ]);
      setBudgets(bData || []);
      setAnalyticAccounts(aData || []);
      setContacts(cData || []);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fetchBudget = async (id) => {
    const res = await fetch(`${BACKEND}/budgets/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load');
    return data;
  };

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const handleSaveNew = async () => {
    if (!formData.name.trim()) return alert('Budget Name is required');
    if (!formData.responsible_contact_id) return alert('Responsible Contact is required');
    if (formData.lines.some(l => !l.analytic_account_id)) return alert('Select an Analytic Account for every line');
    setIsSaving(true);
    try {
      await api.createBudget({
        name: formData.name.trim(),
        period_start: formData.period_start,
        period_end: formData.period_end,
        responsible_contact_id: formData.responsible_contact_id,
        lines: formData.lines.map(l => ({
          analytic_account_id: l.analytic_account_id,
          type: l.type || 'EXPENSE',
          allowed_amount: Number(l.allowed_amount) || 0,
        })),
      });
      await loadData();
      setView('list');
      setFormData(emptyForm);
    } catch (err) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async (id) => {
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND}/budgets/${id}/confirm`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm');
      await loadData();
      setSelectedBudget(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel/archive this budget? This cannot be undone.')) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND}/budgets/${id}/cancel`, { method: 'POST', headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel');
      await loadData();
      setSelectedBudget(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open the editable revision form pre-filled with original lines
  const openReviseForm = (budget) => {
    setReviseData({
      originalId: budget.id,
      originalName: budget.name,
      name: makeRevisedName(budget.name),
      period_start: fmtDate(budget.period_start),
      period_end: fmtDate(budget.period_end),
      lines: (budget.budget_lines || []).map(l => ({
        analytic_account_id: l.analytic_account_id,
        analytic_name: l.analytic_account?.name || '',
        type: l.type || 'EXPENSE',
        old_allowed: l.allowed_amount || 0,           // show original cap for reference
        allowed_amount: String(l.allowed_amount || 0), // editable new cap
      })),
    });
    setView('revise');
  };

  // Save the revision
  const handleSaveRevision = async () => {
    if (!reviseData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${BACKEND}/budgets/${reviseData.originalId}/revise`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          name: reviseData.name,
          lines: reviseData.lines.map(l => ({
            analytic_account_id: l.analytic_account_id,
            type: l.type,
            allowed_amount: Number(l.allowed_amount) || 0,
          })),
        }),
      });
      const newBudget = await res.json();
      if (!res.ok) throw new Error(newBudget.error || 'Revision failed');
      await loadData();
      setReviseData(null);
      setSelectedBudget(newBudget);
      setView('view');
    } catch (err) {
      alert(err.message || 'Failed to create revision');
    } finally {
      setIsSaving(false);
    }
  };

  const openView = async (row) => {
    setIsLoading(true);
    try {
      const data = await fetchBudget(row.id);
      setSelectedBudget(data);
      setView('view');
    } catch (e) {
      alert('Failed to load budget details');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate to a linked budget (revised_from or revisions)
  const navigateToBudget = async (id) => {
    setIsLoading(true);
    try {
      const data = await fetchBudget(id);
      setSelectedBudget(data);
    } catch (e) {
      alert('Failed to load linked budget');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Line helpers ─────────────────────────────────────────────────────────────

  const addLine = () => setFormData(prev => ({
    ...prev,
    lines: [...prev.lines, { analytic_account_id: '', type: 'EXPENSE', allowed_amount: '' }],
  }));

  const removeLine = (idx) => setFormData(prev => ({
    ...prev,
    lines: prev.lines.filter((_, i) => i !== idx),
  }));

  const updateLine = (idx, field, value) => {
    setFormData(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], [field]: value };
      return { ...prev, lines };
    });
  };

  const updateRevLine = (idx, value) => {
    setReviseData(prev => {
      const lines = [...prev.lines];
      lines[idx] = { ...lines[idx], allowed_amount: value };
      return { ...prev, lines };
    });
  };

  // ─── Kanban card ──────────────────────────────────────────────────────────────

  const KANBAN_COLS = [
    { status: 'DRAFT',     label: 'Draft',     icon: '📝', headerBg: '#FEF3C7', headerColor: '#D97706' },
    { status: 'CONFIRMED', label: 'Confirmed', icon: '✅', headerBg: '#D1FAE5', headerColor: '#059669' },
    { status: 'REVISED',   label: 'Revised',   icon: '🔄', headerBg: '#DBEAFE', headerColor: '#2563EB' },
    { status: 'CANCELLED', label: 'Cancelled', icon: '❌', headerBg: '#FEE2E2', headerColor: '#DC2626' },
  ];

  function BudgetKanbanCard({ budget }) {
    const totalAllowed = (budget.budget_lines || []).reduce((s, l) => s + (l.allowed_amount || 0), 0);
    const totalCommitted = (budget.budget_lines || []).reduce((s, l) => s + (l.committed_amount || 0), 0);
    const lineCount = (budget.budget_lines || []).length;
    const s = STATUS_STYLE[budget.status] || STATUS_STYLE.DRAFT;
    const isOver = totalCommitted > totalAllowed && totalAllowed > 0;
    const pct = totalAllowed > 0 ? Math.min(100, Math.round((totalCommitted / totalAllowed) * 100)) : 0;

    return (
      <div onClick={() => openView(budget)} style={{
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(113,75,103,0.14)'; e.currentTarget.style.borderColor = '#714B67'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
      >
        {/* Name + status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1E293B', lineHeight: '1.3' }}>{budget.name}</div>
          <StatusBadge status={budget.status} />
        </div>

        {/* Period */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', marginBottom: '6px' }}>
          <Calendar size={13} />
          {fmtDate(budget.period_start)} – {fmtDate(budget.period_end)}
        </div>

        {/* Responsible */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748B', marginBottom: '12px' }}>
          <User size={13} />
          {budget.responsible_contact?.name || '—'}
        </div>

        {/* Revision link */}
        {budget.revised_from && (
          <div style={{ fontSize: '0.75rem', color: '#2563EB', marginBottom: '10px', fontStyle: 'italic' }}>
            🔗 Revision of: {budget.revised_from.name}
          </div>
        )}

        {/* Budget summary */}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '6px' }}>
            <span>Allowed Cap</span>
            <span style={{ fontWeight: '700', color: '#1E293B' }}>{fmtMoney(totalAllowed)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748B', marginBottom: '8px' }}>
            <span>Committed</span>
            <span style={{ fontWeight: '700', color: isOver ? '#DC2626' : '#059669' }}>{fmtMoney(totalCommitted)}</span>
          </div>

          {/* Progress bar */}
          <div style={{ background: '#F1F5F9', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
            <div style={{
              width: `${pct}%`, height: '100%', borderRadius: '99px',
              background: isOver ? '#EF4444' : pct > 80 ? '#F59E0B' : '#10B981',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8', marginTop: '4px' }}>
            <span>{lineCount} analytic line{lineCount !== 1 ? 's' : ''}</span>
            <span style={{ color: isOver ? '#DC2626' : '#64748B', fontWeight: isOver ? '700' : '400' }}>
              {pct}% committed
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── List View ────────────────────────────────────────────────────────────────

  const columns = [
    { header: 'Budget Name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Period', render: (row) => `${fmtDate(row.period_start)} – ${fmtDate(row.period_end)}` },
    { header: 'Responsible', render: (row) => row.responsible_contact?.name || '—' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      header: 'Revised From',
      render: (row) => row.revised_from
        ? <span style={{ fontSize: '0.8rem', color: '#2563EB' }}>{row.revised_from.name}</span>
        : '—'
    },
    {
      header: '',
      render: (row) => (
        <button className="secondary-btn" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => openView(row)}>
          Open Form
        </button>
      )
    },
  ];

  if (view === 'list') {
    return (
      <div className="page-content" style={{ padding: 0 }}>
        {/* Toolbar */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="page-title">Analytical Budgets</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setListMode('list')}
                title="List view"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.82rem',
                  background: listMode === 'list' ? '#714B67' : 'transparent',
                  color: listMode === 'list' ? '#FFF' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutList size={15} /> List
              </button>
              <button
                onClick={() => setListMode('kanban')}
                title="Kanban view"
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.82rem',
                  background: listMode === 'kanban' ? '#714B67' : 'transparent',
                  color: listMode === 'kanban' ? '#FFF' : '#64748B',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={15} /> Kanban
              </button>
            </div>
            <button className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => { setFormData(emptyForm); setView('form'); }}>
              <Plus size={18} /> New Budget
            </button>
          </div>
        </div>

        {isLoading
          ? <p style={{ padding: '24px', color: '#64748B' }}>Loading budgets...</p>
          : listMode === 'list'
            ? <DataTable title="Budget" columns={columns} data={budgets} searchPlaceholder="Search budgets..." />
            : (
              /* ── Kanban ── */
              <div style={{ padding: '0 32px 32px', overflowX: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(260px, 1fr))', gap: '16px', minWidth: '900px' }}>
                  {KANBAN_COLS.map(col => {
                    const colBudgets = budgets.filter(b => b.status === col.status);
                    return (
                      <div key={col.status}>
                        {/* Column header */}
                        <div style={{
                          background: col.headerBg,
                          color: col.headerColor,
                          borderRadius: '10px',
                          padding: '10px 14px',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                        }}>
                          <span>{col.icon} {col.label}</span>
                          <span style={{
                            background: 'rgba(0,0,0,0.12)',
                            borderRadius: '99px',
                            padding: '1px 8px',
                            fontSize: '0.78rem',
                          }}>{colBudgets.length}</span>
                        </div>

                        {/* Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {colBudgets.length === 0
                            ? (
                              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#CBD5E1', fontSize: '0.85rem', border: '2px dashed #E2E8F0', borderRadius: '10px' }}>
                                No budgets
                              </div>
                            )
                            : colBudgets.map(b => <BudgetKanbanCard key={b.id} budget={b} />)
                          }
                        </div>

                        {/* Add new shortcut in DRAFT column */}
                        {col.status === 'DRAFT' && (
                          <button
                            onClick={() => { setFormData(emptyForm); setView('form'); }}
                            style={{
                              width: '100%', marginTop: '10px', padding: '10px',
                              border: '2px dashed #CBD5E1', borderRadius: '10px',
                              background: 'transparent', color: '#94A3B8',
                              cursor: 'pointer', fontSize: '0.83rem', fontWeight: '600',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#714B67'; e.currentTarget.style.color = '#714B67'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#94A3B8'; }}
                          >
                            <Plus size={15} /> New Budget
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        }
      </div>
    );
  }

  // ─── New Budget Form ──────────────────────────────────────────────────────────

  if (view === 'form') {
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => setView('list')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>New Budget</h2>
            <StatusBadge status="DRAFT" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={handleSaveNew} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button className="secondary-btn" onClick={() => setView('list')}>Cancel</button>
          </div>
        </div>

        <div style={{ background: '#FFF', border: '2px solid #1E293B', borderRadius: '14px', padding: '28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <Field label="Budget Name *">
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="E.g. January 2026" />
            </Field>
            <Field label="Responsible *">
              <select value={formData.responsible_contact_id}
                onChange={e => setFormData({ ...formData, responsible_contact_id: e.target.value })}>
                <option value="">— Select Contact —</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Budget Period — Start Date">
              <input type="date" value={formData.period_start} onChange={e => setFormData({ ...formData, period_start: e.target.value })} />
            </Field>
            <Field label="Budget Period — End Date">
              <input type="date" value={formData.period_end} onChange={e => setFormData({ ...formData, period_end: e.target.value })} />
            </Field>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>Budget Lines</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '14px' }}>
            Set the <strong>Allowed Amount</strong> (budget cap) for each analytic account.
            The <strong>Committed Amount</strong> is auto-computed from actual PO/Bill/Invoice transactions.
          </p>
          <table className="valora-table" style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Analytic Account</th>
                <th>Type (Income/Expense)</th>
                <th style={{ textAlign: 'right' }}>Allowed Amount — Budget Cap (₹)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select value={line.analytic_account_id} onChange={e => updateLine(idx, 'analytic_account_id', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                      <option value="">— Select Analytic —</option>
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
                    <input type="number" value={line.allowed_amount} placeholder="200000"
                      onChange={e => updateLine(idx, 'allowed_amount', e.target.value)}
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

    return (
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => { setView('list'); setSelectedBudget(null); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{b.name}</h2>
            <StatusBadge status={b.status} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isDraft && (
              <button className="primary-btn" style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => handleConfirm(b.id)}>
                <CheckCircle size={16} /> Confirm
              </button>
            )}
            {isConfirmed && (
              <button className="primary-btn" style={{ backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => openReviseForm(b)}>
                <RefreshCw size={16} /> Revise
              </button>
            )}
            {!isReadOnly && (
              <button className="secondary-btn" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}
                disabled={isSaving} onClick={() => handleCancel(b.id)}>
                <XCircle size={16} /> Cancel
              </button>
            )}
          </div>
        </div>

        <div style={{ background: '#FFF', border: '2px solid #1E293B', borderRadius: '14px', padding: '28px' }}>
          {/* Revised-from link */}
          {b.revised_from && (
            <div style={{ background: '#DBEAFE', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
              <span style={{ color: '#1E40AF', fontSize: '0.875rem' }}>
                📋 <strong>Revision of:</strong> {b.revised_from.name}
                &nbsp;<StatusBadge status={b.revised_from.status} />
              </span>
              <button className="secondary-btn" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigateToBudget(b.revised_from.id)}>
                <ExternalLink size={13} /> View Original
              </button>
            </div>
          )}

          {/* Revisions made from this budget */}
          {b.revisions && b.revisions.length > 0 && (
            <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
              <span style={{ color: '#166534', fontSize: '0.875rem' }}>
                🔗 <strong>Revised into:</strong> {b.revisions[b.revisions.length - 1]?.name}
              </span>
              <button className="secondary-btn" style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => navigateToBudget(b.revisions[b.revisions.length - 1].id)}>
                <ExternalLink size={13} /> View Revision
              </button>
            </div>
          )}

          {/* Read-only banner */}
          {isReadOnly && (
            <div style={{ background: '#FEF3C7', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#92400E', fontSize: '0.875rem' }}>
              <AlertTriangle size={16} />
              This budget is <strong style={{ marginLeft: '4px' }}>{b.status}</strong> — read-only.
              {b.status === 'REVISED' && ' A new revised budget has been created and is now active.'}
            </div>
          )}

          {/* Header fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
            <Field label="Budget Name"><input value={b.name} disabled /></Field>
            <Field label="Revision Of">
              <input value={b.revised_from?.name || '—'} disabled />
            </Field>
            <Field label="Responsible"><input value={b.responsible_contact?.name || '—'} disabled /></Field>
            <Field label="Start Date"><input value={fmtDate(b.period_start)} disabled /></Field>
            <Field label="End Date"><input value={fmtDate(b.period_end)} disabled /></Field>
          </div>

          {/* Lines table — spec columns */}
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Budget Lines</h3>
          {isConfirmed && (
            <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '14px' }}>
              <strong>Committed Amount</strong> is auto-computed from confirmed PO/Bill/Invoice lines tagged to the analytic account in this period.
              &nbsp;<strong>Allowed %</strong> = Allowed ÷ Committed × 100.
              &nbsp;<strong>Amount to Attain</strong> = Committed − Allowed (positive = over budget).
            </p>
          )}
          <table className="valora-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Analytic</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Allowed Amount (₹)<br /><span style={{ fontWeight: '400', fontSize: '0.75rem' }}>(Budget Cap)</span></th>
                {isConfirmed && <>
                  <th style={{ textAlign: 'right' }}>Committed Amount (₹)<br /><span style={{ fontWeight: '400', fontSize: '0.75rem' }}>(Auto — from transactions)</span></th>
                  <th style={{ textAlign: 'right' }}>Allowed %</th>
                  <th style={{ textAlign: 'right' }}>Amount to Attain (₹)</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {(b.budget_lines || []).length === 0 && (
                <tr><td colSpan={isConfirmed ? 6 : 3} style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>No budget lines.</td></tr>
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
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtMoney(line.allowed_amount)}</td>
                    {isConfirmed && <>
                      <td style={{ textAlign: 'right', fontWeight: '600', color: isOver ? '#DC2626' : '#059669' }}>
                        {fmtMoney(line.committed_amount)}
                        {isOver && <AlertTriangle size={13} style={{ marginLeft: '6px', verticalAlign: 'middle' }} />}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>
                        {Number(line.allowed_pct || 0).toFixed(1)}%
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: isOver ? '#DC2626' : '#059669' }}>
                        {fmtMoney(line.amount_to_attain)}
                      </td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Revise Form ──────────────────────────────────────────────────────────────
  // Purpose: allow user to change the Allowed Amount (budget cap) for each line.
  // The committed amounts stay the same (auto-computed from transactions).
  // Original budget → REVISED (archived). New budget → CONFIRMED.

  if (view === 'revise' && reviseData) {
    const rd = reviseData;
    return (
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => { setReviseData(null); setView('view'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>Revise Budget</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={handleSaveRevision} disabled={isSaving}
              style={{ backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={16} /> {isSaving ? 'Creating Revision...' : 'Confirm Revision'}
            </button>
            <button className="secondary-btn" onClick={() => { setReviseData(null); setView('view'); }}>
              Cancel
            </button>
          </div>
        </div>

        {/* Explanation */}
        <div style={{ background: '#DBEAFE', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', fontSize: '0.875rem', color: '#1E40AF', lineHeight: '1.6' }}>
          <strong>What Revise does:</strong>
          <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
            <li>The original budget (<em>{rd.originalName}</em>) will be <strong>archived as REVISED</strong> — preserved for traceability.</li>
            <li>A new <strong>CONFIRMED</strong> budget (<em>{rd.name}</em>) is created, linked to the original.</li>
            <li>Use this when you need to raise or lower the <strong>budget cap (Allowed Amount)</strong> mid-period.</li>
          </ul>
        </div>

        <div style={{ background: '#FFF', border: '2px solid #1E293B', borderRadius: '14px', padding: '28px' }}>
          {/* Revised name */}
          <div style={{ marginBottom: '24px', maxWidth: '440px' }}>
            <Field label="Revised Budget Name">
              <input value={rd.name} onChange={e => setReviseData({ ...rd, name: e.target.value })} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '14px', background: '#F8FAFC', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase' }}>Period</div>
              <div style={{ fontWeight: '700', marginTop: '4px' }}>{rd.period_start} — {rd.period_end}</div>
            </div>
          </div>

          {/* Lines: show old cap → new cap editable */}
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>Adjust Budget Caps (Allowed Amounts)</h3>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '14px' }}>
            Change the <strong>New Allowed Amount</strong> column. The old caps are shown for reference.
          </p>
          <table className="valora-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Analytic Account</th>
                <th>Type</th>
                <th style={{ textAlign: 'right' }}>Old Allowed Amount (₹)</th>
                <th style={{ textAlign: 'right' }}>New Allowed Amount (₹) ✏️</th>
              </tr>
            </thead>
            <tbody>
              {rd.lines.map((line, idx) => (
                <tr key={idx}>
                  <td><strong>{line.analytic_name || line.analytic_account_id}</strong></td>
                  <td>
                    <span style={{
                      padding: '3px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '700',
                      backgroundColor: line.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2',
                      color: line.type === 'INCOME' ? '#059669' : '#DC2626'
                    }}>{line.type}</span>
                  </td>
                  <td style={{ textAlign: 'right', color: '#94A3B8', fontWeight: '600' }}>
                    {fmtMoney(line.old_allowed)}
                  </td>
                  <td>
                    <input type="number" value={line.allowed_amount}
                      onChange={e => updateRevLine(idx, e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '2px solid #2563EB', textAlign: 'right', fontWeight: '700', fontSize: '0.95rem' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return <div className="page-content"><p>Loading...</p></div>;
}
