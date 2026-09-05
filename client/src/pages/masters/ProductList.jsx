import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import DataTable from '../../components/DataTable';
import FormShell from '../../components/FormShell';
import { api } from '../../api';

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '', type: 'Goods', category: '', salesPrice: '', cost: ''
  });

  const loadProducts = async () => {
    setIsLoading(true);
    const data = await api.getProducts();
    setProducts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    setIsSaving(true);
    try {
      const newProduct = await api.createProduct({
        ...formData,
        sales_price: Number(formData.salesPrice),
        cost: Number(formData.cost)
      });
      setProducts(prev => [...prev, newProduct]);
      setIsFormOpen(false);
      setFormData({ name: '', type: 'Goods', category: '', salesPrice: '', cost: '' });
    } catch (err) {
      alert(err.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

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
      <button 
        onClick={() => handleDelete(row.id)} 
        style={{ background: 'none', border: 'none', color: 'var(--valora-error)', cursor: 'pointer', padding: '4px' }}
        title="Delete Product"
      >
        <Trash2 size={16} />
      </button>
    )}
  ];

  if (isFormOpen) {
    return (
      <div className="page-content">
        <FormShell 
          title="New Product" 
          onSave={handleSave} 
          onCancel={() => setIsFormOpen(false)}
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
