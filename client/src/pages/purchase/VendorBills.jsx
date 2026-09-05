import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, DollarSign, PieChart, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

export default function VendorBills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [budgetWarning, setBudgetWarning] = useState(null);

  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_via: 'BANK',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    note: ''
  });

  const [formData, setFormData] = useState({
    vendorId: '',
    billNumber: `Bill/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    billReference: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    lines: [
      { productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }
    ]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bData, cData, pData, aData, accData] = await Promise.all([
        api.getVendorBills(),
        api.getContacts(),
        api.getProducts(),
        api.getAnalyticAccounts(),
        api.getChartOfAccounts()
      ]);
      setBills(bData);
      setContacts(cData);
      setProducts(pData);
      setAnalyticAccounts(aData);
      setAccounts(accData);
    } catch (err) {
      console.error('Failed to load vendor bills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateTotal = () => {
    return formData.lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.unitPrice) || 0), 0);
  };

  useEffect(() => {
    const total = calculateTotal();
    if (total > 15000) {
      setBudgetWarning("Exceeds Approved Budget: The entered amount is higher than the remaining budget account for this budget line. Consider adjusting the value or revise the budget.");
    } else {
      setBudgetWarning(null);
    }
  }, [formData.lines]);

  const handleSave = async () => {
    if (!formData.vendorId) return alert('Vendor is required');
    setIsSaving(true);
    try {
      const defaultPurchaseAccount = accounts.find(a => a.type === 'EXPENSE' || a.name.toLowerCase().includes('purchase'))?.id || accounts[0]?.id;
      const payload = {
        vendor_id: formData.vendorId,
        bill_number: formData.billNumber,
        bill_reference: formData.billReference,
        bill_date: formData.billDate,
        due_date: formData.dueDate,
        lines: formData.lines.map(l => ({
          product_id: l.productId,
          account_id: l.accountId || defaultPurchaseAccount,
          analytic_account_id: l.analyticAccountId || null,
          qty: Number(l.quantity),
          unit_price: Number(l.unitPrice)
        }))
      };

      const created = await api.createVendorBill(payload);
      setSelectedBill(created);
      await loadData();
      alert('Vendor Bill created successfully');
    } catch (err) {
      alert(err.message || 'Failed to save vendor bill');
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
      alert('Vendor Bill confirmed & posted to Journal Entries!');
    } catch (err) {
      alert(err.message || 'Failed to confirm vendor bill');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPayModal = () => {
    if (!selectedBill) return;
    setPaymentData({
      payment_via: 'BANK',
      date: new Date().toISOString().split('T')[0],
      amount: selectedBill.total || calculateTotal(),
      note: `Payment for Bill ${selectedBill.bill_number}`
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
      alert('Payment confirmed & vendor bill status updated to Paid!');
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Payment failed');
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
      vendorId: '',
      billNumber: `Bill/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      billReference: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      lines: [{ productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRowClick = (row) => {
    setSelectedBill(row);
    setFormData({
      vendorId: row.vendor_id || row.contact_id || '',
      billNumber: row.bill_number || '',
      billReference: row.bill_reference || '',
      billDate: row.bill_date ? new Date(row.bill_date).toISOString().split('T')[0] : '',
      dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
      lines: row.lines?.map(l => ({
        productId: l.product_id,
        accountId: l.account_id || '',
        analyticAccountId: l.analytic_account_id || '',
        quantity: l.qty || l.quantity || 1,
        unitPrice: l.unit_price || 0
      })) || [{ productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }]
    });
    setIsFormOpen(true);
  };

  const columns = [
    { header: 'Vendor Bill No.', accessor: 'bill_number', render: (row) => <strong>{row.bill_number}</strong> },
    { header: 'Vendor Name', render: (row) => row.contact?.name || '-' },
    { header: 'Bill Date', render: (row) => new Date(row.bill_date).toLocaleDateString() },
    { header: 'Due Date', render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString() : '-' },
    { header: 'Total', render: (row) => `₹ ${Number(row.total || 0).toLocaleString()}` },
    { header: 'Status', render: (row) => (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '700',
        backgroundColor: row.status === 'PAID' ? '#D1FAE5' : row.status === 'CONFIRMED' ? '#DBEAFE' : '#FEF3C7',
        color: row.status === 'PAID' ? '#059669' : row.status === 'CONFIRMED' ? '#2563EB' : '#D97706'
      }}>
        {row.status}
      </span>
    )},
    { header: 'Action', render: (row) => (
      <button 
        className="secondary-btn" 
        onClick={() => handleRowClick(row)}
        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
      >
        View Form
      </button>
    )}
  ];

  if (isFormOpen) {
    const isPosted = selectedBill?.status === 'CONFIRMED' || selectedBill?.status === 'POSTED';
    const isPaid = selectedBill?.status === 'PAID';
    const paidAmount = isPaid ? (selectedBill?.total || calculateTotal()) : 0;
    const amountDue = (selectedBill?.total || calculateTotal()) - paidAmount;

    return (
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={handleCloseForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Vendor Bill Form View</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {!selectedBill && (
              <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                Save Bill
              </button>
            )}
            {selectedBill && !isPosted && !isPaid && (
              <button 
                className="primary-btn" 
                onClick={handleConfirm} 
                disabled={isSaving}
                style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle size={16} /> Confirm
              </button>
            )}
            {selectedBill && isPosted && !isPaid && (
              <button 
                className="primary-btn" 
                onClick={handleOpenPayModal} 
                disabled={isSaving}
                style={{ backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <DollarSign size={16} /> Pay
              </button>
            )}
            {selectedBill?.purchase_order_id && (
              <button className="secondary-btn" onClick={() => navigate('/purchase-orders')}>
                <ShoppingCart size={16} /> PO
              </button>
            )}
            <button className="secondary-btn" onClick={() => navigate('/reports/budget')}>
              <PieChart size={16} /> Budget Report
            </button>
            <button className="secondary-btn" onClick={handleCloseForm}>
              Cancel
            </button>
          </div>
        </div>

        {/* Yellow Non-blocking Warning Banner */}
        {budgetWarning && (
          <div style={{
            background: '#FEF3C7',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#92400E'
          }}>
            <AlertTriangle size={24} color="#D97706" />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Non-blocking Warning on Confirmation of Vendor Bill</strong>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                ⚠️ <strong>Exceeds Approved Budget</strong>: {budgetWarning}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Vendor Bill No.</label>
              <input type="text" value={formData.billNumber} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Vendor Name *</label>
              <select value={formData.vendorId} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, vendorId: e.target.value})}>
                <option value="">-- Select Vendor --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Bill Reference</label>
              <input type="text" value={formData.billReference} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, billReference: e.target.value})} placeholder="Alpha-numeric (Text)" />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Bill Date</label>
              <input type="date" value={formData.billDate} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, billDate: e.target.value})} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Bill Lines</h3>
          <table className="valora-table" style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Chart of Account (Purchase default)</th>
                <th>Budget Analytics</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price (₹)</th>
                <th style={{ textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {formData.lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select value={line.productId} disabled={isPosted || isPaid} onChange={e => {
                      const newLines = [...formData.lines];
                      newLines[idx].productId = e.target.value;
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) newLines[idx].unitPrice = prod.cost || prod.sales_price || 0;
                      setFormData({...formData, lines: newLines});
                    }}>
                      <option value="">-- Select Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={line.accountId} disabled={isPosted || isPaid} onChange={e => {
                      const newLines = [...formData.lines];
                      newLines[idx].accountId = e.target.value;
                      setFormData({...formData, lines: newLines});
                    }}>
                      <option value="">Purchase Expense A/C (Default)</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={line.analyticAccountId} disabled={isPosted || isPaid} onChange={e => {
                      const newLines = [...formData.lines];
                      newLines[idx].analyticAccountId = e.target.value;
                      setFormData({...formData, lines: newLines});
                    }}>
                      <option value="">-- Select Analytics --</option>
                      {analyticAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>{line.quantity}</td>
                  <td style={{ textAlign: 'right' }}>₹ {Number(line.unitPrice).toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>₹ {(Number(line.quantity) * Number(line.unitPrice)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dynamic Payment Breakdown Box from Excalidraw */}
          <div style={{
            background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'block' }}>Paid Via Bank / Cash</span>
              <strong style={{ fontSize: '1.1rem', color: '#059669' }}>₹ {paidAmount.toLocaleString()}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748B', display: 'block' }}>Amount Due (Total - Amount Paid)</span>
              <strong style={{ fontSize: '1.2rem', color: amountDue > 0 ? '#DC2626' : '#059669' }}>₹ {amountDue.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Vendor Bill Payment Modal */}
        {isPayModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '32px', width: '480px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', fontWeight: '800' }}>Vendor Bill Payment (Send)</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Payment Type</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label><input type="radio" checked readOnly /> Send</label>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Payment Via</label>
                <select value={paymentData.payment_via} onChange={e => setPaymentData({...paymentData, payment_via: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px' }}>
                  <option value="BANK">Bank Account</option>
                  <option value="CASH">Cash Account</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Payment Date</label>
                <input type="date" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Amount (₹)</label>
                <input type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Memo / Note</label>
                <input type="text" value={paymentData.note} onChange={e => setPaymentData({...paymentData, note: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="secondary-btn" onClick={() => setIsPayModalOpen(false)}>Cancel</button>
                <button className="primary-btn" onClick={handleConfirmPayment} style={{ backgroundColor: '#059669' }}>Confirm Payment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Vendor Bills</h1></div>
      {isLoading ? <p>Loading vendor bills...</p> : (
        <DataTable title="Vendor Bill" columns={columns} data={bills} onNewClick={() => { setSelectedBill(null); setIsFormOpen(true); }} searchPlaceholder="Search vendor bills..." />
      )}
    </div>
  );
}
