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
import { api } from '../../api';

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
    setEditingId(null);
    setFormData({ name: '', type: 'Customer', email: '', mobile: '', city: '', state: '' });
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
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
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
        />
      )}
    </div>
  );
}
