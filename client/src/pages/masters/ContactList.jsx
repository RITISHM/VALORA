/**
 * @file ContactList.jsx
 * @description Master data view for managing business contacts (Vendors and Customers).
 * Provides full CRUD capabilities: list view with filtering via DataTable,
 * inline modal/shell creation, record editing, and optimistic deletion.
 * @module pages/masters/ContactList
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api, BACKEND_URL } from '../../api';

/**
 * Contact management view component.
 * 
 * @component
 * @returns {JSX.Element} Contact master data view or creation/edit form shell.
 */
export default function ContactList() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '', login_id: '', email: '', password: '', role: 'ACCOUNTANT', contact_id: ''
  });

  const [formData, setFormData] = useState({
    name: '', type: 'Customer', email: '', mobile: '', city: '', state: ''
  });

  /**
   * Fetches all registered contacts from the backend API.
   * 
   * @async
   * @function loadContacts
   */
  const loadContacts = async () => {
    setIsLoading(true);
    const data = await api.getContacts();
    setContacts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadContacts();
  }, []);

  /**
   * Persists new or updated contact record via backend API.
   * 
   * @async
   * @function handleSave
   */
  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setIsSaving(true);
    try {
      if (editingId) {
        const updatedContact = await api.updateContact(editingId, formData);
        setContacts(prev => prev.map(c => c.id === editingId ? updatedContact : c));
      } else {
        const newContact = await api.createContact(formData);
        setContacts(prev => [...prev, newContact]);
      }
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Pre-fills form fields and opens form shell for editing an existing contact.
   * 
   * @function handleEdit
   * @param {Object} row - Target contact record to edit.
   */
  const handleEdit = (row) => {
    setFormData({
      name: row.name || '',
      type: row.type || 'Customer',
      email: row.email || '',
      mobile: row.mobile || '',
      city: row.city || '',
      state: row.state || ''
    });
    setEditingId(row.id);
    setIsFormOpen(true);
  };

  /**
   * Resets form state and closes the editing FormShell.
   * 
   * @function handleCloseForm
   */
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsUserFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Customer', email: '', mobile: '', city: '', state: '' });
    setUserFormData({ name: '', login_id: '', email: '', password: '', role: 'ACCOUNTANT', contact_id: '' });
  };

  const handleSaveUser = async () => {
    if (!userFormData.name || !userFormData.login_id || !userFormData.password || !userFormData.email) return alert('Name, Login ID, Email, and Password are required');
    if (userFormData.role === 'CONTACT' && !userFormData.contact_id) return alert('Please link a Vendor profile for this user.');
    setIsSaving(true);
    try {
      const payload = { ...userFormData };
      if (payload.role !== 'CONTACT') delete payload.contact_id; // Clean payload

      const response = await fetch(`${BACKEND_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        if (Array.isArray(data.error)) {
          throw new Error(data.error.map(e => `${e.path ? e.path.join('.') + ': ' : ''}${e.message}`).join(' | '));
        }
        throw new Error(data.error || 'Failed to create system user');
      }
      alert('System user created successfully!');
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to create system user');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Removes a contact with optimistic UI update and server rollback on failure.
   * 
   * @async
   * @function handleDelete
   * @param {string|number} id - Identifier of contact to delete.
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const previousContacts = [...contacts];
      // Optimistically remove from UI
      setContacts(prev => prev.filter(c => c.id !== id));
      try {
        await api.deleteContact(id);
      } catch (err) {
        // Rollback on error
        setContacts(previousContacts);
        alert(err.message || 'Failed to delete contact');
      }
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', render: (row) => (
      <span style={{ 
        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem',
        backgroundColor: row.type === 'Customer' ? 'rgba(25, 135, 84, 0.1)' : 'rgba(113, 75, 103, 0.1)',
        color: row.type === 'Customer' ? 'var(--valora-success)' : 'var(--valora-primary)'
      }}>{row.type}</span>
    )},
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'Location', render: (row) => `${row.city || ''} ${row.state ? ', ' + row.state : ''}` },
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => handleEdit(row)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
          title="Edit Contact"
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={() => handleDelete(row.id)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
          title="Delete Contact"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )}
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title={editingId ? "Edit Contact" : "New Contact"} 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Azure Furniture" required />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option>Customer</option>
                <option>Vendor</option>
                <option>Both</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@example.com" />
            </div>
            <div className="form-field">
              <label>Mobile</label>
              <input value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} placeholder="Phone number" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>City</label>
              <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" />
            </div>
            <div className="form-field">
              <label>State</label>
              <input value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="State" />
            </div>
          </div>
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      {isUserFormOpen ? (
        <FormShell title="New System User" onSave={handleSaveUser} onCancel={handleCloseForm} isSaving={isSaving}>
          <div className="form-row">
            <div className="form-field">
              <label>Name *</label>
              <input value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} placeholder="e.g. Jane Doe" required />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="CONTACT">Vendor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Login ID *</label>
              <input value={userFormData.login_id} onChange={e => setUserFormData({...userFormData, login_id: e.target.value})} placeholder="Assign a unique Login ID" required />
            </div>
            <div className="form-field">
              <label>Email Address *</label>
              <input type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} placeholder="Required email address" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Initial Password *</label>
              <input type="password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Must include upper, lower, number, special char" required />
            </div>
            {userFormData.role === 'CONTACT' ? (
              <div className="form-field">
                <label>Link to Vendor Profile *</label>
                <select value={userFormData.contact_id} onChange={e => setUserFormData({...userFormData, contact_id: e.target.value})} required>
                  <option value="">Select Vendor...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-field"></div>
            )}
          </div>
        </FormShell>
      ) : (
      <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Contacts & Users</h1>
        <button className="submit-btn" onClick={() => setIsUserFormOpen(true)} style={{ width: 'auto', padding: '10px 16px', borderRadius: '8px' }}>
          + Add System User
        </button>
      </div>
      {isLoading ? (
        <p>Loading contacts...</p>
      ) : (
        <DataTable 
          title="Contact" 
          columns={columns} 
          data={contacts} 
          onNewClick={() => setIsFormOpen(true)} 
          searchPlaceholder="Search contacts..."
          enableKanban={true}
          renderKanbanCard={(item) => (
            <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '8px', backgroundColor: 'var(--valora-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--valora-primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {item.name ? item.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--valora-text-main)' }}>{item.name}</h4>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--valora-primary)' }}><Pencil size={14}/></button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--valora-error)' }}><Trash2 size={14}/></button>
                  </div>
                </div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: 'var(--valora-text-muted)' }}>{item.email || 'No email'}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--valora-text-muted)' }}>{item.mobile || 'No mobile'}</p>
              </div>
            </div>
          )}
        />
      )}
      </>
      )}
    </div>
  );
}
