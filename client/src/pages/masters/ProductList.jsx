import React, { useState, useEffect } from 'react';
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
    await api.createProduct({
      ...formData,
      salesPrice: Number(formData.salesPrice),
      cost: Number(formData.cost)
    });
    setIsSaving(false);
    setIsFormOpen(false);
    setFormData({ name: '', type: 'Goods', category: '', salesPrice: '', cost: '' });
    loadProducts();
  };

  const columns = [
    { header: 'Product Name', accessor: 'name' },
    { header: 'Type', accessor: 'type' },
    { header: 'Category', accessor: 'category' },
    { header: 'Sales Price', render: (row) => `₹ ${Number(row.salesPrice).toLocaleString()}` },
    { header: 'Cost', render: (row) => `₹ ${Number(row.cost).toLocaleString()}` }
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
