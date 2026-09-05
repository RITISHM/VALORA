/**
 * @file Profile.jsx
 * @description User Profile management view in Valora ERP.
 * Displays user identity details (name, initials avatar, role badge, email address)
 * and allows in-place editing of the user's display name with backend persistence.
 * @module pages/Profile
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../api';
import { Loader2 } from 'lucide-react';

/**
 * Profile component for inspecting and updating authenticated user profile attributes.
 * 
 * @component
 * @returns {JSX.Element} Rendered profile details and inline edit form.
 */
export default function Profile() {
  const navigate = useNavigate();

  const userStr = localStorage.getItem('valora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  /**
   * Persists modified user display name to backend /auth/me endpoint and updates localStorage.
   * 
   * @async
   * @function handleSave
   */
  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name cannot be empty');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('valora_token');
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local storage
        localStorage.setItem('valora_user', JSON.stringify(data.user));
        setIsEditing(false);
        // Force a reload or state update to reflect changes across the app, specifically the layout avatar
        window.location.reload();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Update failed'}`);
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };
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
          {initials}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            {isEditing ? (
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                style={{ fontSize: '1.5rem', fontWeight: 'bold', padding: '8px', borderRadius: '8px', border: '1px solid #D1D5DB', marginBottom: '8px', width: '100%', maxWidth: '300px' }}
              />
            ) : (
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', color: '#111116' }}>{user?.name || 'Unknown User'}</h2>
            )}
            <br />
            <span style={{ color: '#714B67', fontWeight: '600', backgroundColor: 'rgba(113, 75, 103, 0.1)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', textTransform: 'capitalize', display: 'inline-block', marginTop: '4px' }}>
              {user?.role ? user.role.toLowerCase() : 'No Role'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ color: '#6B7280', fontSize: '0.9rem' }}>Email Address</span>
            <span style={{ color: '#111116', fontWeight: '600' }}>{user?.email || 'N/A'}</span>
            {isEditing && <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>(Email cannot be changed)</span>}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            {isEditing ? (
              <>
                <button className="primary-btn" onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loading && <Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />}
                  Save Changes
                </button>
                <button onClick={() => { setIsEditing(false); setName(user?.name || ''); }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #D1D5DB', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#374151' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button className="primary-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                <button 
                  onClick={handleLogout}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--valora-error)', color: 'var(--valora-error)', background: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
