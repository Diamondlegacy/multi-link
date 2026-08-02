import { query } from "./_lib/db.js";
import { getAuthedUser, encryptBankNumber } from "./_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });

  if (req.method === "GET") {
    const result = await query(
      `SELECT full_name, phone, dob, avatar_url, bank_name, bank_account_name
       FROM users WHERE id = $1`,
      [authed.sub]
    );
    const row = result.rows[0];
    if (!row) return res.status(404).json({ error: "User not found." });
    return res.status(200).json({
      fullName: row.full_name || "",
      phone: row.phone || "",
      dob: row.dob || "",
      avatarUrl: row.avatar_url || "",
      bankName: row.bank_name || "",
      bankAccountName: row.bank_account_name || "",
    });
  }

  if (req.method === "PUT") {
    const {
      fullName,
      phone,
      dob,
      avatarUrl,
      bankName,
      bankAccountName,
      bankAccountNumber,
    } = req.body || {};

    // Rough safety net: base64 images can get large. 2MB of base64 text
    // is plenty for a small profile photo without bloating the database.
    if (avatarUrl && avatarUrl.length > 2_000_000) {
      return res.status(400).json({ error: "That image is too large. Try a smaller photo." });
    }

    const encryptedNumber =
      bankAccountNumber !== undefined
        ? encryptBankNumber(bankAccountNumber)
        : undefined;

    await query(
      `UPDATE users SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         dob = COALESCE($3, dob),
         avatar_url = COALESCE($4, avatar_url),
         bank_name = COALESCE($5, bank_name),
         bank_account_name = COALESCE($6, bank_account_name),
         bank_account_number_encrypted = COALESCE($7, bank_account_number_encrypted)
       WHERE id = $8`,
      [
        fullName,
        phone,
        dob,
        avatarUrl,
        bankName,
        bankAccountName,
        encryptedNumber,
        authed.sub,
      ]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
