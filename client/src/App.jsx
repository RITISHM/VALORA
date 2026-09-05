import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login.jsx';
import Signup from './pages/signup.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Layout from './components/Layout.jsx';
import ContactList from './pages/masters/ContactList.jsx';
import ProductList from './pages/masters/ProductList.jsx';
import ChartOfAccounts from './pages/masters/ChartOfAccounts.jsx';

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
          <Route path="/journals" element={<div className="page-content"><h2>Journals (WIP)</h2></div>} />
          <Route path="/reports" element={<div className="page-content"><h2>Reports (WIP)</h2></div>} />
        </Route>
      </Routes>
    </Router>
  );
}