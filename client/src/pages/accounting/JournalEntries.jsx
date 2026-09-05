import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertTriangle, Plus, CheckCircle, Save } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "../../components/DataTable";
import { api } from "../../api";
import "../../styles/forms.css";

export default function JournalEntries() {
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null); // Read-only support

  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    journalId: "",
    reference: "",
    lines: [
      { accountId: "", contactId: "", debit: 0, credit: 0, description: "" },
      { accountId: "", contactId: "", debit: 0, credit: 0, description: "" },
    ],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [eData, jData, aData, cData] = await Promise.all([
        api.getJournalEntries(),
        api.getJournals(),
        api.getChartOfAccounts(),
        api.getContacts(),
      ]);
      setEntries(eData);
      setJournals(jData);
      setAccounts(aData);
      setContacts(cData);

      if (jData.length > 0 && !formData.journalId) {
        setFormData((prev) => ({ ...prev, journalId: jData[0].id }));
      }
    } catch (err) {
      console.error("Failed to load journal entry data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.get("new") === "true" || location.pathname.endsWith("/new")) {
      setIsFormOpen(true);
    }
  }, [location]);

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { accountId: "", contactId: "", debit: 0, credit: 0, description: "" }],
    }));
  };

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 2)
      return alert("At least 2 lines are required for a double-entry journal.");
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  const handleLineChange = (idx, field, value) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      newLines[idx] = { ...newLines[idx], [field]: value };
      return { ...prev, lines: newLines };
    });
  };

  const totalDebit = formData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = formData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handlePost = async () => {
    if (!isBalanced) {
      return alert("Debit and Credit totals must be equal and greater than 0 before posting.");
    }
    if (!formData.journalId) return alert("Please select a journal.");

    setIsSaving(true);
    try {
      const payload = {
        journalId: formData.journalId,
        reference: formData.reference || "Manual Entry",
        entryDate: formData.entryDate,
        status: "POSTED",
        lines: formData.lines.map((l) => ({
          accountId: l.accountId,
          contactId: l.contactId || null,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description || "",
        })),
      };

      await api.createJournalEntry(payload);
      await loadData();
      handleCloseForm();
      alert("Journal Entry posted successfully");
    } catch (err) {
      alert(err.message || "Failed to post journal entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedEntry(null);
    setFormData({
      entryDate: new Date().toISOString().split("T")[0],
      journalId: journals[0]?.id || "",
      reference: "",
      lines: [
        { accountId: "", contactId: "", debit: 0, credit: 0, description: "" },
        { accountId: "", contactId: "", debit: 0, credit: 0, description: "" },
      ],
    });
  };

  // Support viewing existing posted entries (read-only)
  const handleRowClick = async (row) => {
    // If you add a getJournalEntryById endpoint in the future, fetch it here.
    // For now, we'll map what we have from the row.
    setSelectedEntry(row);
    setFormData({
      entryDate: new Date(row.entry_date).toISOString().split("T")[0],
      journalId: row.journal_id || "",
      reference: row.reference || "",
      lines: row.journal_items?.map((item) => ({
        accountId: item.account_id || "",
        contactId: item.partner_id || "",
        debit: item.debit || 0,
        credit: item.credit || 0,
        description: item.description || "",
      })) || [],
    });
    setIsFormOpen(true);
  };

  const columns = [
    { header: "Date", render: (row) => new Date(row.entry_date).toLocaleDateString("en-IN") },
    { header: "Number / Ref", render: (row) => <strong>{row.entry_number || row.reference || "-"}</strong> },
    { header: "Journal", render: (row) => row.journal?.name || "-" },
    {
      header: "Total",
      render: (row) => {
        if (!row.journal_items || row.journal_items.length === 0) return "-";
        const total = row.journal_items.reduce((sum, item) => sum + item.debit, 0);
        return `₹ ${Number(total).toLocaleString("en-IN")}`;
      },
    },
    {
      header: "Status",
      render: (row) => (
        <span className={`fv-badge ${row.status === "POSTED" ? "fv-badge-posted" : "fv-badge-draft"}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (row) => (
        <button className="secondary-btn" onClick={() => handleRowClick(row)} style={{ padding: "4px 12px", fontSize: "0.8rem" }}>
          View
        </button>
      ),
    },
  ];

  if (isFormOpen) {
    const isReadOnly = Boolean(selectedEntry);

    return (
      <div className="page-content">
        <div className="fv-page">
          <div className="fv-topbar">
            <div className="fv-topbar-left">
              <button className="fv-btn fv-btn-back" onClick={handleCloseForm}>
                <ArrowLeft size={15} /> Back
              </button>
              <div>
                <h1 className="fv-topbar-title">
                  {selectedEntry ? selectedEntry.entry_number || selectedEntry.reference : "New Journal Entry"}
                </h1>
                <p className="fv-topbar-subtitle">
                  {selectedEntry ? "View posted journal entry" : "Create a manual double-entry record"}
                </p>
              </div>
            </div>

            <div className="fv-topbar-actions">
              <div className="fv-status-bar">
                <span className={`fv-status-step ${!isReadOnly ? "active" : "done"}`}>Draft</span>
                <span className={`fv-status-step ${isReadOnly ? "active" : ""}`}>Posted</span>
              </div>

              {!isReadOnly && (
                <button
                  className="fv-btn fv-btn-confirm"
                  onClick={handlePost}
                  disabled={!isBalanced || isSaving}
                  style={{ opacity: !isBalanced ? 0.6 : 1, cursor: !isBalanced ? "not-allowed" : "pointer" }}
                >
                  <Save size={15} /> {isSaving ? "Posting…" : "Post to Ledger"}
                </button>
              )}
              <button className="fv-btn fv-btn-ghost" onClick={handleCloseForm}>
                {isReadOnly ? "Close" : "Cancel"}
              </button>
            </div>
          </div>

          {!isBalanced && !isReadOnly && (
            <div className="fv-warning-banner" style={{ background: "#FEF2F2", borderColor: "#EF4444" }}>
              <AlertTriangle size={24} color="#DC2626" style={{ marginTop: 0 }} />
              <div>
                <p className="fv-warning-title" style={{ color: "#991B1B", fontSize: "0.95rem" }}>
                  Blocking Warning: Debit and Credit totals do not match!
                </p>
                <p className="fv-warning-body" style={{ color: "#7F1D1D" }}>
                  Total Debit: <strong style={{ fontSize: "1.05rem" }}>₹ {totalDebit.toLocaleString("en-IN")}</strong> | 
                  Total Credit: <strong style={{ fontSize: "1.05rem" }}>₹ {totalCredit.toLocaleString("en-IN")}</strong>
                  <br />The transaction must be balanced before it can be posted to the ledger.
                </p>
              </div>
            </div>
          )}

          <div className="fv-card">
            <div className="fv-card-body">
              <p className="fv-section-label">Entry Details</p>
              <div className="fv-grid fv-grid-3">
                <div className="fv-field">
                  <label className="fv-label">Accounting Date <span className="fv-required">*</span></label>
                  <input
                    className="fv-input"
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    disabled={isReadOnly}
                    required
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Journal <span className="fv-required">*</span></label>
                  <select
                    className="fv-select"
                    value={formData.journalId}
                    onChange={(e) => setFormData({ ...formData, journalId: e.target.value })}
                    disabled={isReadOnly}
                    required
                  >
                    <option value="">— Select Journal —</option>
                    {journals.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name} ({j.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fv-field">
                  <label className="fv-label">Reference / Memo</label>
                  <input
                    className="fv-input"
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    disabled={isReadOnly}
                    placeholder="e.g. Accrual Adjustment"
                  />
                </div>
              </div>
            </div>

            <div className="fv-lines-section">
              <p className="fv-lines-title">Journal Items</p>
              <div className="fv-table-wrap">
                <table className="fv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Sr.</th>
                      <th>Account <span className="fv-required">*</span></th>
                      <th>Partner</th>
                      <th>Description</th>
                      <th style={{ textAlign: "right", width: 120 }}>Debit (₹)</th>
                      <th style={{ textAlign: "right", width: 120 }}>Credit (₹)</th>
                      {!isReadOnly && <th style={{ width: 40 }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "#94A3B8", fontSize: "0.8rem" }}>
                          {idx + 1}
                        </td>
                        <td>
                          <select
                            className="fv-table-select"
                            value={line.accountId}
                            onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="">— Select Account —</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.code} {a.name} ({a.type})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            className="fv-table-select"
                            value={line.contactId}
                            onChange={(e) => handleLineChange(idx, "contactId", e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="">— Partner —</option>
                            {contacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="fv-table-input"
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                            disabled={isReadOnly}
                            placeholder="Line description"
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isReadOnly ? (
                            <span style={{ fontWeight: 600 }}>{Number(line.debit).toLocaleString("en-IN")}</span>
                          ) : (
                            <input
                              className="fv-table-input fv-table-input-md"
                              type="number"
                              min="0"
                              value={line.debit || ""}
                              onChange={(e) => {
                                handleLineChange(idx, "debit", e.target.value);
                                if (Number(e.target.value) > 0) handleLineChange(idx, "credit", 0);
                              }}
                            />
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {isReadOnly ? (
                            <span style={{ fontWeight: 600 }}>{Number(line.credit).toLocaleString("en-IN")}</span>
                          ) : (
                            <input
                              className="fv-table-input fv-table-input-md"
                              type="number"
                              min="0"
                              value={line.credit || ""}
                              onChange={(e) => {
                                handleLineChange(idx, "credit", e.target.value);
                                if (Number(e.target.value) > 0) handleLineChange(idx, "debit", 0);
                              }}
                            />
                          )}
                        </td>
                        {!isReadOnly && (
                          <td>
                            <button className="fv-remove-btn" type="button" onClick={() => handleRemoveLine(idx)} title="Remove">✕</button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={!isReadOnly ? 4 : 4} style={{ textAlign: "right", color: "#64748B" }}>Totals</td>
                      <td style={{ textAlign: "right", color: totalDebit === totalCredit ? "#059669" : "#DC2626", fontSize: "1rem" }}>
                        ₹ {totalDebit.toLocaleString("en-IN")}
                      </td>
                      <td style={{ textAlign: "right", color: totalDebit === totalCredit ? "#059669" : "#DC2626", fontSize: "1rem" }}>
                        ₹ {totalCredit.toLocaleString("en-IN")}
                      </td>
                      {!isReadOnly && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!isReadOnly && (
                <button className="fv-add-line" type="button" onClick={handleAddLine}>
                  <Plus size={14} /> Add Journal Item
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Journal Entries</h1></div>
      {isLoading ? (
        <p style={{ padding: "40px", color: "#64748B" }}>Loading journal entries…</p>
      ) : (
        <DataTable
          title="Journal Entry"
          columns={columns}
          data={entries}
          onNewClick={() => { setSelectedEntry(null); setIsFormOpen(true); }}
          searchPlaceholder="Search journal entries…"
        />
      )}
    </div>
  );
}
