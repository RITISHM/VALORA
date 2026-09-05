/**
 * @file Notifications.jsx
 * @description System alerts and notification feeds view in Valora ERP.
 * Renders priority alerts such as upcoming vendor bill dues, budget threshold warnings,
 * and system platform update notices.
 * @module pages/Notifications
 */

import React from 'react';

/**
 * Notifications component displaying urgent workflow alerts and platform announcements.
 * 
 * @component
 * @returns {JSX.Element} Rendered notifications feed page.
 */
export default function Notifications() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Notifications</h1>
      </div>
      
      <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #F3F4F6', maxWidth: '800px' }}>
        <h2 style={{ marginBottom: '24px', fontSize: '1.2rem', color: '#111116' }}>Recent Alerts</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', backgroundColor: 'rgba(1, 126, 132, 0.1)', borderRadius: '12px', borderLeft: '4px solid #017E84' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#111116' }}>Vendor Bill Due Soon</h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Bill #1024 for Azure Furniture is due in 3 days.</p>
          </div>
          
          <div style={{ padding: '16px', backgroundColor: 'rgba(212, 98, 67, 0.1)', borderRadius: '12px', borderLeft: '4px solid #D46243' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#111116' }}>Budget Exceeded Warning</h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Marketing Expenses have exceeded 90% of the allocated Q2 budget.</p>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '12px', borderLeft: '4px solid #9CA3AF' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#111116' }}>System Update</h3>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.9rem' }}>Valora was updated to version 1.2 successfully.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
