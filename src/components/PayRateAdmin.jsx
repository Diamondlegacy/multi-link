import React, { useEffect, useState } from "react";
import { getPayRateAsync, setPayRateAsync } from "../services/dataService.js";

export default function PayRateAdmin() {
  const [rate, setRateInput] = useState(0);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPayRateAsync()
      .then(setRateInput)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await setPayRateAsync(rate);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h2 className="card-title">Admin settings</h2>
      <p className="card-subtitle">
        This rate applies to every worker's pay calculation.
      </p>

      <form onSubmit={handleSubmit} className="rate-form">
        <label className="field">
          <span>Pay per hour</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={rate}
            onChange={(e) => setRateInput(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Update rate
        </button>
        {saved && <p className="field-success">Rate updated.</p>}
        {error && <p className="field-error">{error}</p>}
      </form>
    </div>
  );
}
