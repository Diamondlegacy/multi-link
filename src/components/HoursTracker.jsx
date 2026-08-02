import React, { useEffect, useState } from "react";
import {
  logHoursAsync,
  getHoursForUserAsync,
  deleteHoursEntryAsync,
  getPayRateAsync,
} from "../services/dataService.js";

export default function HoursTracker({ user }) {
  const [entries, setEntries] = useState([]);
  const [rate, setRate] = useState(0);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const [entriesData, rateData] = await Promise.all([
        getHoursForUserAsync(),
        getPayRateAsync(),
      ]);
      setEntries(entriesData);
      setRate(rateData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!hours || Number(hours) <= 0) return;
    setError("");
    try {
      await logHoursAsync({ date, hours, note });
      setHours("");
      setNote("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteHoursEntryAsync(id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const totalPay = totalHours * rate;

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 className="card-title">Hours & pay</h2>
      <p className="card-subtitle">
        Current rate: <strong>{formatMoney(rate)}</strong> / hour
        {rate === 0 && " — not set yet, ask your admin"}
      </p>

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
          <span>Total hours logged</span>
          <span>{totalHours.toFixed(2)}</span>
        </div>
        <div className="stub-perforation" />
        <div className="stub-row stub-total">
          <span>Total earned</span>
          <span>{formatMoney(totalPay)}</span>
        </div>
      </div>

      <table className="entries-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours</th>
            <th>Note</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 && (
            <tr>
              <td colSpan="4" className="empty-row">
                No hours logged yet.
              </td>
            </tr>
          )}
          {entries.map((e) => (
            <tr key={e.id}>
              <td>{e.date}</td>
              <td>{e.hours}</td>
              <td>{e.note || "—"}</td>
              <td>
                <button
                  className="link-btn danger"
                  onClick={() => handleDelete(e.id)}
                >
                  Remove
                </button>
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
