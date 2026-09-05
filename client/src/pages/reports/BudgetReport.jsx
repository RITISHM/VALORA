import React, { useState, useEffect } from 'react';
import { ArrowLeft, PieChart as PieIcon, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { api } from '../../api';

// Simple SVG Pie chart (no external dep)
function SimplePieChart({ committed, achieved, size = 160 }) {
  const total = Math.max(committed, achieved, 1);
  const achievedPct = Math.min(achieved / total, 1);
  const committedPct = Math.min(committed / total, 1);

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle - 90));
    const y1 = cy + r * Math.sin(toRad(startAngle - 90));
    const x2 = cx + r * Math.cos(toRad(endAngle - 90));
    const y2 = cy + r * Math.sin(toRad(endAngle - 90));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const achievedAngle = achievedPct * 360;
  const committedAngle = committedPct * 360;
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle cx={cx} cy={cy} r={r} fill="#E2E8F0" />
      {/* Committed arc (blue) */}
      {committedAngle > 0 && (
        <path d={describeArc(cx, cy, r, 0, Math.min(committedAngle, 359.9))} fill="#93C5FD" />
      )}
      {/* Achieved arc (pink/red) */}
      {achievedAngle > 0 && (
        <path d={describeArc(cx, cy, r, 0, Math.min(achievedAngle, 359.9))} fill="#FCA5A5" opacity="0.85" />
      )}
    </svg>
  );
}

export default function BudgetReport() {
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [detailView, setDetailView] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        // Use the budgets list endpoint which now includes enriched line data
        const data = await api.getBudgets();
        setBudgets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load budget report:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const openDetail = (b) => {
    setSelectedBudget(b);
    setDetailView(true);
  };

  const fmtMoney = (n) => `₹ ${Number(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

  // ─── Detail / Drill-down view ─────────────────────────────────────────────────
  if (detailView && selectedBudget) {
    const b = selectedBudget;
    const totalCommitted = (b.budget_lines || []).reduce((s, l) => s + (l.committed_amount || 0), 0);
    const totalAchieved = (b.budget_lines || []).reduce((s, l) => s + (l.achieved_amount || 0), 0);

    return (
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={() => setDetailView(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800' }}>{b.name} — Detail Report</h2>
          </div>
          <button className="primary-btn" onClick={() => window.print()}>Print</button>
        </div>

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '28px' }}>
          {/* Header info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Budget</div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>{b.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>Start Date</div>
              <div style={{ fontWeight: '700' }}>{fmtDate(b.period_start)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>End Date</div>
              <div style={{ fontWeight: '700' }}>{fmtDate(b.period_end)}</div>
            </div>
          </div>

          {/* Pie Chart + Summary */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <SimplePieChart committed={totalCommitted} achieved={totalAchieved} size={180} />
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#64748B' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#93C5FD', borderRadius: '2px', marginRight: '4px' }}></span> Committed &nbsp;
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#FCA5A5', borderRadius: '2px', marginRight: '4px' }}></span> Achieved
              </div>
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Total Committed', value: fmtMoney(totalCommitted), color: '#2563EB' },
                { label: 'Total Achieved', value: fmtMoney(totalAchieved), color: '#059669' },
                { label: 'Remaining (Committed − Achieved)', value: fmtMoney(totalCommitted - totalAchieved), color: totalCommitted - totalAchieved < 0 ? '#DC2626' : '#0F172A' },
                { label: 'Achieved %', value: `${totalCommitted > 0 ? ((totalAchieved / totalCommitted) * 100).toFixed(1) : 0}%`, color: '#7C3AED' },
              ].map((s) => (
                <div key={s.label} style={{ background: '#F8FAFC', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lines Table */}
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
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#64748B' }}>No lines.</td></tr>
              )}
              {(b.budget_lines || []).map((line, idx) => (
                <tr key={idx}>
                  <td><strong>{line.analytic_account?.name || '—'}</strong></td>
                  <td>
                    <span style={{
                      padding: '3px 8px', borderRadius: '5px', fontSize: '0.8rem', fontWeight: '700',
                      backgroundColor: line.type === 'INCOME' ? '#D1FAE5' : '#FEE2E2',
                      color: line.type === 'INCOME' ? '#059669' : '#DC2626'
                    }}>{line.type}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600' }}>{fmtMoney(line.committed_amount)}</td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: line.is_over_budget ? '#DC2626' : '#059669' }}>
                    {fmtMoney(line.achieved_amount)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#7C3AED' }}>
                    {Number(line.allowed_pct || 0).toFixed(1)}%
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: (line.amount_to_attain || 0) < 0 ? '#DC2626' : '#059669' }}>
                    {fmtMoney(line.amount_to_attain)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Grid List View ──────────────────────────────────────────────────────────
  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PieIcon size={28} color="#2563EB" />
          <div>
            <h1 className="page-title">Budget Report</h1>
            <p style={{ color: '#64748B', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
              Track Committed vs Achieved vs Remaining across all budgets.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p>Loading Budget Report...</p>
      ) : budgets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
          <PieIcon size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>No budgets found. Create an Analytical Budget to track project performance.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {budgets.map((b) => {
            const totalCommitted = (b.budget_lines || []).reduce((s, l) => s + (l.committed_amount || 0), 0);
            const totalAchieved = (b.budget_lines || []).reduce((s, l) => s + (l.achieved_amount || 0), 0);
            const remaining = totalCommitted - totalAchieved;
            const isOver = remaining < 0;

            return (
              <div key={b.id} style={{
                background: '#FFFFFF', border: '2px solid #E2E8F0', borderRadius: '14px', padding: '20px',
                cursor: 'pointer', transition: 'box-shadow 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                onClick={() => openDetail(b)}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>{b.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                      {fmtDate(b.period_start)} – {fmtDate(b.period_end)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                      backgroundColor: { DRAFT: '#FEF3C7', CONFIRMED: '#D1FAE5', REVISED: '#DBEAFE', CANCELLED: '#FEE2E2' }[b.status] || '#F1F5F9',
                      color: { DRAFT: '#D97706', CONFIRMED: '#059669', REVISED: '#2563EB', CANCELLED: '#DC2626' }[b.status] || '#64748B'
                    }}>{b.status}</span>
                    <button className="secondary-btn" style={{ padding: '3px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => { e.stopPropagation(); openDetail(b); }}>
                      <Eye size={12} /> Open Form View on Click
                    </button>
                  </div>
                </div>

                {/* Pie + stats */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <SimplePieChart committed={totalCommitted} achieved={totalAchieved} size={80} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Committed</div>
                    <div style={{ fontWeight: '700', color: '#2563EB', fontSize: '1rem', marginBottom: '8px' }}>{fmtMoney(totalCommitted)}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '4px' }}>Achieved</div>
                    <div style={{ fontWeight: '700', color: '#059669', fontSize: '1rem', marginBottom: '8px' }}>{fmtMoney(totalAchieved)}</div>
                    {isOver && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontSize: '0.8rem', fontWeight: '700' }}>
                        <AlertTriangle size={14} /> Exceeds Budget
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B', marginBottom: '4px' }}>
                    <span>Achieved vs Committed</span>
                    <span style={{ fontWeight: '700', color: isOver ? '#DC2626' : '#059669' }}>
                      {totalCommitted > 0 ? ((totalAchieved / totalCommitted) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '4px',
                      width: `${Math.min((totalAchieved / Math.max(totalCommitted, 1)) * 100, 100)}%`,
                      background: isOver ? '#EF4444' : '#22C55E',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Line count */}
                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{(b.budget_lines || []).length} budget line{b.budget_lines?.length !== 1 ? 's' : ''}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2563EB' }}>
                    <TrendingUp size={12} /> Open Form View on Click
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
