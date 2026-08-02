import React, { useEffect, useState } from "react";
import { getPendingApprovalsAsync, decideHoursAsync } from "../services/dataService.js";

export default function PendingApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    setLoading(true);
    getPendingApprovalsAsync()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDecision(id, action) {
    setBusyId(id);
    setError("");
    try {
      await decideHoursAsync(id, action);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Approvals</h2>
      <p className="card-subtitle">
        These hours won't count toward a worker's pay or the leaderboard
        until you approve them.
      </p>

      {error && <p className="field-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="entries-table">
          <thead>
            <tr>
              <th>Worker</th>
              <th>Date</th>
              <th>Hours</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-row">Nothing waiting for approval.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.worker.name}</td>
                <td>{r.date}</td>
                <td>{r.hours}</td>
                <td>{r.note || "—"}</td>
                <td className="approval-actions">
                  <button
                    className="btn btn-approve"
                    disabled={busyId === r.id}
                    onClick={() => handleDecision(r.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-reject"
                    disabled={busyId === r.id}
                    onClick={() => handleDecision(r.id, "reject")}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
