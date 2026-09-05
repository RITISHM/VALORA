/**
 * BudgetReport.jsx
 *
 * Comprehensive Analytical Budget Report & Analytics:
 * - Data Model: Allowed Cap (user-set) vs Committed Amount (auto-summed from PO/Bill/Invoice)
 * - Interactive SVG Pie / Donut Charts for Analytics across Analytic Accounts, Cap Utilization & Status
 * - Visible in BOTH List and Kanban views
 * - "+ Add Budget Report" modal to create new analytical budgets directly from the report
 * - Export to CSV for offline reporting
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, TrendingUp, AlertTriangle, BarChart2, Search,
  ChevronDown, ChevronUp, LayoutList, LayoutGrid, Calendar,
  User, PieChart, Plus, Download, X, Check, Trash2, Layers
} from 'lucide-react';
import { api } from '../../api';

const fmtMoney = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const STATUS_STYLE = {
  DRAFT:     { bg: '#FEF3C7', color: '#D97706', label: 'Draft' },
  CONFIRMED: { bg: '#D1FAE5', color: '#059669', label: 'Confirmed' },
  REVISED:   { bg: '#DBEAFE', color: '#2563EB', label: 'Revised' },
  CANCELLED: { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' },
};

const CHART_PALETTE = [
  '#714B67', '#059669', '#2563EB', '#D97706', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#10B981', '#6366F1',
  '#14B8A6', '#F43F5E', '#84CC16', '#EAB308', '#64748B'
];

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: '#F1F5F9', color: '#64748B', label: status };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '700', backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// Mini horizontal bar showing committed vs allowed cap
function BudgetBar({ committed, allowed }) {
  if (!allowed && !committed) return <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>;
  const base = Math.max(committed, allowed, 1);
  const committedPct = Math.min((committed / base) * 100, 100);
  const allowedPct = Math.min((allowed / base) * 100, 100);
  const isOver = committed > allowed && allowed > 0;

  return (
    <div style={{ width: '100%', minWidth: 80 }}>
      <div style={{ position: 'relative', height: '8px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden', marginBottom: '3px' }}>
        {/* Allowed cap marker */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${allowedPct}%`, background: '#BBF7D0', borderRadius: '99px' }} />
        {/* Committed bar */}
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${committedPct}%`, background: isOver ? '#EF4444' : '#3B82F6', borderRadius: '99px', opacity: 0.85 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
        <span style={{ color: '#3B82F6', fontWeight: '600' }}>Committed</span>
        <span style={{ color: '#059669', fontWeight: '600' }}>Cap</span>
      </div>
    </div>
  );
}

// ─── Interactive SVG Donut / Pie Chart Component ─────────────────────────────
function DonutPieChart({
  data = [],
  size = 200,
  innerRadius = 55,
  outerRadius = 90,
  centerTitle = 'Total',
  centerValue = '0',
  isCurrency = true,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const validData = data.filter(d => (d.value || 0) > 0);
  const total = validData.reduce((sum, d) => sum + (d.value || 0), 0);

  const cx = size / 2;
  const cy = size / 2;

  let currentAngle = -Math.PI / 2; // start at 12 o'clock

  const activeItem = hoveredIndex !== null && validData[hoveredIndex] ? validData[hoveredIndex] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {/* SVG Chart */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={(outerRadius + innerRadius) / 2}
              stroke="#E2E8F0"
              strokeWidth={outerRadius - innerRadius}
              fill="none"
              strokeDasharray="4 4"
            />
          ) : (
            validData.map((item, idx) => {
              const sliceAngle = (item.value / total) * 2 * Math.PI;
              const startAngle = currentAngle;
              const endAngle = currentAngle + sliceAngle;
              currentAngle = endAngle;

              const isHovered = hoveredIndex === idx;
              const rOuter = isHovered ? outerRadius + 5 : outerRadius;
              const rInner = isHovered ? Math.max(innerRadius - 3, 0) : innerRadius;

              const isFullCircle = sliceAngle >= 2 * Math.PI - 0.0001;
              const effEndAngle = isFullCircle ? startAngle + 2 * Math.PI - 0.001 : endAngle;

              const x1 = cx + rOuter * Math.cos(startAngle);
              const y1 = cy + rOuter * Math.sin(startAngle);
              const x2 = cx + rOuter * Math.cos(effEndAngle);
              const y2 = cy + rOuter * Math.sin(effEndAngle);

              const x3 = cx + rInner * Math.cos(effEndAngle);
              const y3 = cy + rInner * Math.sin(effEndAngle);
              const x4 = cx + rInner * Math.cos(startAngle);
              const y4 = cy + rInner * Math.sin(startAngle);

              const largeArc = sliceAngle > Math.PI ? 1 : 0;
              const pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} Z`;

              return (
                <path
                  key={idx}
                  d={pathData}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                  }}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none',
            maxWidth: `${innerRadius * 1.7}px`,
          }}
        >
          <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1.2' }}>
            {activeItem ? activeItem.label : centerTitle}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '800', color: activeItem ? activeItem.color : '#1E293B', marginTop: '2px', lineHeight: '1.2' }}>
            {activeItem
              ? (isCurrency ? fmtMoney(activeItem.value) : activeItem.value)
              : centerValue}
          </div>
          {activeItem && total > 0 && (
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748B', marginTop: '1px' }}>
              {((activeItem.value / total) * 100).toFixed(1)}%
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: '1', minWidth: '220px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {validData.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic' }}>No data to display</div>
        ) : (
          validData.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: isHovered ? '#F8FAFC' : 'transparent',
                  border: `1px solid ${isHovered ? item.color : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: isHovered ? '700' : '500', color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '700', color: isHovered ? item.color : '#334155' }}>
                    {isCurrency ? fmtMoney(item.value) : item.value}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#64748B', background: '#F1F5F9', padding: '1px 6px', borderRadius: '4px' }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function BudgetReport() {
  const [reportData, setReportData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedBudgets, setExpandedBudgets] = useState({});
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [listMode, setListMode] = useState('list'); // 'list' | 'kanban'

  // Analytics View State (visible in both list and kanban)
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [analyticsMetric, setAnalyticsMetric] = useState('committed'); // 'committed' | 'allowed'

  // Add Budget Report Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const yearEndStr = `${new Date().getFullYear()}-12-31`;

  const emptyForm = {
    name: '',
    responsible_contact_id: '',
    period_start: todayStr,
    period_end: yearEndStr,
    lines: [{ analytic_account_id: '', type: 'EXPENSE', allowed_amount: '' }],
  };
  const [formData, setFormData] = useState(emptyForm);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportRes, budgetsRes, accountsRes, contactsRes] = await Promise.all([
        api.getBudgetReport(),
        api.getBudgets(),
        api.getAnalyticAccounts().catch(() => []),
        api.getContacts().catch(() => []),
      ]);
      setReportData(reportRes);
      setBudgets(Array.isArray(budgetsRes) ? budgetsRes : []);
      setAnalyticAccounts(Array.isArray(accountsRes) ? accountsRes : []);
      setContacts(Array.isArray(contactsRes) ? contactsRes : []);
    } catch (err) {
      console.error('Failed to load budget report:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleExpand = (id) => setExpandedBudgets(prev => ({ ...prev, [id]: !prev[id] }));

  // ─── Add Budget Modal Handlers ───────────────────────────────────────────────
  const handleAddLine = () => {
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { analytic_account_id: '', type: 'EXPENSE', allowed_amount: '' }]
    }));
  };

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateLine = (idx, field, val) => {
    setFormData(prev => {
      const nextLines = [...prev.lines];
      nextLines[idx] = { ...nextLines[idx], [field]: val };
      return { ...prev, lines: nextLines };
    });
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Budget Name is required');
      return;
    }
    if (!formData.responsible_contact_id) {
      setFormError('Responsible Contact is required');
      return;
    }
    if (!formData.period_start || !formData.period_end) {
      setFormError('Start and End dates are required');
      return;
    }
    const hasValidLine = formData.lines.some(
      l => l.analytic_account_id && parseFloat(l.allowed_amount) > 0
    );
    if (!hasValidLine) {
      setFormError('Please add at least one line with an analytic account and budget cap (> ₹0)');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        period_start: formData.period_start,
        period_end: formData.period_end,
        responsible_contact_id: formData.responsible_contact_id,
        lines: formData.lines
          .filter(l => l.analytic_account_id)
          .map(l => ({
            analytic_account_id: l.analytic_account_id,
            type: l.type || 'EXPENSE',
            allowed_amount: parseFloat(l.allowed_amount) || 0,
          })),
      };

      await api.createBudget(payload);
      setShowAddModal(false);
      setFormData(emptyForm);
      setSuccessToast(`Budget "${payload.name}" successfully created!`);
      setTimeout(() => setSuccessToast(''), 4000);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to create budget. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Export to CSV Handler ──────────────────────────────────────────────────
  const handleExportCSV = () => {
    const allLines = reportData?.lines || [];
    if (allLines.length === 0) {
      alert('No budget report data available to export.');
      return;
    }

    const headers = [
      'Budget Name',
      'Status',
      'Responsible Person',
      'Analytic Account',
      'Type',
      'Allowed Cap (INR)',
      'Committed Amount (INR)',
      'Allowed %',
      'Amount to Attain (INR)',
      'Over Budget'
    ];

    const rows = allLines.map(l => [
      `"${(l.budget_name || '').replace(/"/g, '""')}"`,
      l.budget_status || '',
      `"${(l.responsible_person || '').replace(/"/g, '""')}"`,
      `"${(l.analytic_account_name || '').replace(/"/g, '""')}"`,
      l.type || '',
      l.allowed_amount || 0,
      l.committed_amount || 0,
      `${(l.allowed_pct || 0).toFixed(1)}%`,
      l.amount_to_attain || 0,
      l.over_budget ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `valora_budget_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── Kanban Card Component ──────────────────────────────────────────────────
  const KANBAN_COLS = [
    { status: 'DRAFT',     label: 'Draft',     icon: '📝', headerBg: '#FEF3C7', headerColor: '#D97706' },
    { status: 'CONFIRMED', label: 'Confirmed', icon: '✅', headerBg: '#D1FAE5', headerColor: '#059669' },
    { status: 'REVISED',   label: 'Revised',   icon: '🔄', headerBg: '#DBEAFE', headerColor: '#2563EB' },
    { status: 'CANCELLED', label: 'Cancelled', icon: '❌', headerBg: '#FEE2E2', headerColor: '#DC2626' },
  ];

  function BudgetReportCard({ budget, period }) {
    const totalAllowedB  = budget.lines.reduce((s, l) => s + (l.allowed_amount  || 0), 0);
    const totalCommitted = budget.lines.reduce((s, l) => s + (l.committed_amount || 0), 0);
    const totalToAttain  = budget.lines.reduce((s, l) => s + (l.amount_to_attain || 0), 0);
    const hasOver        = budget.lines.some(l => l.over_budget);
    const pct            = totalAllowedB > 0 ? Math.min(100, Math.round((totalCommitted / totalAllowedB) * 100)) : 0;
    const [hover, setHover] = useState(false);

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#FFF',
          border: `1.5px solid ${hasOver ? '#FCA5A5' : hover ? '#714B67' : '#E2E8F0'}`,
          borderRadius: '12px',
          padding: '16px',
          boxShadow: hover ? '0 4px 16px rgba(113,75,103,0.13)' : '0 1px 4px rgba(0,0,0,0.05)',
          transition: 'all 0.18s ease',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
          <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#1E293B', lineHeight: '1.3' }}>{budget.budget_name}</div>
          {hasOver && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', color: '#DC2626', fontWeight: '700', flexShrink: 0 }}>
              <AlertTriangle size={12} /> Over
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <User size={11} /> {budget.responsible_person || '—'}
        </div>
        {period && (
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={11} /> {fmtDate(period.start)} – {fmtDate(period.end)}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
          <div style={{ background: '#F0FDF4', borderRadius: '8px', padding: '8px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: '#059669', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Allowed Cap</div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#059669' }}>{fmtMoney(totalAllowedB)}</div>
          </div>
          <div style={{ background: hasOver ? '#FEF2F2' : '#EFF6FF', borderRadius: '8px', padding: '8px 10px' }}>
            <div style={{ fontSize: '0.68rem', color: hasOver ? '#DC2626' : '#2563EB', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Committed</div>
            <div style={{ fontWeight: '800', fontSize: '0.88rem', color: hasOver ? '#DC2626' : '#2563EB' }}>{fmtMoney(totalCommitted)}</div>
          </div>
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ height: '7px', background: '#F1F5F9', borderRadius: '99px', overflow: 'hidden', marginBottom: '3px' }}>
            <div style={{
              height: '100%', borderRadius: '99px',
              width: `${pct}%`,
              background: hasOver ? '#EF4444' : pct > 80 ? '#F59E0B' : '#22C55E',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
            <span>{budget.lines.length} line{budget.lines.length !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: '700', color: hasOver ? '#DC2626' : '#64748B' }}>{pct}% committed</span>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
          <span>Amount to Attain</span>
          <span style={{ fontWeight: '700', color: totalToAttain > 0 ? '#DC2626' : '#059669' }}>{fmtMoney(totalToAttain)}</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p style={{ color: '#64748B', fontWeight: '600' }}>Loading Budget Report & Analytics...</p>
      </div>
    );
  }

  // ─── Data Aggregation ───────────────────────────────────────────────────────
  const allLines = reportData?.lines || [];
  const budgetMap = {};
  allLines.forEach(line => {
    if (!budgetMap[line.budget_id]) {
      budgetMap[line.budget_id] = {
        budget_id: line.budget_id,
        budget_name: line.budget_name,
        budget_status: line.budget_status,
        responsible_person: line.responsible_person,
        lines: [],
      };
    }
    budgetMap[line.budget_id].lines.push(line);
  });

  const budgetPeriods = {};
  budgets.forEach(b => { budgetPeriods[b.id] = { start: b.period_start, end: b.period_end }; });

  // Apply search
  let searchedBudgets = Object.values(budgetMap);
  if (searchTerm.trim()) {
    const q = searchTerm.toLowerCase();
    searchedBudgets = searchedBudgets.filter(b =>
      b.budget_name.toLowerCase().includes(q) ||
      (b.responsible_person || '').toLowerCase().includes(q) ||
      b.lines.some(l => (l.analytic_account_name || '').toLowerCase().includes(q))
    );
  }

  // Apply status filter for list view
  const listBudgets = statusFilter !== 'ALL'
    ? searchedBudgets.filter(b => b.budget_status === statusFilter)
    : searchedBudgets;

  // Summary stats
  const totalAllowed = allLines.reduce((s, l) => s + (l.allowed_amount || 0), 0);
  const totalCommitted = allLines.reduce((s, l) => s + (l.committed_amount || 0), 0);
  const overBudgetLines = allLines.filter(l => l.over_budget).length;

  // ─── Analytics Pie Chart Data Preparation ──────────────────────────────────
  // 1. Analytic Account Distribution (Committed or Allowed)
  const analyticAgg = {};
  allLines.forEach(l => {
    const name = l.analytic_account_name || 'Unassigned';
    if (!analyticAgg[name]) {
      analyticAgg[name] = { committed: 0, allowed: 0 };
    }
    analyticAgg[name].committed += (l.committed_amount || 0);
    analyticAgg[name].allowed += (l.allowed_amount || 0);
  });

  const analyticPieData = Object.entries(analyticAgg).map(([name, vals], idx) => ({
    label: name,
    value: analyticsMetric === 'committed' ? vals.committed : vals.allowed,
    color: CHART_PALETTE[idx % CHART_PALETTE.length],
  })).sort((a, b) => b.value - a.value);

  // 2. Budget Status Distribution (Draft, Confirmed, Revised, Cancelled)
  const statusCounts = { DRAFT: 0, CONFIRMED: 0, REVISED: 0, CANCELLED: 0 };
  budgets.forEach(b => {
    if (statusCounts[b.status] !== undefined) statusCounts[b.status]++;
    else statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });

  const statusPieData = Object.entries(statusCounts).map(([st, count]) => ({
    label: STATUS_STYLE[st]?.label || st,
    value: count,
    color: STATUS_STYLE[st]?.color || '#64748B',
  })).filter(d => d.value > 0);

  // 3. Cap Utilization Distribution
  const withinCap = Math.min(totalCommitted, totalAllowed);
  const unutilizedCap = Math.max(totalAllowed - totalCommitted, 0);
  const overBudgetAmount = Math.max(totalCommitted - totalAllowed, 0);

  const utilizationPieData = [
    { label: 'Utilized Cap', value: withinCap, color: '#059669' },
    { label: 'Unspent Buffer', value: unutilizedCap, color: '#714B67' },
    ...(overBudgetAmount > 0 ? [{ label: 'Over Budget', value: overBudgetAmount, color: '#DC2626' }] : []),
  ];

  const statuses = ['ALL', 'DRAFT', 'CONFIRMED', 'REVISED', 'CANCELLED'];

  return (
    <div className="page-content">
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: '#059669', color: '#FFF', padding: '12px 20px',
          borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem'
        }}>
          <Check size={18} /> {successToast}
        </div>
      )}

      {/* Page header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart2 size={28} color="#714B67" />
          <div>
            <h1 className="page-title">Budget Report & Analytics</h1>
            <p style={{ color: '#64748B', margin: '2px 0 0', fontSize: '0.875rem' }}>
              Track Allowed Cap vs Committed Amount across all analytical budgets
            </p>
          </div>
        </div>

        {/* Action buttons + View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            title="Download report data as CSV"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: '1.5px solid #CBD5E1',
              background: '#FFF', color: '#475569', fontWeight: '600', fontSize: '0.84rem',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          >
            <Download size={15} /> Export CSV
          </button>

          {/* Add Budget Report Button */}
          <button
            onClick={() => {
              setFormError('');
              setFormData(emptyForm);
              setShowAddModal(true);
            }}
            title="Create a new budget report"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#714B67', color: '#FFF', fontWeight: '700', fontSize: '0.84rem',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(113,75,103,0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> Add Budget Report
          </button>

          {/* Toggle Analytics Card */}
          <button
            onClick={() => setShowAnalytics(prev => !prev)}
            title="Toggle Analytics Pie Charts"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '8px 12px', borderRadius: '8px', border: '1.5px solid',
              borderColor: showAnalytics ? '#714B67' : '#CBD5E1',
              background: showAnalytics ? '#FDF2F8' : '#FFF',
              color: showAnalytics ? '#714B67' : '#64748B',
              fontWeight: '600', fontSize: '0.84rem', cursor: 'pointer',
            }}
          >
            <PieChart size={15} /> {showAnalytics ? 'Hide Charts' : 'Show Charts'}
          </button>

          {/* View toggle (List vs Kanban) */}
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
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Budgets', value: reportData?.total_budgets || 0, color: '#714B67', icon: '📋' },
          { label: 'Total Allowed Cap', value: fmtMoney(totalAllowed), color: '#059669', icon: '✅' },
          { label: 'Total Committed', value: fmtMoney(totalCommitted), color: '#2563EB', icon: '📊' },
          { label: 'Over-Budget Lines', value: overBudgetLines, color: overBudgetLines > 0 ? '#DC2626' : '#059669', icon: overBudgetLines > 0 ? '⚠️' : '✓' },
        ].map(card => (
          <div key={card.label} style={{ background: '#FFF', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{card.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ─── Analytics Pie Charts Section (VISIBLE IN BOTH LIST AND KANBAN) ─── */}
      {showAnalytics && (
        <div style={{
          background: '#FFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: '14px',
          padding: '24px',
          marginBottom: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieChart size={22} color="#714B67" />
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1E293B', margin: 0 }}>Analytics & Visualizations</h2>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>Breakdown across Analytic Accounts, Portfolio Health, and Status</p>
              </div>
            </div>

            {/* Metric Switcher for Chart 1 */}
            <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
              <button
                onClick={() => setAnalyticsMetric('committed')}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.78rem',
                  background: analyticsMetric === 'committed' ? '#714B67' : 'transparent',
                  color: analyticsMetric === 'committed' ? '#FFF' : '#64748B',
                }}
              >
                Committed Spend
              </button>
              <button
                onClick={() => setAnalyticsMetric('allowed')}
                style={{
                  padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: '600', fontSize: '0.78rem',
                  background: analyticsMetric === 'allowed' ? '#714B67' : 'transparent',
                  color: analyticsMetric === 'allowed' ? '#FFF' : '#64748B',
                }}
              >
                Allowed Cap
              </button>
            </div>
          </div>

          {/* Grid of Two Interactive Pie Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
            {/* Chart 1: Analytic Accounts Distribution */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1E293B' }}>
                  📊 Analytic Accounts Distribution
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#FFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  {analyticsMetric === 'committed' ? 'By Committed (₹)' : 'By Cap (₹)'}
                </span>
              </div>
              <DonutPieChart
                data={analyticPieData}
                centerTitle={analyticsMetric === 'committed' ? 'Total Committed' : 'Total Cap'}
                centerValue={fmtMoney(analyticsMetric === 'committed' ? totalCommitted : totalAllowed)}
                isCurrency={true}
              />
            </div>

            {/* Chart 2: Cap Utilization & Portfolio Health */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#1E293B' }}>
                  🎯 Budget Cap Utilization & Health
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', background: '#FFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  {totalAllowed > 0 ? `${Math.round((totalCommitted / totalAllowed) * 100)}% utilized` : '0%'}
                </span>
              </div>
              <DonutPieChart
                data={utilizationPieData}
                centerTitle="Allowed Cap"
                centerValue={fmtMoney(totalAllowed)}
                isCurrency={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Toolbar: search + status filter */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '8px 14px', gap: '8px', flex: '1', minWidth: '220px' }}>
          <Search size={16} color="#94A3B8" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by budget name, responsible person, or analytic account..."
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', width: '100%' }}
          />
        </div>
        {listMode === 'list' && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{
                padding: '7px 14px', borderRadius: '8px', border: '1.5px solid',
                borderColor: statusFilter === s ? '#714B67' : '#E2E8F0',
                background: statusFilter === s ? '#714B67' : '#FFF',
                color: statusFilter === s ? '#FFF' : '#64748B',
                fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── Kanban view ── */}
      {listMode === 'kanban' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(270px, 1fr))', gap: '16px', minWidth: '900px' }}>
            {KANBAN_COLS.map(col => {
              const colBudgets = searchedBudgets.filter(b => b.budget_status === col.status);
              return (
                <div key={col.status}>
                  {/* Column header */}
                  <div style={{
                    background: col.headerBg, color: col.headerColor,
                    borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontWeight: '700', fontSize: '0.875rem',
                  }}>
                    <span>{col.icon} {col.label}</span>
                    <span style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '99px', padding: '1px 8px', fontSize: '0.78rem' }}>
                      {colBudgets.length}
                    </span>
                  </div>
                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colBudgets.length === 0
                      ? <div style={{ textAlign: 'center', padding: '32px 16px', color: '#CBD5E1', fontSize: '0.85rem', border: '2px dashed #E2E8F0', borderRadius: '10px' }}>No budgets</div>
                      : colBudgets.map(b => <BudgetReportCard key={b.budget_id} budget={b} period={budgetPeriods[b.budget_id]} />)
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {listMode === 'list' && (
        listBudgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#CBD5E1' }}>
            <BarChart2 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ fontSize: '1rem', fontWeight: '600' }}>No budgets found.</p>
            <p style={{ fontSize: '0.875rem', marginTop: '8px' }}>Create an Analytical Budget to track project performance.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listBudgets.map(budget => {
              const isExpanded = expandedBudgets[budget.budget_id];
              const period = budgetPeriods[budget.budget_id];
              const totalAllowedB = budget.lines.reduce((s, l) => s + (l.allowed_amount || 0), 0);
              const totalCommittedB = budget.lines.reduce((s, l) => s + (l.committed_amount || 0), 0);
              const totalToAttain = budget.lines.reduce((s, l) => s + (l.amount_to_attain || 0), 0);
              const hasOverBudget = budget.lines.some(l => l.over_budget);

              return (
                <div key={budget.budget_id} style={{
                  background: '#FFF',
                  border: `1.5px solid ${hasOverBudget ? '#FCA5A5' : '#E2E8F0'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}>
                  {/* Budget row header */}
                  <div
                    onClick={() => toggleExpand(budget.budget_id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', cursor: 'pointer', userSelect: 'none' }}
                  >
                    {/* Expand icon */}
                    <div style={{ color: '#94A3B8', flexShrink: 0 }}>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>

                    {/* Budget name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1E293B' }}>{budget.budget_name}</span>
                        <StatusBadge status={budget.budget_status} />
                        {hasOverBudget && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#DC2626', fontWeight: '700' }}>
                            <AlertTriangle size={13} /> Over Budget
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '3px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        {budget.responsible_person && <span>👤 {budget.responsible_person}</span>}
                        {period && <span>📅 {fmtDate(period.start)} – {fmtDate(period.end)}</span>}
                        <span>📋 {budget.lines.length} line{budget.lines.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Summary numbers */}
                    <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Allowed Cap</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#059669' }}>{fmtMoney(totalAllowedB)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>Committed</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: hasOverBudget ? '#DC2626' : '#2563EB' }}>{fmtMoney(totalCommittedB)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' }}>To Attain</div>
                        <div style={{ fontWeight: '700', fontSize: '0.95rem', color: totalToAttain > 0 ? '#DC2626' : '#059669' }}>{fmtMoney(totalToAttain)}</div>
                      </div>
                      <div style={{ width: '100px' }}>
                        <BudgetBar committed={totalCommittedB} allowed={totalAllowedB} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded lines table */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #F1F5F9' }}>
                      <table className="valora-table" style={{ width: '100%', margin: 0 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC' }}>
                            <th style={{ paddingLeft: '54px' }}>Analytic Account</th>
                            <th>Type</th>
                            <th style={{ textAlign: 'right' }}>
                              Allowed Amount (₹)
                              <div style={{ fontWeight: '400', fontSize: '0.7rem', color: '#94A3B8' }}>Budget Cap</div>
                            </th>
                            <th style={{ textAlign: 'right' }}>
                              Committed Amount (₹)
                              <div style={{ fontWeight: '400', fontSize: '0.7rem', color: '#94A3B8' }}>From Transactions</div>
                            </th>
                            <th style={{ textAlign: 'right' }}>Allowed %</th>
                            <th style={{ textAlign: 'right' }}>Amount to Attain (₹)</th>
                            <th style={{ width: '120px' }}>Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budget.lines.map((line, idx) => {
                            const isLineOver = line.over_budget;
                            return (
                              <tr key={idx} style={{ background: isLineOver ? '#FFF7F7' : undefined }}>
                                <td style={{ paddingLeft: '54px' }}>
                                  <strong>{line.analytic_account_name || '—'}</strong>
                                  {isLineOver && <AlertTriangle size={13} color="#DC2626" style={{ marginLeft: '6px', verticalAlign: 'middle' }} />}
                                </td>
                                <td>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: '5px', fontSize: '0.78rem', fontWeight: '700',
                                    backgroundColor: line.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2',
                                    color: line.type === 'INCOME' ? '#059669' : '#DC2626',
                                  }}>{line.type}</span>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                  {fmtMoney(line.allowed_amount)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: isLineOver ? '#DC2626' : '#2563EB' }}>
                                  {fmtMoney(line.committed_amount)}
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>
                                  {Number(line.allowed_pct || 0).toFixed(1)}%
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: (line.amount_to_attain || 0) > 0 ? '#DC2626' : '#059669' }}>
                                  {fmtMoney(line.amount_to_attain)}
                                </td>
                                <td>
                                  <BudgetBar committed={line.committed_amount} allowed={line.allowed_amount} />
                                </td>
                              </tr>
                            );
                          })}
                          {/* Totals row */}
                          <tr style={{ background: '#F8FAFC', fontWeight: '800', borderTop: '2px solid #E2E8F0' }}>
                            <td style={{ paddingLeft: '54px', color: '#1E293B' }}>TOTAL</td>
                            <td></td>
                            <td style={{ textAlign: 'right', color: '#059669' }}>{fmtMoney(totalAllowedB)}</td>
                            <td style={{ textAlign: 'right', color: hasOverBudget ? '#DC2626' : '#2563EB' }}>{fmtMoney(totalCommittedB)}</td>
                            <td style={{ textAlign: 'right', color: '#7C3AED' }}>
                              {totalAllowedB > 0 ? ((totalAllowedB / Math.max(totalCommittedB, 1)) * 100).toFixed(1) : '—'}%
                            </td>
                            <td style={{ textAlign: 'right', color: totalToAttain > 0 ? '#DC2626' : '#059669' }}>{fmtMoney(totalToAttain)}</td>
                            <td><BudgetBar committed={totalCommittedB} allowed={totalAllowedB} /></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748B' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#BBF7D0' }} /> Allowed Cap (green)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6' }} /> Committed — within budget (blue)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444' }} /> Committed — over budget (red)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={12} /> Amount to Attain = Committed − Allowed
        </div>
      </div>

      {/* ─── ADD BUDGET REPORT MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, padding: '20px',
        }}>
          <div style={{
            background: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '780px',
            maxHeight: '90vh', overflowY: 'auto', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            position: 'relative',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E293B', margin: '0 0 4px' }}>
                  Create New Budget Report
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  Define period dates and analytic account caps to track live transactions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div style={{
                background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#DC2626',
                padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem',
                marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <AlertTriangle size={16} /> {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateBudget}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Q3 Analytical Budget"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Responsible Contact *
                  </label>
                  <select
                    required
                    value={formData.responsible_contact_id}
                    onChange={e => setFormData({ ...formData, responsible_contact_id: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none', background: '#FFF'
                    }}
                  >
                    <option value="">— Select Responsible Contact —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Period Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={e => setFormData({ ...formData, period_start: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Period End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={e => setFormData({ ...formData, period_end: e.target.value })}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '8px',
                      border: '1.5px solid #CBD5E1', fontSize: '0.9rem', outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Budget Lines Section */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1E293B', textTransform: 'uppercase' }}>
                    Analytic Account Lines
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: '#F1F5F9', color: '#714B67', border: 'none',
                      padding: '5px 10px', borderRadius: '6px', fontSize: '0.8rem',
                      fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Add Line
                  </button>
                </div>

                <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Analytic Account</th>
                        <th style={{ padding: '10px 12px', width: '130px' }}>Type</th>
                        <th style={{ padding: '10px 12px', width: '170px', textAlign: 'right' }}>Allowed Cap (₹)</th>
                        <th style={{ width: '40px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: idx < formData.lines.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                          <td style={{ padding: '8px 12px' }}>
                            <select
                              value={line.analytic_account_id}
                              onChange={e => handleUpdateLine(idx, 'analytic_account_id', e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFF' }}
                            >
                              <option value="">— Select Analytic Account —</option>
                              {analyticAccounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <select
                              value={line.type}
                              onChange={e => handleUpdateLine(idx, 'type', e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', background: '#FFF' }}
                            >
                              <option value="EXPENSE">Expense</option>
                              <option value="INCOME">Income</option>
                            </select>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="e.g. 150000"
                              value={line.allowed_amount}
                              onChange={e => handleUpdateLine(idx, 'allowed_amount', e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.85rem', textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            {formData.lines.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '18px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '9px 18px', borderRadius: '8px', border: '1.5px solid #CBD5E1',
                    background: '#FFF', color: '#64748B', fontWeight: '600', fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 22px', borderRadius: '8px', border: 'none',
                    background: '#714B67', color: '#FFF', fontWeight: '700', fontSize: '0.875rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(113,75,103,0.3)',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Creating Budget...' : 'Create Budget Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
