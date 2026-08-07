import React, { useEffect, useState } from "react";
import { getMyLinksAsync, releaseLinkAsync, claimLinkAsync } from "../services/dataService.js";
import SecretField from "./SecretField.jsx";

export default function LinksTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  function refresh() {
    setLoading(true);
    getMyLinksAsync()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleRelease(id) {
    setBusyId(id);
    setError("");
    try {
      await releaseLinkAsync(id);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClaim(id) {
    setBusyId(id);
    setError("");
    try {
      await claimLinkAsync(id);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div>
      {error && <p className="field-error" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">My links</h2>
        <p className="card-subtitle">
          Assigned to you for the day. Can't work today? Release it so it can be picked up.
        </p>

        {data.myLinks.length === 0 && (
          <p className="empty-row" style={{ padding: "16px 0" }}>
            No link assigned to you right now.
          </p>
        )}

        <div className="link-cards">
          {data.myLinks.map((link) => (
            <div className="link-card" key={link.id}>
              <div className="link-card-header">
                <span className="link-card-name">{link.accountName}</span>
                <span className="status-badge status-approved">assigned</span>
              </div>
              <p className="link-card-date">For {link.assignedDate}</p>
              <div className="link-card-body">
                <div className="secret-field">
                  <span className="secret-label">Email</span>
                  <div className="secret-row">
                    <span className="secret-value">{link.accountEmail}</span>
                  </div>
                </div>
                <SecretField label="Account password" value={link.accountPassword} />
                <SecretField label="Remote desktop password" value={link.rdpPassword} />
                {link.notes && (
                  <div className="secret-field">
                    <span className="secret-label">Notes</span>
                    <div className="secret-row">
                      <span className="secret-value">{link.notes}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                className="btn btn-reject"
                style={{ marginTop: 14 }}
                disabled={busyId === link.id}
                onClick={() => handleRelease(link.id)}
              >
                Release for today
              </button>
            </div>
          ))}
        </div>
      </div>

      {data.hasReleaseBadge && (
        <div className="card">
          <h2 className="card-title">Released links</h2>
          <p className="card-subtitle">
            Released by other workers today. Claim one to have it assigned to you,
            with full credentials revealed once claimed.
          </p>

          {data.releasedLinks.length === 0 && (
            <p className="empty-row" style={{ padding: "16px 0" }}>
              Nothing released right now.
            </p>
          )}

          <div className="link-cards">
            {data.releasedLinks.map((link) => (
              <div className="link-card link-card-released" key={link.id}>
                <div className="link-card-header">
                  <span className="link-card-name">{link.accountName}</span>
                  <span className="status-badge status-pending">released</span>
                </div>
                <p className="link-card-date">
                  Was for {link.assignedDate} — released by {link.releasedBy}
                </p>
                <div className="secret-field">
                  <span className="secret-label">Email</span>
                  <div className="secret-row">
                    <span className="secret-value">{link.accountEmail}</span>
                  </div>
                </div>
                {link.notes && (
                  <div className="secret-field">
                    <span className="secret-label">Notes</span>
                    <div className="secret-row">
                      <span className="secret-value">{link.notes}</span>
                    </div>
                  </div>
                )}
                <button
                  className="btn btn-approve"
                  style={{ marginTop: 14 }}
                  disabled={busyId === link.id}
                  onClick={() => handleClaim(link.id)}
                >
                  Claim this link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
