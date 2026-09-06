import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, DollarSign, ShoppingCart, PieChart, AlertTriangle, Plus, X, Printer, Trash2, Pencil } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "../../components/DataTable";
import { api } from "../../api";
import "../../styles/forms.css";

export default function VendorBills() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [bills, setBills]                   = useState([]);
  const [contacts, setContacts]             = useState([]);
  const [products, setProducts]             = useState([]);
  const [accounts, setAccounts]             = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [isFormOpen, setIsFormOpen]         = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [selectedBill, setSelectedBill]     = useState(null);
  const [budgetWarning, setBudgetWarning]   = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  const [paymentData, setPaymentData] = useState({
    payment_via: "BANK",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    note: "",
  });

  const [formData, setFormData] = useState({
    vendorId: "",
    billNumber: "",
    billReference: "",
    billDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    lines: [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
  });

  /* ── Data loading ── */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, cData, pData, aData, accData] = await Promise.all([
        api.getVendorBills(),
        api.getContacts(),
        api.getProducts(),
        api.getAnalyticAccounts(),
        api.getChartOfAccounts(),
      ]);
      setBills(bData);
      setContacts(cData);
      setProducts(pData);
      setAnalyticAccounts(aData);
      setAccounts(accData);
    } catch (err) {
      console.error("Failed to load vendor bills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const q = new URLSearchParams(location.search);
    if (q.get("new") === "true" || location.pathname.endsWith("/new")) setIsFormOpen(true);
  }, [location]);

  /* ── Totals ── */
  const calculateTotal = () =>
    formData.lines.reduce(
      (sum, l) => sum + (Number(l.quantity) * Number(l.unitPrice) || 0),
      0,
    );

  useEffect(() => {
    if (calculateTotal() > 15000) {
      setBudgetWarning(
        "The entered amount exceeds the remaining budget for this account. Consider adjusting the value or revising the budget.",
      );
    } else {
      setBudgetWarning(null);
    }
  }, [formData.lines]);

  /* ── Line management ── */
  const handleAddLine = () =>
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
    }));

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 1) return;
    setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const handleLineChange = (idx, field, value) => {
    setFormData(prev => {
      const lines = [...prev.lines];
      const line  = { ...lines[idx], [field]: value };
      if (field === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod) line.unitPrice = prod.cost || prod.sales_price || 0;
      }
      lines[idx] = line;
      return { ...prev, lines };
    });
  };

  /* ── CRUD ── */
  const handleSave = async () => {
    if (!formData.vendorId) return alert("Vendor is required");
    setIsSaving(true);
    try {
      const defaultPurchaseAccount =
        accounts.find(a => a.type === "EXPENSE" || a.name.toLowerCase().includes("purchase"))?.id ||
        accounts[0]?.id;
      const payload = {
        vendor_id: formData.vendorId,
        bill_reference: formData.billReference || undefined,
        bill_date: formData.billDate,
        due_date: formData.dueDate,
        lines: formData.lines.map(l => ({
          product_id: l.productId,
          account_id: l.accountId || defaultPurchaseAccount,
          analytic_account_id: l.analyticAccountId || null,
          qty: Number(l.quantity),
          unit_price: Number(l.unitPrice),
        })),
      };
      const created = await api.createVendorBill(payload);
      setSelectedBill(created);
      await loadData();
      alert("Vendor Bill created successfully");
    } catch (err) {
      alert(err.message || "Failed to save vendor bill");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedBill) return;
    setIsSaving(true);
    try {
      const updated = await api.confirmVendorBill(selectedBill.id);
      setSelectedBill(updated);
      await loadData();
      alert("Vendor Bill confirmed & posted to Journal Entries!");
    } catch (err) {
      alert(err.message || "Failed to confirm vendor bill");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPayModal = () => {
    if (!selectedBill) return;
    setPaymentData({
      payment_via: "BANK",
      date: new Date().toISOString().split("T")[0],
      amount: selectedBill.total || calculateTotal(),
      note: `Payment for ${selectedBill.bill_reference || "bill"}`,
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedBill) return;
    setIsSaving(true);
    try {
      await api.payVendorBill(selectedBill.id, paymentData);
      setIsPayModalOpen(false);
      await loadData();
      alert("Payment confirmed & vendor bill updated to Paid!");
      handleCloseForm();
    } catch (err) {
      alert(err.message || "Payment failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBill(null);
    setIsPayModalOpen(false);
    setBudgetWarning(null);
    setFormData({
      vendorId: "",
      billNumber: "",
      billReference: "",
      billDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      lines: [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRowClick = async (row) => {
    setIsLoading(true);
    try {
      const fullDoc = await api.getVendorBillById(row.id);
      setSelectedBill(fullDoc);
      setFormData({
        vendorId: fullDoc.vendor_id || "",
        billNumber: fullDoc.bill_reference || "",
        billReference: "",
        billDate: fullDoc.bill_date ? new Date(fullDoc.bill_date).toISOString().split("T")[0] : "",
        dueDate: fullDoc.due_date ? new Date(fullDoc.due_date).toISOString().split("T")[0] : "",
        lines: fullDoc.lines?.map(l => ({
          productId: l.product_id,
          accountId: l.account_id || "",
          analyticAccountId: l.analytic_account_id || "",
          quantity: l.qty || l.quantity || 1,
          unitPrice: l.unit_price || 0,
        })) || [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
      });
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBill) return;
    if (selectedBill.status !== "DRAFT") {
      alert("Only DRAFT bills can be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this bill? This cannot be undone.")) return;
    
    setIsSaving(true);
    try {
      await api.deleteVendorBill(selectedBill.id);
      await loadData();
      alert("Bill deleted successfully");
      handleCloseForm();
    } catch (err) {
      alert(err.message || "Failed to delete");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = async (e, id, status) => {
    e.stopPropagation();
    if (status !== "DRAFT") {
      alert("Only DRAFT bills can be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this bill?")) return;
    try {
      await api.deleteVendorBill(id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  /* ── Table columns ── */
  const columns = [
    { header: "Bill Ref", accessor: "bill_reference", render: (r) => <strong>{r.bill_reference}</strong> },
    { header: "Vendor Name", render: (r) => r.vendor?.name || "-" },
    { header: "Bill Date", render: (r) => new Date(r.bill_date).toLocaleDateString("en-IN") },
    { header: "Total", render: (r) => `₹ ${Number(r.total || 0).toLocaleString("en-IN")}` },
    {
      header: "Status",
      render: (r) => (
        <span className={`fv-badge ${r.status === "PAID" ? "fv-badge-paid" : r.status === "CONFIRMED" || r.status === "POSTED" ? "fv-badge-confirmed" : "fv-badge-draft"}`}>
          {r.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRowClick(r); }} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
            title="Edit / View"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={(e) => handleDeleteRow(e, r.id, r.status)} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ═══════════════════════════════════════════
     FORM VIEW
  ═══════════════════════════════════════════ */
  if (isFormOpen) {
    const userStr     = localStorage.getItem("valora_user");
    const user        = userStr ? JSON.parse(userStr) : null;
    const isAccountant = user?.role?.toLowerCase() === "accountant";

    const isPosted    = selectedBill?.status === "CONFIRMED" || selectedBill?.status === "POSTED";
    const isPaid      = selectedBill?.status === "PAID";
    const isReadOnly  = isPosted || isPaid || (isAccountant && Boolean(selectedBill));

    const grandTotal  = calculateTotal();
    const paidAmount  = isPaid ? selectedBill?.total || grandTotal : 0;
    const amountDue   = (selectedBill?.total || grandTotal) - paidAmount;

    return (
      <div className="page-content">
        <div className="fv-page">

          {/* ── Top bar ── */}
          <div className="fv-topbar">
            <div className="fv-topbar-left">
              <button className="fv-btn fv-btn-back" onClick={handleCloseForm}>
                <ArrowLeft size={15} /> Back
              </button>
              <div>
                <h1 className="fv-topbar-title">
                  {selectedBill ? selectedBill.bill_reference : "New Vendor Bill"}
                </h1>
                <p className="fv-topbar-subtitle">
                  {selectedBill
                    ? `Vendor: ${contacts.find(c => c.id === formData.vendorId)?.name || "—"}`
                    : "Fill in the details below"}
                </p>
              </div>
            </div>

            <div className="fv-topbar-actions">
              {/* Status pipeline */}
              <div className="fv-status-bar">
                <span className={`fv-status-step ${!selectedBill || selectedBill.status === "DRAFT" ? "active" : "done"}`}>Draft</span>
                <span className={`fv-status-step ${isPosted && !isPaid ? "active" : isPaid ? "done" : ""}`}>Confirmed</span>
                <span className={`fv-status-step ${isPaid ? "active" : ""}`}>Paid</span>
              </div>

              {!selectedBill && (
                <button className="fv-btn fv-btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Bill"}
                </button>
              )}
              {selectedBill && (
                <button className="fv-btn fv-btn-ghost print-hide" onClick={() => window.print()} title="Print">
                  <Printer size={15} /> Print
                </button>
              )}
              {selectedBill && selectedBill.status === "DRAFT" && (
                <button className="fv-btn fv-btn-ghost print-hide" style={{ color: "#DC2626" }} onClick={handleDelete} disabled={isSaving} title="Delete">
                  <Trash2 size={15} /> Delete
                </button>
              )}
              {selectedBill && !isPosted && !isPaid && (
                <button className="fv-btn fv-btn-confirm" onClick={handleConfirm} disabled={isSaving}>
                  <CheckCircle size={15} /> Confirm
                </button>
              )}
              {selectedBill && isPosted && !isPaid && (
                <button className="fv-btn fv-btn-pay" onClick={handleOpenPayModal} disabled={isSaving}>
                  <DollarSign size={15} /> Pay
                </button>
              )}
              {selectedBill && isPaid && (
                <button className="fv-btn fv-btn-pay" onClick={handleOpenPayModal} disabled={isSaving}>
                  <DollarSign size={15} /> View Payment
                </button>
              )}
              {selectedBill?.purchase_order_id && (
                <button className="fv-btn fv-btn-ghost" onClick={() => navigate("/purchase-orders")}>
                  <ShoppingCart size={15} /> PO
                </button>
              )}
              <button className="fv-btn fv-btn-ghost" onClick={() => navigate("/reports/budget")}>
                <PieChart size={15} /> Budget
              </button>
              <button className="fv-btn fv-btn-ghost" onClick={handleCloseForm}>Cancel</button>
            </div>
          </div>

          {/* ── Budget warning ── */}
          {budgetWarning && (
            <div className="fv-warning-banner">
              <AlertTriangle size={20} className="fv-warning-icon" />
              <div>
                <p className="fv-warning-title">⚠ Non-Blocking Warning — Exceeds Approved Budget</p>
                <p className="fv-warning-body">{budgetWarning}</p>
              </div>
            </div>
          )}

          {/* ── Main card ── */}
          <div className="fv-card">

            {/* Header fields */}
            <div className="fv-card-body">
              <p className="fv-section-label">Bill Details</p>
              <div className="fv-grid fv-grid-5">
                <div className="fv-field">
                  <label className="fv-label">Vendor Bill No.</label>
                  <input
                    className="fv-input fv-input-autogen"
                    value={formData.billNumber}
                    disabled
                    placeholder="Auto-Generated"
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Vendor Name <span className="fv-required">*</span></label>
                  <select
                    className="fv-select"
                    value={formData.vendorId}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                  >
                    <option value="">— Select Vendor —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.type ? ` (${c.type === "BOTH" ? "Customer & Vendor" : c.type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fv-field">
                  <label className="fv-label">
                    Bill Reference
                    <span className="fv-label-hint">(Vendor's own ref)</span>
                  </label>
                  <input
                    className="fv-input"
                    type="text"
                    value={formData.billReference}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, billReference: e.target.value })}
                    placeholder="e.g. ABC-34-001"
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Bill Date</label>
                  <input
                    className="fv-input"
                    type="date"
                    value={formData.billDate}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, billDate: e.target.value })}
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Due Date</label>
                  <input
                    className="fv-input"
                    type="date"
                    value={formData.dueDate}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="fv-lines-section">
              <p className="fv-lines-title">Bill Lines</p>
              <div className="fv-table-wrap">
                <table className="fv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Sr.</th>
                      <th>Product <span style={{ color: "#DC2626" }}>*</span></th>
                      <th>Chart of Account</th>
                      <th>Budget Analytics</th>
                      <th style={{ textAlign: "right", width: 80 }}>Qty <span style={{ color: "#DC2626" }}>*</span></th>
                      <th style={{ textAlign: "right", width: 120 }}>Unit Price (₹) <span style={{ color: "#DC2626" }}>*</span></th>
                      <th style={{ textAlign: "right", width: 120 }}>Total (₹)</th>
                      {!isReadOnly && <th style={{ width: 40 }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => {
                      const lineTotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
                      return (
                        <tr key={idx}>
                          <td style={{ textAlign: "center", fontWeight: 700, color: "#94A3B8", fontSize: "0.8rem" }}>{idx + 1}</td>
                          <td>
                            <select
                              className="fv-table-select"
                              value={line.productId}
                              disabled={isReadOnly}
                              onChange={e => handleLineChange(idx, "productId", e.target.value)}
                            >
                              <option value="">— Select Product —</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="fv-table-select"
                              value={line.accountId}
                              disabled={isReadOnly}
                              onChange={e => handleLineChange(idx, "accountId", e.target.value)}
                            >
                              <option value="">Purchase Expense A/C (Default)</option>
                              {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="fv-table-select"
                              value={line.analyticAccountId}
                              disabled={isReadOnly}
                              onChange={e => handleLineChange(idx, "analyticAccountId", e.target.value)}
                            >
                              <option value="">— Analytic Account —</option>
                              {analyticAccounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isReadOnly ? (
                              <span style={{ fontWeight: 600 }}>{line.quantity}</span>
                            ) : (
                              <input
                                className="fv-table-input fv-table-input-sm"
                                type="number"
                                min="1"
                                value={line.quantity}
                                onChange={e => handleLineChange(idx, "quantity", e.target.value)}
                              />
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {isReadOnly ? (
                              <span style={{ fontWeight: 600 }}>₹ {Number(line.unitPrice).toLocaleString("en-IN")}</span>
                            ) : (
                              <input
                                className="fv-table-input fv-table-input-md"
                                type="number"
                                value={line.unitPrice}
                                onChange={e => handleLineChange(idx, "unitPrice", e.target.value)}
                              />
                            )}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#0F172A" }}>
                            ₹ {lineTotal.toLocaleString("en-IN")}
                          </td>
                          {!isReadOnly && (
                            <td>
                              <button className="fv-remove-btn" type="button" onClick={() => handleRemoveLine(idx)} title="Remove">✕</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={!isReadOnly ? 6 : 6} style={{ textAlign: "right", color: "#64748B" }}>Grand Total</td>
                      <td style={{ textAlign: "right", color: "#714B67", fontSize: "1rem" }}>
                        ₹ {grandTotal.toLocaleString("en-IN")}
                      </td>
                      {!isReadOnly && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!isReadOnly && (
                <button className="fv-add-line" type="button" onClick={handleAddLine}>
                  <Plus size={14} /> Add Product Line
                </button>
              )}
            </div>

            {/* Payment breakdown pills */}
            <div className="fv-pay-breakdown">
              <div className="fv-pay-pill">
                <span className="fv-pay-pill-label">Paid Via Bank / Cash</span>
                <span className={`fv-pay-pill-value ${isPaid ? "paid" : ""}`}>
                  ₹ {paidAmount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="fv-pay-pill">
                <span className="fv-pay-pill-label">Amount Due</span>
                <span className={`fv-pay-pill-value ${amountDue > 0 ? "due" : "clear"}`}>
                  ₹ {amountDue.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="fv-pay-pill">
                <span className="fv-pay-pill-label">Bill Total</span>
                <span className="fv-pay-pill-value">
                  ₹ {(selectedBill?.total || grandTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ════ Payment Modal ════ */}
        {isPayModalOpen && (
          <div className="fv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsPayModalOpen(false); }}>
            <div className="fv-modal">
              <div className="fv-modal-header">
                <h2 className="fv-modal-title">Register Payment</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Pipeline */}
                  <div className="fv-modal-status">
                    {isPaid ? (
                      <span className="fv-modal-status-step confirmed">Confirmed</span>
                    ) : (
                      <>
                        <span className="fv-modal-status-step">Draft</span>
                        <span className="fv-modal-status-step active">Confirm</span>
                        <span className="fv-modal-status-step">Cancelled</span>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", display: "flex" }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="fv-modal-body">
                {/* Payment Type */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Payment Type</span>
                  <div className="fv-modal-row-value fv-radio-group">
                    <label className="fv-radio-label">
                      <input type="radio" checked readOnly /> Send
                    </label>
                    <label className="fv-radio-label" style={{ opacity: 0.4 }}>
                      <input type="radio" disabled /> Receive
                    </label>
                  </div>
                </div>

                {/* Partner */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Partner</span>
                  <div className="fv-modal-row-value">
                    <div className="fv-static">
                      {contacts.find(c => c.id === formData.vendorId)?.name || "Unknown Partner"}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Amount (₹) <span style={{ color: "#DC2626" }}>*</span></span>
                  <div className="fv-modal-row-value">
                    <input
                      className="fv-input"
                      type="number"
                      value={paymentData.amount}
                      onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                      disabled={isPaid}
                      style={{ fontWeight: 700, fontSize: "1.05rem" }}
                    />
                  </div>
                </div>

                {/* Payment Via */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Payment Via</span>
                  <div className="fv-modal-row-value">
                    <select
                      className="fv-select"
                      value={paymentData.payment_via}
                      onChange={e => setPaymentData({ ...paymentData, payment_via: e.target.value })}
                      disabled={isPaid}
                    >
                      <option value="BANK">Bank Account</option>
                      <option value="CASH">Cash Account</option>
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Payment Date</span>
                  <div className="fv-modal-row-value">
                    <input
                      className="fv-input"
                      type="date"
                      value={paymentData.date}
                      onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                      disabled={isPaid}
                    />
                  </div>
                </div>

                {/* Note */}
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Memo / Note</span>
                  <div className="fv-modal-row-value">
                    <input
                      className="fv-input"
                      type="text"
                      value={paymentData.note}
                      onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
                      disabled={isPaid}
                      placeholder="Alpha-numeric note"
                    />
                  </div>
                </div>
              </div>

              <div className="fv-modal-footer">
                <button className="fv-btn fv-btn-ghost" onClick={() => setIsPayModalOpen(false)}>
                  {isPaid ? "Close" : "Cancel"}
                </button>
                {!isPaid && (
                  <button className="fv-btn fv-btn-confirm" onClick={handleConfirmPayment} disabled={isSaving}>
                    {isSaving ? "Processing…" : "Confirm Payment"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Vendor Bills</h1></div>
      {isLoading ? (
        <p style={{ padding: "40px", color: "#64748B" }}>Loading vendor bills…</p>
      ) : (
        <DataTable
          title="Vendor Bill"
          columns={columns}
          data={bills}
          onNewClick={() => {
            setSelectedBill(null);
            setIsFormOpen(true);
          }}
          enableKanban={false}
          searchPlaceholder="Search bills..."
          emptyStateIcon={ShoppingCart}
          emptyStateTitle="No Vendor Bills yet"
          emptyStateMessage="Create your first purchase order or register a bill directly to get started!"
        />
      )}
    </div>
  );
}
