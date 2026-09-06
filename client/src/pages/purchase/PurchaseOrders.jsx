import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, FileText, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import { api } from "../../api";
import "../../styles/forms.css";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [contacts, setContacts]             = useState([]);
  const [products, setProducts]             = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [budgets, setBudgets]               = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [isFormOpen, setIsFormOpen]         = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [budgetWarning, setBudgetWarning]   = useState(null);

  const [formData, setFormData] = useState({
    vendorId: "",
    poDate: new Date().toISOString().split("T")[0],
    orderNumber: "",
    lines: [{ productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
  });

  /* ── Data loading ── */
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [poData, cData, pData, aData, bData] = await Promise.all([
        api.getPurchaseOrders(),
        api.getContacts(),
        api.getProducts(),
        api.getAnalyticAccounts(),
        api.getBudgets(),
      ]);
      setPurchaseOrders(poData);
      setContacts(cData);
      setProducts(pData);
      setAnalyticAccounts(aData);
      setBudgets(bData);
    } catch (err) {
      console.error("Failed to load purchase orders data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ── Budget check ── */
  const calculateTotal = () =>
    formData.lines.reduce(
      (sum, l) => sum + (Number(l.quantity) * Number(l.unitPrice) || 0),
      0,
    );

  useEffect(() => {
    const total = calculateTotal();
    if (total > 15000) {
      setBudgetWarning(
        "The entered amount is higher than the remaining budget for this account. Consider adjusting the value or revising the budget.",
      );
    } else {
      setBudgetWarning(null);
    }
  }, [formData.lines]);

  /* ── Line management ── */
  const handleAddLine = () =>
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, { productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
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
    if (formData.lines.some(l => !l.productId)) return alert("Product is required for all lines");
    setIsSaving(true);
    try {
      const payload = {
        vendor_id: formData.vendorId,
        po_number: formData.orderNumber,
        po_date: formData.poDate,
        lines: formData.lines.map(l => ({
          product_id: l.productId,
          analytic_account_id: l.analyticAccountId || null,
          qty: Number(l.quantity),
          unit_price: Number(l.unitPrice),
        })),
      };
      const created = await api.createPurchaseOrder(payload);
      setSelectedOrder(created);
      await loadData();
      alert("Purchase Order created successfully");
    } catch (err) {
      alert(err.message || "Failed to save purchase order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const updated = await api.confirmPurchaseOrder(selectedOrder.id);
      setSelectedOrder(updated);
      await loadData();
      alert("Purchase Order confirmed!");
    } catch (err) {
      alert(err.message || "Failed to confirm purchase order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateBill = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      await api.createVendorBill({
        vendor_id: selectedOrder.vendor_id || selectedOrder.contact_id,
        purchase_order_id: selectedOrder.id,
        bill_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        lines: selectedOrder.lines?.map(l => ({
          product_id: l.product_id,
          analytic_account_id: l.analytic_account_id,
          qty: l.qty || l.quantity || 1,
          unit_price: l.unit_price,
        })) || [],
      });
      await loadData();
      alert("Vendor Bill created from Purchase Order!");
      navigate("/vendor-bills");
    } catch (err) {
      alert(err.message || "Failed to create bill");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedOrder(null);
    setBudgetWarning(null);
    setFormData({
      vendorId: "",
      poDate: new Date().toISOString().split("T")[0],
      orderNumber: "",
      lines: [{ productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRowClick = async (row) => {
    setIsLoading(true);
    try {
      const fullDoc = await api.getPurchaseOrderById(row.id);
      setSelectedOrder(fullDoc);
      setFormData({
        vendorId: fullDoc.vendor_id || "",
        poDate: fullDoc.po_date ? new Date(fullDoc.po_date).toISOString().split("T")[0] : "",
        orderNumber: fullDoc.po_number || "",
        lines: fullDoc.lines?.map(l => ({
          productId: l.product_id,
          analyticAccountId: l.analytic_account_id || "",
          quantity: l.qty || l.quantity || 1,
          unitPrice: l.unit_price || 0,
        })) || [{ productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
      });
      setIsFormOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to load details");
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Table columns ── */
  const columns = [
    { header: "PO No.", accessor: "po_number", render: (r) => <strong>{r.po_number}</strong> },
    { header: "Vendor Name", render: (r) => r.vendor?.name || "-" },
    { header: "PO Date", render: (r) => new Date(r.po_date).toLocaleDateString("en-IN") },
    { header: "Total", render: (r) => `₹ ${Number(r.total || 0).toLocaleString("en-IN")}` },
    {
      header: "Status",
      render: (r) => (
        <span className={`fv-badge ${r.status === "CONFIRMED" ? "fv-badge-confirmed" : "fv-badge-draft"}`}>
          {r.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (r) => (
        <button className="secondary-btn" onClick={() => handleRowClick(r)} style={{ padding: "4px 12px", fontSize: "0.8rem" }}>
          View
        </button>
      ),
    },
  ];

  /* ═══════════════════════════════════════════
     FORM VIEW
  ═══════════════════════════════════════════ */
  if (isFormOpen) {
    const userStr = localStorage.getItem("valora_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const isAccountant  = user?.role?.toLowerCase() === "accountant";
    const isConfirmed   = selectedOrder?.status === "CONFIRMED" || selectedOrder?.status === "BILLED";
    const isReadOnly    = isConfirmed || (isAccountant && Boolean(selectedOrder));
    const grandTotal    = calculateTotal();

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
                  {selectedOrder ? selectedOrder.po_number : "New Purchase Order"}
                </h1>
                <p className="fv-topbar-subtitle">
                  {selectedOrder ? `Vendor: ${contacts.find(c => c.id === formData.vendorId)?.name || "—"}` : "Fill in the details below"}
                </p>
              </div>
            </div>

            <div className="fv-topbar-actions">
              {/* Status pipeline */}
              <div className="fv-status-bar">
                <span className={`fv-status-step ${!selectedOrder || selectedOrder.status === "DRAFT" ? "active" : "done"}`}>Draft</span>
                <span className={`fv-status-step ${isConfirmed ? "active" : ""}`}>Confirmed</span>
              </div>

              {!selectedOrder && (
                <button className="fv-btn fv-btn-save" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save Order"}
                </button>
              )}
              {selectedOrder && !isConfirmed && (
                <button className="fv-btn fv-btn-confirm" onClick={handleConfirm} disabled={isSaving}>
                  <CheckCircle size={15} /> Confirm
                </button>
              )}
              {selectedOrder && isConfirmed && (
                <button className="fv-btn fv-btn-bill" onClick={handleCreateBill} disabled={isSaving}>
                  <FileText size={15} /> Create Bill
                </button>
              )}
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
              <p className="fv-section-label">Order Details</p>
              <div className="fv-grid fv-grid-3">
                <div className="fv-field">
                  <label className="fv-label">PO No.</label>
                  <input
                    className="fv-input fv-input-autogen"
                    value={formData.orderNumber}
                    disabled
                    placeholder="Auto-Generated"
                  />
                </div>
                <div className="fv-field">
                  <label className="fv-label">Vendor Name <span className="fv-required">*</span></label>
                  <select
                    className="fv-select"
                    value={formData.vendorId}
                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                    disabled={isReadOnly}
                  >
                    <option value="">— Select Vendor —</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.type ? ` (${c.type === "BOTH" ? "Customer & Vendor" : c.type})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="fv-field">
                  <label className="fv-label">PO Date</label>
                  <input
                    className="fv-input"
                    type="date"
                    value={formData.poDate}
                    onChange={e => setFormData({ ...formData, poDate: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div className="fv-lines-section">
              <p className="fv-lines-title">Purchase Order Lines</p>
              <div className="fv-table-wrap">
                <table className="fv-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>Sr.</th>
                      <th>Product <span style={{ color: "#DC2626" }}>*</span></th>
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
                              onChange={e => handleLineChange(idx, "productId", e.target.value)}
                              disabled={isReadOnly}
                            >
                              <option value="">— Select Product —</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (Cost: ₹{p.cost})</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select
                              className="fv-table-select"
                              value={line.analyticAccountId}
                              onChange={e => handleLineChange(idx, "analyticAccountId", e.target.value)}
                              disabled={isReadOnly}
                            >
                              <option value="">— Select Analytics —</option>
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
                      <td colSpan={!isReadOnly ? 5 : 5} style={{ textAlign: "right", color: "#64748B" }}>Grand Total</td>
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

          </div>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Purchase Orders</h1></div>
      {isLoading ? (
        <p style={{ padding: "40px", color: "#64748B" }}>Loading purchase orders…</p>
      ) : (
        <DataTable
          title="Purchase Order"
          columns={columns}
          data={purchaseOrders}
          onNewClick={() => { setSelectedOrder(null); setIsFormOpen(true); }}
          searchPlaceholder="Search purchase orders…"
        />
      )}
    </div>
  );
}
