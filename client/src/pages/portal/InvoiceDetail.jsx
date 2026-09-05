import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileText, Calendar, DollarSign, Box } from 'lucide-react';
import { BACKEND_URL } from '../../api';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

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
    </div>
  );
}
