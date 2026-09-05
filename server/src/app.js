const express = require('express');
const cors = require('cors');
const analyticAccountsRoutes = require('./routes/analyticAccounts.routes');
const budgetsRoutes = require('./routes/budgets.routes');
const salesRoutes = require('./routes/sales.routes');
const invoicesRoutes = require('./routes/invoices.routes');
const paymentsRoutes = require('./routes/payments.routes');
const reportsRoutes = require('./routes/reports.routes');
const journalsRoutes = require('./routes/journals.routes');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/analytic-accounts', analyticAccountsRoutes);
app.use('/budgets', budgetsRoutes);
app.use('/sales-orders', salesRoutes);
app.use('/customer-invoices', invoicesRoutes);
app.use('/payments', paymentsRoutes);
app.use('/reports', reportsRoutes);
app.use('/journals', journalsRoutes);
app.use('/contacts', require('./routes/contacts'));
app.use('/products', require('./routes/products'));
app.use('/accounts', require('./routes/accounts'));
if (authRoutes) {
  app.use('/auth', authRoutes);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 404 Handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
