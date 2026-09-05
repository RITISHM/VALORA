import React, { useState } from 'react';
import { ShoppingCart, Trash2, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { BACKEND_URL } from '../../api';
import '../../styles/dashboard.css';

export default function CartCheckout() {
  const { items, removeFromCart, updateQuantity, getTotal, clearCart } = useCartStore();
  const [checkingOut, setCheckingOut] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    setCheckingOut(true);
    try {
      const token = localStorage.getItem('valora_token');
      const payload = {
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          price: i.price
        }))
      };

      const res = await fetch(`${BACKEND_URL}/portal/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccess(true);
        clearCart();
        setTimeout(() => {
          navigate('/dashboard'); // Go back to dashboard to pay the new invoice
        }, 2000);
      } else {
        alert('Checkout failed');
        setCheckingOut(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error during checkout');
      setCheckingOut(false);
    }
  };

  if (success) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <CheckCircle size={64} color="#10B981" style={{ marginBottom: '24px' }} />
        <h1 style={{ marginBottom: '8px' }}>Order Placed!</h1>
        <p style={{ color: '#6B7280' }}>Your invoice has been generated. Redirecting to your dashboard to complete payment...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="dashboard-greeting" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShoppingCart size={28} />
        <h1 style={{ margin: 0 }}>Shopping Cart</h1>
      </div>

      <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
        <div style={{ flex: 2 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
            {items.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 16px auto', opacity: 0.2 }} />
                <p>Your cart is empty.</p>
                <button onClick={() => navigate('/portal/customer')} className="primary-btn" style={{ marginTop: '16px', padding: '8px 24px', borderRadius: '8px' }}>Continue Shopping</button>
              </div>
            ) : (
              <div>
                {items.map((item, idx) => (
                  <div key={item.product_id} style={{ 
                    display: 'flex', 
                    padding: '24px', 
                    borderBottom: idx < items.length - 1 ? '1px solid #F3F4F6' : 'none',
                    gap: '20px'
                  }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F9FAFB', flexShrink: 0 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
                        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)} style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', backgroundColor: '#F9FAFB' }}>-</button>
                          <span style={{ padding: '4px 16px', borderLeft: '1px solid #E5E7EB', borderRight: '1px solid #E5E7EB' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer', backgroundColor: '#F9FAFB' }}>+</button>
                        </div>
                        
                        <button onClick={() => removeFromCart(item.product_id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={16} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #F3F4F6', padding: '24px', position: 'sticky', top: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 24px 0' }}>Order Summary</h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#4B5563' }}>
              <span>Subtotal</span>
              <span>₹{getTotal().toLocaleString('en-IN')}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#4B5563' }}>
              <span>Tax (Estimated)</span>
              <span>₹0</span>
            </div>
            
            <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '16px 0' }}></div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '1.25rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span>₹{getTotal().toLocaleString('en-IN')}</span>
            </div>
            
            <button 
              onClick={handleCheckout} 
              disabled={items.length === 0 || checkingOut}
              className="primary-btn" 
              style={{ width: '100%', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontSize: '1rem', backgroundColor: items.length === 0 ? '#9CA3AF' : undefined }}
            >
              {checkingOut ? 'Generating Invoice...' : 'Buy Now'}
              {!checkingOut && <ArrowRight size={18} />}
            </button>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', textAlign: 'center', marginTop: '16px' }}>
              By clicking "Buy Now", an official invoice will be generated in your dashboard for immediate payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
