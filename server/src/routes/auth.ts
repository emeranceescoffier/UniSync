import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import getPool from '../db';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();
  const hash = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hash]);
  res.status(201).send({ message: 'Registered' });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  if (result.rowCount === 0) return res.status(400).send({ error: 'No user' });
  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).send({ error: 'Wrong password' });
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
  res.send({ token });
});

export default router;
