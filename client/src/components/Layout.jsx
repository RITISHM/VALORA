/**
 * @file Layout.jsx
 * @description Core authenticated dashboard layout shell for Valora ERP.
 * Implements a collapsible navigation sidebar with contrast hover animation, 
 * top header with contextual actions (search, notifications, settings, profile avatar),
 * and dynamic nested route rendering via React Router Outlet.
 * @module components/Layout
 */

import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, BarChart3, LogOut, Hexagon, Search, Bell, Settings,
  Store, ShoppingBag, ShoppingCart, BookOpen, PieChart, Layers, Tag, DollarSign, ListFilter
} from 'lucide-react';
import '../styles/layout.css';
import { useCartStore } from '../store/useCartStore';

/**
 * Layout component providing the persistent frame for all authenticated views.
 * Handles role-based sidebar link filtering and user logout flow.
 * 
 * @component
 * @returns {JSX.Element} Authenticated layout wrapper with sidebar and main content outlet.
 */
export default function Layout() {
  const navigate = useNavigate();
  const cartItemCount = useCartStore((state) => state.getItemCount ? state.getItemCount() : 0);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const userStr = localStorage.getItem('valora_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role?.toLowerCase() || '';

  /**
   * Logs out user by redirecting to the login view.
   * @function handleLogout
   */
  const handleLogout = () => {
    localStorage.removeItem('valora_user');
    localStorage.removeItem('valora_token');
    navigate('/login');
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  return (
    <div className="app-wrapper" onClick={closeDropdowns}>
      <div className="app-layout">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link to="/dashboard" className="sidebar-logo-link">
              <Hexagon size={28} className="sidebar-logo-icon" />
              <span className="sidebar-brand-name">VALORA</span>
            </Link>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
              <LayoutDashboard size={20} className="nav-icon" />
              <span className="nav-label">Dashboard</span>
            </NavLink>

            {userRole !== 'contact' && (
              <>
                <NavLink to="/sales-orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Sales Orders">
                  <ShoppingBag size={20} className="nav-icon" />
                  <span className="nav-label">Sales Orders</span>
                </NavLink>

                <NavLink to="/customer-invoices" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Customer Invoices">
                  <FileText size={20} className="nav-icon" />
                  <span className="nav-label">Customer Invoices</span>
                </NavLink>

                <NavLink to="/purchase-orders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Purchase Orders">
                  <ShoppingCart size={20} className="nav-icon" />
                  <span className="nav-label">Purchase Orders</span>
                </NavLink>

                <NavLink to="/vendor-bills" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Vendor Bills">
                  <FileText size={20} className="nav-icon" />
                  <span className="nav-label">Vendor Bills</span>
                </NavLink>

                <NavLink to="/contacts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Contacts">
                  <Users size={20} className="nav-icon" />
                  <span className="nav-label">Contacts</span>
                </NavLink>

                <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Products">
                  <Package size={20} className="nav-icon" />
                  <span className="nav-label">Products</span>
                </NavLink>

                <NavLink to="/accounts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Chart of Accounts">
                  <BookOpen size={20} className="nav-icon" />
                  <span className="nav-label">Chart of Accounts</span>
                </NavLink>

                <NavLink to="/journals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Journals">
                  <ListFilter size={20} className="nav-icon" />
                  <span className="nav-label">Journals</span>
                </NavLink>

                <NavLink to="/journal-entries" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Journal Entries">
                  <Layers size={20} className="nav-icon" />
                  <span className="nav-label">Journal Entries</span>
                </NavLink>

                <NavLink to="/reports/balance-sheet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Balance Sheet">
                  <BarChart3 size={20} className="nav-icon" />
                  <span className="nav-label">Balance Sheet</span>
                </NavLink>

                <NavLink to="/reports/pnl" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Profit & Loss">
                  <BarChart3 size={20} className="nav-icon" />
                  <span className="nav-label">Profit & Loss</span>
                </NavLink>
              </>
            )}

            {userRole === 'contact' && (
              <>
                <NavLink to="/portal/customer" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Customer">
                  <ShoppingBag size={20} className="nav-icon" />
                  <span className="nav-label">Customer</span>
                </NavLink>

                <NavLink to="/portal/vendor" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Vendor">
                  <Store size={20} className="nav-icon" />
                  <span className="nav-label">Vendor</span>
                </NavLink>

                <NavLink to="/portal/cart" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Cart">
                  <div style={{ position: 'relative' }}>
                    <ShoppingCart size={20} className="nav-icon" />
                    {cartItemCount > 0 && (
                      <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: '#DC2626', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  <span className="nav-label">Cart</span>
                </NavLink>
              </>
            )}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} className="nav-icon" />
              <span className="nav-label">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          <header className="top-header">
            <div style={{ flex: 1 }}></div>

            <div className="header-actions">
              <div className="header-search">
                <Search size={16} color="#9CA3AF" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {userRole === 'contact' && (
                <Link to="/portal/cart" style={{ color: 'inherit', display: 'flex', position: 'relative', marginRight: '10px' }}>
                  <ShoppingCart size={20} className="header-icon" />
                  {cartItemCount > 0 && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#DC2626', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              )}

              <Link to="/notifications" style={{ color: 'inherit', display: 'flex' }}>
                <Bell size={20} className="header-icon" />
              </Link>

              <Link to="/settings" style={{ color: 'inherit', display: 'flex' }}>
                <Settings size={20} className="header-icon" />
              </Link>

              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <div className="user-profile">
                  <div className="avatar">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </div>
                </div>
              </Link>
            </div>
          </header>

          <main className="page-content">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
    </div>
  );
}
