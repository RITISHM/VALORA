import React from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, FileText, BarChart3, LogOut, Hexagon, Search, Bell, Settings } from 'lucide-react';
import '../styles/layout.css';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="app-wrapper">
      <div className="app-layout">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link to="/dashboard">
              <Hexagon size={28} className="sidebar-logo-icon" />
            </Link>
          </div>
          
          <nav className="sidebar-nav">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Dashboard">
              <LayoutDashboard size={20} />
            </NavLink>
            
            <NavLink to="/contacts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Contacts">
              <Users size={20} />
            </NavLink>
            
            <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Products">
              <Package size={20} />
            </NavLink>
            
            <NavLink to="/journals" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Journals">
              <FileText size={20} />
            </NavLink>
            
            <NavLink to="/reports/balance-sheet" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Balance Sheet">
              <BarChart3 size={20} />
            </NavLink>
            
            <NavLink to="/reports/pnl" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} title="Profit & Loss">
              <BarChart3 size={20} />
            </NavLink>
          </nav>
          
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          <header className="top-header">
            <div style={{ flex: 1 }}>
              {/* Dashboard specific greeting will go here via portal or we just leave this space for layout, wait, image has greeting on left. Let's just put the greeting here for all pages or let the page handle it. Let's leave it blank and let page put title */}
            </div>
            
            <div className="header-actions">
              <div className="header-search">
                <Search size={16} color="#9CA3AF" />
                <input type="text" placeholder="Search..." />
              </div>
              
              <Link to="/notifications" style={{ color: 'inherit', display: 'flex' }}>
                <Bell size={20} className="header-icon" />
              </Link>
              
              <Link to="/settings" style={{ color: 'inherit', display: 'flex' }}>
                <Settings size={20} className="header-icon" />
              </Link>
              
              <Link to="/profile" style={{ textDecoration: 'none' }}>
                <div className="user-profile">
                  <div className="avatar">ML</div>
                </div>
              </Link>
            </div>
          </header>
          
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
