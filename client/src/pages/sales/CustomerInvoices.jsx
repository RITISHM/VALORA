import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, DollarSign, ShoppingCart, AlertTriangle, Plus, X, Printer, Trash2, Pencil, Eye } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DataTable from "../../components/DataTable";
import Loader from "../../components/Loader";
import { api } from "../../api";
import "../../styles/forms.css";
import valoraLogo from "../../assets/valora-logo-dark.png";

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const location = useLocation();

  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_via: "BANK",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    note: "",
  });

  const [formData, setFormData] = useState({
    customerId: "",
    invoiceNumber: "",
    invoiceReference: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    lines: [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
  });

  const handlePrint = () => {
    if (!selectedInvoice) return;
    const customer = contacts.find(c => c.id === formData.customerId);
    const lines = formData.lines;
    const grandTotal = calculateTotal();

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    const logoSrc = valoraLogo;

    const linesHtml = lines.map((line, idx) => {
      const prod = products.find(p => p.id === line.productId);
      const sub = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
      const tax = sub * ((Number(line.taxRate) || 0) / 100);
      const total = sub + tax;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;">${idx + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;">${prod?.name || '—'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;text-align:right;">${Number(line.quantity)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;text-align:right;">₹${Number(line.unitPrice).toLocaleString('en-IN')}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;text-align:right;">${Number(line.taxRate) || 0}%</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:0.9rem;text-align:right;font-weight:600;">₹${total.toLocaleString('en-IN')}</td>
        </tr>`;
    }).join('');

    const subtotal = lines.reduce((s, l) => s + (Number(l.quantity)||0)*(Number(l.unitPrice)||0), 0);
    const taxTotal = grandTotal - subtotal;
    const statusLabel = selectedInvoice.status === 'PAID' ? '<span style="color:#166534;background:#dcfce7;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">PAID</span>' :
      selectedInvoice.status === 'CONFIRMED' || selectedInvoice.status === 'POSTED' ? '<span style="color:#1e40af;background:#dbeafe;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">CONFIRMED</span>' :
      '<span style="color:#92400e;background:#fef3c7;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:700;">DRAFT</span>';

    printWindow.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"/>
      <title>Invoice ${selectedInvoice.invoice_number || ''}</title>
      <style>
        @page { size: A4; margin: 15mm 20mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; font-size: 0.9rem; background:#fff; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; padding-bottom:24px; border-bottom:2px solid #714b67; }
        .logo { width:120px; }
        .company-name { font-size:1.6rem; font-weight:800; color:#714b67; }
        .company-sub { font-size:0.8rem; color:#64748b; margin-top:2px; }
        .inv-title { font-size:2rem; font-weight:900; color:#714b67; text-transform:uppercase; letter-spacing:2px; }
        .inv-number { font-size:0.85rem; color:#64748b; margin-top:4px; }
        .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:28px; }
        .meta-box { padding:16px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; }
        .meta-label { font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#64748b; margin-bottom:6px; }
        .meta-value { font-size:0.95rem; font-weight:600; color:#1e293b; }
        .meta-muted { font-size:0.82rem; color:#64748b; margin-top:2px; }
        table { width:100%; border-collapse:collapse; margin-bottom:24px; }
        thead tr { background:#714b67; color:#fff; }
        thead th { padding:10px 12px; font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; text-align:left; }
        thead th:last-child,thead th:nth-child(n+3) { text-align:right; }
        .totals { display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-bottom:32px; }
        .total-row { display:flex; gap:32px; font-size:0.88rem; }
        .total-row.grand { font-size:1.1rem; font-weight:800; color:#714b67; border-top:2px solid #714b67; padding-top:8px; margin-top:4px; }
        .total-label { color:#64748b; min-width:120px; text-align:right; }
        .total-val { font-weight:600; min-width:100px; text-align:right; }
        .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0; text-align:center; font-size:0.75rem; color:#94a3b8; }
        .status-wrap { margin-top:8px; }
        @media print { body{-webkit-print-color-adjust:exact;print-color-adjust:exact;} }
      </style>
    </head><body>
      <div class="header">
        <div>
          <div class="company-name">VALORA</div>
          <div class="company-sub">Enterprise Resource Planning</div>
        </div>
        <div style="text-align:right;">
          <div class="inv-title">Tax Invoice</div>
          <div class="inv-number">${selectedInvoice.invoice_number || 'DRAFT'}</div>
          <div class="status-wrap">${statusLabel}</div>
        </div>
      </div>
      <div class="meta-grid">
        <div class="meta-box">
          <div class="meta-label">Billed To</div>
          <div class="meta-value">${customer?.name || '—'}</div>
          ${customer?.email ? `<div class="meta-muted">${customer.email}</div>` : ''}
          ${customer?.mobile ? `<div class="meta-muted">${customer.mobile}</div>` : ''}
          ${customer?.city ? `<div class="meta-muted">${customer.city}${customer.state ? ', ' + customer.state : ''}</div>` : ''}
        </div>
        <div class="meta-box">
          <div class="meta-label">Invoice Details</div>
          <div class="meta-value">Date: ${formData.invoiceDate ? new Date(formData.invoiceDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'}) : '—'}</div>
          ${formData.dueDate ? `<div class="meta-muted">Due: ${new Date(formData.dueDate).toLocaleDateString('en-IN', {day:'2-digit',month:'long',year:'numeric'})}</div>` : ''}
          ${formData.invoiceReference ? `<div class="meta-muted">Ref: ${formData.invoiceReference}</div>` : ''}
        </div>
      </div>
      <table>
        <thead><tr>
          <th style="width:40px;">#</th>
          <th>Product / Description</th>
          <th style="text-align:right;width:60px;">Qty</th>
          <th style="text-align:right;width:110px;">Unit Price</th>
          <th style="text-align:right;width:60px;">Tax</th>
          <th style="text-align:right;width:110px;">Total</th>
        </tr></thead>
        <tbody>${linesHtml}</tbody>
      </table>
      <div class="totals">
        <div class="total-row"><span class="total-label">Subtotal</span><span class="total-val">₹${subtotal.toLocaleString('en-IN')}</span></div>
        <div class="total-row"><span class="total-label">Tax Amount</span><span class="total-val">₹${taxTotal.toLocaleString('en-IN')}</span></div>
        <div class="total-row grand"><span class="total-label">Grand Total</span><span class="total-val">₹${grandTotal.toLocaleString('en-IN')}</span></div>
      </div>
      <div class="footer">
        <p>Thank you for your business. Please contact us at support@valora.in for any queries.</p>
        <p style="margin-top:4px;">This is a computer-generated invoice and does not require a physical signature.</p>
      </div>
    </body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 250);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, cData, pData, aData, accData] = await Promise.all([
        api.getCustomerInvoices(),
        api.getContacts(),
        api.getProducts(),
        api.getAnalyticAccounts(),
        api.getChartOfAccounts(),
      ]);
      setInvoices(invData);
      setContacts(cData);
      setProducts(pData);
      setAnalyticAccounts(aData);
      setAccounts(accData);
    } catch (err) {
      console.error("Failed to load customer invoices:", err);
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

  const calculateTotal = () =>
    formData.lines.reduce(
      (sum, line) => {
        const sub = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
        return sum + sub + (sub * ((Number(line.taxRate) || 0) / 100));
      },
      0,
    );

  const handleAddLine = () =>
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
    }));

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 1) return;
    setFormData(prev => ({ ...prev, lines: prev.lines.filter((_, i) => i !== idx) }));
  };

  const handleLineChange = (idx, field, value) => {
    setFormData(prev => {
      const lines = [...prev.lines];
      const line = { ...lines[idx], [field]: value };
      if (field === "productId") {
        const prod = products.find(p => p.id === value);
        if (prod) line.unitPrice = prod.sales_price || 0;
      }
      lines[idx] = line;
      return { ...prev, lines };
    });
  };

  const handleSave = async () => {
    if (!formData.customerId) return alert("Customer is required");
    setIsSaving(true);
    try {
      const defaultSalesAccount = accounts.find((a) => a.type === "INCOME" || a.name.toLowerCase().includes("sales"))?.id || accounts[0]?.id;
      const payload = {
        customer_id: formData.customerId,
        invoice_number: formData.invoiceNumber,
        invoice_reference: formData.invoiceReference || undefined,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        lines: formData.lines.map((l) => ({
          product_id: l.productId,
          account_id: l.accountId || defaultSalesAccount,
          analytic_account_id: l.analyticAccountId || null,
          qty: Number(l.quantity),
          unit_price: Number(l.unitPrice),
          tax_rate: Number(l.taxRate) || 0,
        })),
      };

      const created = await api.createCustomerInvoice(payload);
      setSelectedInvoice(created);
      await loadData();
      alert("Invoice created successfully");
    } catch (err) {
      alert(err.message || "Failed to save customer invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedInvoice) return;
    setIsSaving(true);
    try {
      const updated = await api.confirmCustomerInvoice(selectedInvoice.id);
      setSelectedInvoice(updated);
      await loadData();
      alert("Invoice confirmed & posted to Journal Entries!");
    } catch (err) {
      alert(err.message || "Failed to confirm invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPayModal = () => {
    if (!selectedInvoice) return;
    setPaymentData({
      payment_via: "BANK",
      date: new Date().toISOString().split("T")[0],
      amount: selectedInvoice.total || calculateTotal(),
      note: `Payment for Invoice ${selectedInvoice.invoice_number || ""}`,
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    setIsSaving(true);
    try {
      await api.payCustomerInvoice(selectedInvoice.id, paymentData);
      setIsPayModalOpen(false);
      await loadData();
      alert("Payment confirmed & invoice status updated to Paid!");
      handleCloseForm();
    } catch (err) {
      alert(err.message || "Payment failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    if (selectedInvoice.status !== "DRAFT") {
      alert("Only DRAFT invoices can be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this invoice? This cannot be undone.")) return;

    setIsSaving(true);
    try {
      await api.deleteCustomerInvoice(selectedInvoice.id);
      await loadData();
      alert("Invoice deleted successfully");
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
      alert("Only DRAFT invoices can be deleted.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.deleteCustomerInvoice(id);
      await loadData();
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedInvoice(null);
    setIsPayModalOpen(false);
    setFormData({
      customerId: "",
      invoiceNumber: "",
      invoiceReference: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      lines: [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
    });
  };

  const handleRowClick = async (row) => {
    setIsLoading(true);
    try {
      const fullDoc = await api.getCustomerInvoiceById(row.id);
      setSelectedInvoice(fullDoc);
      setFormData({
        customerId: fullDoc.customer_id || "",
        invoiceNumber: fullDoc.invoice_number || "",
        invoiceReference: fullDoc.invoice_reference || "",
        invoiceDate: fullDoc.invoice_date ? new Date(fullDoc.invoice_date).toISOString().split("T")[0] : "",
        dueDate: fullDoc.due_date ? new Date(fullDoc.due_date).toISOString().split("T")[0] : "",
        lines: fullDoc.lines?.map((l) => ({
          productId: l.product_id,
          accountId: l.account_id || "",
          analyticAccountId: l.analytic_account_id || "",
          quantity: l.qty || l.quantity || 1,
          unitPrice: l.unit_price || 0,
          taxRate: l.tax_rate || 0,
        })) || [{ productId: "", accountId: "", analyticAccountId: "", quantity: 1, unitPrice: 0, taxRate: 0 }],
      });
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load details");
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: "Invoice No.", accessor: "invoice_number", render: (row) => <strong>{row.invoice_number}</strong> },
    { header: "Customer Name", render: (row) => row.customer?.name || "-" },
    { header: "Invoice Date", render: (row) => row.invoice_date ? new Date(row.invoice_date).toLocaleDateString("en-IN") : "-" },
    { header: "Total", render: (row) => `₹ ${Number(row.total || 0).toLocaleString("en-IN")}` },
    {
      header: "Status",
      render: (row) => (
        <span className={`fv-badge ${row.status === "PAID" ? "fv-badge-paid" : row.status === "CONFIRMED" || row.status === "POSTED" ? "fv-badge-confirmed" : "fv-badge-draft"}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={(e) => { e.stopPropagation(); handleRowClick(row); }} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
            title={row.status === "DRAFT" ? "Edit" : "View"}
          >
            {row.status === "DRAFT" ? <Pencil size={16} /> : <Eye size={16} />}
          </button>
          <button 
            onClick={(e) => handleDeleteRow(e, row.id, row.status)} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (isFormOpen) {
    const userStr = localStorage.getItem("valora_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const isAccountant = user?.role?.toLowerCase() === "accountant";

    const isPosted = selectedInvoice?.status === "CONFIRMED" || selectedInvoice?.status === "POSTED";
    const isPaid = selectedInvoice?.status === "PAID";
    const isReadOnly = isPosted || isPaid || (isAccountant && Boolean(selectedInvoice));

    const grandTotal = calculateTotal();
    const paidAmount = isPaid ? selectedInvoice?.total || grandTotal : 0;
    const amountDue = (selectedInvoice?.total || grandTotal) - paidAmount;

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
                  {selectedInvoice ? selectedInvoice.invoice_number : "New Customer Invoice"}
                </h1>
                <p className="fv-topbar-subtitle">
                  {selectedInvoice
                    ? `Customer: ${contacts.find(c => c.id === formData.customerId)?.name || "—"}`
                    : "Fill in the details below"}
                </p>
              </div>
            </div>

            <div className="fv-topbar-actions">
              <div className="fv-status-bar">
                <span className={`fv-status-step ${!selectedInvoice || selectedInvoice.status === "DRAFT" ? "active" : "done"}`}>Draft</span>
                <span className={`fv-status-step ${isPosted && !isPaid ? "active" : isPaid ? "done" : ""}`}>Confirmed</span>
                <span className={`fv-status-step ${isPaid ? "active" : ""}`}>Paid</span>
              </div>

              {!selectedInvoice && (
                <button className="fv-btn fv-btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Invoice"}
                </button>
              )}
              {selectedInvoice && (
                <button className="fv-btn fv-btn-ghost print-hide" onClick={handlePrint} title="Print Invoice">
                  <Printer size={15} /> Print
                </button>
              )}
              {selectedInvoice && selectedInvoice.status === "DRAFT" && (
                <button className="fv-btn fv-btn-ghost print-hide" style={{ color: "#DC2626" }} onClick={handleDelete} disabled={isSaving} title="Delete">
                  <Trash2 size={15} /> Delete
                </button>
              )}
              {selectedInvoice && !isPosted && !isPaid && (
                <button className="fv-btn fv-btn-confirm" onClick={handleConfirm} disabled={isSaving}>
                  <CheckCircle size={15} /> Confirm
                </button>
              )}
              {selectedInvoice && isPosted && !isPaid && (
                <button className="fv-btn fv-btn-pay" onClick={handleOpenPayModal} disabled={isSaving}>
                  <DollarSign size={15} /> Register Payment
                </button>
              )}
              {selectedInvoice && isPaid && (
                <button className="fv-btn fv-btn-pay" onClick={handleOpenPayModal} disabled={isSaving}>
                  <DollarSign size={15} /> View Payment
                </button>
              )}
              {selectedInvoice?.sales_order_id && (
                <button className="fv-btn fv-btn-ghost" onClick={() => navigate("/sales-orders")}>
                  <ShoppingCart size={15} /> SO
                </button>
              )}
              <button className="fv-btn fv-btn-ghost" onClick={handleCloseForm}>Cancel</button>
            </div>
          </div>

          <div className="fv-card">
            <div className="fv-card-body">
              <p className="fv-section-label">Invoice Details</p>
              <div className="fv-grid fv-grid-5">
                <div className="fv-field">
                  <label className="fv-label">Invoice No.</label>
                  <input
                    className="fv-input fv-input-autogen"
                    value={formData.invoiceNumber}
                    disabled
                    placeholder="Auto-Generated"
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Customer Name <span className="fv-required">*</span></label>
                  <select
                    className="fv-select"
                    value={formData.customerId}
                    disabled={isReadOnly}
                    onChange={e => {
                      const cid = e.target.value;
                      const c = contacts.find(x => x.id === cid);
                      const taxRate = c?.tax_rate || 0;
                      setFormData(prev => ({
                        ...prev,
                        customerId: cid,
                        lines: prev.lines.map(l => ({ ...l, taxRate }))
                      }));
                    }}
                  >
                    <option value="">— Select Customer —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.type ? ` (${c.type === "BOTH" ? "Customer & Vendor" : c.type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fv-field">
                  <label className="fv-label">
                    Customer Reference
                  </label>
                  <input
                    className="fv-input"
                    type="text"
                    value={formData.invoiceReference}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, invoiceReference: e.target.value })}
                    placeholder="e.g. PO-9921"
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Invoice Date</label>
                  <input
                    className="fv-input"
                    type="date"
                    value={formData.invoiceDate}
                    disabled={isReadOnly}
                    onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
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

            <div className="fv-lines-section">
              <p className="fv-lines-title">Invoice Lines</p>
              <div className="fv-table-wrap">
                <table className="fv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Sr.</th>
                      <th>Product <span style={{ color: "#DC2626" }}>*</span></th>
                      <th>Income Account</th>
                      <th>Budget Analytics</th>
                      <th style={{ textAlign: "right", width: 80 }}>Qty <span style={{ color: "#DC2626" }}>*</span></th>
                      <th style={{ textAlign: "right", width: 120 }}>Unit Price (₹) <span style={{ color: "#DC2626" }}>*</span></th>
                      <th style={{ textAlign: "right", width: 80 }}>Tax (%)</th>
                      <th style={{ textAlign: "right", width: 120 }}>Total (₹)</th>
                      {!isReadOnly && <th style={{ width: 40 }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => {
                      const subtotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
                      const taxAmount = subtotal * ((Number(line.taxRate) || 0) / 100);
                      const lineTotal = subtotal + taxAmount;
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
                              <option value="">Sales Income A/C (Default)</option>
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
                          <td style={{ textAlign: "right" }}>
                            {isReadOnly ? (
                              <span style={{ fontWeight: 600 }}>{line.taxRate}%</span>
                            ) : (
                              <input
                                className="fv-table-input fv-table-input-sm"
                                type="number"
                                min="0" max="100" step="0.01"
                                value={line.taxRate}
                                onChange={e => handleLineChange(idx, "taxRate", e.target.value)}
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
                      <td colSpan={!isReadOnly ? 7 : 7} style={{ textAlign: "right", color: "#64748B" }}>Grand Total</td>
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

            <div className="fv-pay-breakdown">
              <div className="fv-pay-pill">
                <span className="fv-pay-pill-label">Received via Bank/Cash</span>
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
                <span className="fv-pay-pill-label">Invoice Total</span>
                <span className="fv-pay-pill-value">
                  ₹ {(selectedInvoice?.total || grandTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

          </div>
        </div>

        {isPayModalOpen && (
          <div className="fv-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setIsPayModalOpen(false); }}>
            <div className="fv-modal">
              <div className="fv-modal-header">
                <h2 className="fv-modal-title">Register Payment (Receipt)</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Payment Type</span>
                  <div className="fv-modal-row-value fv-radio-group">
                    <label className="fv-radio-label" style={{ opacity: 0.4 }}>
                      <input type="radio" disabled /> Send
                    </label>
                    <label className="fv-radio-label">
                      <input type="radio" checked readOnly /> Receive
                    </label>
                  </div>
                </div>

                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Customer</span>
                  <div className="fv-modal-row-value">
                    <div className="fv-static">
                      {contacts.find(c => c.id === formData.customerId)?.name || "Unknown Customer"}
                    </div>
                  </div>
                </div>

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

                <div className="fv-modal-row">
                  <span className="fv-modal-row-label">Payment Into</span>
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
                    {isSaving ? "Processing…" : "Confirm Receipt"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Customer Invoices</h1></div>
      {isLoading ? (
        <p style={{ padding: "40px", color: "#64748B" }}>Loading customer invoices…</p>
      ) : (
        <DataTable
          title="Customer Invoice"
          columns={columns}
          data={invoices}
          onNewClick={() => { setSelectedInvoice(null); setIsFormOpen(true); }}
          searchPlaceholder="Search customer invoices…"
        />
      )}
    </div>
  );
}
