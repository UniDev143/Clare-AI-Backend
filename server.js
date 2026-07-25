require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// ── CONNECT DATABASE ───────────────────────────────────────
connectDB();

// ── GLOBAL MIDDLEWARE ──────────────────────────────────────
app.use(cors({
  origin: 'http://localhost:5173',   // React frontend
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));       // parse JSON bodies
app.use(express.urlencoded({ extended: true })); // parse form data

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/brands',   require('./routes/brands'));
app.use('/api/products', require('./routes/products'));
app.use('/api/scans',    require('./routes/scans'));

// ── HEALTH CHECK ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'Claré AI',
    timestamp: new Date().toISOString()
  });
});

// ── 404 HANDLER ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── GLOBAL ERROR HANDLER ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Claré AI backend running on port ${PORT}`);
});