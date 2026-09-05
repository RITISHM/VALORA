import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, DollarSign, PieChart, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { api } from '../../api';

export default function CustomerInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Payment Modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_via: 'BANK',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    note: ''
  });

  const [formData, setFormData] = useState({
    customerId: '',
    invoiceNumber: `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    invoiceReference: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    lines: [
      { productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }
    ]
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invData, cData, pData, aData, accData] = await Promise.all([
        api.getCustomerInvoices(),
        api.getContacts(),
        api.getProducts(),
        api.getAnalyticAccounts(),
        api.getChartOfAccounts()
      ]);
      setInvoices(invData);
      setContacts(cData);
      setProducts(pData);
      setAnalyticAccounts(aData);
      setAccounts(accData);
    } catch (err) {
      console.error('Failed to load customer invoices:', err);
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

  const handleSave = async () => {
    if (!formData.customerId) return alert('Customer is required');
    setIsSaving(true);
    try {
      const defaultSalesAccount = accounts.find(a => a.type === 'INCOME' || a.name.toLowerCase().includes('sales'))?.id || accounts[0]?.id;
      const payload = {
        contact_id: formData.customerId,
        invoice_number: formData.invoiceNumber,
        invoice_reference: formData.invoiceReference,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate,
        total: calculateTotal(),
        lines: formData.lines.map(l => ({
          product_id: l.productId,
          account_id: l.accountId || defaultSalesAccount,
          analytic_account_id: l.analyticAccountId || null,
          quantity: Number(l.quantity),
          unit_price: Number(l.unitPrice)
        }))
      };

      const created = await api.createCustomerInvoice(payload);
      setSelectedInvoice(created);
      await loadData();
      alert('Invoice created successfully');
    } catch (err) {
      alert(err.message || 'Failed to save customer invoice');
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
      alert('Invoice confirmed & posted to Journal Entries!');
    } catch (err) {
      alert(err.message || 'Failed to confirm invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenPayModal = () => {
    if (!selectedInvoice) return;
    setPaymentData({
      payment_via: 'BANK',
      date: new Date().toISOString().split('T')[0],
      amount: selectedInvoice.total || calculateTotal(),
      note: `Payment for Invoice ${selectedInvoice.invoice_number}`
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
      alert('Payment confirmed & invoice status updated to Paid!');
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Payment failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedInvoice(null);
    setIsPayModalOpen(false);
    setFormData({
      customerId: '',
      invoiceNumber: `INV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceReference: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      lines: [{ productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRowClick = (row) => {
    setSelectedInvoice(row);
    setFormData({
      customerId: row.contact_id || '',
      invoiceNumber: row.invoice_number || '',
      invoiceReference: row.invoice_reference || '',
      invoiceDate: row.invoice_date ? new Date(row.invoice_date).toISOString().split('T')[0] : '',
      dueDate: row.due_date ? new Date(row.due_date).toISOString().split('T')[0] : '',
      lines: row.lines?.map(l => ({
        productId: l.product_id,
        accountId: l.account_id || '',
        analyticAccountId: l.analytic_account_id || '',
        quantity: l.quantity,
        unitPrice: l.unit_price
      })) || [{ productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }]
    });
    setIsFormOpen(true);
  };

  const columns = [
    { header: 'Invoice No.', accessor: 'invoice_number', render: (row) => <strong>{row.invoice_number}</strong> },
    { header: 'Customer', render: (row) => row.contact?.name || '-' },
    { header: 'Invoice Date', render: (row) => new Date(row.invoice_date).toLocaleDateString() },
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
    const isPosted = selectedInvoice?.status === 'CONFIRMED' || selectedInvoice?.status === 'POSTED';
    const isPaid = selectedInvoice?.status === 'PAID';

    return (
      <div className="page-content" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="secondary-btn" onClick={handleCloseForm} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Customer Invoice Form View</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            {!selectedInvoice && (
              <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
                Save Invoice
              </button>
            )}
            {selectedInvoice && !isPosted && !isPaid && (
              <button 
                className="primary-btn" 
                onClick={handleConfirm} 
                disabled={isSaving}
                style={{ backgroundColor: '#059669', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <CheckCircle size={16} /> Confirm
              </button>
            )}
            {selectedInvoice && isPosted && !isPaid && (
              <button 
                className="primary-btn" 
                onClick={handleOpenPayModal} 
                disabled={isSaving}
                style={{ backgroundColor: '#7C3AED', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <DollarSign size={16} /> Pay
              </button>
            )}
            {selectedInvoice?.sales_order_id && (
              <button className="secondary-btn" onClick={() => navigate('/sales-orders')}>
                <FileText size={16} /> SO
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

        <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '24px' }}>
          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Customer Invoice No.</label>
              <input type="text" value={formData.invoiceNumber} disabled />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Customer Name *</label>
              <select value={formData.customerId} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, customerId: e.target.value})}>
                <option value="">-- Select Customer --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Invoice Reference</label>
              <input type="text" value={formData.invoiceReference} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, invoiceReference: e.target.value})} placeholder="Alpha-numeric Text" />
            </div>
            <div className="form-field">
              <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Invoice Date</label>
              <input type="date" value={formData.invoiceDate} disabled={isPosted || isPaid} onChange={e => setFormData({...formData, invoiceDate: e.target.value})} />
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>Invoice Lines</h3>
          <table className="valora-table" style={{ width: '100%', marginBottom: '16px' }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Chart of Account (Sales by default)</th>
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
                      if (prod) newLines[idx].unitPrice = prod.sales_price || 0;
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
                      <option value="">Sales Income A/C (Default)</option>
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
        </div>

        {/* Invoice Payment Modal */}
        {isPayModalOpen && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#FFFFFF', border: '2px solid #1E293B', borderRadius: '16px', padding: '32px', width: '480px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', fontWeight: '800' }}>Invoice Payment (Receive)</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Payment Type</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label><input type="radio" checked readOnly /> Receive</label>
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
      <div className="page-header"><h1 className="page-title">Customer Invoices</h1></div>
      {isLoading ? <p>Loading customer invoices...</p> : (
        <DataTable title="Customer Invoice" columns={columns} data={invoices} onNewClick={() => { setSelectedInvoice(null); setIsFormOpen(true); }} searchPlaceholder="Search customer invoices..." />
      )}
    </div>
  );
}
