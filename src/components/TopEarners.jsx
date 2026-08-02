import React, { useEffect, useState } from "react";
import { getTopEarnersAsync } from "../services/dataService.js";
import WeekPicker from "./WeekPicker.jsx";

export default function TopEarners({ currentUserId, onSelectWorker }) {
  const [week, setWeek] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    getTopEarnersAsync(week)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [week]);

  const rows = data?.rows || [];

  return (
    <div className="card">
      <div className="card-header-row">
        <div>
          <h2 className="card-title">Top earners</h2>
          <p className="card-subtitle">
            Only workers with approved earnings that week are shown.
            {onSelectWorker && " Click a name to view their profile."}
          </p>
        </div>
        <WeekPicker selectedWeek={week} onChange={setWeek} />
      </div>

      {error && <p className="field-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ol className="leaderboard">
          {rows.length === 0 && (
            <li className="empty-row">No approved earnings for this week yet.</li>
          )}
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
