import { query } from "./_lib/db.js";
import { getAuthedUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });

  if (req.method === "GET") {
    const result = await query("SELECT value FROM settings WHERE key = 'pay_rate'");
    const rate = result.rows[0] ? Number(result.rows[0].value) : 0;
    return res.status(200).json({ payRate: rate });
  }

  if (req.method === "PUT") {
    if (authed.role !== "admin") {
      return res.status(403).json({ error: "Only an admin can change the pay rate." });
    }
    const { payRate } = req.body || {};
    if (payRate === undefined || Number(payRate) < 0) {
      return res.status(400).json({ error: "A valid pay rate is required." });
    }
    await query(
      `INSERT INTO settings (key, value) VALUES ('pay_rate', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [String(payRate)]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
