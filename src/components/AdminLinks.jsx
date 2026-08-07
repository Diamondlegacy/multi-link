import React, { useEffect, useState } from "react";
import {
  getAdminLinksAsync,
  createLinkAsync,
  assignLinkAsync,
  deleteLinkAsync,
  getAdminWorkersAsync,
} from "../services/dataService.js";

export default function AdminLinks() {
  const [links, setLinks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    accountName: "",
    accountEmail: "",
    accountPassword: "",
    rdpPassword: "",
    notes: "",
  });
  const [creating, setCreating] = useState(false);

  const [assignPicks, setAssignPicks] = useState({});

  function refresh() {
    setLoading(true);
    Promise.all([getAdminLinksAsync(), getAdminWorkersAsync()])
      .then(([linkRows, workerRows]) => {
        setLinks(linkRows);
        setWorkers(workerRows.filter((w) => w.role === "worker"));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createLinkAsync(form);
      setForm({ accountName: "", accountEmail: "", accountPassword: "", rdpPassword: "", notes: "" });
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function updatePick(linkId, field, value) {
    setAssignPicks((prev) => ({
      ...prev,
      [linkId]: { ...prev[linkId], [field]: value },
    }));
  }

  async function handleAssign(linkId) {
    const pick = assignPicks[linkId];
    if (!pick?.workerId || !pick?.date) {
      setError("Pick a worker and a date before assigning.");
      return;
    }
    setError("");
    try {
      await assignLinkAsync(linkId, pick);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(linkId) {
    setError("");
    try {
      await deleteLinkAsync(linkId);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">Add a new link</h2>
        <p className="card-subtitle">
          The account and remote desktop passwords are encrypted before they're
          ever stored, and are only shown to the worker it's assigned to.
        </p>
        <form onSubmit={handleCreate} className="grid-form">
          <label className="field">
            <span>Account name</span>
            <input
              value={form.accountName}
              onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Account email</span>
            <input
              type="email"
              value={form.accountEmail}
              onChange={(e) => setForm((f) => ({ ...f, accountEmail: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Account password</span>
            <input
              value={form.accountPassword}
              onChange={(e) => setForm((f) => ({ ...f, accountPassword: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span>Remote desktop password</span>
            <input
              value={form.rdpPassword}
              onChange={(e) => setForm((f) => ({ ...f, rdpPassword: e.target.value }))}
              required
            />
          </label>
          <label className="field field-wide">
            <span>Notes (optional)</span>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
          {error && <p className="field-error">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? "Adding..." : "Add link"}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="card-title">All links</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="link-cards">
            {links.length === 0 && (
              <p className="empty-row" style={{ padding: "16px 0" }}>No links yet.</p>
            )}
            {links.map((link) => (
              <div className="link-card" key={link.id}>
                <div className="link-card-header">
                  <span className="link-card-name">{link.accountName}</span>
                  <span className={`status-badge status-${link.status === "assigned" ? "approved" : link.status === "released" ? "pending" : "rejected"}`}>
                    {link.status}
                  </span>
                </div>
                <p className="link-card-date">{link.accountEmail}</p>
                {link.worker && (
                  <p className="link-card-date">
                    {link.status === "released" ? "Was" : "Currently"} assigned to{" "}
                    <strong>{link.worker.name}</strong>
                    {link.assignedDate && ` for ${link.assignedDate}`}
                  </p>
                )}
                {link.notes && <p className="link-card-date">Notes: {link.notes}</p>}

                <div className="assign-row">
                  <select
                    className="week-picker"
                    value={assignPicks[link.id]?.workerId || ""}
                    onChange={(e) => updatePick(link.id, "workerId", e.target.value)}
                  >
                    <option value="">Assign to...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <input
                    type="date"
                    className="week-picker"
                    value={assignPicks[link.id]?.date || ""}
                    onChange={(e) => updatePick(link.id, "date", e.target.value)}
                  />
                  <button className="btn btn-approve" onClick={() => handleAssign(link.id)}>
                    Assign
                  </button>
                  <button className="btn btn-reject" onClick={() => handleDelete(link.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
