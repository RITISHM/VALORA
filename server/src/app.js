const express = require("express");
const cors = require("cors");
const analyticAccountsRoutes = require("./routes/analyticAccounts.routes");
const budgetsRoutes = require("./routes/budgets.routes");
const salesRoutes = require("./routes/sales.routes");
const invoicesRoutes = require("./routes/invoices.routes");
const vendorBillsRoutes = require("./routes/vendorBills.routes");
const paymentsRoutes = require("./routes/payments.routes");
const reportsRoutes = require("./routes/reports.routes");
const journalsRoutes = require("./routes/journals.routes");
const journalEntriesRoutes = require("./routes/journalEntries.routes");
const inventoryRoutes = require("./routes/inventory.routes");
const portalRoutes = require("./routes/portal.routes");
const contactsRoutes = require("./routes/contacts.routes");
const productsRoutes = require("./routes/products.routes");
const accountsRoutes = require("./routes/accounts.routes");
const authRoutes = require("./routes/auth");
const purchaseOrdersRoutes = require("./routes/purchaseOrders.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

// Routes
app.use("/contacts", contactsRoutes);
app.use("/products", productsRoutes);
app.use("/accounts", accountsRoutes);
app.use("/analytic-accounts", analyticAccountsRoutes);
app.use("/budgets", budgetsRoutes);
app.use("/sales-orders", salesRoutes);
app.use("/customer-invoices", invoicesRoutes);
app.use("/purchase-orders", purchaseOrdersRoutes);
app.use("/vendor-bills", vendorBillsRoutes);
app.use("/payments", paymentsRoutes);
app.use("/reports", reportsRoutes);
app.use("/journals", journalsRoutes);
app.use("/journal-entries", journalEntriesRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/portal", portalRoutes);
if (authRoutes) {
  app.use("/auth", authRoutes);
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
