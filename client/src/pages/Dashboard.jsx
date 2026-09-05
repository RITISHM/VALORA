import React from 'react';
import { Network, Activity, Sunrise, MoreHorizontal, FileText, ArrowRight } from 'lucide-react';
import '../styles/dashboard.css';

function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Hi, Admin 👋</h1>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col">
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <a href="#" className="see-all">See all <ArrowRight size={14} /></a>
          </div>
          
          <div className="dashboard-tabs">
            <span className="tab">All</span>
            <span className="tab">Sales</span>
            <span className="tab active">Purchases</span>
            <span className="tab">Journals</span>
          </div>

          <div className="transaction-cards">
            <div className="transaction-card">
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

            <div className="transaction-card">
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

            <div className="transaction-card">
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

        {/* Right Column */}
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
              <a href="#" className="see-all">See all <ArrowRight size={14} /></a>
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

function UserDashboard({ user }) {
  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Hi, {user?.name || 'User'} 👋</h1>
      </div>

      <div className="dashboard-grid">
        {/* Left Column (Main content) */}
        <div className="dashboard-main-col" style={{ flex: 1.5 }}>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Total Due</span>
              <h2 style={{ fontSize: '2rem', color: '#111116', margin: '8px 0 0 0' }}>₹ 14,500</h2>
            </div>
            <div style={{ flex: 1, backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #F3F4F6' }}>
              <span style={{ color: '#6B7280', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Recently Paid</span>
              <h2 style={{ fontSize: '2rem', color: '#111116', margin: '8px 0 0 0' }}>₹ 3,200</h2>
            </div>
          </div>

          <div className="section-header">
            <h2>My Invoices & Bills</h2>
            <div className="dashboard-tabs" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
              <span className="tab active">Unpaid</span>
              <span className="tab">Paid</span>
            </div>
          </div>

          <div className="transaction-cards" style={{ marginTop: '24px' }}>
            <div className="transaction-card">
              <div className="card-graphic bg-mint" style={{ width: '80px', height: '80px', marginRight: '20px' }}>
                <FileText size={32} strokeWidth={1} color="#017E84" />
              </div>
              <div className="card-content">
                <h3>Invoice #INV-2026-001</h3>
                <p style={{ margin: '0 0 8px 0' }}>Purchase of Office Chairs</p>
                <div className="card-badges">
                  <span className="badge" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>Unpaid</span>
                </div>
              </div>
              <div className="card-meta" style={{ gap: '16px', alignItems: 'flex-end' }}>
                <span className="amount" style={{ color: '#111116', fontWeight: '700', fontSize: '1.2rem' }}>₹ 14,500</span>
                <button className="primary-btn" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Pay Now</button>
              </div>
            </div>

            <div className="transaction-card">
              <div className="card-graphic bg-purple" style={{ width: '80px', height: '80px', marginRight: '20px' }}>
                <FileText size={32} strokeWidth={1} color="#714B67" />
              </div>
              <div className="card-content">
                <h3>Invoice #INV-2026-000</h3>
                <p style={{ margin: '0 0 8px 0' }}>Consulting Services</p>
                <div className="card-badges">
                  <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>Paid</span>
                </div>
              </div>
              <div className="card-meta" style={{ gap: '16px', alignItems: 'flex-end' }}>
                <span className="amount" style={{ color: '#9CA3AF', fontWeight: '700', fontSize: '1.2rem' }}>₹ 3,200</span>
                <button className="primary-btn" style={{ padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#F3F4F6', color: '#6B7280', opacity: 1, cursor: 'not-allowed' }}>Paid</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const userStr = localStorage.getItem('valora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role?.toLowerCase() || '';

  if (userRole === 'contact') {
    return <UserDashboard user={user} />;
  }

  return <AdminDashboard />;
}
