import React from "react";

const WORKER_NAV = [
  { id: "dashboard", label: "Dashboard" },
  { id: "leaderboard", label: "Top Earners" },
  { id: "profile", label: "My Profile" },
];

const ADMIN_NAV = [
  { id: "overview", label: "Overview" },
  { id: "workers", label: "Workers" },
  { id: "leaderboard", label: "Top Earners" },
  { id: "manage-admins", label: "Manage Admins" },
  { id: "profile", label: "My Profile" },
  { id: "settings", label: "Pay Rate" },
];

export default function Sidebar({ role, active, onSelect }) {
  const items = role === "admin" ? ADMIN_NAV : WORKER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">
        {role === "admin" ? "Admin" : "Worker"}
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${active === item.id ? "sidebar-link-active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
