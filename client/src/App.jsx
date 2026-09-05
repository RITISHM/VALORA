import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Layout from './components/Layout.jsx';
import ContactList from './pages/masters/ContactList.jsx';
import ProductList from './pages/masters/ProductList.jsx';
import ChartOfAccounts from './pages/masters/ChartOfAccounts.jsx';
import JournalEntries from './pages/accounting/JournalEntries.jsx';
import BalanceSheet from './pages/reports/BalanceSheet.jsx';
import ProfitAndLoss from './pages/reports/ProfitAndLoss.jsx';
import Settings from './pages/Settings.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Authenticated Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/products" element={<ProductList />} />
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