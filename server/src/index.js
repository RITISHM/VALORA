require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const productsRoutes = require('./routes/products');
const accountsRoutes = require('./routes/accounts');
const journalsRoutes = require('./routes/journals');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/contacts', contactsRoutes);
app.use('/products', productsRoutes);
app.use('/accounts', accountsRoutes);
app.use('/journals', journalsRoutes);

// Generic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
