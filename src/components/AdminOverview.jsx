import React, { useEffect, useState } from "react";
import { getAdminOverviewAsync } from "../services/dataService.js";

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOverviewAsync()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card">Loading...</div>;
  if (error) return <div className="card"><p className="field-error">{error}</p></div>;

  return (
    <div className="overview-grid">
      <div className="card stat-card">
        <p className="stat-label">All-time worker earnings</p>
        <p className="stat-value">{formatMoney(data.allTime.earnings)}</p>
        <p className="stat-sub">{data.allTime.hours.toFixed(1)} hours logged</p>
      </div>

      <div className="card stat-card">
        <p className="stat-label">This week's worker earnings</p>
        <p className="stat-value">{formatMoney(data.thisWeek.earnings)}</p>
        <p className="stat-sub">{data.thisWeek.hours.toFixed(1)} hours logged</p>
      </div>

      <div className="card stat-card stat-card-highlight">
        <p className="stat-label">Your cut this week ({data.adminCutPercent}%)</p>
        <p className="stat-value stat-value-gold">{formatMoney(data.adminCutThisWeek)}</p>
        <p className="stat-sub">Based on this week's worker earnings</p>
      </div>

      <div className="card stat-card">
        <p className="stat-label">Active workers</p>
        <p className="stat-value">{data.workerCount}</p>
        <p className="stat-sub">Current pay rate: {formatMoney(data.payRate)}/hr</p>
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
