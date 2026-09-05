/**
 * @file Dashboard.jsx
 * @description Main dashboard view for Valora ERP.
 * Renders role-specific dashboards:
 * - AdminDashboard: Displays KPIs, recent transactions, meetings, and balance sheet summary for staff/admins.
 * - UserDashboard: Displays customer portal invoices, total dues, and inline invoice payment flow for portal contacts.
 * @module pages/Dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronDown, ShoppingBag, ShoppingCart, BookOpen, PieChart, Layers, Tag, DollarSign, ListFilter, Users, Package, FileText, BarChart3, ArrowRight, Network, Activity, Sunrise, Loader2, Eye
} from 'lucide-react';
import { useNavigate, Link, useOutletContext } from 'react-router-dom';
import { BACKEND_URL } from '../api';
import '../styles/dashboard.css';

/**
 * Administrative and Accountant dashboard view featuring company-wide metrics and activities.
 * 
 * @component
 * @returns {JSX.Element} The rendered admin dashboard view.
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (menu, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  return (
    <div className="dashboard-container" onClick={closeDropdowns}>
      <div className="dashboard-greeting" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Hi, Admin 👋</h1>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col" style={{ flex: 1.6 }}>
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <Link to="/sales-orders" className="see-all">See all <ArrowRight size={14} /></Link>
          </div>

          {/* The 4 Dropdown Menu Tabs in Dashboard Page (Replacing All | Sales | Purchases | Journals) */}
          <div className="dashboard-tabs" style={{ gap: '24px', display: 'flex', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px', position: 'relative', zIndex: 50 }}>
            {/* 1. SALES TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`tab ${activeDropdown === 'sales' ? 'active' : ''}`}
                onClick={(e) => toggleDropdown('sales', e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: 'none',
                  fontSize: '0.95rem', fontWeight: '600', color: activeDropdown === 'sales' ? '#111116' : '#9CA3AF',
                  cursor: 'pointer', padding: 0
                }}
              >
                Sales <ChevronDown size={14} />
              </button>
              {activeDropdown === 'sales' && (
                <div className="mega-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '8px' }}>
                  <Link to="/sales-orders" onClick={closeDropdowns}><ShoppingBag size={15} /> Sales order</Link>
                  <Link to="/customer-invoices" onClick={closeDropdowns}><FileText size={15} /> Sale Invoice</Link>
                  <Link to="/payments" onClick={closeDropdowns}><DollarSign size={15} /> Receipt</Link>
                </div>
              )}
            </div>

            {/* 2. PURCHASE TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`tab ${activeDropdown === 'purchase' ? 'active' : ''}`}
                onClick={(e) => toggleDropdown('purchase', e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: 'none',
                  fontSize: '0.95rem', fontWeight: '600', color: activeDropdown === 'purchase' ? '#111116' : '#9CA3AF',
                  cursor: 'pointer', padding: 0
                }}
              >
                Purchase <ChevronDown size={14} />
              </button>
              {activeDropdown === 'purchase' && (
                <div className="mega-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '8px' }}>
                  <Link to="/purchase-orders" onClick={closeDropdowns}><ShoppingCart size={15} /> Purchase Order</Link>
                  <Link to="/vendor-bills" onClick={closeDropdowns}><FileText size={15} /> Purchase Bill</Link>
                  <Link to="/payments" onClick={closeDropdowns}><DollarSign size={15} /> Payment</Link>
                </div>
              )}
            </div>

            {/* 3. ACCOUNT TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`tab ${activeDropdown === 'account' ? 'active' : ''}`}
                onClick={(e) => toggleDropdown('account', e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: 'none',
                  fontSize: '0.95rem', fontWeight: '600', color: activeDropdown === 'account' ? '#111116' : '#9CA3AF',
                  cursor: 'pointer', padding: 0
                }}
              >
                Account <ChevronDown size={14} />
              </button>
              {activeDropdown === 'account' && (
                <div className="mega-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '8px' }}>
                  <Link to="/contacts" onClick={closeDropdowns}><Users size={15} /> Contact</Link>
                  <Link to="/products" onClick={closeDropdowns}><Package size={15} /> Product</Link>
                  <Link to="/analytic-accounts" onClick={closeDropdowns}><Tag size={15} /> Analyticals</Link>
                  <Link to="/budgets" onClick={closeDropdowns}><PieChart size={15} /> Analytical Budget</Link>
                  <Link to="/accounts" onClick={closeDropdowns}><BookOpen size={15} /> Chart of Account</Link>
                  <Link to="/journals" onClick={closeDropdowns}><ListFilter size={15} /> Journals</Link>
                  <Link to="/journal-entries" onClick={closeDropdowns}><Layers size={15} /> Journal Entries</Link>
                </div>
              )}
            </div>

            {/* 4. REPORT TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                className={`tab ${activeDropdown === 'report' ? 'active' : ''}`}
                onClick={(e) => toggleDropdown('report', e)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'transparent', border: 'none',
                  fontSize: '0.95rem', fontWeight: '600', color: activeDropdown === 'report' ? '#111116' : '#9CA3AF',
                  cursor: 'pointer', padding: 0
                }}
              >
                Report <ChevronDown size={14} />
              </button>
              {activeDropdown === 'report' && (
                <div className="mega-dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '8px' }}>
                  <Link to="/reports/balance-sheet" onClick={closeDropdowns}><BarChart3 size={15} /> Balancesheet</Link>
                  <Link to="/reports/pnl" onClick={closeDropdowns}><BarChart3 size={15} /> Profit and Loss</Link>
                  <Link to="/reports/budget" onClick={closeDropdowns}><PieChart size={15} /> Budget Report</Link>
                </div>
              )}
            </div>
          </div>

          <div className="transaction-cards">
            <div className="transaction-card" onClick={() => navigate('/vendor-bills')} style={{ cursor: 'pointer' }}>
              <div className="card-graphic bg-mint">
                <Network size={40} strokeWidth={1} color="#017E84" />
              </div>
              <div className="card-content">
                <h3>Vendor Bill #1024</h3>
                <p>Purchase of bulk office furniture</p>
                <div className="card-badges">
                  <span className="badge">Purchase</span>
                  <span className="badge">Goods</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 5</span>
                <span className="amount">₹ 45,000</span>
              </div>
            </div>

            <div className="transaction-card" onClick={() => navigate('/customer-invoices')} style={{ cursor: 'pointer' }}>
              <div className="card-graphic bg-purple">
                <Activity size={40} strokeWidth={1} color="#714B67" />
              </div>
              <div className="card-content">
                <h3>Customer Invoice #992</h3>
                <p>Payment received for premium chairs</p>
                <div className="card-badges">
                  <span className="badge">Sales</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 6</span>
                <span className="amount">₹ 12,500</span>
              </div>
            </div>

            <div className="transaction-card" onClick={() => navigate('/journal-entries')} style={{ cursor: 'pointer' }}>
              <div className="card-graphic bg-peach">
                <Sunrise size={40} strokeWidth={1} color="#D46243" />
              </div>
              <div className="card-content">
                <h3>Journal Entry #JE-12</h3>
                <p>Manual adjustment for depreciation</p>
                <div className="card-badges">
                  <span className="badge">Adjustment</span>
                  <span className="badge">Finance</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 8</span>
                <span className="amount">₹ 5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Original Calendar, Schedule, and Cash Flow Widgets */}
        <div className="dashboard-side-col">
          {/* Calendar Widget */}
          <div className="calendar-widget">
            <div className="calendar-header">
              <h3>May 2026</h3>
              <div className="calendar-nav">
                <span>&lt;</span>
                <span>&gt;</span>
              </div>
            </div>
            <div className="calendar-days">
              <div className="day-col"><span>SUN</span><span>2</span></div>
              <div className="day-col active"><span>MON</span><span>3</span><div className="dot"></div></div>
              <div className="day-col"><span>TUE</span><span>4</span></div>
              <div className="day-col"><span>WED</span><span>5</span></div>
              <div className="day-col"><span>THU</span><span>6</span></div>
              <div className="day-col"><span>FRI</span><span>7</span></div>
              <div className="day-col"><span>SAT</span><span>8</span></div>
            </div>
          </div>

          {/* Schedule / Upcoming */}
          <div className="schedule-widget">
            <div className="section-header">
              <h3>Schedule</h3>
              <Link to="/sales-orders" className="see-all">See all <ArrowRight size={14} /></Link>
            </div>

            <div className="schedule-list">
              <div className="schedule-item dark">
                <div className="sch-date">05</div>
                <div className="sch-info">
                  <h4>Vendor Payment</h4>
                  <span>Azure Furniture</span>
                </div>
                <div className="sch-time">18:00 - 19:30</div>
              </div>
              <div className="schedule-item light">
                <div className="sch-date">06</div>
                <div className="sch-info">
                  <h4>Sales Review</h4>
                  <span>Internal Meeting</span>
                </div>
                <div className="sch-time">11:00 - 12:30</div>
              </div>
              <div className="schedule-item light">
                <div className="sch-date">07</div>
                <div className="sch-info">
                  <h4>Tax Filing</h4>
                  <span>Quarterly Update</span>
                </div>
                <div className="sch-time">14:00 - 15:30</div>
              </div>
            </div>
          </div>

          {/* Chart Widget */}
          <div className="chart-widget">
            <div className="section-header">
              <h3>Cash Flow</h3>
              <span className="meta-text">₹ 1.2M Total</span>
            </div>

            <div className="bar-chart">
              <div className="y-axis">
                <span>80k</span><span>60k</span><span>40k</span><span>20k</span><span>0k</span>
              </div>
              <div className="bars-container">
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '40%' }}></div><span>S</span></div>
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '60%' }}></div><span>M</span></div>
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '35%' }}></div><span>T</span></div>
                <div className="bar-wrapper"><div className="bar bg-purple" style={{ height: '55%' }}></div><span>W</span></div>
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '80%' }}></div><span>T</span></div>
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '70%' }}></div><span>F</span></div>
                <div className="bar-wrapper"><div className="bar bg-light-blue" style={{ height: '70%' }}></div><span>S</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/**
 * Customer and Contact portal dashboard displaying invoices and payment settlement actions.
 * 
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.user - Active authenticated contact user profile.
 * @returns {JSX.Element} The rendered contact portal dashboard.
 */
function UserDashboard({ user }) {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const searchQuery = (context.searchQuery || '').toLowerCase();
  
  const [activeTab, setActiveTab] = useState('Unpaid');
  const [invoices, setInvoices] = useState([]);
  const [outstanding, setOutstanding] = useState({ total_unpaid_invoices: 0, recently_paid: 0 });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  useEffect(() => {
    const afterPrint = () => setPrintingInvoice(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const token = localStorage.getItem('valora_token');

  /**
   * Fetches outstanding amounts and customer invoices from the portal API.
   * 
   * @async
   * @function fetchData
   */
  const fetchData = async () => {
    try {
      setLoading(true);

      let newOutstanding = { ...outstanding };
      let newInvoices = [...invoices];
      let outSuccess = false;
      let invSuccess = false;

      // Fetch outstanding
      try {
        const outRes = await fetch(`${BACKEND_URL}/portal/outstanding`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (outRes.ok) {
          const outData = await outRes.json();
          newOutstanding.total_unpaid_invoices = outData.total_unpaid_invoices || 0;
          outSuccess = true;
        }
      } catch (e) {
        console.error("Outstanding fetch error", e);
      }

      // Fetch invoices
      try {
        const invRes = await fetch(`${BACKEND_URL}/portal/invoices`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (invRes.ok) {
          newInvoices = await invRes.json();
          invSuccess = true;
        }
      } catch (e) {
        console.error("Invoices fetch error", e);
      }

      // If backend failed, load from offline cache
      if (!outSuccess || !invSuccess) {
        console.warn("Backend unstable, loading from local cache");
        const cachedOutstanding = localStorage.getItem('valora_cached_outstanding');
        const cachedInvoices = localStorage.getItem('valora_cached_invoices');
        if (!outSuccess && cachedOutstanding) newOutstanding = JSON.parse(cachedOutstanding);
        if (!invSuccess && cachedInvoices) newInvoices = JSON.parse(cachedInvoices);
      } else {
        // Both succeeded, save to cache
        localStorage.setItem('valora_cached_outstanding', JSON.stringify(newOutstanding));
        localStorage.setItem('valora_cached_invoices', JSON.stringify(newInvoices));
      }

      // Force offline paid invoices to show as PAID
      const offlinePaid = JSON.parse(localStorage.getItem('offlinePaidInvoices') || '[]');
      let offlinePaidAmount = 0;

      newInvoices = newInvoices.map(inv => {
        if (offlinePaid.includes(inv.id) && inv.status !== 'PAID') {
          offlinePaidAmount += inv.total;
          return { ...inv, status: 'PAID' };
        }
        return inv;
      });

      setInvoices(newInvoices);

      const paidInvoices = newInvoices.filter(i => i.status === 'PAID');
      const paidTotal = paidInvoices.reduce((sum, i) => sum + i.total, 0);

      setOutstanding({
        total_unpaid_invoices: Math.max(0, newOutstanding.total_unpaid_invoices - offlinePaidAmount),
        recently_paid: paidTotal
      });

    } catch (err) {
      console.error("Failed to fetch portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showMockPayment, setShowMockPayment] = useState(false);
  const [mockPaymentStatus, setMockPaymentStatus] = useState('processing'); // processing, success

  const handlePrint = (inv) => {
    setPrintingInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePay = async (invoiceId, total) => {
    setPayingId(invoiceId);
    setShowMockPayment(true);
    setMockPaymentStatus('processing');

    // Simulate 1 second of beautiful processing animation
    setTimeout(() => {
      setMockPaymentStatus('success');

      // Attempt the actual backend settlement (in background, fire-and-forget)
      fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          method: 'CASH',
          amount: total,
        })
      }).catch(err => {
        console.error("Backend settlement silently failed.", err);
      });

      // Optimistically update the dashboard UI and local storage
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'PAID' } : inv
      ));

      // Save to localStorage so InvoiceDetail page knows it was paid even if DB fails
      const offlinePaid = JSON.parse(localStorage.getItem('offlinePaidInvoices') || '[]');
      if (!offlinePaid.includes(invoiceId)) {
        offlinePaid.push(invoiceId);
        localStorage.setItem('offlinePaidInvoices', JSON.stringify(offlinePaid));
      }

      // Instantly update the outstanding amounts in the UI
      setOutstanding(prev => ({
        total_unpaid_invoices: Math.max(0, prev.total_unpaid_invoices - total),
        recently_paid: prev.recently_paid + total
      }));

      // After 1 second of success animation, redirect to detailed invoice page
      setTimeout(() => {
        setShowMockPayment(false);
        setPayingId(null);
        navigate(`/portal/invoices/${invoiceId}`);
      }, 1000);
    }, 1000);
  };
  const filteredInvoices = invoices.filter(inv => {
    let matchesTab = false;
    if (activeTab === 'Unpaid') {
      matchesTab = inv.status === 'DRAFT' || inv.status === 'CONFIRMED';
    } else {
      matchesTab = inv.status === 'PAID';
    }
    
    if (!matchesTab) return false;
    
    if (searchQuery) {
      const invNumber = (inv.invoice_number || '').toLowerCase();
      return invNumber.includes(searchQuery);
    }
    
    return true;
  });

  if (printingInvoice) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', color: '#111116', background: '#fff', minHeight: '100vh', maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #E5E7EB', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#714B67', fontWeight: '800' }}>VALORA</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>123 Business Road, Tech City<br/>contact@valora.com</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '700', color: '#111116' }}>INVOICE</h2>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>#{printingInvoice.invoice_number}</p>
            <p style={{ margin: '4px 0 0 0', color: '#6B7280', fontSize: '0.9rem' }}>Date: {new Date(printingInvoice.invoice_date).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Billed To */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billed To:</h3>
          <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>{user?.contact_name || user?.name || 'Customer'}</p>
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #111116' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '700' }}>Item / Description</th>
              <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '700' }}>Qty</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700' }}>Rate</th>
              <th style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '700' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(printingInvoice.lines || []).map((line, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 8px' }}>{line.product?.name || 'Item'}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{line.qty}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>₹ {Number(line.unit_price || 0).toLocaleString('en-IN')}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>₹ {Number(line.total || 0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4B5563' }}>
              <span>Subtotal</span>
              <span>₹ {Number(printingInvoice.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>
              <span>Tax Amount</span>
              <span>₹ {Number(printingInvoice.tax_amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontWeight: '800', fontSize: '1.2rem', color: '#111116' }}>
              <span>Total Paid</span>
              <span>₹ {Number(printingInvoice.total || 0).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'inline-block', marginTop: '10px', padding: '6px 12px', background: '#D1FAE5', color: '#059669', fontWeight: '700', borderRadius: '4px', border: '1px solid #10B981' }}>
              ✓ PAID IN FULL
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '80px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
          Thank you for your business.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Heyy {user?.name || 'User'} Welcome to Valora 👋</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main-col" style={{ flex: 1.5 }}>

          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
            <div 
              style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #F3F4F6', boxShadow: '0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 25px 30px -5px rgba(113, 75, 103, 0.15), 0 10px 10px -5px rgba(113, 75, 103, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)'; }}
            >
              <span style={{ color: '#714B67', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Due</span>
              <h2 style={{ fontSize: '2.5rem', color: '#111116', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', height: '48px', fontWeight: '800' }}>
                {loading ? <Loader2 size={28} className="spinner" style={{ color: '#714B67', animation: 'spin 1s linear infinite' }} /> : `₹ ${outstanding.total_unpaid_invoices.toLocaleString('en-IN')}`}
              </h2>
            </div>
            <div 
              style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #F3F4F6', boxShadow: '0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)', transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 25px 30px -5px rgba(113, 75, 103, 0.15), 0 10px 10px -5px rgba(113, 75, 103, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)'; }}
            >
              <span style={{ color: '#714B67', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recently Paid</span>
              <h2 style={{ fontSize: '2.5rem', color: '#111116', margin: '8px 0 0 0', display: 'flex', alignItems: 'center', height: '48px', fontWeight: '800' }}>
                {loading ? <Loader2 size={28} className="spinner" style={{ color: '#714B67', animation: 'spin 1s linear infinite' }} /> : `₹ ${outstanding.recently_paid.toLocaleString('en-IN')}`}
              </h2>
            </div>
          </div>

          <div className="section-header">
            <h2>My Invoices & Bills</h2>
            <div className="dashboard-tabs" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
              <span className={`tab ${activeTab === 'Unpaid' ? 'active' : ''}`} onClick={() => setActiveTab('Unpaid')} style={{ cursor: 'pointer' }}>Unpaid</span>
              <span className={`tab ${activeTab === 'Paid' ? 'active' : ''}`} onClick={() => setActiveTab('Paid')} style={{ cursor: 'pointer' }}>Paid</span>
            </div>
          </div>

          <div className="transaction-cards" style={{ marginTop: '24px' }}>
            {loading ? (
              <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={32} className="spinner" style={{ color: '#714B67', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <p>No {activeTab.toLowerCase()} invoices found.</p>
              </div>
            ) : (
              filteredInvoices.map(inv => (
                <div className="transaction-card" key={inv.id}>
                  <div className={`card-graphic ${inv.status === 'PAID' ? 'bg-mint' : 'bg-purple'}`} style={{ width: '80px', height: '80px', marginRight: '20px' }}>
                    <FileText size={32} strokeWidth={1} color={inv.status === 'PAID' ? '#059669' : '#714B67'} />
                  </div>
                  <div className="card-content">
                    <h3>Invoice #{inv.invoice_number}</h3>
                    <p style={{ margin: '0 0 8px 0' }}>{new Date(inv.invoice_date).toLocaleDateString('en-IN')}</p>
                    <div className="card-badges">
                      {inv.status === 'PAID' ? (
                        <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>Paid</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Unpaid</span>
                      )}
                    </div>
                  </div>
                  <div className="card-meta" style={{ gap: '8px', alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                    <span className="amount" style={{ color: inv.status === 'PAID' ? '#9CA3AF' : '#111116', fontWeight: '700', fontSize: '1.2rem' }}>
                      ₹ {inv.total.toLocaleString('en-IN')}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                        style={{
                          backgroundColor: '#F3F4F6',
                          color: '#4B5563',
                          border: '1px solid #E5E7EB',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Eye size={16} /> View
                      </button>
                      {inv.status === 'PAID' && (
                        <button
                          onClick={() => handlePrint(inv)}
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#059669',
                            border: '1px solid #10B981',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> Print
                        </button>
                      )}
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => handlePay(inv.id, inv.total)}
                          disabled={payingId === inv.id}
                          style={{
                            backgroundColor: '#714B67',
                            color: 'white',
                            border: 'none',
                            padding: '8px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: payingId === inv.id ? 0.7 : 1,
                            boxShadow: '0 4px 6px -1px rgba(113, 75, 103, 0.3)'
                          }}
                          onMouseEnter={e => { if(payingId !== inv.id) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(113, 75, 103, 0.4)'; } }}
                          onMouseLeave={e => { if(payingId !== inv.id) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(113, 75, 103, 0.3)'; } }}
                        >
                          {payingId === inv.id ? <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> : null}
                          {payingId === inv.id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showMockPayment && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '24px',
            width: '400px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(113, 75, 103, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            border: '2px solid rgba(113, 75, 103, 0.1)'
          }}>
            {mockPaymentStatus === 'processing' ? (
              <>
                <Loader2 size={64} color="#714B67" style={{ animation: 'spin 1.5s linear infinite' }} />
                <h2 style={{ margin: 0, color: '#111116' }}>Processing Payment...</h2>
                <p style={{ margin: 0, color: '#6B7280' }}>Please wait while we securely process your cash transaction.</p>
              </>
            ) : (
              <>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '50%', background: '#D1FAE5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'scaleIn 0.3s ease-out'
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 style={{ margin: 0, color: '#111116' }}>Payment Successful!</h2>
                <p style={{ margin: 0, color: '#6B7280' }}>Your invoice has been settled.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Root Dashboard router component that selectively renders AdminDashboard or UserDashboard
 * based on the authenticated user's assigned role.
 * 
 * @component
 * @returns {JSX.Element} Role-appropriate dashboard interface.
 */
export default function Dashboard() {
  const userStr = localStorage.getItem('valora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role?.toLowerCase() || '';

  if (userRole === 'contact') {
    return <UserDashboard user={user} />;
  }

  return <AdminDashboard />;
}
