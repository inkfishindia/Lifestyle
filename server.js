require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Auth gate (optional — skip if no ACCESS_PASSWORD set)
if (process.env.ACCESS_PASSWORD) {
  app.post('/api/auth', (req, res) => {
    if (req.body.password === process.env.ACCESS_PASSWORD) {
      res.cookie('auth', 'ok', { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
      return res.json({ ok: true });
    }
    res.status(401).json({ error: 'Wrong password' });
  });

  app.use('/api', (req, res, next) => {
    if (req.path === '/auth') return next();
    if (req.cookies?.auth === 'ok') return next();
    res.status(401).json({ error: 'Not authenticated' });
  });
}

// API routes
app.use('/api/chat', require('./server/routes/chat'));
app.use('/api/agents', require('./server/routes/agents'));

// Static files — serve app/ directory
app.use(express.static(path.join(__dirname, 'app')));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app', 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Lifestyle server running on port ${PORT}`);
  });
}

module.exports = app;
