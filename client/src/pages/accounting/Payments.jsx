import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    payment_type: 'SEND',
    partner_id: '',
    payment_via: 'BANK',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    note: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        api.getPayments(),
        api.getContacts()
      ]);
      setPayments(pData);
      setContacts(cData);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!formData.partner_id) return alert('Partner is required');
    if (!formData.amount || Number(formData.amount) <= 0) return alert('Valid amount is required');

    setIsSaving(true);
    try {
      await api.createPayment({
        ...formData,
        amount: Number(formData.amount)
      });
      await loadData();
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save payment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setFormData({
      payment_type: 'SEND',
      partner_id: '',
      payment_via: 'BANK',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      note: ''
    });
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date || row.created_at).toLocaleDateString() },
    { header: 'Type', render: (row) => (
      <span style={{
        padding: '4px 10px',
        borderRadius: '6px',
        fontSize: '0.8rem',
        fontWeight: '700',
        backgroundColor: row.payment_type === 'RECEIVE' ? '#D1FAE5' : '#FEE2E2',
        color: row.payment_type === 'RECEIVE' ? '#059669' : '#DC2626'
      }}>
        {row.payment_type || 'SEND'}
      </span>
    )},
    { header: 'Partner', render: (row) => row.contact?.name || '-' },
    { header: 'Payment Via', accessor: 'payment_via' },
    { header: 'Amount', render: (row) => `₹ ${Number(row.amount || 0).toLocaleString()}` },
    { header: 'Memo / Note', accessor: 'note' }
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title="New Payment / Receipt" 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Payment Type</label>
              <select value={formData.payment_type} onChange={e => setFormData({...formData, payment_type: e.target.value})}>
                <option value="SEND">Send (Vendor Payment)</option>
                <option value="RECEIVE">Receive (Customer Receipt)</option>
              </select>
            </div>
            <div className="form-field">
              <label>Partner *</label>
              <select value={formData.partner_id} onChange={e => setFormData({...formData, partner_id: e.target.value})} required>
                <option value="">-- Select Contact --</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type ? (c.type.toUpperCase() === 'BOTH' ? 'Customer & Vendor' : c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase()) : 'Contact'})</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Payment Via</label>
              <select value={formData.payment_via} onChange={e => setFormData({...formData, payment_via: e.target.value})}>
                <option value="BANK">Bank Account</option>
                <option value="CASH">Cash Account</option>
              </select>
            </div>
            <div className="form-field">
              <label>Date</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Amount (₹) *</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required />
            </div>
            <div className="form-field">
              <label>Memo / Note</label>
              <input type="text" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} placeholder="Alpha-numeric note" />
            </div>
          </div>
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header"><h1 className="page-title">Payments & Receipts</h1></div>
      {isLoading ? <p>Loading payments...</p> : (
        <DataTable title="Payment" columns={columns} data={payments} onNewClick={() => setIsFormOpen(true)} searchPlaceholder="Search payments..." />
      )}
    </div>
  );
}
