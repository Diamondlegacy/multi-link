import React, { useEffect, useState } from "react";
import { getTopEarnersAsync } from "../services/dataService.js";

export default function TopEarners({ currentUserId, onSelectWorker }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTopEarnersAsync()
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <h2 className="card-title">Top earners</h2>
      <p className="card-subtitle">
        Ranked by total earnings, all-time.
        {onSelectWorker && " Click a name to view their profile."}
      </p>

      {error && <p className="field-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ol className="leaderboard">
          {rows.length === 0 && <li className="empty-row">No data yet.</li>}
          {rows.map((row, i) => (
            <li
              key={row.userId}
              className={`leaderboard-row ${
                row.userId === currentUserId ? "leaderboard-you" : ""
              }`}
            >
              <span className="leaderboard-rank">{i + 1}</span>
              <span className="leaderboard-name">
                {onSelectWorker ? (
                  <button
                    className="link-btn"
                    onClick={() => onSelectWorker(row.userId)}
                  >
                    {row.name}
                  </button>
                ) : (
                  row.name
                )}
                {row.userId === currentUserId && (
                  <span className="you-badge">you</span>
                )}
              </span>
              <span className="leaderboard-hours">
                {row.totalHours.toFixed(1)} hrs
              </span>
              <span className="leaderboard-amount">
                {formatMoney(row.totalEarnings)}
              </span>
            </li>
          ))}
        </ol>
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
