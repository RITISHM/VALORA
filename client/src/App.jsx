/**
 * @file App.jsx
 * @description Primary application router component for Valora.
 * Defines public routes (Login, Signup, Admin Create User) and protected routes
 * nested within the main application Layout shell.
 * @module App
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import AdminCreateUser from './pages/AdminCreateUser.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Layout from './components/Layout.jsx';
import ContactList from './pages/masters/ContactList.jsx';
import ProductList from './pages/masters/ProductList.jsx';
import CustomerMarketplace from './pages/portal/CustomerMarketplace.jsx';
import VendorProductForm from './pages/portal/VendorProductForm.jsx';
import CartCheckout from './pages/portal/CartCheckout.jsx';
import ChartOfAccounts from './pages/masters/ChartOfAccounts.jsx';
import JournalEntries from './pages/accounting/JournalEntries.jsx';
import BalanceSheet from './pages/reports/BalanceSheet.jsx';
import ProfitAndLoss from './pages/reports/ProfitAndLoss.jsx';
import Settings from './pages/Settings.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';

/**
 * Root App component managing client-side navigation and routing structure.
 * @component
 * @returns {JSX.Element} The router hierarchy with all registered view routes.
 */
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin/create-user" element={<AdminCreateUser />} />
        
        {/* Authenticated Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/portal/customer" element={<CustomerMarketplace />} />
          <Route path="/portal/vendor" element={<VendorProductForm />} />
          <Route path="/portal/cart" element={<CartCheckout />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/journals" element={<JournalEntries />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="/reports/pnl" element={<ProfitAndLoss />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}