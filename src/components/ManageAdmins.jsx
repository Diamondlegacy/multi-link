import React, { useEffect, useState } from "react";
import { getAdminWorkersAsync, setUserRoleAsync } from "../services/dataService.js";

export default function ManageAdmins({ currentUserId }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    getAdminWorkersAsync()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleRole(user) {
    const newRole = user.role === "admin" ? "worker" : "admin";
    try {
      await setUserRoleAsync(user.id, newRole);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Manage admins</h2>
      <p className="card-subtitle">
        Any admin can promote a worker to admin, or step someone down —
        the same way group admins work on WhatsApp.
      </p>

      {error && <p className="field-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td style={{ textTransform: "capitalize" }}>{r.role}</td>
                <td>
                  {r.id === currentUserId ? (
                    <span className="card-subtitle">That's you</span>
                  ) : (
                    <button className="link-btn" onClick={() => toggleRole(r)}>
                      {r.role === "admin" ? "Remove admin" : "Make admin"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
