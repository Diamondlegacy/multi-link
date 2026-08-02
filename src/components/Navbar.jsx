import React from "react";

export default function Navbar({ user, onLogout }) {
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-mark">M</span>
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
