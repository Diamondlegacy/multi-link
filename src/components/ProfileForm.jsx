import React, { useState } from "react";
import { updateProfile } from "../services/dataService.js";

const MAX_DIMENSION = 300; // resize photos down to this before saving

export default function ProfileForm({ user, onUpdated }) {
  const [form, setForm] = useState({
    fullName: user.profile.fullName || "",
    phone: user.profile.phone || "",
    dob: user.profile.dob || "",
    avatarUrl: user.profile.avatarUrl || "",
    bankName: user.profile.bankName || "",
    bankAccountName: user.profile.bankAccountName || "",
    bankAccountNumber: user.profile.bankAccountNumber || "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [photoError, setPhotoError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Resize so the file we store isn't huge
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        update("avatarUrl", resizedDataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await updateProfile(user.id, form);
      setSaved(true);
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card">
      <h2 className="card-title">Your profile</h2>
      <p className="card-subtitle">
        Keep this up to date — it's used for identification and payment.
      </p>

      <div className="avatar-row">
        <div className="avatar-preview">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="Profile" />
          ) : (
            <span>{(form.fullName || user.email || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <label className="btn btn-ghost-light" style={{ cursor: "pointer" }}>
            Change photo
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
          </label>
          {photoError && <p className="field-error">{photoError}</p>}
        </div>
      </div>

      <p className="card-subtitle" style={{ marginTop: 4 }}>
        Signed in as <strong>{user.email}</strong>
      </p>

      <form onSubmit={handleSubmit} className="grid-form">
        <label className="field">
          <span>Full name</span>
          <input
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Phone number</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+234 800 000 0000"
            required
          />
        </label>

        <label className="field">
          <span>Date of birth</span>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => update("dob", e.target.value)}
            required
          />
        </label>

        <div className="field-divider">Bank details</div>

        <label className="field">
          <span>Bank name</span>
          <input
            value={form.bankName}
            onChange={(e) => update("bankName", e.target.value)}
            placeholder="e.g. GTBank, Access Bank"
            required
          />
        </label>

        <label className="field">
          <span>Account holder name</span>
          <input
            value={form.bankAccountName}
            onChange={(e) => update("bankAccountName", e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span>Account number</span>
          <input
            value={form.bankAccountNumber}
            onChange={(e) => update("bankAccountNumber", e.target.value)}
            required
          />
        </label>

        {error && <p className="field-error">{error}</p>}
        {saved && <p className="field-success">Profile saved.</p>}

        <button className="btn btn-primary" type="submit">
          Save profile
        </button>
      </form>
    </div>
  );
}
