/**
 * @file ProfitAndLoss.jsx
 * @description Financial Statement component for displaying the Profit & Loss (P&L) Statement in Valora ERP.
 * Renders Income and Expenses ledgers, calculates Total Income, Total Expenses,
 * and Net Profit / Loss with color indicators, and supports year filtering and printing.
 * @module pages/reports/ProfitAndLoss
 */

import { useState, useEffect } from "react";
import { api } from "../../api";

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
      console.error("Failed to load P&L:", error);
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

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading && !report) return <div className="page-content">Loading...</div>;
  if (!report) return <div className="page-content">No data available.</div>;

  return (
    <div className="page-content">
      <div
        className="page-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <button className="secondary-btn" onClick={() => window.history.back()}>
          Back
        </button>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid var(--valora-border)",
              backgroundColor: "var(--valora-surface)",
              fontSize: "1rem",
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-btn" onClick={handlePrint}>
          Print
        </button>
      </div>

      <div
        style={{
          backgroundColor: "var(--valora-surface)",
          padding: "24px",
          borderRadius: "12px",
          border: "1px solid var(--valora-border)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            border: "1px solid var(--valora-border)",
          }}
        >
          <thead>
            <tr>
              <th
                colSpan="2"
                style={{
                  borderBottom: "1px solid var(--valora-border)",
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "normal",
                  color: "var(--valora-text-muted)",
                }}
              >
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Income Section */}
            <tr
              style={{
                borderBottom: "1px solid var(--valora-border)",
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <td style={{ padding: "12px", fontWeight: "bold" }}>Income</td>
              <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
                Rs. {report.income.total.toLocaleString()}
              </td>
            </tr>
            {report.income.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--valora-border)" }}>
                <td style={{ padding: "12px", paddingLeft: "24px" }}>{item.name}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  Rs. {item.balance.toLocaleString()}
                </td>
              </tr>
            ))}
            {report.income.items.length === 0 && (
              <tr style={{ borderBottom: "1px solid var(--valora-border)" }}>
                <td
                  colSpan="2"
                  style={{
                    padding: "12px",
                    paddingLeft: "24px",
                    color: "var(--valora-text-muted)",
                  }}
                >
                  No income accounts
                </td>
              </tr>
            )}

            {/* Expenses Section */}
            <tr
              style={{
                borderBottom: "1px solid var(--valora-border)",
                backgroundColor: "rgba(0,0,0,0.02)",
              }}
            >
              <td style={{ padding: "12px", fontWeight: "bold" }}>Expenses</td>
              <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>
                Rs. {report.expenses.total.toLocaleString()}
              </td>
            </tr>
            {report.expenses.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--valora-border)" }}>
                <td style={{ padding: "12px", paddingLeft: "24px" }}>{item.name}</td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  Rs. {item.balance.toLocaleString()}
                </td>
              </tr>
            ))}
            {report.expenses.items.length === 0 && (
              <tr style={{ borderBottom: "1px solid var(--valora-border)" }}>
                <td
                  colSpan="2"
                  style={{
                    padding: "12px",
                    paddingLeft: "24px",
                    color: "var(--valora-text-muted)",
                  }}
                >
                  No expense accounts
                </td>
              </tr>
            )}

            {/* Net Income */}
            <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
              <td style={{ padding: "12px", fontWeight: "bold" }}>Net Income</td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "bold",
                  color: report.net_profit >= 0 ? "var(--valora-success)" : "var(--valora-error)",
                }}
              >
                Rs. {report.net_profit.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
