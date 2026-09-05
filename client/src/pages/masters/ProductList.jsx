/**
 * @file ProductList.jsx
 * @description Master Product Management component for Valora ERP.
 * Provides a searchable data grid of all catalog products (Goods, Services, Combos)
 * along with modal/drawer forms for creating, editing, and deleting products.
 * @module pages/masters/ProductList
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

/**
 * ProductList Component
 * 
 * Renders the product catalog management interface with real-time data table,
 * creation/edit form toggle, and optimistic deletion handling.
 * 
 * @component
 * @returns {JSX.Element} The rendered ProductList master interface.
 */
export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '', type: 'Goods', category: '', salesPrice: '', cost: ''
  });

  /**
   * Fetches the latest product catalog from the backend API or mock store.
   * Updates component loading state and sets the product list.
   * 
   * @async
   * @function loadProducts
   * @returns {Promise<void>} Resolves when state is updated.
   */
  const loadProducts = async () => {
    setIsLoading(true);
    const data = await api.getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  /**
   * Validates and submits the product form data to the backend.
   * Handles both creation of new products and updating existing products.
   * 
   * @async
   * @function handleSave
   * @returns {Promise<void>} Resolves when save operation completes and form closes.
   */
  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        sales_price: Number(formData.salesPrice),
        cost: Number(formData.cost)
      };
      
      if (editingId) {
        const updatedProduct = await api.updateProduct(editingId, payload);
        setProducts(prev => prev.map(p => p.id === editingId ? updatedProduct : p));
      } else {
        const newProduct = await api.createProduct(payload);
        setProducts(prev => [...prev, newProduct]);
      }
      handleCloseForm();
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Populates the form state with selected product data and opens the edit form.
   * 
   * @function handleEdit
   * @param {Object} row - The product record to edit.
   * @param {number|string} row.id - Product unique identifier.
   * @param {string} [row.name] - Product name.
   * @param {string} [row.type] - Product type (e.g. 'Goods', 'Service', 'Combo').
   * @param {string} [row.category] - Product category.
   * @param {number|string} [row.sales_price] - Selling price.
   * @param {number|string} [row.cost] - Cost price.
   * @returns {void}
   */
  const handleEdit = (row) => {
    setFormData({
      name: row.name || '',
      type: row.type || 'Goods',
      category: row.category || '',
      salesPrice: row.sales_price || '',
      cost: row.cost || ''
    });
    setEditingId(row.id);
    setIsFormOpen(true);
  };

  /**
   * Resets the form state, clears editing identifiers, and closes the form dialog.
   * 
   * @function handleCloseForm
   * @returns {void}
   */
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', type: 'Goods', category: '', salesPrice: '', cost: '' });
  };

  /**
   * Prompts user for confirmation and deletes a product record with optimistic UI rollback.
   * 
   * @async
   * @function handleDelete
   * @param {number|string} id - Identifier of the product to delete.
   * @returns {Promise<void>} Resolves after deletion request and state synchronization.
   */
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const previousProducts = [...products];
      // Optimistically remove from UI
      setProducts(prev => prev.filter(p => p.id !== id));
      try {
        await api.deleteProduct(id);
      } catch (err) {
        // Rollback on error
        setProducts(previousProducts);
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  const columns = [
    { header: 'Product Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Category', accessor: 'category' },
    { header: 'Sales Price', render: (row) => `₹ ${Number(row.sales_price || 0).toLocaleString()}` },
    { header: 'Cost', render: (row) => `₹ ${Number(row.cost || 0).toLocaleString()}` },
    { header: 'Actions', render: (row) => (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => handleEdit(row)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-primary)', cursor: 'pointer', padding: '4px' }}
          title="Edit Product"
        >
          <Pencil size={16} />
        </button>
        <button 
          onClick={() => handleDelete(row.id)} 
          style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
          title="Delete Product"
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
          title={editingId ? "Edit Product" : "New Product"} 
          onSave={handleSave} 
          onCancel={handleCloseForm}
          isSaving={isSaving}
        >
          <div className="form-row">
            <div className="form-field">
              <label>Product Name *</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="E.g. Office Desk" required />
            </div>
            <div className="form-field">
              <label>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option>Goods</option>
                <option>Service</option>
                <option>Combo</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Category</label>
              <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="E.g. Furniture" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Sales Price (₹)</label>
              <input type="number" value={formData.salesPrice} onChange={e => setFormData({...formData, salesPrice: e.target.value})} placeholder="0.00" />
            </div>
            <div className="form-field">
              <label>Cost / Purchase Price (₹)</label>
              <input type="number" value={formData.cost} onChange={e => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
            </div>
          </div>
        </FormShell>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ padding: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Products</h1>
      </div>
      {isLoading ? (
        <p>Loading products...</p>
      ) : (
        <DataTable 
          title="Product" 
          columns={columns} 
          data={products} 
          onNewClick={() => setIsFormOpen(true)} 
          searchPlaceholder="Search products..."
        />
      )}
    </div>
  );
}
