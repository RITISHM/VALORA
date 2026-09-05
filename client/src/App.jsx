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

// Master Pages
import ContactList from './pages/masters/ContactList.jsx';
import ProductList from './pages/masters/ProductList.jsx';
import CustomerMarketplace from './pages/portal/CustomerMarketplace.jsx';
import VendorProductForm from './pages/portal/VendorProductForm.jsx';
import CartCheckout from './pages/portal/CartCheckout.jsx';
import PortalInvoices from './pages/portal/PortalInvoices.jsx';
import InvoiceDetail from './pages/portal/InvoiceDetail.jsx';
import ChartOfAccounts from './pages/masters/ChartOfAccounts.jsx';

// Accounting Pages
import Journals from './pages/accounting/Journals.jsx';
import JournalEntries from './pages/accounting/JournalEntries.jsx';
import Payments from './pages/accounting/Payments.jsx';
import AnalyticAccounts from './pages/accounting/AnalyticAccounts.jsx';
import Budgets from './pages/accounting/Budgets.jsx';

// Sales & Purchase Pages
import SalesOrders from './pages/sales/SalesOrders.jsx';
import CustomerInvoices from './pages/sales/CustomerInvoices.jsx';
import PurchaseOrders from './pages/purchase/PurchaseOrders.jsx';
import VendorBills from './pages/purchase/VendorBills.jsx';

// Report Pages
import BalanceSheet from './pages/reports/BalanceSheet.jsx';
import ProfitAndLoss from './pages/reports/ProfitAndLoss.jsx';
import BudgetReport from './pages/reports/BudgetReport.jsx';

// Miscellaneous Pages
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

          {/* Sales Tab */}
          <Route path="/sales-orders" element={<SalesOrders />} />
          <Route path="/sales-orders/new" element={<SalesOrders />} />
          <Route path="/customer-invoices" element={<CustomerInvoices />} />
          <Route path="/customer-invoices/new" element={<CustomerInvoices />} />

          {/* Purchase Tab */}
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/purchase-orders/new" element={<PurchaseOrders />} />
          <Route path="/vendor-bills" element={<VendorBills />} />
          <Route path="/vendor-bills/new" element={<VendorBills />} />

          {/* Payments & Receipts */}
          <Route path="/payments" element={<Payments />} />

          {/* Master & Accounts Tab */}
          <Route path="/contacts" element={<ContactList />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/portal/customer" element={<CustomerMarketplace />} />
          <Route path="/portal/vendor" element={<VendorProductForm />} />
          <Route path="/portal/cart" element={<CartCheckout />} />
          <Route path="/portal/invoices" element={<PortalInvoices />} />
          <Route path="/portal/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/analytic-accounts" element={<AnalyticAccounts />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/accounts/new" element={<ChartOfAccounts />} />
          <Route path="/journals" element={<Journals />} />
          <Route path="/journal-entries" element={<JournalEntries />} />
          <Route path="/journal-entries/new" element={<JournalEntries />} />

          {/* Reports Tab */}
          <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="/reports/pnl" element={<ProfitAndLoss />} />
          <Route path="/reports/budget" element={<BudgetReport />} />

          {/* Misc */}
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}