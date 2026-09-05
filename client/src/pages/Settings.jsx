/**
 * @file Settings.jsx
 * @description System Preferences and Configuration page for Valora ERP.
 * Displays general company profile information (legal name, base accounting currency, fiscal year end)
 * and provides navigation to administrative user provisioning.
 * @module pages/Settings
 */

import React from 'react';

/**
 * Settings component displaying organization-wide configuration and administrative links.
 * 
 * @component
 * @returns {JSX.Element} The rendered settings page.
 */
export default function Settings() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>
      
      <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #F3F4F6', maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', color: '#111116' }}>General Preferences</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111116' }}>Company Name</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>The legal name of your business.</p>
            </div>
            <span style={{ color: '#111116', fontWeight: '600' }}>Valora Furniture Ltd.</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6', paddingBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111116' }}>Currency</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>The base currency for all accounting.</p>
            </div>
            <span style={{ color: '#111116', fontWeight: '600' }}>INR (₹)</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#111116' }}>Fiscal Year End</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>When your financial year closes.</p>
            </div>
            <span style={{ color: '#111116', fontWeight: '600' }}>March 31</span>
          </div>
        </div>

        <button className="primary-btn" style={{ marginTop: '32px' }}>Save Changes</button>
      </div>

      {/* User Provisioning & Administration */}
      <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #F3F4F6', maxWidth: '800px', marginTop: '24px' }}>
        <h2 style={{ marginBottom: '8px', fontSize: '1.2rem', color: '#111116' }}>User Provisioning & Roles</h2>
        <p style={{ margin: '0 0 20px 0', color: '#6B7280', fontSize: '0.9rem' }}>
          Create system users and assign operational privileges (Administrator, Accountant, Standard User).
        </p>
        
        <a
          href="/admin/create-user"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--valora-primary, #714B67)',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.9rem',
            transition: 'opacity 0.2s',
          }}
        >
          + Create New User (Admin Form)
        </a>
      </div>
    </div>
  );
}
