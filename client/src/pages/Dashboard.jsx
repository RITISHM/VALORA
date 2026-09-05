import React from 'react';
import { Network, Activity, Sunrise, MoreHorizontal, FileText, ArrowRight } from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Hi, Admin User 👋</h1>
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
            {/* Card 1 */}
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

            {/* Card 2 */}
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

            {/* Card 3 */}
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
