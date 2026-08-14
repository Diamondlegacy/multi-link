import React from "react";
import {
  LayoutDashboard,
  ClipboardCheck,
  Link2,
  Users,
  Trophy,
  ShieldCheck,
  UserCircle,
  Wallet,
} from "lucide-react";

const WORKER_NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "links", label: "Links", icon: Link2 },
  { id: "leaderboard", label: "Top Earners", icon: Trophy },
  { id: "profile", label: "My Profile", icon: UserCircle },
];

const ADMIN_NAV = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "approvals", label: "Approvals", icon: ClipboardCheck },
  { id: "links", label: "Links", icon: Link2 },
  { id: "workers", label: "Workers", icon: Users },
  { id: "leaderboard", label: "Top Earners", icon: Trophy },
  { id: "manage-admins", label: "Manage Admins", icon: ShieldCheck },
  { id: "profile", label: "My Profile", icon: UserCircle },
  { id: "settings", label: "Pay Rate", icon: Wallet },
];

export default function Sidebar({ role, active, onSelect }) {
  const items = role === "admin" ? ADMIN_NAV : WORKER_NAV;

  return (
    <aside className="sidebar">
      <div className="sidebar-section-label">
        {role === "admin" ? "Admin" : "Worker"}
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-link ${active === item.id ? "sidebar-link-active" : ""}`}
              onClick={() => onSelect(item.id)}
            >
              <Icon className="sidebar-icon" size={18} strokeWidth={2} />
              <span className="sidebar-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
