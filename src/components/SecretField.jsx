import React, { useState } from "react";

export default function SecretField({ label, value }) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard access can fail in some browser contexts; fail quietly
    }
  }

  return (
    <div className="secret-field">
      <span className="secret-label">{label}</span>
      <div className="secret-row">
        <span className="secret-value">{visible ? value : "•".repeat(Math.min(value.length, 14) || 8)}</span>
        <button type="button" className="secret-btn" onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide" : "Show"}
        </button>
        <button type="button" className="secret-btn" onClick={handleCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
