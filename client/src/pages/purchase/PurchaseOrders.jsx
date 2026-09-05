import React, { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../components/DataTable";
import { api } from "../../api";

export default function PurchaseOrders() {
  const navigate = useNavigate();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [budgetWarning, setBudgetWarning] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: "",
    poDate: new Date().toISOString().split("T")[0],
    orderNumber: "",
    lines: [{ productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
  });

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

  useEffect(() => {
    loadData();
  }, []);

  const handleAddLine = () => {
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { productId: "", analyticAccountId: "", quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveLine = (idx) => {
    if (formData.lines.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx),
    }));
  };

  const handleLineChange = (idx, field, value) => {
    setFormData((prev) => {
      const newLines = [...prev.lines];
      const updatedLine = { ...newLines[idx], [field]: value };
      if (field === "productId") {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          updatedLine.unitPrice = prod.cost || prod.sales_price || 0;
        }
      }
      newLines[idx] = updatedLine;
      return { ...prev, lines: newLines };
    });

    // Check budget guardrails dynamically
    checkBudgetGuardrails();
  };

  const calculateTotal = () => {
    return formData.lines.reduce(
      (sum, line) => sum + (Number(line.quantity) * Number(line.unitPrice) || 0),
      0,
    );
  };

  const checkBudgetGuardrails = () => {
    const total = calculateTotal();
    // Excalidraw requirement: Non-blocking warning if total > 20000 or exceeds budget limit
    if (total > 15000) {
      setBudgetWarning(
        "Exceeds Approved Budget: The entered amount is higher than the remaining budget account for this budget line. Consider adjusting the value or revise the budget.",
      );
    } else {
      setBudgetWarning(null);
    }
  };

  useEffect(() => {
    checkBudgetGuardrails();
  }, [formData.lines]);

  const handleSave = async () => {
    if (!formData.vendorId) return alert("Vendor is required");
    if (formData.lines.some((l) => !l.productId))
      return alert("Product is required for all line items");

    setIsSaving(true);
    try {
      const payload = {
        vendor_id: formData.vendorId,
        po_number: formData.orderNumber,
        po_date: formData.poDate,
        lines: formData.lines.map((l) => ({
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
      const billData = {
        vendor_id: selectedOrder.vendor_id || selectedOrder.contact_id,
        purchase_order_id: selectedOrder.id,
        bill_number: `Bill/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        bill_reference: `Ref-${selectedOrder.po_number}`,
        bill_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        lines:
          selectedOrder.lines?.map((l) => ({
            product_id: l.product_id,
            analytic_account_id: l.analytic_account_id,
            qty: l.qty || l.quantity || 1,
            unit_price: l.unit_price,
          })) || [],
      };

      await api.createVendorBill(billData);
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
      setSelectedBill
        ? setSelectedBill(fullDoc)
        : setSelectedOrder
          ? setSelectedOrder(fullDoc)
          : setSelectedInvoice(fullDoc);
      setFormData({
        ...(row.vendor_id ? { vendorId: fullDoc.vendor_id } : {}),
        ...(row.customer_id ? { customerId: fullDoc.customer_id } : {}),
        billNumber: fullDoc.bill_number || "",
        billReference: fullDoc.bill_reference || "",
        orderNumber: fullDoc.order_number || "",
        invoiceNumber: fullDoc.invoice_number || "",
        billDate: fullDoc.bill_date ? new Date(fullDoc.bill_date).toISOString().split("T")[0] : "",
        orderDate: fullDoc.order_date
          ? new Date(fullDoc.order_date).toISOString().split("T")[0]
          : "",
        invoiceDate: fullDoc.invoice_date
          ? new Date(fullDoc.invoice_date).toISOString().split("T")[0]
          : "",
        dueDate: fullDoc.due_date ? new Date(fullDoc.due_date).toISOString().split("T")[0] : "",
        lines: fullDoc.lines?.map((l) => ({
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

  const columns = [
    { header: "PO No.", accessor: "po_number", render: (row) => <strong>{row.po_number}</strong> },
    { header: "Vendor Name", render: (row) => row.contact?.name || "-" },
    { header: "PO Date", render: (row) => new Date(row.po_date).toLocaleDateString() },
    { header: "Total", render: (row) => `₹ ${Number(row.total || 0).toLocaleString()}` },
    {
      header: "Status",
      render: (row) => (
        <span
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: "700",
            backgroundColor: row.status === "CONFIRMED" ? "#D1FAE5" : "#FEF3C7",
            color: row.status === "CONFIRMED" ? "#059669" : "#D97706",
          }}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      render: (row) => (
        <button
          className="secondary-btn"
          onClick={() => handleRowClick(row)}
          style={{ padding: "4px 10px", fontSize: "0.8rem" }}
        >
          View Form
        </button>
      ),
    },
  ];

  if (isFormOpen) {
    const userStr = localStorage.getItem("valora_user");
    const user = userStr ? JSON.parse(userStr) : null;
    const isAccountant = user?.role?.toLowerCase() === "accountant";

    const isConfirmed = selectedOrder?.status === "CONFIRMED" || selectedOrder?.status === "BILLED";
    const isReadOnly = isConfirmed || (isAccountant && Boolean(selectedOrder));

    return (
      <div className="page-content" style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="secondary-btn"
              onClick={handleCloseForm}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800" }}>
              Purchase Order Form View
            </h2>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {!selectedOrder && (
              <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                Save Order
              </button>
            )}
            {selectedOrder && !isConfirmed && (
              <button
                className="primary-btn"
                onClick={handleConfirm}
                disabled={isSaving}
                style={{
                  backgroundColor: "#059669",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle size={16} /> Confirm
              </button>
            )}
            {selectedOrder && isConfirmed && (
              <button
                className="primary-btn"
                onClick={handleCreateBill}
                disabled={isSaving}
                style={{
                  backgroundColor: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <FileText size={16} /> Create Bill
              </button>
            )}
            <button className="secondary-btn" onClick={handleCloseForm}>
              Cancel
            </button>
          </div>
        </div>

        {/* Yellow Non-blocking Warning Banner */}
        {budgetWarning && (
          <div
            style={{
              background: "#FEF3C7",
              border: "2px solid #F59E0B",
              borderRadius: "12px",
              padding: "16px 20px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#92400E",
            }}
          >
            <AlertTriangle size={24} color="#D97706" />
            <div>
              <strong style={{ fontSize: "0.95rem" }}>
                Non-Blocking Warning on Confirmation of PO
              </strong>
              <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>
                ⚠️ <strong>Exceeds Approved Budget</strong>: {budgetWarning}
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: "#FFFFFF",
            border: "2px solid #1E293B",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div className="form-field">
              <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>PO No.</label>
              <input
                type="text"
                value={formData.orderNumber}
                disabled={true}
                placeholder="Auto-Generated"
              />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>
                Vendor Name (Contact Master) *
              </label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                disabled={isReadOnly}
                required
              >
                <option value="">-- Select Vendor --</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type ? (c.type.toUpperCase() === 'BOTH' ? 'Customer & Vendor' : c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase()) : 'Contact'})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label style={{ fontWeight: "600", fontSize: "0.85rem" }}>PO Date</label>
              <input
                type="date"
                value={formData.poDate}
                onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                disabled={isReadOnly}
              />
            </div>
          </div>

          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px" }}>
            Purchase Order Lines
          </h3>

          <table className="valora-table" style={{ width: "100%", marginBottom: "16px" }}>
            <thead>
              <tr>
                <th style={{ width: "50px" }}>Sr. No.</th>
                <th>Product (Product Master)</th>
                <th>Budget Analytics</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit Price (₹)</th>
                <th style={{ textAlign: "right" }}>Total (₹)</th>
                {!isReadOnly && <th style={{ width: "40px" }}></th>}
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, idx) => {
                const lineTotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <select
                        value={line.productId}
                        onChange={(e) => handleLineChange(idx, "productId", e.target.value)}
                        disabled={isReadOnly}
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                        }}
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Cost: ₹ {p.cost})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={line.analyticAccountId}
                        onChange={(e) => handleLineChange(idx, "analyticAccountId", e.target.value)}
                        disabled={isReadOnly}
                        style={{
                          width: "100%",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                        }}
                      >
                        <option value="">-- Select Analytics --</option>
                        {analyticAccounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                        disabled={isReadOnly}
                        style={{
                          width: "70px",
                          textAlign: "right",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <input
                        type="number"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(idx, "unitPrice", e.target.value)}
                        disabled={isReadOnly}
                        style={{
                          width: "100px",
                          textAlign: "right",
                          padding: "6px",
                          borderRadius: "6px",
                          border: "1px solid #CBD5E1",
                        }}
                      />
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "700" }}>
                      ₹ {lineTotal.toLocaleString()}
                    </td>
                    {!isReadOnly && (
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#EF4444",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ fontWeight: "800", fontSize: "1.1rem", background: "#F8FAFC" }}>
                <td colSpan={5} style={{ textAlign: "right" }}>
                  Grand Total:
                </td>
                <td style={{ textAlign: "right", color: "#2563EB" }}>
                  ₹ {calculateTotal().toLocaleString()}
                </td>
                {!isReadOnly && <td></td>}
              </tr>
            </tfoot>
          </table>

          {!isReadOnly && (
            <button
              type="button"
              className="secondary-btn"
              onClick={handleAddLine}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={16} /> Add Product Line
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Purchase Orders</h1>
      </div>
      {isLoading ? (
        <p>Loading purchase orders...</p>
      ) : (
        <DataTable
          title="Purchase Order"
          columns={columns}
          data={purchaseOrders}
          onNewClick={() => {
            setSelectedOrder(null);
            setIsFormOpen(true);
          }}
          searchPlaceholder="Search purchase orders..."
        />
      )}
    </div>
  );
}
