/**
 * @file Dashboard.jsx
 * @description Main dashboard view for Valora ERP.
 * Renders role-specific dashboards:
 * - AdminDashboard: Displays KPIs, recent transactions, meetings, and balance sheet summary for staff/admins.
 * - UserDashboard: Displays customer portal invoices, total dues, and inline invoice payment flow for portal contacts.
 * @module pages/Dashboard
 */

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ShoppingBag,
  ShoppingCart,
  BookOpen,
  PieChart,
  Layers,
  Tag,
  DollarSign,
  ListFilter,
  Users,
  Package,
  FileText,
  BarChart3,
  ArrowRight,
  Network,
  Activity,
  Sunrise,
  Loader2,
  Eye,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import { BACKEND_URL, api } from "../api";
import "../styles/dashboard.css";

/**
 * Administrative and Accountant dashboard view featuring company-wide metrics and activities.
 *
 * @component
 * @returns {JSX.Element} The rendered admin dashboard view.
 */
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await api.getAIInsights();
      setInsights(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    api
      .getDashboardAnalytics()
      .then((res) => {
        setData(res.admin);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const toggleDropdown = (menu, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  const closeDropdowns = () => {
    setActiveDropdown(null);
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentMonthYear = currentTime.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const startOfWeek = new Date(currentTime);
  startOfWeek.setDate(currentTime.getDate() - currentTime.getDay()); // Sunday

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      date: d,
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase(),
      dayNum: d.getDate(),
      isToday: d.toDateString() === currentTime.toDateString(),
    };
  });

  return (
    <div className="dashboard-container" onClick={closeDropdowns}>
      <div className="dashboard-greeting" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: 0 }}>Hi, Admin 👋</h1>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-main-col" style={{ flex: 1.6 }}>
          <div className="section-header">
            <h2>Recent Transactions</h2>
            <Link to="/sales-orders" className="see-all">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {/* The 4 Dropdown Menu Tabs in Dashboard Page (Replacing All | Sales | Purchases | Journals) */}
          <div
            className="dashboard-tabs"
            style={{
              gap: "24px",
              display: "flex",
              alignItems: "center",
              marginBottom: "32px",
              borderBottom: "1px solid #F3F4F6",
              paddingBottom: "12px",
              position: "relative",
              zIndex: 50,
            }}
          >
            {/* 1. SALES TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
              <button
                type="button"
                className={`tab ${activeDropdown === "sales" ? "active" : ""}`}
                onClick={(e) => toggleDropdown("sales", e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: activeDropdown === "sales" ? "#111116" : "#9CA3AF",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Sales <ChevronDown size={14} />
              </button>
              {activeDropdown === "sales" && (
                <div
                  className="mega-dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 100,
                    marginTop: "8px",
                  }}
                >
                  <Link to="/sales-orders" onClick={closeDropdowns}>
                    <ShoppingBag size={15} /> Sales order
                  </Link>
                  <Link to="/customer-invoices" onClick={closeDropdowns}>
                    <FileText size={15} /> Sale Invoice
                  </Link>
                  <Link to="/payments" onClick={closeDropdowns}>
                    <DollarSign size={15} /> Receipt
                  </Link>
                </div>
              )}
            </div>

            {/* 2. PURCHASE TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
              <button
                type="button"
                className={`tab ${activeDropdown === "purchase" ? "active" : ""}`}
                onClick={(e) => toggleDropdown("purchase", e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: activeDropdown === "purchase" ? "#111116" : "#9CA3AF",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Purchase <ChevronDown size={14} />
              </button>
              {activeDropdown === "purchase" && (
                <div
                  className="mega-dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 100,
                    marginTop: "8px",
                  }}
                >
                  <Link to="/purchase-orders" onClick={closeDropdowns}>
                    <ShoppingCart size={15} /> Purchase Order
                  </Link>
                  <Link to="/vendor-bills" onClick={closeDropdowns}>
                    <FileText size={15} /> Purchase Bill
                  </Link>
                  <Link to="/payments" onClick={closeDropdowns}>
                    <DollarSign size={15} /> Payment
                  </Link>
                </div>
              )}
            </div>

            {/* 3. ACCOUNT TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
              <button
                type="button"
                className={`tab ${activeDropdown === "account" ? "active" : ""}`}
                onClick={(e) => toggleDropdown("account", e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: activeDropdown === "account" ? "#111116" : "#9CA3AF",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Account <ChevronDown size={14} />
              </button>
              {activeDropdown === "account" && (
                <div
                  className="mega-dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 100,
                    marginTop: "8px",
                  }}
                >
                  <Link to="/contacts" onClick={closeDropdowns}>
                    <Users size={15} /> Contact
                  </Link>
                  <Link to="/products" onClick={closeDropdowns}>
                    <Package size={15} /> Product
                  </Link>
                  <Link to="/analytic-accounts" onClick={closeDropdowns}>
                    <Tag size={15} /> Analyticals
                  </Link>
                  <Link to="/budgets" onClick={closeDropdowns}>
                    <PieChart size={15} /> Analytical Budget
                  </Link>
                  <Link to="/accounts" onClick={closeDropdowns}>
                    <BookOpen size={15} /> Chart of Account
                  </Link>
                  <Link to="/journals" onClick={closeDropdowns}>
                    <ListFilter size={15} /> Journals
                  </Link>
                  <Link to="/journal-entries" onClick={closeDropdowns}>
                    <Layers size={15} /> Journal Entries
                  </Link>
                </div>
              )}
            </div>

            {/* 4. REPORT TAB */}
            <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
              <button
                type="button"
                className={`tab ${activeDropdown === "report" ? "active" : ""}`}
                onClick={(e) => toggleDropdown("report", e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "transparent",
                  border: "none",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  color: activeDropdown === "report" ? "#111116" : "#9CA3AF",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Report <ChevronDown size={14} />
              </button>
              {activeDropdown === "report" && (
                <div
                  className="mega-dropdown-menu"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    zIndex: 100,
                    marginTop: "8px",
                  }}
                >
                  <Link to="/reports/balance-sheet" onClick={closeDropdowns}>
                    <BarChart3 size={15} /> Balancesheet
                  </Link>
                  <Link to="/reports/pnl" onClick={closeDropdowns}>
                    <BarChart3 size={15} /> Profit and Loss
                  </Link>
                  <Link to="/reports/budget" onClick={closeDropdowns}>
                    <PieChart size={15} /> Budget Report
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="transaction-cards">
            <div
              className="transaction-card"
              onClick={() => navigate("/vendor-bills")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-graphic bg-mint">
                <Network size={40} strokeWidth={1} color="#017E84" />
              </div>
              <div className="card-content">
                <h3>Vendor Bill #1024</h3>
                <p>Purchase of bulk office furniture</p>
                <div className="card-badges">
                  <span className="badge">Purchase</span>
                  <span className="badge">Goods</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 5</span>
                <span className="amount">₹ 45,000</span>
              </div>
            </div>

            <div
              className="transaction-card"
              onClick={() => navigate("/customer-invoices")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-graphic bg-purple">
                <Activity size={40} strokeWidth={1} color="#714B67" />
              </div>
              <div className="card-content">
                <h3>Customer Invoice #992</h3>
                <p>Payment received for premium chairs</p>
                <div className="card-badges">
                  <span className="badge">Sales</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 6</span>
                <span className="amount">₹ 12,500</span>
              </div>
            </div>

            <div
              className="transaction-card"
              onClick={() => navigate("/journal-entries")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-graphic bg-peach">
                <Sunrise size={40} strokeWidth={1} color="#D46243" />
              </div>
              <div className="card-content">
                <h3>Journal Entry #JE-12</h3>
                <p>Manual adjustment for depreciation</p>
                <div className="card-badges">
                  <span className="badge">Adjustment</span>
                  <span className="badge">Finance</span>
                </div>
              </div>
              <div className="card-meta">
                <span className="date">Start May 8</span>
                <span className="amount">₹ 5,000</span>
              </div>
            </div>

            {/* AI Insights Card */}
            <div style={{ marginTop: "32px", padding: "24px", background: "linear-gradient(135deg, #f0ebff 0%, #e0d4ff 100%)", borderRadius: "12px", border: "1px solid #d4c4f9", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "#4F46E5", fontSize: "1.1rem" }}>
                  <Activity size={20} /> AI Financial Insights
                </h3>
                {!insights && !loadingInsights && (
                  <button
                    onClick={fetchInsights}
                    style={{ background: "#4F46E5", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}
                  >
                    Generate Insights
                  </button>
                )}
              </div>

              {loadingInsights && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6B7280" }}>
                  <Loader2 size={18} style={{ animation: "spin 2s linear infinite" }} /> Analyzing ledger data...
                </div>
              )}

              {insights && (
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#1F2937", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {insights.map((insight, idx) => (
                    <li key={idx} style={{ lineHeight: "1.5" }}>{insight}</li>
                  ))}
                </ul>
              )}
              <style>
                {`
                  @keyframes spin { 100% { transform: rotate(360deg); } }
                `}
              </style>
            </div>
          </div>
        </div>

        {/* Right Column: Original Calendar, Schedule, and Cash Flow Widgets */}
        <div className="dashboard-side-col">
          {/* Calendar Widget */}
          <div className="calendar-widget">
            <div className="calendar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{currentMonthYear}</h3>
                <span style={{ fontSize: "0.85rem", color: "#64748B", fontWeight: "600" }}>
                  {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="calendar-nav">
                <span>&lt;</span>
                <span>&gt;</span>
              </div>
            </div>
            <div className="calendar-days">
              {weekDays.map((d, i) => (
                <div key={i} className={`day-col ${d.isToday ? "active" : ""}`}>
                  <span>{d.dayName}</span>
                  <span>{d.dayNum}</span>
                  {d.isToday && <div className="dot"></div>}
                </div>
              ))}
            </div>
          </div>

          {/* Schedule / Upcoming */}
          <div className="schedule-widget">
            <div className="section-header">
              <h3>Schedule</h3>
              <Link to="/sales-orders" className="see-all">
                See all <ArrowRight size={14} />
              </Link>
            </div>

            <div className="schedule-list">
              {[
                { title: "Vendor Payment", subtitle: "Azure Furniture", time: "18:00 - 19:30", theme: "dark", offsetDays: 0 },
                { title: "Sales Review", subtitle: "Internal Meeting", time: "11:00 - 12:30", theme: "light", offsetDays: 1 },
                { title: "Tax Filing", subtitle: "Quarterly Update", time: "14:00 - 15:30", theme: "light", offsetDays: 2 }
              ].map((item, idx) => {
                const itemDate = new Date(currentTime);
                itemDate.setDate(currentTime.getDate() + item.offsetDays);
                const dateStr = itemDate.getDate().toString().padStart(2, "0");
                return (
                  <div key={idx} className={`schedule-item ${item.theme}`}>
                    <div className="sch-date">{dateStr}</div>
                    <div className="sch-info">
                      <h4>{item.title}</h4>
                      <span>{item.subtitle}</span>
                    </div>
                    <div className="sch-time">{item.time}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart Widget */}
          <div className="chart-widget" style={{ display: "flex", flexDirection: "column" }}>
            <div className="section-header">
              <h3>Cash Flow</h3>
              <span className="meta-text">₹ 452k Total</span>
            </div>

            <div style={{ flex: 1, minHeight: "220px", width: "100%", marginTop: "16px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "S", amount: 45000 },
                  { name: "M", amount: 82000 },
                  { name: "T", amount: 35000 },
                  { name: "W", amount: 120000 },
                  { name: "T", amount: 65000 },
                  { name: "F", amount: 50000 },
                  { name: "S", amount: 55000 }
                ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9CA3AF", fontWeight: 600 }} tickFormatter={(val) => `${val / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)" }}
                    formatter={(value) => [`₹ ${value.toLocaleString("en-IN")}`, "Cash Flow"]}
                  />
                  <Bar dataKey="amount" radius={[4, 4, 4, 4]}>
                    {[
                      { name: "S", amount: 45000 },
                      { name: "M", amount: 82000 },
                      { name: "T", amount: 35000 },
                      { name: "W", amount: 120000 },
                      { name: "T", amount: 65000 },
                      { name: "F", amount: 50000 },
                      { name: "S", amount: 55000 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.amount > 100000 ? "#714B67" : "rgba(1, 126, 132, 0.4)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Customer and Contact portal dashboard displaying invoices and payment settlement actions.
 *
 * @component
 * @param {Object} props - Component properties.
 * @param {Object} props.user - Active authenticated contact user profile.
 * @returns {JSX.Element} The rendered contact portal dashboard.
 */
function UserDashboard({ user }) {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const searchQuery = (context.searchQuery || "").toLowerCase();

  const [activeTab, setActiveTab] = useState("Unpaid");
  const [invoices, setInvoices] = useState([]);
  const [outstanding, setOutstanding] = useState({ total_unpaid_invoices: 0, recently_paid: 0 });
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);

  useEffect(() => {
    const afterPrint = () => setPrintingInvoice(null);
    window.addEventListener("afterprint", afterPrint);
    return () => window.removeEventListener("afterprint", afterPrint);
  }, []);

  const token = localStorage.getItem("valora_token");

  /**
   * Fetches outstanding amounts and customer invoices from the portal API.
   *
   * @async
   * @function fetchData
   */
  const fetchData = async () => {
    try {
      setLoading(true);

      let newOutstanding = { ...outstanding };
      let newInvoices = [...invoices];
      let outSuccess = false;
      let invSuccess = false;

      // Fetch outstanding
      try {
        const outRes = await fetch(`${BACKEND_URL}/portal/outstanding`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (outRes.ok) {
          const outData = await outRes.json();
          newOutstanding.total_unpaid_invoices = outData.total_unpaid_invoices || 0;
          outSuccess = true;
        }
      } catch (e) {
        console.error("Outstanding fetch error", e);
      }

      // Fetch invoices
      try {
        const invRes = await fetch(`${BACKEND_URL}/portal/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (invRes.ok) {
          newInvoices = await invRes.json();
          invSuccess = true;
        }
      } catch (e) {
        console.error("Invoices fetch error", e);
      }

      // If backend failed, load from offline cache
      if (!outSuccess || !invSuccess) {
        console.warn("Backend unstable, loading from local cache");
        const cachedOutstanding = localStorage.getItem("valora_cached_outstanding");
        const cachedInvoices = localStorage.getItem("valora_cached_invoices");
        if (!outSuccess && cachedOutstanding) newOutstanding = JSON.parse(cachedOutstanding);
        if (!invSuccess && cachedInvoices) newInvoices = JSON.parse(cachedInvoices);
      } else {
        // Both succeeded, save to cache
        localStorage.setItem("valora_cached_outstanding", JSON.stringify(newOutstanding));
        localStorage.setItem("valora_cached_invoices", JSON.stringify(newInvoices));
      }

      // Force offline paid invoices to show as PAID
      const offlinePaid = JSON.parse(localStorage.getItem("offlinePaidInvoices") || "[]");
      let offlinePaidAmount = 0;

      newInvoices = newInvoices.map((inv) => {
        if (offlinePaid.includes(inv.id) && inv.status !== "PAID") {
          offlinePaidAmount += inv.total;
          return { ...inv, status: "PAID" };
        }
        return inv;
      });

      setInvoices(newInvoices);

      const paidInvoices = newInvoices.filter((i) => i.status === "PAID");
      const paidTotal = paidInvoices.reduce((sum, i) => sum + i.total, 0);

      setOutstanding({
        total_unpaid_invoices: Math.max(
          0,
          newOutstanding.total_unpaid_invoices - offlinePaidAmount,
        ),
        recently_paid: paidTotal,
      });
    } catch (err) {
      console.error("Failed to fetch portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showMockPayment, setShowMockPayment] = useState(false);
  const [mockPaymentStatus, setMockPaymentStatus] = useState("processing"); // processing, success

  const handlePrint = (inv) => {
    setPrintingInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async (invoiceId, total) => {
    setPayingId(invoiceId);

    try {
      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        alert("Failed to load payment gateway.");
        setPayingId(null);
        return;
      }

      // 1. Create Razorpay order on backend
      const token = localStorage.getItem("valora_token");
      const orderRes = await fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/razorpay-order`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create payment order");
      }

      const orderData = await orderRes.json();

      if (orderData.key_id === "mock") {
        const verifyRes = await fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/pay`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            method: "ONLINE",
            amount: total,
            razorpay_payment_id: "mock_payment",
          }),
        });

        if (!verifyRes.ok) throw new Error("Verification failed");

        alert("Payment Successful!");

        // Update UI
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "PAID" } : inv)),
        );

        setOutstanding((prev) => ({
          total_unpaid_invoices: Math.max(0, prev.total_unpaid_invoices - total),
          recently_paid: prev.recently_paid + total,
        }));

        navigate(`/portal/invoices/${invoiceId}`);
        setPayingId(null);
        return;
      }

      // 2. Open Razorpay options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: "INR",
        name: "Valora ERP",
        description: `Payment for Invoice`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${BACKEND_URL}/portal/invoices/${invoiceId}/pay`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                method: "ONLINE",
                amount: total,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) throw new Error("Verification failed");

            alert("Payment Successful!");

            // Update UI
            setInvoices((prev) =>
              prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "PAID" } : inv)),
            );

            setOutstanding((prev) => ({
              total_unpaid_invoices: Math.max(0, prev.total_unpaid_invoices - total),
              recently_paid: prev.recently_paid + total,
            }));

            navigate(`/portal/invoices/${invoiceId}`);
          } catch (err) {
            alert("Payment verification failed: " + err.message);
          }
        },
        modal: {
          ondismiss: function () {
            alert("Payment cancelled");
            setPayingId(null);
          },
        },
        theme: {
          color: "#4F46E5",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Error initiating payment: " + err.message);
      setPayingId(null);
    }
  };
  const filteredInvoices = invoices.filter((inv) => {
    let matchesTab = false;
    if (activeTab === "Unpaid") {
      matchesTab = inv.status === "DRAFT" || inv.status === "CONFIRMED";
    } else {
      matchesTab = inv.status === "PAID";
    }

    if (!matchesTab) return false;

    if (searchQuery) {
      const invNumber = (inv.invoice_number || "").toLowerCase();
      return invNumber.includes(searchQuery);
    }

    return true;
  });

  if (printingInvoice) {
    return (
      <div
        style={{
          padding: "40px",
          fontFamily: "sans-serif",
          color: "#111116",
          background: "#fff",
          minHeight: "100vh",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "2px solid #E5E7EB",
            paddingBottom: "20px",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "2rem", color: "#714B67", fontWeight: "800" }}>
              VALORA
            </h1>
            <p style={{ margin: "4px 0 0 0", color: "#6B7280", fontSize: "0.9rem" }}>
              123 Business Road, Tech City
              <br />
              contact@valora.com
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: "700", color: "#111116" }}>
              INVOICE
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#6B7280", fontSize: "0.9rem" }}>
              #{printingInvoice.invoice_number}
            </p>
            <p style={{ margin: "4px 0 0 0", color: "#6B7280", fontSize: "0.9rem" }}>
              Date: {new Date(printingInvoice.invoice_date).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Billed To */}
        <div style={{ marginBottom: "40px" }}>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: "1rem",
              color: "#4B5563",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Billed To:
          </h3>
          <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "600" }}>
            {user?.contact_name || user?.name || "Customer"}
          </p>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "40px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #111116" }}>
              <th style={{ padding: "12px 8px", textAlign: "left", fontWeight: "700" }}>
                Item / Description
              </th>
              <th style={{ padding: "12px 8px", textAlign: "center", fontWeight: "700" }}>Qty</th>
              <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700" }}>Rate</th>
              <th style={{ padding: "12px 8px", textAlign: "right", fontWeight: "700" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(printingInvoice.lines || []).map((line, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "12px 8px" }}>{line.product?.name || "Item"}</td>
                <td style={{ padding: "12px 8px", textAlign: "center" }}>{line.qty}</td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  ₹ {Number(line.unit_price || 0).toLocaleString("en-IN")}
                </td>
                <td style={{ padding: "12px 8px", textAlign: "right" }}>
                  ₹ {Number(line.total || 0).toLocaleString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: "300px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                color: "#4B5563",
              }}
            >
              <span>Subtotal</span>
              <span>₹ {Number(printingInvoice.subtotal || 0).toLocaleString("en-IN")}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                color: "#4B5563",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <span>Tax Amount</span>
              <span>₹ {Number(printingInvoice.tax_amount || 0).toLocaleString("en-IN")}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0",
                fontWeight: "800",
                fontSize: "1.2rem",
                color: "#111116",
              }}
            >
              <span>Total Paid</span>
              <span>₹ {Number(printingInvoice.total || 0).toLocaleString("en-IN")}</span>
            </div>
            <div
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "6px 12px",
                background: "#D1FAE5",
                color: "#059669",
                fontWeight: "700",
                borderRadius: "4px",
                border: "1px solid #10B981",
              }}
            >
              ✓ PAID IN FULL
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{ marginTop: "80px", textAlign: "center", color: "#9CA3AF", fontSize: "0.85rem" }}
        >
          Thank you for your business.
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-greeting">
        <h1>Heyy {user?.name || "User"} Welcome to Valora 👋</h1>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-main-col" style={{ flex: 1.5 }}>
          <div style={{ display: "flex", gap: "24px", marginBottom: "40px" }}>
            <div
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                padding: "32px",
                borderRadius: "24px",
                border: "1px solid #F3F4F6",
                boxShadow:
                  "0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)",
                transition:
                  "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 25px 30px -5px rgba(113, 75, 103, 0.15), 0 10px 10px -5px rgba(113, 75, 103, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)";
              }}
            >
              <span
                style={{
                  color: "#714B67",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Due
              </span>
              <h2
                style={{
                  fontSize: "2.5rem",
                  color: "#111116",
                  margin: "8px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  height: "48px",
                  fontWeight: "800",
                }}
              >
                {loading ? (
                  <Loader2
                    size={28}
                    className="spinner"
                    style={{ color: "#714B67", animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  `₹ ${outstanding.total_unpaid_invoices.toLocaleString("en-IN")}`
                )}
              </h2>
            </div>
            <div
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                padding: "32px",
                borderRadius: "24px",
                border: "1px solid #F3F4F6",
                boxShadow:
                  "0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)",
                transition:
                  "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 25px 30px -5px rgba(113, 75, 103, 0.15), 0 10px 10px -5px rgba(113, 75, 103, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 20px 25px -5px rgba(113, 75, 103, 0.1), 0 8px 10px -6px rgba(113, 75, 103, 0.05)";
              }}
            >
              <span
                style={{
                  color: "#714B67",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Recently Paid
              </span>
              <h2
                style={{
                  fontSize: "2.5rem",
                  color: "#111116",
                  margin: "8px 0 0 0",
                  display: "flex",
                  alignItems: "center",
                  height: "48px",
                  fontWeight: "800",
                }}
              >
                {loading ? (
                  <Loader2
                    size={28}
                    className="spinner"
                    style={{ color: "#714B67", animation: "spin 1s linear infinite" }}
                  />
                ) : (
                  `₹ ${outstanding.recently_paid.toLocaleString("en-IN")}`
                )}
              </h2>
            </div>
          </div>

          <div className="section-header">
            <h2>My Invoices & Bills</h2>
            <div
              className="dashboard-tabs"
              style={{ marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}
            >
              <span
                className={`tab ${activeTab === "Unpaid" ? "active" : ""}`}
                onClick={() => setActiveTab("Unpaid")}
                style={{ cursor: "pointer" }}
              >
                Unpaid
              </span>
              <span
                className={`tab ${activeTab === "Paid" ? "active" : ""}`}
                onClick={() => setActiveTab("Paid")}
                style={{ cursor: "pointer" }}
              >
                Paid
              </span>
            </div>
          </div>

          <div className="transaction-cards" style={{ marginTop: "24px" }}>
            {loading ? (
              <div style={{ padding: "40px", display: "flex", justifyContent: "center" }}>
                <Loader2
                  size={32}
                  className="spinner"
                  style={{ color: "#714B67", animation: "spin 1s linear infinite" }}
                />
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
                <p>No {activeTab.toLowerCase()} invoices found.</p>
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div className="transaction-card" key={inv.id}>
                  <div
                    className={`card-graphic ${inv.status === "PAID" ? "bg-mint" : "bg-purple"}`}
                    style={{ width: "80px", height: "80px", marginRight: "20px" }}
                  >
                    <FileText
                      size={32}
                      strokeWidth={1}
                      color={inv.status === "PAID" ? "#059669" : "#714B67"}
                    />
                  </div>
                  <div className="card-content">
                    <h3>Invoice #{inv.invoice_number}</h3>
                    <p style={{ margin: "0 0 8px 0" }}>
                      {new Date(inv.invoice_date).toLocaleDateString("en-IN")}
                    </p>
                    <div className="card-badges">
                      {inv.status === "PAID" ? (
                        <span
                          className="badge"
                          style={{ backgroundColor: "#D1FAE5", color: "#059669" }}
                        >
                          Paid
                        </span>
                      ) : (
                        <span
                          className="badge"
                          style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                        >
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="card-meta"
                    style={{
                      gap: "8px",
                      alignItems: "flex-end",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      className="amount"
                      style={{
                        color: inv.status === "PAID" ? "#9CA3AF" : "#111116",
                        fontWeight: "700",
                        fontSize: "1.2rem",
                      }}
                    >
                      ₹ {inv.total.toLocaleString("en-IN")}
                    </span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => navigate(`/portal/invoices/${inv.id}`)}
                        style={{
                          backgroundColor: "#F3F4F6",
                          color: "#4B5563",
                          border: "1px solid #E5E7EB",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "background-color 0.2s",
                        }}
                      >
                        <Eye size={16} /> View
                      </button>
                      {inv.status === "PAID" && (
                        <button
                          onClick={() => handlePrint(inv)}
                          style={{
                            backgroundColor: "#FFFFFF",
                            color: "#059669",
                            border: "1px solid #10B981",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.2s",
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="6 9 6 2 18 2 18 9"></polyline>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                            <rect x="6" y="14" width="12" height="8"></rect>
                          </svg>{" "}
                          Print
                        </button>
                      )}
                      {inv.status !== "PAID" && (
                        <button
                          onClick={() => handlePay(inv.id, inv.total)}
                          disabled={payingId === inv.id}
                          style={{
                            backgroundColor: "#714B67",
                            color: "white",
                            border: "none",
                            padding: "8px 20px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            opacity: payingId === inv.id ? 0.7 : 1,
                            boxShadow: "0 4px 6px -1px rgba(113, 75, 103, 0.3)",
                          }}
                          onMouseEnter={(e) => {
                            if (payingId !== inv.id) {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow =
                                "0 10px 15px -3px rgba(113, 75, 103, 0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (payingId !== inv.id) {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow =
                                "0 4px 6px -1px rgba(113, 75, 103, 0.3)";
                            }
                          }}
                        >
                          {payingId === inv.id ? (
                            <Loader2
                              size={16}
                              className="spinner"
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          ) : null}
                          {payingId === inv.id ? "Processing..." : "Pay Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showMockPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "40px",
              borderRadius: "24px",
              width: "400px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(113, 75, 103, 0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "24px",
              border: "2px solid rgba(113, 75, 103, 0.1)",
            }}
          >
            {mockPaymentStatus === "processing" ? (
              <>
                <Loader2
                  size={64}
                  color="#714B67"
                  style={{ animation: "spin 1.5s linear infinite" }}
                />
                <h2 style={{ margin: 0, color: "#111116" }}>Processing Payment...</h2>
                <p style={{ margin: 0, color: "#6B7280" }}>
                  Please wait while we securely process your cash transaction.
                </p>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "#D1FAE5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "scaleIn 0.3s ease-out",
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h2 style={{ margin: 0, color: "#111116" }}>Payment Successful!</h2>
                <p style={{ margin: 0, color: "#6B7280" }}>Your invoice has been settled.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Accountant specific dashboard focused on quick entries and analytics.
 */
function AccountantDashboard({ user }) {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getDashboardAnalytics()
      .then((res) => {
        setData(res.accountant);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (menu, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };
  const closeDropdowns = () => setActiveDropdown(null);

  return (
    <div className="dashboard-container" onClick={closeDropdowns}>
      <div className="dashboard-greeting" style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", margin: 0 }}>
          Hi, {user?.name || "Accountant"} 👋
        </h1>
        <p style={{ color: "#6B7280", margin: "8px 0 0 0", fontSize: "1rem" }}>
          Here is your financial overview for today.
        </p>
      </div>

      {/* The 4 Dropdown Menu Tabs */}
      <div
        className="dashboard-tabs"
        style={{
          gap: "24px",
          display: "flex",
          alignItems: "center",
          marginBottom: "32px",
          borderBottom: "1px solid #F3F4F6",
          paddingBottom: "12px",
          position: "relative",
          zIndex: 50,
        }}
      >
        {/* 1. SALES TAB */}
        <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${activeDropdown === "sales" ? "active" : ""}`}
            onClick={(e) => toggleDropdown("sales", e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: activeDropdown === "sales" ? "#111116" : "#9CA3AF",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Sales <ChevronDown size={14} />
          </button>
          {activeDropdown === "sales" && (
            <div
              className="mega-dropdown-menu"
              style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, marginTop: "8px" }}
            >
              <Link to="/sales-orders" onClick={closeDropdowns}>
                <ShoppingBag size={15} /> Sales order
              </Link>
              <Link to="/customer-invoices" onClick={closeDropdowns}>
                <FileText size={15} /> Sale Invoice
              </Link>
              <Link to="/payments" onClick={closeDropdowns}>
                <DollarSign size={15} /> Receipt
              </Link>
            </div>
          )}
        </div>

        {/* 2. PURCHASE TAB */}
        <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${activeDropdown === "purchase" ? "active" : ""}`}
            onClick={(e) => toggleDropdown("purchase", e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: activeDropdown === "purchase" ? "#111116" : "#9CA3AF",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Purchase <ChevronDown size={14} />
          </button>
          {activeDropdown === "purchase" && (
            <div
              className="mega-dropdown-menu"
              style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, marginTop: "8px" }}
            >
              <Link to="/purchase-orders" onClick={closeDropdowns}>
                <ShoppingCart size={15} /> Purchase Order
              </Link>
              <Link to="/vendor-bills" onClick={closeDropdowns}>
                <FileText size={15} /> Purchase Bill
              </Link>
              <Link to="/payments" onClick={closeDropdowns}>
                <DollarSign size={15} /> Payment
              </Link>
            </div>
          )}
        </div>

        {/* 3. ACCOUNT TAB */}
        <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${activeDropdown === "account" ? "active" : ""}`}
            onClick={(e) => toggleDropdown("account", e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: activeDropdown === "account" ? "#111116" : "#9CA3AF",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Account <ChevronDown size={14} />
          </button>
          {activeDropdown === "account" && (
            <div
              className="mega-dropdown-menu"
              style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, marginTop: "8px" }}
            >
              <Link to="/contacts" onClick={closeDropdowns}>
                <Users size={15} /> Contact
              </Link>
              <Link to="/products" onClick={closeDropdowns}>
                <Package size={15} /> Product
              </Link>
              <Link to="/analytic-accounts" onClick={closeDropdowns}>
                <Tag size={15} /> Analyticals
              </Link>
              <Link to="/budgets" onClick={closeDropdowns}>
                <PieChart size={15} /> Analytical Budget
              </Link>
              <Link to="/accounts" onClick={closeDropdowns}>
                <BookOpen size={15} /> Chart of Account
              </Link>
              <Link to="/journals" onClick={closeDropdowns}>
                <ListFilter size={15} /> Journals
              </Link>
              <Link to="/journal-entries" onClick={closeDropdowns}>
                <Layers size={15} /> Journal Entries
              </Link>
            </div>
          )}
        </div>

        {/* 4. REPORT TAB */}
        <div className="mega-dropdown-wrapper" style={{ position: "relative" }}>
          <button
            type="button"
            className={`tab ${activeDropdown === "report" ? "active" : ""}`}
            onClick={(e) => toggleDropdown("report", e)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "transparent",
              border: "none",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: activeDropdown === "report" ? "#111116" : "#9CA3AF",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Report <ChevronDown size={14} />
          </button>
          {activeDropdown === "report" && (
            <div
              className="mega-dropdown-menu"
              style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, marginTop: "8px" }}
            >
              <Link to="/reports/balance-sheet" onClick={closeDropdowns}>
                <BarChart3 size={15} /> Balancesheet
              </Link>
              <Link to="/reports/pnl" onClick={closeDropdowns}>
                <BarChart3 size={15} /> Profit and Loss
              </Link>
              <Link to="/reports/budget" onClick={closeDropdowns}>
                <PieChart size={15} /> Budget Report
              </Link>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "32px" }}>
        {/* Main Analytics Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Quick Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    color: "#4B5563",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Operating Cash
                </span>
                <div style={{ background: "#E0F2FE", padding: "8px", borderRadius: "8px" }}>
                  <DollarSign size={20} color="#0369A1" />
                </div>
              </div>
              <h2 style={{ fontSize: "2rem", color: "#111116", margin: 0, fontWeight: "800" }}>
                ₹ 1,240,500
              </h2>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    color: "#4B5563",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Net Income (MTD)
                </span>
                <div style={{ background: "#D1FAE5", padding: "8px", borderRadius: "8px" }}>
                  <Activity size={20} color="#059669" />
                </div>
              </div>
              <h2 style={{ fontSize: "2rem", color: "#111116", margin: 0, fontWeight: "800" }}>
                ₹ 384,200
              </h2>
            </div>

            <div
              style={{
                backgroundColor: "#F8FAFC",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    color: "#4B5563",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textTransform: "uppercase",
                  }}
                >
                  Pending Approvals
                </span>
                <div style={{ background: "#FCE7F3", padding: "8px", borderRadius: "8px" }}>
                  <ListFilter size={20} color="#BE185D" />
                </div>
              </div>
              <h2 style={{ fontSize: "2rem", color: "#111116", margin: 0, fontWeight: "800" }}>
                14 Drafts
              </h2>
            </div>
          </div>

          {/* Quick Actions (Add Data) */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E5E7EB",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", fontSize: "1.2rem", color: "#111116" }}>
              Quick Add Operations
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
              <button
                onClick={() => navigate("/customer-invoices/new")}
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#714B67",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <FileText size={24} /> New Invoice
              </button>
              <button
                onClick={() => navigate("/vendor-bills/new")}
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#017E84",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <Network size={24} /> New Bill
              </button>
              <button
                onClick={() => navigate("/journal-entries/new")}
                style={{
                  backgroundColor: "#F3F4F6",
                  color: "#D46243",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <Layers size={24} /> New Journal Entry
              </button>
              <button
                onClick={() => navigate("/reports/pnl")}
                style={{
                  backgroundColor: "#714B67",
                  color: "white",
                  border: "none",
                  padding: "16px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px -1px rgba(113, 75, 103, 0.4)",
                }}
              >
                <BarChart3 size={24} /> View Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Recent Activity) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #E5E7EB",
            }}
          >
            <h3
              style={{
                margin: "0 0 20px 0",
                fontSize: "1.2rem",
                color: "#111116",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Recent Activity
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#FCE7F3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#BE185D",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={16} />
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "0.9rem",
                      color: "#111116",
                      fontWeight: "600",
                    }}
                  >
                    Invoice #INV0004 Posted
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7280" }}>
                    2 hours ago by Admin
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#E0F2FE",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0369A1",
                    flexShrink: 0,
                  }}
                >
                  <Layers size={16} />
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "0.9rem",
                      color: "#111116",
                      fontWeight: "600",
                    }}
                  >
                    Journal Entry #JE012 Drafted
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7280" }}>
                    4 hours ago by You
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#D1FAE5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#059669",
                    flexShrink: 0,
                  }}
                >
                  <Network size={16} />
                </div>
                <div>
                  <p
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "0.9rem",
                      color: "#111116",
                      fontWeight: "600",
                    }}
                  >
                    Bill #BILL099 Confirmed
                  </p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7280" }}>Yesterday</p>
                </div>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "10px",
                background: "transparent",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                color: "#4B5563",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              View Audit Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Root Dashboard router component that selectively renders AdminDashboard, AccountantDashboard, or UserDashboard
 * based on the authenticated user's assigned role.
 *
 * @component
 * @returns {JSX.Element} Role-appropriate dashboard interface.
 */
export default function Dashboard() {
  const userStr = localStorage.getItem("valora_user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userRole = user?.role?.toLowerCase() || "";

  if (userRole === "contact") {
    return <UserDashboard user={user} />;
  }

  if (userRole === "accountant" || userRole === "user") {
    return <AccountantDashboard user={user} />;
  }

  return <AdminDashboard />;
}
