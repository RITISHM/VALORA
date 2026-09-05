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
  ChevronDown, ShoppingBag, ShoppingCart, BookOpen, PieChart, Layers, Tag, DollarSign, ListFilter, Users, Package, FileText, BarChart3, ArrowRight, Network, Activity, Sunrise, Loader2
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [activeTab, setActiveTab] = useState('Unpaid');
  const [invoices, setInvoices] = useState([]);
  const [outstanding, setOutstanding] = useState({ total_unpaid_invoices: 0, recently_paid: 0 });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);

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
      const outRes = await fetch(`${BACKEND_URL}/portal/outstanding`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (outRes.ok) {
        const outData = await outRes.json();
        setOutstanding(prev => ({ ...prev, total_unpaid_invoices: outData.total_unpaid_invoices || 0 }));
      }

      const invRes = await fetch(`${BACKEND_URL}/portal/invoices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData);
        const paidInvoices = invData.filter(i => i.status === 'PAID');
        const paidTotal = paidInvoices.reduce((sum, i) => sum + i.total, 0);
        setOutstanding(prev => ({ ...prev, recently_paid: paidTotal }));
      }
    } catch (err) {
      console.error("Failed to fetch portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

<<<<<<< HEAD
  // Helper to dynamically load the Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  /**
   * Initiates invoice payment via real Razorpay API
   */
  const handlePay = async (invoiceId, total) => {
    try {
      setPayingId(invoiceId);

      const resLoad = await loadRazorpayScript();
      if (!resLoad) {
        alert('Razorpay SDK failed to load. Are you online?');
        setPayingId(null);
        return;
      }

      // 1. Fetch Order ID from backend
      const orderRes = await fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!orderRes.ok) {
        const errText = await orderRes.text();
        alert(`Failed to create Razorpay order: ${errText}`);
        setPayingId(null);
        return;
      }

      const orderData = await orderRes.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.key_id, 
        amount: orderData.amount, 
        currency: 'INR',
        name: 'Valora ERP',
        description: `Payment for Invoice #${invoiceId}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2953/2953363.png',
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const res = await fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/pay`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                method: 'BANK', 
                amount: total, 
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature
              })
            });
            if (res.ok) {
              await fetchData();
            } else {
              const errorText = await res.text();
              alert(`Backend settlement failed after payment: ${errorText}`);
            }
          } catch (err) {
            console.error(err);
            alert("Error settling invoice.");
          } finally {
            setPayingId(null);
          }
        },
        prefill: {
          name: user?.name || 'Valora Customer',
          email: user?.email || 'customer@valora.com',
          contact: '9999999999'
        },
        theme: {
          color: '#017E84'
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response){
        alert(`Payment Failed! Reason: ${response.error.description}`);
        setPayingId(null);
      });

      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert("Error initiating Razorpay checkout");
      setPayingId(null);
    }
  };

=======
>>>>>>> acf701bdc20e188c41d698a1e108fdabc3d8cbc8
  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'Unpaid') {
      return inv.status === 'DRAFT' || inv.status === 'CONFIRMED';
    } else {
      return inv.status === 'PAID';
    }
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Heyy {user?.name || 'User'} Welcome to Valora 👋</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main-col" style={{ flex: 1.5 }}>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Due</span>
              <h2 style={{ fontSize: '2rem', color: '#111116', margin: '8px 0 0 0' }}>₹ {outstanding.total_unpaid_invoices.toLocaleString('en-IN')}</h2>
            </div>
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Recently Paid</span>
              <h2 style={{ fontSize: '2rem', color: '#111116', margin: '8px 0 0 0' }}>₹ {outstanding.recently_paid.toLocaleString('en-IN')}</h2>
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
                <Loader2 size={32} className="spinner" style={{ color: '#017E84', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <p>No {activeTab.toLowerCase()} invoices found.</p>
              </div>
            ) : (
              filteredInvoices.map(inv => (
                <div className="transaction-card" key={inv.id}>
                  <div className={`card-graphic ${inv.status === 'PAID' ? 'bg-purple' : 'bg-mint'}`} style={{ width: '80px', height: '80px', marginRight: '20px' }}>
                    <FileText size={32} strokeWidth={1} color={inv.status === 'PAID' ? '#714B67' : '#017E84'} />
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
                  <div className="card-meta" style={{ gap: '16px', alignItems: 'flex-end' }}>
                    <span className="amount" style={{ color: inv.status === 'PAID' ? '#9CA3AF' : '#111116', fontWeight: '700', fontSize: '1.2rem' }}>
                      ₹ {inv.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
