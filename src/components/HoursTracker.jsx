import React, { useEffect, useState } from "react";
import {
  logHoursAsync,
  getHoursForUserAsync,
  deleteHoursEntryAsync,
  getPayRateAsync,
} from "../services/dataService.js";
import WeekPicker from "./WeekPicker.jsx";

export default function HoursTracker({ user }) {
  const [week, setWeek] = useState(null);
  const [entries, setEntries] = useState([]);
  const [rate, setRate] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh(weekToLoad) {
    if (!weekToLoad) return;
    setLoading(true);
    try {
      const [hoursData, rateData] = await Promise.all([
        getHoursForUserAsync(weekToLoad),
        getPayRateAsync(),
      ]);
      setEntries(hoursData.entries);
      setRate(rateData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(week);
  }, [week]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!hours || Number(hours) <= 0) return;
    setError("");
    try {
      await logHoursAsync({ date, hours, note });
      setHours("");
      setNote("");
      refresh(week);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteHoursEntryAsync(id);
      refresh(week);
    } catch (err) {
      setError(err.message);
    }
  }

  const approvedHours = entries
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => sum + e.hours, 0);
  const pendingHours = entries
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.hours, 0);
  const approvedPay = approvedHours * rate;

  return (
    <div className="card">
      <div className="card-header-row">
        <div>
          <h2 className="card-title">Hours & pay</h2>
          <p className="card-subtitle">
            Current rate: <strong>{formatMoney(rate)}</strong> / hour
            {rate === 0 && " — not set yet, ask your admin"}
          </p>
        </div>
        <WeekPicker selectedWeek={week} onChange={setWeek} />
      </div>

      <form onSubmit={handleAdd} className="hours-form">
        <label className="field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Hours worked</span>
          <input
            type="number"
            min="0"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            required
          />
        </label>
        <label className="field field-wide">
          <span>Note (optional)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button className="btn btn-primary" type="submit">
          Log hours
        </button>
      </form>

      {error && <p className="field-error">{error}</p>}

      <div className="stub">
        <div className="stub-row">
          <span>Approved hours this week</span>
          <span>{approvedHours.toFixed(2)}</span>
        </div>
        {pendingHours > 0 && (
          <div className="stub-row">
            <span>Pending approval</span>
            <span>{pendingHours.toFixed(2)} hrs</span>
          </div>
        )}
        <div className="stub-perforation" />
        <div className="stub-row stub-total">
          <span>Earned this week</span>
          <span>{formatMoney(approvedPay)}</span>
        </div>
      </div>

      <table className="entries-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours</th>
            <th>Note</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {!loading && entries.length === 0 && (
            <tr>
              <td colSpan="5" className="empty-row">
                No hours logged this week.
              </td>
            </tr>
          )}
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.hours}</td>
              <td>{e.note || "—"}</td>
              <td>
                <span className={`status-badge status-${e.status}`}>{e.status}</span>
              </td>
              <td>
                {e.status === "pending" && (
                  <button
                    className="link-btn danger"
                    onClick={() => handleDelete(e.id)}
                  >
                    Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
