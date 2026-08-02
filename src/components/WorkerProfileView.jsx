import React, { useEffect, useState } from "react";
import { getWorkerProfileAsync } from "../services/dataService.js";

export default function WorkerProfileView({ workerId, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkerProfileAsync(workerId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [workerId]);

  return (
    <div>
      <button className="link-btn" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to workers
      </button>

      {loading && <div className="card">Loading...</div>}
      {error && <div className="card"><p className="field-error">{error}</p></div>}

      {data && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="avatar-row">
              <div className="avatar-preview">
                {data.profile.avatarUrl ? (
                  <img src={data.profile.avatarUrl} alt="" />
                ) : (
                  <span>{(data.profile.fullName || data.email || "?").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="card-title" style={{ margin: 0 }}>
                  {data.profile.fullName || data.email}
                </h2>
                <p className="card-subtitle" style={{ margin: 0 }}>
                  {data.email} — {data.role}
                </p>
              </div>
            </div>

            <div className="stub" style={{ marginTop: 20 }}>
              <div className="stub-row">
                <span>Total hours</span>
                <span>{data.totalHours.toFixed(2)}</span>
              </div>
              <div className="stub-perforation" />
              <div className="stub-row stub-total">
                <span>Total earned</span>
                <span>{formatMoney(data.totalEarnings)}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <h2 className="card-title">Contact & bank details</h2>
            <p className="card-subtitle">Visible to admins only, for payroll purposes.</p>
            <dl className="detail-list">
              <div><dt>Phone</dt><dd>{data.profile.phone || "—"}</dd></div>
              <div><dt>Date of birth</dt><dd>{data.profile.dob || "—"}</dd></div>
              <div><dt>Bank name</dt><dd>{data.profile.bankName || "—"}</dd></div>
              <div><dt>Account holder</dt><dd>{data.profile.bankAccountName || "—"}</dd></div>
              <div><dt>Account number</dt><dd>{data.profile.bankAccountNumber || "—"}</dd></div>
            </dl>
          </div>

          <div className="card">
            <h2 className="card-title">Hours log</h2>
            <table className="entries-table">
              <thead>
                <tr><th>Date</th><th>Hours</th><th>Note</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.hoursEntries.length === 0 && (
                  <tr><td colSpan="4" className="empty-row">No hours logged yet.</td></tr>
                )}
                {data.hoursEntries.map((e) => (
                  <tr key={e.id}>
                    <td>{e.date}</td>
                    <td>{e.hours}</td>
                    <td>{e.note || "—"}</td>
                    <td>
                      <span className={`status-badge status-${e.status}`}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
