import { useState, useEffect } from 'react';
import { FileText, ArrowLeft, DollarSign, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api, BACKEND_URL } from '../../api';
import '../../styles/dashboard.css';

export default function PortalInvoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: 'BANK',
    amount: 0
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('valora_token');
      const res = await fetch(`${BACKEND_URL}/portal/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        // Fallback to customer invoices API if accessed as admin
        const data = await api.getCustomerInvoices();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Failed to fetch portal invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const handleOpenPay = (inv) => {
    setSelectedInvoice(inv);
    setPaymentData({
      method: 'BANK',
      amount: inv.total || 0
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = async () => {
    if (!selectedInvoice) return;
    setPaying(true);
    try {
      const token = localStorage.getItem('valora_token');
      const res = await fetch(`${BACKEND_URL}/portal/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      });

      if (res.ok) {
        alert('Payment processed successfully!');
        setIsPayModalOpen(false);
        setSelectedInvoice(null);
        await fetchInvoices();
      } else {
        const err = await res.json();
        alert(err.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to process payment');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="dashboard-greeting" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: '#111116' }}>User Portal - Invoices</h1>
          <p style={{ margin: '4px 0 0 0', color: '#6B7280' }}>Track, view, and pay your customer invoices online</p>
        </div>
        <button onClick={() => navigate('/portal/customer')} className="primary-btn" style={{ borderRadius: '8px', padding: '10px 20px' }}>
          Browse Marketplace
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', margin: '24px 0' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: '#6B7280' }}>
            <FileText size={20} color="#2563EB" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Total Invoices</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111116' }}>{invoices.length}</div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: '#6B7280' }}>
            <Clock size={20} color="#D97706" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Outstanding Balance</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#D97706' }}>
            ₹ {totalOutstanding.toLocaleString('en-IN')}
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', color: '#6B7280' }}>
            <CheckCircle size={20} color="#059669" />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Total Paid</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#059669' }}>
            ₹ {totalPaid.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px', color: '#111116' }}>My Invoices</h2>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px 0' }}>Loading your invoices...</p>
        ) : invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
            <p style={{ margin: 0 }}>No invoices found in your user portal account.</p>
          </div>
        ) : (
          <table className="valora-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: '700', color: '#111116' }}>{inv.invoice_number}</td>
                  <td>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                  <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>
                    ₹ {Number(inv.total || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      backgroundColor: inv.status === 'PAID' ? '#D1FAE5' : inv.status === 'CONFIRMED' ? '#DBEAFE' : '#FEF3C7',
                      color: inv.status === 'PAID' ? '#059669' : inv.status === 'CONFIRMED' ? '#2563EB' : '#D97706'
                    }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        className="secondary-btn" 
                        onClick={() => setSelectedInvoice(inv)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '6px' }}
                      >
                        Details
                      </button>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button 
                          className="primary-btn" 
                          onClick={() => handleOpenPay(inv)}
                          style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px', backgroundColor: '#059669' }}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInvoice && !isPayModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', width: '640px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>Invoice {selectedInvoice.invoice_number}</h2>
              <span style={{
                padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800',
                backgroundColor: selectedInvoice.status === 'PAID' ? '#D1FAE5' : '#FEF3C7',
                color: selectedInvoice.status === 'PAID' ? '#059669' : '#D97706'
              }}>
                {selectedInvoice.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Invoice Date</span>
                <div style={{ fontWeight: '600' }}>{new Date(selectedInvoice.invoice_date).toLocaleDateString()}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Due Date</span>
                <div style={{ fontWeight: '600' }}>{selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : '-'}</div>
              </div>
            </div>

            <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '700' }}>Itemized Breakdown</h4>
            <table className="valora-table" style={{ width: '100%', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Unit Price</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoice.lines?.map((line, i) => (
                  <tr key={i}>
                    <td>{line.product?.name || 'Product Item'}</td>
                    <td style={{ textAlign: 'right' }}>{line.qty || line.quantity}</td>
                    <td style={{ textAlign: 'right' }}>₹ {Number(line.unit_price).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', fontWeight: '700' }}>₹ {(Number(line.qty || line.quantity) * Number(line.unit_price)).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '2px dashed #E5E7EB' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                Total: ₹ {Number(selectedInvoice.total || 0).toLocaleString('en-IN')}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="secondary-btn" onClick={() => setSelectedInvoice(null)}>Close</button>
                {selectedInvoice.status !== 'PAID' && (
                  <button className="primary-btn" onClick={() => handleOpenPay(selectedInvoice)} style={{ backgroundColor: '#059669' }}>
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPayModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '32px', width: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <ShieldCheck size={24} color="#059669" />
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }}>User Portal Payment</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Invoice No.</label>
              <input type="text" value={selectedInvoice?.invoice_number || ''} disabled style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Payment Method</label>
              <select value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                <option value="BANK">Bank Transfer / UPI</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '6px' }}>Amount (₹)</label>
              <input type="number" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="secondary-btn" onClick={() => setIsPayModalOpen(false)} disabled={paying}>Cancel</button>
              <button className="primary-btn" onClick={handleConfirmPay} disabled={paying} style={{ backgroundColor: '#059669' }}>
                {paying ? 'Processing...' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
