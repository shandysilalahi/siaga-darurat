// lib/auth.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'siaga-darurat-dev-secret-CHANGE-ME';
const JWT_EXPIRES_IN = '30d';

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, first_name: user.first_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Express middleware: mewajibkan token valid di header Authorization: Bearer <token>
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login kembali.' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });

  req.user = payload;
  next();
}

// Middleware opsional: membatasi endpoint untuk role tertentu
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: `Hanya untuk akun ${role}.` });
    }
    next();
  };
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken, requireAuth, requireRole };
