/**
 * @file ProfitAndLoss.jsx
 * @description Financial Statement component for displaying the Profit & Loss (P&L) Statement in Valora ERP.
 * Renders Income and Expenses ledgers, calculates Total Income, Total Expenses,
 * and Net Profit / Loss with color indicators, and supports year filtering and printing.
 * @module pages/reports/ProfitAndLoss
 */

import React, { useState, useEffect } from 'react';
import { api } from '../../api';

/**
 * ProfitAndLoss Component
 * 
 * Renders the Profit and Loss statement for the chosen accounting year,
 * comparing operational revenues and expenses to derive Net Income.
 * 
 * @component
 * @returns {JSX.Element} The rendered Profit and Loss report page.
 */
export default function ProfitAndLoss() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReport();
  }, [year]);

  /**
   * Fetches the Profit & Loss report data for the selected fiscal year.
   * 
   * @async
   * @function loadReport
   * @returns {Promise<void>} Resolves when the statement state is updated.
   */
  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProfitAndLoss(year);
      setReport(data);
    } catch (error) {
      console.error('Failed to load P&L:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Triggers the native browser print preview dialog for exporting or printing the statement.
   * 
   * @function handlePrint
   * @returns {void}
   */
  const handlePrint = () => {
    window.print();
  };

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  if (isLoading && !report) return <div className="page-content">Loading...</div>;
  if (!report) return <div className="page-content">No data available.</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Profit & Loss Statement</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--valora-border)' }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="primary-btn" onClick={handlePrint}>Print</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Income Column */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--valora-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--valora-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--valora-border)', paddingBottom: '8px' }}>Income</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {report.income.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 0' }}>{item.name}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹ {item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {report.income.items.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--valora-text-muted)' }}>No income accounts with balance.</td></tr>}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)' }}>Total Income</td>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)', textAlign: 'right', color: 'var(--valora-success)' }}>
                  ₹ {report.income.total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Expenses Column */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--valora-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--valora-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--valora-border)', paddingBottom: '8px' }}>Expenses</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {report.expenses.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 0' }}>{item.name}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹ {item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {report.expenses.items.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--valora-text-muted)' }}>No expense accounts with balance.</td></tr>}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)' }}>Total Expenses</td>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)', textAlign: 'right', color: 'var(--valora-error)' }}>
                  ₹ {report.expenses.total.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Net Profit Summary */}
      <div style={{ marginTop: '24px', padding: '24px', backgroundColor: 'var(--valora-surface)', border: '1px solid var(--valora-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Net Profit</h2>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: report.net_profit >= 0 ? 'var(--valora-success)' : 'var(--valora-error)' }}>
          ₹ {report.net_profit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
