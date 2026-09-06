/**
 * @file BalanceSheet.jsx
 * @description Financial Statement component for displaying the Company Balance Sheet in Valora ERP.
 * Renders two-column accounting statement of Assets vs. Liabilities and Capital,
 * verifies accounting equation equality (Assets = Liabilities + Capital), and supports year filtering and printing.
 * @module pages/reports/BalanceSheet
 */

import { useState, useEffect } from "react";
import { api } from "../../api";

/** Format a number as Indian Rupee with always-2 decimal places */
const fmt = (num) =>
  Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * BalanceSheet Component
 *
 * Renders the Balance Sheet financial report for a selected fiscal year.
 * Displays Assets, Liabilities, and Capital sections, calculating totals
 * and verifying balance equilibrium (Assets = Liabilities + Capital).
 *
 * @component
 * @returns {JSX.Element} The rendered Balance Sheet report page.
 */
export default function BalanceSheet() {
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
    setError(null);
    try {
      const data = await api.getBalanceSheet(year);
      setReport(data);
    } catch (err) {
      console.error("Failed to load balance sheet:", err);
      setError(err.message || "Failed to load balance sheet. Please try again.");
      setReport(null);
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

  /* ── shared cell style helpers ── */
  const cellBase = {
    padding: "10px 14px",
    fontSize: "0.9rem",
    borderBottom: "1px solid var(--valora-border)",
    verticalAlign: "top",
  };

  const sectionHeader = {
    ...cellBase,
    fontWeight: "700",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--valora-text-muted)",
    backgroundColor: "rgba(0,0,0,0.03)",
    paddingTop: "14px",
  };

  const subtotalRow = {
    ...cellBase,
    fontWeight: "600",
    borderTop: "1px solid var(--valora-border)",
    borderBottom: "2px solid var(--valora-border)",
    backgroundColor: "rgba(0,0,0,0.02)",
  };

  const totalRow = {
    ...cellBase,
    fontWeight: "700",
    fontSize: "1rem",
    borderTop: "2px solid var(--valora-border)",
    backgroundColor: "rgba(0,0,0,0.04)",
  };

  /* ── early returns ── */
  if (isLoading && !report) {
    return (
      <div className="page-content" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ opacity: 0.6 }}>Loading balance sheet…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-content">
        <div
          style={{
            padding: "20px",
            borderRadius: "10px",
            backgroundColor: "rgba(220,53,69,0.1)",
            color: "var(--valora-error)",
            border: "1px solid rgba(220,53,69,0.3)",
          }}
        >
          <strong>Error:</strong> {error}
          <br />
          <button className="secondary-btn" style={{ marginTop: "12px" }} onClick={loadReport}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return <div className="page-content">No data available.</div>;
  }

  /* ── build right-column rows: Capital first, then Liabilities ── */
  const rightRows = [
    { type: "section", label: "Capital & Equity" },
    ...report.capital.items.map((i) => ({ type: "item", ...i })),
    {
      type: "subtotal",
      label: "Total Capital",
      value: report.capital.total,
    },
    { type: "section", label: "Liabilities" },
    ...report.liabilities.items.map((i) => ({ type: "item", ...i })),
    {
      type: "subtotal",
      label: "Total Liabilities",
      value: report.liabilities.total,
    },
  ];

  const leftRows = [
    { type: "section", label: "Assets" },
    ...report.assets.items.map((i) => ({ type: "item", ...i })),
  ];

  const maxRows = Math.max(leftRows.length, rightRows.length);

  /* ── render ── */
  return (
    <div className="page-content">
      {/* ── Controls ── */}
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
          <label style={{ fontSize: "0.85rem", opacity: 0.7 }}>As of Dec 31,</label>
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
          Print / Export PDF
        </button>
      </div>

      {/* ── Print-only header (hidden on screen via @media print CSS) ── */}
      <div className="print-report-header" style={{ marginBottom: "20px" }}>
        <h2
          style={{
            textAlign: "center",
            margin: 0,
            fontWeight: "700",
            fontSize: "1.2rem",
          }}
        >
          Balance Sheet
        </h2>
        <p style={{ textAlign: "center", margin: "4px 0 0", opacity: 0.6, fontSize: "0.85rem" }}>
          As of December 31, {year}
        </p>
      </div>

      {/* ── Balance Sheet Table ── */}
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
                style={{
                  borderBottom: "2px solid var(--valora-border)",
                  borderRight: "2px solid var(--valora-border)",
                  padding: "12px 14px",
                  textAlign: "center",
                  width: "50%",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Assets
              </th>
              <th
                style={{
                  borderBottom: "2px solid var(--valora-border)",
                  padding: "12px 14px",
                  textAlign: "center",
                  width: "50%",
                  fontWeight: "700",
                  fontSize: "0.95rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Liabilities &amp; Capital
              </th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: maxRows }).map((_, idx) => {
              const left = leftRows[idx];
              const right = rightRows[idx];

              const leftStyle = (() => {
                if (!left) return { ...cellBase, borderRight: "2px solid var(--valora-border)" };
                if (left.type === "section") return { ...sectionHeader, borderRight: "2px solid var(--valora-border)" };
                if (left.type === "subtotal") return { ...subtotalRow, borderRight: "2px solid var(--valora-border)" };
                return { ...cellBase, borderRight: "2px solid var(--valora-border)" };
              })();

              const rightStyle = (() => {
                if (!right) return cellBase;
                if (right.type === "section") return sectionHeader;
                if (right.type === "subtotal") return subtotalRow;
                return cellBase;
              })();

              return (
                <tr key={idx}>
                  {/* Left — Asset */}
                  <td style={leftStyle}>
                    {left && left.type === "section" && (
                      <span>{left.label}</span>
                    )}
                    {left && left.type === "item" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ paddingLeft: "8px" }}>{left.name}</span>
                        <span>₹ {fmt(left.balance)}</span>
                      </div>
                    )}
                    {left && left.type === "subtotal" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{left.label}</span>
                        <span>₹ {fmt(left.value)}</span>
                      </div>
                    )}
                  </td>

                  {/* Right — Capital / Liabilities */}
                  <td style={rightStyle}>
                    {right && right.type === "section" && (
                      <span>{right.label}</span>
                    )}
                    {right && right.type === "item" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ paddingLeft: "8px" }}>{right.name}</span>
                        <span>₹ {fmt(right.balance)}</span>
                      </div>
                    )}
                    {right && right.type === "subtotal" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>{right.label}</span>
                        <span>₹ {fmt(right.value)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {maxRows === 0 && (
              <tr>
                <td
                  colSpan="2"
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--valora-text-muted)",
                  }}
                >
                  No posted journal entries found for {year}.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <td style={{ ...totalRow, borderRight: "2px solid var(--valora-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Assets</span>
                  <span>₹ {fmt(report.total_assets)}</span>
                </div>
              </td>
              <td style={totalRow}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Total Liabilities &amp; Capital</span>
                  <span>₹ {fmt(report.total_liabilities_and_capital)}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>

        {/* ── Balance check banner ── */}
        <div
          style={{
            marginTop: "20px",
            padding: "14px 20px",
            backgroundColor: report.is_balanced
              ? "rgba(25, 135, 84, 0.1)"
              : "rgba(220, 53, 69, 0.1)",
            color: report.is_balanced ? "var(--valora-success)" : "var(--valora-error)",
            borderRadius: "8px",
            border: `1px solid ${report.is_balanced ? "rgba(25,135,84,0.3)" : "rgba(220,53,69,0.3)"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontWeight: "600",
          }}
        >
          <span>
            {report.is_balanced
              ? "✓ Balance Sheet is balanced — Assets = Liabilities + Capital"
              : "✗ Balance Sheet is NOT balanced"}
          </span>
          {!report.is_balanced && (
            <span style={{ fontSize: "0.9rem" }}>
              Difference: ₹{" "}
              {fmt(Math.abs(report.total_assets - report.total_liabilities_and_capital))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
