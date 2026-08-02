import React, { useEffect, useState } from "react";
import { getAdminOverviewAsync } from "../services/dataService.js";
import WeekPicker from "./WeekPicker.jsx";

export default function AdminOverview() {
  const [week, setWeek] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!week) return;
    setLoading(true);
    getAdminOverviewAsync(week)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [week]);

  if (error) return <div className="card"><p className="field-error">{error}</p></div>;
  if (loading || !data) return <div className="card">Loading...</div>;

  return (
    <div>
      <div className="card-header-row" style={{ marginBottom: 20 }}>
        <div>
          <p className="card-subtitle" style={{ margin: 0 }}>
            {data.pendingApprovalsCount > 0
              ? `${data.pendingApprovalsCount} hours entr${data.pendingApprovalsCount === 1 ? "y" : "ies"} waiting for your approval`
              : "All caught up on approvals"}
          </p>
        </div>
        <WeekPicker selectedWeek={week} onChange={setWeek} />
      </div>

      <div className="overview-grid">
        <div className="card stat-card">
          <p className="stat-label">All-time worker earnings (approved)</p>
          <p className="stat-value">{formatMoney(data.allTime.earnings)}</p>
          <p className="stat-sub">{data.allTime.hours.toFixed(1)} hours logged</p>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Week {data.week.weekNumber} worker earnings</p>
          <p className="stat-value">{formatMoney(data.week.earnings)}</p>
          <p className="stat-sub">{data.week.hours.toFixed(1)} approved hours</p>
        </div>

        <div className="card stat-card stat-card-highlight">
          <p className="stat-label">Your cut, week {data.week.weekNumber} ({data.adminCutPercent}%)</p>
          <p className="stat-value stat-value-gold">{formatMoney(data.adminCutThisWeek)}</p>
          <p className="stat-sub">Based on that week's approved earnings</p>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Active workers</p>
          <p className="stat-value">{data.workerCount}</p>
          <p className="stat-sub">Current pay rate: {formatMoney(data.payRate)}/hr</p>
        </div>
      </div>
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
