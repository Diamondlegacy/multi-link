import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;
// 32-byte (64 hex char) key used only to encrypt bank account numbers.
// Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const BANK_KEY = process.env.BANK_ENCRYPTION_KEY;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(
      `${name} is not set. Add it in Vercel -> Project -> Settings -> Environment Variables.`
    );
  }
}

// ---------- passwords ----------
export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ---------- session tokens ----------
export function signToken(user) {
  requireEnv("JWT_SECRET", JWT_SECRET);
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  requireEnv("JWT_SECRET", JWT_SECRET);
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Pulls the user out of the Authorization: Bearer <token> header.
// Returns null if missing/invalid — callers should respond 401.
export function getAuthedUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  return verifyToken(token);
}

// Returns the authed user if they're an admin, otherwise null.
// Route handlers should respond 401 (not logged in) or 403 (not admin)
// based on which of getAuthedUser / requireAdmin comes back empty.
export function requireAdmin(req) {
  const authed = getAuthedUser(req);
  if (!authed || authed.role !== "admin") return null;
  return authed;
}

// ---------- bank account encryption (AES-256-GCM) ----------
export function encryptBankNumber(plainText) {
  requireEnv("BANK_ENCRYPTION_KEY", BANK_KEY);
  if (!plainText) return "";
  const key = Buffer.from(BANK_KEY, "hex");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // store iv + authTag + ciphertext together, base64-encoded
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptBankNumber(stored) {
  requireEnv("BANK_ENCRYPTION_KEY", BANK_KEY);
  if (!stored) return "";
  const key = Buffer.from(BANK_KEY, "hex");
  const raw = Buffer.from(stored, "base64");
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
// Same AES-256-GCM encryption, reused for link account/RDP passwords —
// no reason to maintain two copies of the same crypto code.
export const encryptSecret = encryptBankNumber;
export const decryptSecret = decryptBankNumber;
