import React from "react";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark">
  <svg width="30" height="30" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#E8A63C" />
    <path d="M16 42 V22 L24 34 L32 22 L40 34 L48 22 V42" stroke="#12213A" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
</span>
        <span className="navbar-name">multi-link</span>
      </div>
      {user && (
        <div className="navbar-user">
          {user.profile?.avatarUrl && (
            <img
              src={user.profile.avatarUrl}
              alt=""
              className="navbar-avatar"
            />
          )}
          <span className="navbar-username">
            {user.profile?.fullName || user.email}
          </span>
          <span className={`navbar-role role-${user.role}`}>{user.role}</span>
          <button className="btn btn-ghost" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
