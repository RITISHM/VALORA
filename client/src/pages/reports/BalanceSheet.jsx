import React, { useState, useEffect } from 'react';
import { api } from '../../api';

export default function BalanceSheet() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReport();
  }, [year]);

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBalanceSheet(year);
      setReport(data);
    } catch (error) {
      console.error('Failed to load balance sheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  if (isLoading && !report) return <div className="page-content">Loading...</div>;
  if (!report) return <div className="page-content">No data available.</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Balance Sheet</h1>
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
        {/* Assets Column */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--valora-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--valora-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--valora-border)', paddingBottom: '8px' }}>Assets</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {report.assets.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 0' }}>{item.name}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹ {item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {report.assets.items.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--valora-text-muted)' }}>No asset accounts with balance.</td></tr>}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)' }}>Total Assets</td>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)', textAlign: 'right' }}>
                  ₹ {report.total_assets.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Liabilities & Capital Column */}
        <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'var(--valora-surface)', padding: '24px', borderRadius: '8px', border: '1px solid var(--valora-border)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--valora-border)', paddingBottom: '8px' }}>Liabilities</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
            <tbody>
              {report.liabilities.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 0' }}>{item.name}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹ {item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {report.liabilities.items.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--valora-text-muted)' }}>No liability accounts with balance.</td></tr>}
            </tbody>
          </table>

          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--valora-border)', paddingBottom: '8px' }}>Capital</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {report.capital.items.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px 0' }}>{item.name}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right' }}>₹ {item.balance.toLocaleString()}</td>
                </tr>
              ))}
              {report.capital.items.length === 0 && <tr><td colSpan="2" style={{ color: 'var(--valora-text-muted)' }}>No capital accounts with balance.</td></tr>}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)' }}>Total Liabilities & Capital</td>
                <td style={{ fontWeight: 'bold', paddingTop: '16px', borderTop: '2px solid var(--valora-border)', textAlign: 'right' }}>
                  ₹ {report.total_liabilities_and_capital.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: report.is_balanced ? 'rgba(25, 135, 84, 0.1)' : 'rgba(220, 53, 69, 0.1)', color: report.is_balanced ? 'var(--valora-success)' : 'var(--valora-error)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
        <span>{report.is_balanced ? 'Balance Sheet is balanced' : 'Balance Sheet is not balanced'}</span>
        <span>Difference: ₹ {Math.abs(report.total_assets - report.total_liabilities_and_capital).toLocaleString()}</span>
      </div>
    </div>
  );
}
