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

  async function handleRelease(linkId) {
    setBusyId(linkId);
    setError("");
    try {
      await releaseLinkAsync(linkId);
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleClaim(assignmentId) {
    setBusyId(assignmentId);
    setError("");
    try {
      await claimLinkAsync(assignmentId);
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
          Assigned to you until you release it or an admin reassigns it.
        </p>

        {data.myLinks.length === 0 && (
          <p className="empty-row" style={{ padding: "16px 0" }}>
            No link assigned to you right now.
          </p>
        )}

        <div className="link-cards">
          {data.myLinks.map((link) => (
            <div className="link-card" key={link.assignmentId}>
              <div className="link-card-header">
                <span className="link-card-name">{link.accountName}</span>
                <span className="status-badge status-approved">assigned</span>
              </div>
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
                disabled={busyId === link.linkId}
                onClick={() => handleRelease(link.linkId)}
              >
                Release this link
              </button>
            </div>
          ))}
        </div>
      </div>

      {data.hasReleaseBadge && (
        <div className="card">
          <h2 className="card-title">Released links</h2>
          <p className="card-subtitle">
            Released by other workers. Claim one to have it assigned to you,
            with full credentials revealed once claimed.
          </p>

          {data.releasedLinks.length === 0 && (
            <p className="empty-row" style={{ padding: "16px 0" }}>
              Nothing released right now.
            </p>
          )}

          <div className="link-cards">
            {data.releasedLinks.map((link) => (
              <div className="link-card link-card-released" key={link.assignmentId}>
                <div className="link-card-header">
                  <span className="link-card-name">{link.accountName}</span>
                  <span className="status-badge status-pending">released</span>
                </div>
                <p className="link-card-date">Released by {link.releasedBy}</p>
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
                  disabled={busyId === link.assignmentId}
                  onClick={() => handleClaim(link.assignmentId)}
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
