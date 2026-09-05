import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>
      
      <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '16px', border: '1px solid #F3F4F6', maxWidth: '800px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        
        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#EBF0FA', color: '#714B67', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '800' }}>
          A
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#111116' }}>Admin User</h2>
            <span style={{ color: '#714B67', fontWeight: '600', backgroundColor: 'rgba(113, 75, 103, 0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>Administrator</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Email Address</span>
            <span style={{ color: '#111116', fontWeight: '600' }}>admin@valora.com</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Phone Number</span>
            <span style={{ color: '#111116', fontWeight: '600' }}>+91 98765 43210</span>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
            <button className="primary-btn">Edit Profile</button>
            <button 
              onClick={handleLogout}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--valora-error)', color: 'var(--valora-error)', background: 'none', cursor: 'pointer', fontWeight: '600' }}
            >
              Sign Out
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
