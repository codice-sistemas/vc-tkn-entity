import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export function signToken(payload: object, opts?: jwt.SignOptions) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h', ...(opts || {}) });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

// Example: minimal credential check, replace with DB lookup
export async function verifyCredentials(email: string, password: string) {
  // For production, lookup user in DB. Here we accept a single admin user.
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password';
  if (email === adminEmail && password === adminPassword) {
    return { id: 1, email };
  }
  return null;
}