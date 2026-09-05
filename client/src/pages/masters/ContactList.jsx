/**
 * @file ContactList.jsx
 * @description Master data view for managing business contacts (Vendors and Customers) and system users.
 * Provides full CRUD capabilities: list view with filtering via DataTable,
 * inline modal/shell creation, record editing, and optimistic deletion.
 * @module pages/masters/ContactList
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Pencil, Users, Building2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api, BACKEND_URL } from '../../api';

export default function ContactList() {
  const userStr = localStorage.getItem('valora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAccountant = user?.role?.toLowerCase() === 'accountant';

  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  
  const [userFormData, setUserFormData] = useState({
    name: '', login_id: '', email: '', password: '', role: 'ACCOUNTANT', contact_id: ''
  });

  const [formData, setFormData] = useState({
    name: '', type: 'Customer', email: '', mobile: '', city: '', state: ''
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
      const cData = await api.getContacts();
      setContacts(cData);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- CONTACT LOGIC ---
  const handleSaveContact = async () => {
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

  const handleEditContact = (row) => {
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

  const handleDeleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      const previousContacts = [...contacts];
      setContacts(prev => prev.filter(c => c.id !== id));
      try {
        await api.deleteContact(id);
      } catch (err) {
        setContacts(previousContacts);
        alert(err.message || 'Failed to delete contact');
      }
    }
  };

  // --- USER LOGIC ---
  const handleSaveUser = async () => {
    if (!userFormData.name || !userFormData.email) return alert('Name and Email are required');
    if (!editingUserId && (!userFormData.login_id || !userFormData.password)) {
      return alert('Login ID and Password are required for new users');
    }
    if (userFormData.role === 'CONTACT' && !userFormData.contact_id) {
      return alert('Please link a Vendor profile for this user.');
    }
    
    setIsSaving(true);
    try {
      const payload = { ...userFormData };
      if (payload.role !== 'CONTACT') delete payload.contact_id;

      if (editingUserId) {
        delete payload.password; // Do not send password on update
        delete payload.login_id; // Do not update login ID
        
        const updatedUser = await api.updateUser(editingUserId, payload);
        setUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));
        alert('User updated successfully!');
      } else {
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
          throw new Error(data.error || 'Failed to create user');
        }
        setUsers(prev => [...prev, data.user]);
        alert('User created successfully!');
      }
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = (row) => {
    setUserFormData({
      name: row.name || '',
      login_id: row.login_id || '',
      email: row.email || '',
      password: '',
      role: row.role || 'ACCOUNTANT',
      contact_id: row.contact_id || ''
    });
    setEditingUserId(row.id);
    setIsUserFormOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const previousUsers = [...users];
      setUsers(prev => prev.filter(u => u.id !== id));
      try {
        await api.deleteUser(id);
      } catch (err) {
        setUsers(previousUsers);
        alert(err.message || 'Failed to delete user');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsUserFormOpen(false);
    setEditingId(null);
    setEditingUserId(null);
    setFormData({ name: '', type: 'Customer', email: '', mobile: '', city: '', state: '' });
    setUserFormData({ name: '', login_id: '', email: '', password: '', role: 'ACCOUNTANT', contact_id: '' });
  };

  const contactColumns = [
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
    ...(!isAccountant ? [{
      header: 'Actions', render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => handleEditContact(row)} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
            title="Edit Contact"
          >
            <Pencil size={16} />
          </button>
          <button 
            onClick={() => handleDeleteContact(row.id)} 
            style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
            title="Delete Contact"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }] : [])
  ];

  const userColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Login ID', accessor: 'login_id' },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', render: (row) => (
      <span style={{ 
        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600',
        backgroundColor: row.role === 'ADMIN' ? '#FEE2E2' : row.role === 'ACCOUNTANT' ? '#E0E7FF' : '#F3F4F6',
        color: row.role === 'ADMIN' ? '#991B1B' : row.role === 'ACCOUNTANT' ? '#3730A3' : '#374151'
      }}>{row.role}</span>
    )},
    { header: 'Linked Contact', render: (row) => {
      if (row.role !== 'CONTACT') return <span style={{ color: '#9CA3AF' }}>N/A</span>;
      const contact = contacts.find(c => c.id === row.contact_id);
      return contact ? contact.name : <span style={{ color: 'var(--valora-error)' }}>Unknown</span>;
    }},
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => handleEditUser(row)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
          title="Edit User"
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={() => handleDeleteUser(row.id)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
          title="Delete User"
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
          onSave={handleSaveContact} 
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

  if (isUserFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title={editingUserId ? "Edit User" : "New User"} 
          onSave={handleSaveUser} 
          onCancel={handleCloseForm} 
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Name *</label>
              <input value={userFormData.name} onChange={e => setUserFormData({...userFormData, name: e.target.value})} placeholder="e.g. Jane Doe" required />
            </div>
            <div className="form-field">
              <label>Role</label>
              <select value={userFormData.role} onChange={e => setUserFormData({...userFormData, role: e.target.value})}>
                <option value="ADMIN">Administrator</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="CONTACT">Vendor/Customer Portal User</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Login ID {editingUserId ? '' : '*'}</label>
              <input 
                value={userFormData.login_id} 
                onChange={e => setUserFormData({...userFormData, login_id: e.target.value})} 
                placeholder={editingUserId ? "Cannot change Login ID" : "Assign a unique Login ID"} 
                disabled={!!editingUserId}
                required={!editingUserId} 
              />
            </div>
            <div className="form-field">
              <label>Email Address *</label>
              <input type="email" value={userFormData.email} onChange={e => setUserFormData({...userFormData, email: e.target.value})} placeholder="Required email address" required />
            </div>
          </div>
          {!editingUserId && (
            <div className="form-row">
              <div className="form-field">
                <label>Initial Password *</label>
                <input type="password" value={userFormData.password} onChange={e => setUserFormData({...userFormData, password: e.target.value})} placeholder="Must include upper, lower, number, special char" required />
              </div>
            </div>
          )}
          {userFormData.role === 'CONTACT' && (
            <div className="form-row">
              <div className="form-field">
                <label>Link to Vendor/Customer Profile *</label>
                <select value={userFormData.contact_id} onChange={e => setUserFormData({...userFormData, contact_id: e.target.value})} required>
                  <option value="">Select Contact...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 className="page-title">Contacts & Users</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="submit-btn" onClick={() => setIsUserFormOpen(true)} style={{ width: 'auto', padding: '10px 16px', borderRadius: '8px', backgroundColor: 'var(--valora-text-main)' }}>
            + Add User
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading data...</div>
      ) : (
        <>
          <DataTable 
            title="Contact" 
            columns={contactColumns} 
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
                    {!isAccountant && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleEditContact(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--valora-primary)' }}><Pencil size={14}/></button>
                        <button onClick={() => handleDeleteContact(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--valora-error)' }}><Trash2 size={14}/></button>
                      </div>
                    )}
                  </div>
                  <p style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: 'var(--valora-text-muted)' }}>{item.email || 'No email'}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--valora-text-muted)' }}>{item.mobile || 'No mobile'}</p>
                </div>
              </div>
            )}
          />

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>System Users</h3>
            <DataTable 
              title="User" 
              columns={userColumns} 
              data={users} 
              searchPlaceholder="Search users..."
            />
          </div>
        </>
      )}
    </div>
  );
}
