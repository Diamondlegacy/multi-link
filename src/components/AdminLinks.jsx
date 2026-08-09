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

  const [picks, setPicks] = useState({});

  function refresh() {
    setLoading(true);
    Promise.all([getAdminLinksAsync(), getAdminWorkersAsync()])
      .then(([linkRows, workerRows]) => {
        setLinks(linkRows);
        setWorkers(workerRows.filter((w) => w.role === "worker"));
        const initialPicks = {};
        linkRows.forEach((l) => {
          const active = l.slots.filter((s) => s.status === "active");
          initialPicks[l.id] = {
            slot1: active[0]?.workerId || "",
            slot2: active[1]?.workerId || "",
          };
        });
        setPicks(initialPicks);
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

  function updatePick(linkId, slot, value) {
    setPicks((prev) => ({ ...prev, [linkId]: { ...prev[linkId], [slot]: value } }));
  }

  async function handleAssign(linkId) {
    const pick = picks[linkId] || {};
    const workerIds = [pick.slot1, pick.slot2].filter(Boolean);
    if (workerIds.length === 0) {
      setError("Pick at least one worker before saving.");
      return;
    }
    setError("");
    try {
      await assignLinkAsync(linkId, workerIds);
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
          ever stored, and are only shown to whoever it's assigned to.
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
        <p className="card-subtitle">Assign each link to up to 2 workers.</p>
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
                </div>
                <p className="link-card-date">{link.accountEmail}</p>
                {link.notes && <p className="link-card-date">Notes: {link.notes}</p>}

                {link.slots.length > 0 && (
                  <div className="link-card-body">
                    {link.slots.map((s) => (
                      <div key={s.assignmentId} className="secret-row">
                        <span className="secret-value">{s.workerName}</span>
                        <span className={`status-badge status-${s.status === "active" ? "approved" : "pending"}`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="assign-row">
                  <select
                    className="week-picker"
                    value={picks[link.id]?.slot1 || ""}
                    onChange={(e) => updatePick(link.id, "slot1", e.target.value)}
                  >
                    <option value="">Worker slot 1: none</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <select
                    className="week-picker"
                    value={picks[link.id]?.slot2 || ""}
                    onChange={(e) => updatePick(link.id, "slot2", e.target.value)}
                  >
                    <option value="">Worker slot 2: none</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-approve" onClick={() => handleAssign(link.id)}>
                    Save assignment
                  </button>
                  <button className="btn btn-reject" onClick={() => handleDelete(link.id)}>
                    Delete link
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
