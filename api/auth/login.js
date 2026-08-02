import { query } from "../_lib/db.js";
import { verifyPassword, signToken } from "../_lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};
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
  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        fullName: user.full_name || "",
        phone: user.phone || "",
        dob: user.dob || "",
        avatarUrl: user.avatar_url || "",
        bankName: user.bank_name || "",
        bankAccountName: user.bank_account_name || "",
      },
    },
  });
}
