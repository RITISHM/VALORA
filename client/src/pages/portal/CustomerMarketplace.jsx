import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter } from 'lucide-react';
import { BACKEND_URL } from '../../api';
import { useCartStore } from '../../store/useCartStore';
import '../../styles/dashboard.css';

export default function CustomerMarketplace() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  
  const addToCart = useCartStore(state => state.addToCart);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('valora_token');
      // For now, if the backend route isn't open, we will use mock data as fallback
      const res = await fetch(`${BACKEND_URL}/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        // Fallback to mock data if backend doesn't allow CONTACT to fetch yet
        setProducts([
          { id: 1, name: 'Ergonomic Office Chair', category_id: 1, sales_price: 12500, description: 'Premium mesh back office chair with lumbar support.', image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=400' },
          { id: 2, name: 'Standing Desk Pro', category_id: 2, sales_price: 35000, description: 'Dual motor adjustable height standing desk.', image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?auto=format&fit=crop&q=80&w=400' },
          { id: 3, name: 'Mechanical Keyboard', category_id: 3, sales_price: 8500, description: 'Wireless mechanical keyboard with tactile switches.', image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=400' },
          { id: 4, name: 'Noise Cancelling Headphones', category_id: 4, sales_price: 18000, description: 'Over-ear headphones with active noise cancellation.', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=400' }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Browse Products</h1>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="header-search" style={{ margin: 0, backgroundColor: 'white' }}>
            <Search size={16} color="#9CA3AF" />
            <input type="text" placeholder="Search products..." style={{ border: 'none', outline: 'none', marginLeft: '8px' }} />
          </div>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', outline: 'none', backgroundColor: 'white' }}
          >
            <option value="All">All Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '24px', 
        marginTop: '24px' 
      }}>
        {products.map(product => (
          <div key={product.id} style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            border: '1px solid #F3F4F6',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ height: '200px', width: '100%', overflow: 'hidden' }}>
              <img 
                src={product.image || 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=400'} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#111116' }}>{product.name}</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#6B7280', flex: 1 }}>
                {product.description || 'No description available for this product.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111116' }}>
                  ₹{Number(product.sales_price).toLocaleString('en-IN')}
                </span>
                <button 
                  onClick={() => handleAddToCart(product)}
                  className="primary-btn" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px' }}
                >
                  <ShoppingCart size={16} />
                  Add
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
