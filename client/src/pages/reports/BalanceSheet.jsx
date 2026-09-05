/**
 * @file BalanceSheet.jsx
 * @description Financial Statement component for displaying the Company Balance Sheet in Valora ERP.
 * Renders two-column accounting statement of Assets vs. Liabilities and Capital,
 * verifies accounting equation equality (Assets = Liabilities + Equity), and supports year filtering and printing.
 * @module pages/reports/BalanceSheet
 */

import React, { useState, useEffect } from "react";
import { api } from "../../api";

/**
 * BalanceSheet Component
 *
 * Renders the Balance Sheet financial report for a selected fiscal year.
 * Displays Assets, Liabilities, and Capital sections, calculating totals and verifying balance equilibrium.
 *
 * @component
 * @returns {JSX.Element} The rendered Balance Sheet report page.
 */
export default function BalanceSheet() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadReport();
  }, [year]);

  /**
   * Fetches the balance sheet report data for the currently selected fiscal year.
   *
   * @async
   * @function loadReport
   * @returns {Promise<void>} Resolves when the report state is populated.
   */
  const loadReport = async () => {
    setIsLoading(true);
    try {
      const data = await api.getBalanceSheet(year);
      setReport(data);
    } catch (error) {
      console.error("Failed to load balance sheet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Triggers the native browser print dialog to print or export the statement as PDF.
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

  const liabilityItems = [...report.capital.items, ...report.liabilities.items];
  const maxRows = Math.max(report.assets.items.length, liabilityItems.length);
  const rows = [];

  for (let i = 0; i < maxRows; i++) {
    rows.push({
      asset: report.assets.items[i] || null,
      liability: liabilityItems[i] || null,
    });
  }

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
        <button
          className="primary-btn"
          onClick={handlePrint}
          style={{ backgroundColor: "var(--valora-primary)", color: "#fff" }}
        >
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
            <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
              <th
                style={{
                  borderBottom: "1px solid var(--valora-border)",
                  borderRight: "1px solid var(--valora-border)",
                  padding: "12px",
                  textAlign: "center",
                  width: "50%",
                }}
              >
                Assets
              </th>
              <th
                style={{
                  borderBottom: "1px solid var(--valora-border)",
                  padding: "12px",
                  textAlign: "center",
                  width: "50%",
                }}
              >
                Liabilities
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--valora-border)" }}>
                {/* Asset Cell */}
                <td style={{ borderRight: "1px solid var(--valora-border)", padding: "12px" }}>
                  {row.asset ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{row.asset.name}</span>
                      <span>Rs. {row.asset.balance.toLocaleString()}</span>
                    </div>
                  ) : null}
                </td>
                {/* Liability Cell */}
                <td style={{ padding: "12px" }}>
                  {row.liability ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>{row.liability.name}</span>
                      <span>Rs. {row.liability.balance.toLocaleString()}</span>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan="2"
                  style={{
                    padding: "12px",
                    textAlign: "center",
                    color: "var(--valora-text-muted)",
                  }}
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
              <td
                style={{
                  borderRight: "1px solid var(--valora-border)",
                  padding: "12px",
                  fontWeight: "bold",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Asset</span>
                  <span>Rs. {report.total_assets.toLocaleString()}</span>
                </div>
              </td>
              <td style={{ padding: "12px", fontWeight: "bold" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Liability</span>
                  <span>Rs. {report.total_liabilities_and_capital.toLocaleString()}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: report.is_balanced
              ? "rgba(25, 135, 84, 0.1)"
              : "rgba(220, 53, 69, 0.1)",
            color: report.is_balanced ? "var(--valora-success)" : "var(--valora-error)",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "bold",
          }}
        >
          <span>
            {report.is_balanced ? "Balance Sheet is balanced" : "Balance Sheet is not balanced"}
          </span>
          <span>
            Difference: Rs.{" "}
            {Math.abs(report.total_assets - report.total_liabilities_and_capital).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
