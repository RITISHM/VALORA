import React from 'react';
import { TrendingUp, FileText, IndianRupee, Users } from 'lucide-react';
import '../styles/dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper sales">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Sales (MTD)</span>
            <span className="stat-value">₹ 1,24,500</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purchases">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Purchases (MTD)</span>
            <span className="stat-value">₹ 86,200</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bank">
            <IndianRupee size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Bank Balance</span>
            <span className="stat-value">₹ 4,50,000</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper contacts">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Contacts</span>
            <span className="stat-value">42</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="recent-activity-card">
          <h3>Recent Journal Entries</h3>
          <div className="empty-state">
            <p>No recent activity found. Once you create transactions, they will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
