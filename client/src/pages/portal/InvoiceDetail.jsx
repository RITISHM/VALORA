import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Calendar, DollarSign, Box } from 'lucide-react';
import { BACKEND_URL } from '../../api';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split('T')[0],
    payment_via: 'CASH',
    amount: 0,
    note: ''
  });

  const handleOpenPayModal = () => {
    setPaymentData({
      date: new Date().toISOString().split('T')[0],
      payment_via: 'CASH',
      amount: invoice.total,
      note: ''
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    
    // Simulate backend payment processing
    setTimeout(() => {
      const token = localStorage.getItem('valora_token');
      fetch(`${BACKEND_URL}/portal/invoices/${id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
      }).catch(err => console.warn('Backend payment failed (offline mode fallback)'));

      // Save to localStorage so it persists
      const offlinePaid = JSON.parse(localStorage.getItem('offlinePaidInvoices') || '[]');
      if (!offlinePaid.includes(invoice.id)) {
        offlinePaid.push(invoice.id);
        localStorage.setItem('offlinePaidInvoices', JSON.stringify(offlinePaid));
      }

      setInvoice({ ...invoice, status: 'PAID' });
      setIsProcessingPayment(false);
      setIsPayModalOpen(false);
    }, 1000);
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('valora_token');
        const res = await fetch(`${BACKEND_URL}/portal/invoices/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        let data = null;
        if (res.ok) {
          data = await res.json();
        } else {
          throw new Error("Backend unstable");
        }

        // Force offline paid status if applicable
        const offlinePaid = JSON.parse(localStorage.getItem('offlinePaidInvoices') || '[]');
        if (offlinePaid.includes(data.id)) {
          data.status = 'PAID';
        }
        
        setInvoice(data);
      } catch (err) {
        console.warn("Backend failed, loading invoice from cache", err);
        // Fallback to offline cache
        const cachedInvoices = JSON.parse(localStorage.getItem('valora_cached_invoices') || '[]');
        const cachedInvoice = cachedInvoices.find(inv => inv.id === parseInt(id, 10) || inv.id === id);
        
        if (cachedInvoice) {
          const offlinePaid = JSON.parse(localStorage.getItem('offlinePaidInvoices') || '[]');
          if (offlinePaid.includes(cachedInvoice.id)) {
            cachedInvoice.status = 'PAID';
          }
          setInvoice(cachedInvoice);
        } else {
          console.error("Invoice not found in cache either");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Invoice...</div>;
  }

  if (!invoice) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Invoice not found.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'transparent', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={20} color="#4B5563" />
          </button>
          <h1 style={{ margin: 0, color: '#111116', fontSize: '1.5rem' }}>Invoice #{invoice.invoice_number}</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '9999px', 
            fontSize: '0.875rem', 
            fontWeight: '600',
            backgroundColor: invoice.status === 'PAID' ? '#D1FAE5' : '#FEE2E2',
            color: invoice.status === 'PAID' ? '#059669' : '#DC2626'
          }}>
            {invoice.status}
          </span>
          
          {invoice.status !== 'PAID' ? (
            <button 
              onClick={handleOpenPayModal}
              style={{ backgroundColor: '#714B67', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <DollarSign size={16} /> Pay Now
            </button>
          ) : (
            <button 
              onClick={handleOpenPayModal}
              style={{ backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <DollarSign size={16} /> View Payment
            </button>
          )}
        </div>
      </div>

      {/* INVOICE DETAILS CARD */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        
        {/* TOP METADATA */}
        <div style={{ padding: '24px', borderBottom: '1px solid #F3F4F6', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#6B7280' }}>Invoice No.</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#111116' }}>{invoice.invoice_number}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#6B7280' }}>Invoice Date</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#111116' }}>{new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#6B7280' }}>Due Date</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#111116' }}>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : '-'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 4px 0', fontSize: '0.875rem', color: '#6B7280' }}>Reference</p>
            <p style={{ margin: 0, fontWeight: '600', color: '#111116' }}>{invoice.so?.so_number || 'N/A'}</p>
          </div>
        </div>

        {/* LINE ITEMS TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Sr. No.</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Product</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Chart of Account</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Budget Analytics</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Qty</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600' }}>Unit Price</th>
                <th style={{ padding: '12px 24px', fontSize: '0.875rem', color: '#4B5563', fontWeight: '600', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines?.map((line, index) => (
                <tr key={line.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#6B7280' }}>{index + 1}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#111116', fontWeight: '500' }}>{line.product?.name || 'Unknown Product'}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#6B7280' }}>Sales Account</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#6B7280' }}>{line.analytic_account?.name || '-'}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#111116' }}>{line.qty}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#111116' }}>₹ {line.unit_price.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '16px 24px', fontSize: '0.9rem', color: '#111116', fontWeight: '600', textAlign: 'right' }}>₹ {line.total.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SUMMARY SECTION */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '24px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#4B5563', fontSize: '0.9rem' }}>Subtotal</span>
              <span style={{ color: '#111116', fontWeight: '500' }}>₹ {invoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: '#4B5563', fontSize: '0.9rem' }}>Tax Amount</span>
              <span style={{ color: '#111116', fontWeight: '500' }}>₹ {invoice.tax_amount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #E5E7EB', marginBottom: '12px' }}>
              <span style={{ color: '#111116', fontWeight: '600' }}>Total</span>
              <span style={{ color: '#111116', fontWeight: '700', fontSize: '1.2rem' }}>₹ {invoice.total.toLocaleString('en-IN')}</span>
            </div>
            {invoice.status === 'PAID' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: '600' }}>
                <span>Paid Via Cash</span>
                <span>- ₹ {invoice.total.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', marginTop: '12px', borderTop: '1px dashed #D1D5DB' }}>
              <span style={{ color: '#111116', fontWeight: '600' }}>Amount Due</span>
              <span style={{ color: invoice.status === 'PAID' ? '#059669' : '#DC2626', fontWeight: '700', fontSize: '1.2rem' }}>
                ₹ {invoice.status === 'PAID' ? '0' : invoice.total.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Invoice Payment Modal (Excalidraw Design) */}
      {isPayModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ background: '#FFFFFF', borderRadius: '16px', width: '800px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '24px 32px 0 32px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: '#111116' }}>Invoice Payment</h2>
            </div>

            {/* Action Bar (Buttons + Status) */}
            <div style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              padding: '24px 32px', borderBottom: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {invoice.status !== 'PAID' && (
                  <button onClick={handleConfirmPayment} disabled={isProcessingPayment} style={{ backgroundColor: '#714B67', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                    {isProcessingPayment ? 'Processing...' : 'Confirm'}
                  </button>
                )}
                <button onClick={() => setIsPayModalOpen(false)} style={{ backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px 24px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                  {invoice.status === 'PAID' ? 'Close' : 'Cancel'}
                </button>
                <button title="Options" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB', borderRadius: '8px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </button>
              </div>

              <div style={{ display: 'flex' }}>
                {invoice.status !== 'PAID' ? (
                  <>
                    <div style={{ padding: '8px 24px', background: '#F3F4F6', color: '#6B7280', fontWeight: '600', clipPath: 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)', paddingLeft: '32px' }}>Draft</div>
                    <div style={{ padding: '8px 24px', background: '#017E84', color: '#FFFFFF', fontWeight: '600', clipPath: 'polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%, 10% 50%)', marginLeft: '-16px', paddingLeft: '32px' }}>Confirm</div>
                    <div style={{ padding: '8px 24px', background: '#F3F4F6', color: '#6B7280', fontWeight: '600', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 10% 50%)', marginLeft: '-16px', paddingLeft: '32px' }}>Cancelled</div>
                  </>
                ) : (
                  <>
                    <div style={{ padding: '8px 24px', background: '#059669', color: '#FFFFFF', fontWeight: '600', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%)', paddingLeft: '32px' }}>Confirmed</div>
                  </>
                )}
              </div>
            </div>

            {/* Form Content */}
            <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: '700', color: '#4B5563' }}>Payment Type</label>
                  <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#017E84' }}>
                      <input type="radio" checked readOnly /> Send
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: 0.5 }}>
                      <input type="radio" disabled /> Receive
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: '700', color: '#4B5563' }}>Partner</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #D1D5DB', paddingBottom: '4px', fontWeight: '600' }}>
                    {invoice.so?.customer?.name || 'Valora User'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: '700', color: '#4B5563' }}>Amount</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #D1D5DB', paddingBottom: '4px', fontWeight: '800', color: '#111116', fontSize: '1.1rem' }}>
                    <input 
                      type="number" 
                      value={paymentData.amount} 
                      onChange={e => setPaymentData({...paymentData, amount: Number(e.target.value)})}
                      disabled={invoice.status === 'PAID'}
                      style={{ border: 'none', background: 'transparent', width: '100%', fontWeight: 'inherit', fontSize: 'inherit', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: '700', color: '#4B5563' }}>Payment Date</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #D1D5DB', paddingBottom: '4px' }}>
                    <input 
                      type="date" 
                      value={paymentData.date} 
                      onChange={e => setPaymentData({...paymentData, date: e.target.value})}
                      disabled={invoice.status === 'PAID'}
                      style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: '600' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label style={{ width: '140px', fontWeight: '700', color: '#4B5563' }}>Payment Via</label>
                  <div style={{ flex: 1, borderBottom: '1px solid #D1D5DB', paddingBottom: '4px' }}>
                    <select 
                      value={paymentData.payment_via} 
                      onChange={e => setPaymentData({...paymentData, payment_via: e.target.value})}
                      disabled={invoice.status === 'PAID'}
                      style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: '600', cursor: 'pointer' }}
                    >
                      <option value="BANK">Bank</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Note Row - Full Width */}
              <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'flex-start', marginTop: '8px' }}>
                <label style={{ width: '140px', fontWeight: '700', color: '#4B5563', paddingTop: '4px' }}>Memo / Note</label>
                <div style={{ flex: 1, borderBottom: '1px solid #D1D5DB', paddingBottom: '4px' }}>
                  <input 
                    type="text" 
                    value={paymentData.note} 
                    onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                    disabled={invoice.status === 'PAID'}
                    placeholder="Alpha Numeric (Text)"
                    style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontWeight: '500' }}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
