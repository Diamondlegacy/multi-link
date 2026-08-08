import { query } from "./_lib/db.js";
import { hashPassword, verifyPassword, signToken } from "./_lib/auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, email, password } = req.body || {};

  if (action === "signup") {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await query("SELECT id FROM users WHERE lower(email) = lower($1)", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }

    const countResult = await query("SELECT COUNT(*)::int AS count FROM users");
    const role = countResult.rows[0].count === 0 ? "admin" : "worker";

    const passwordHash = await hashPassword(password);
    const inserted = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, full_name, phone, dob, avatar_url, bank_name, bank_account_name`,
      [email, passwordHash, role]
    );

    const user = inserted.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: toClientUser(user) });
  }

  if (action === "login") {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const result = await query(
      `SELECT id, email, password_hash, role, full_name, phone, dob, avatar_url, bank_name, bank_account_name
       FROM users WHERE lower(email) = lower($1)`,
      [email]
    );

    const user = result.rows[0];
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const token = signToken(user);
    return res.status(200).json({ token, user: toClientUser(user) });
  }

  return res.status(400).json({ error: "action must be 'signup' or 'login'." });
}

function toClientUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    profile: {
      fullName: row.full_name || "",
      phone: row.phone || "",
      dob: row.dob || "",
      avatarUrl: row.avatar_url || "",
      bankName: row.bank_name || "",
      bankAccountName: row.bank_account_name || "",
    },
  };
}
