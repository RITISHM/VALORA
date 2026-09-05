import React, { useState } from 'react';
import { Store, Upload, CheckCircle } from 'lucide-react';
import { BACKEND_URL } from '../../api';
import '../../styles/dashboard.css';

export default function VendorProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '1',
    description: '',
    sales_price: '',
    cost_price: '',
    type: 'PRODUCT',
    image: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('valora_token');
      const payload = {
        ...formData,
        category_id: parseInt(formData.category_id),
        sales_price: parseFloat(formData.sales_price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
      };

      const res = await fetch(`${BACKEND_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          name: '', category_id: '1', description: '', sales_price: '', cost_price: '', type: 'PRODUCT', image: ''
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert('Failed to upload product. Check permissions.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="dashboard-greeting">
        <h1>Vendor Portal</h1>
        <p style={{ color: '#6B7280', marginTop: '8px' }}>Enter your product details to list it on the marketplace.</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #F3F4F6', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ padding: '12px', backgroundColor: '#F0F9FF', borderRadius: '12px' }}>
            <Store size={24} color="#0369A1" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add New Product</h2>
            <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>This will be visible to all customers instantly.</span>
          </div>
        </div>

        {success && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '8px', marginBottom: '24px' }}>
            <CheckCircle size={20} />
            Product successfully listed on the marketplace!
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Product Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g. Premium Ergonomic Chair"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Category ID</label>
              <input 
                type="number" 
                name="category_id" 
                value={formData.category_id} 
                onChange={handleChange} 
                required 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Selling Price (₹)</label>
              <input 
                type="number" 
                name="sales_price" 
                value={formData.sales_price} 
                onChange={handleChange} 
                required 
                placeholder="0.00"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Short Description</label>
            <textarea 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              rows="3"
              placeholder="Describe the product for the customer..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', resize: 'vertical' }} 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>Image URL</label>
            <input 
              type="url" 
              name="image" 
              value={formData.image} 
              onChange={handleChange} 
              placeholder="https://images.unsplash.com/..."
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none' }} 
            />
            <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '4px' }}>Leave blank to use a default placeholder image.</p>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button 
              type="submit" 
              disabled={loading}
              className="primary-btn" 
              style={{ width: '100%', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1rem' }}
            >
              <Upload size={20} />
              {loading ? 'Publishing...' : 'Publish to Marketplace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
