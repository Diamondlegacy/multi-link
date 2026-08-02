import React, { useEffect, useState } from "react";
import { getAdminWorkersAsync } from "../services/dataService.js";

export default function WorkersList({ onSelectWorker }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminWorkersAsync()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2 className="card-title">Workers</h2>
      <p className="card-subtitle">Click a name to view their full profile.</p>

      {error && <p className="field-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Hours</th>
              <th>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-row">No workers yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <button
                    className="link-btn"
                    onClick={() => onSelectWorker(r.id)}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt="" className="table-avatar" />
                    ) : (
                      <span className="table-avatar table-avatar-fallback">
                        {r.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {r.name}
                  </button>
                </td>
                <td style={{ textTransform: "capitalize" }}>{r.role}</td>
                <td>{r.totalHours.toFixed(1)}</td>
                <td>{formatMoney(r.totalEarnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatMoney(n) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(n || 0);
}
