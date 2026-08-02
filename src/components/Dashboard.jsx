import React, { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import ProfileForm from "./ProfileForm.jsx";
import HoursTracker from "./HoursTracker.jsx";
import TopEarners from "./TopEarners.jsx";
import PayRateAdmin from "./PayRateAdmin.jsx";
import AdminOverview from "./AdminOverview.jsx";
import WorkersList from "./WorkersList.jsx";
import WorkerProfileView from "./WorkerProfileView.jsx";
import ManageAdmins from "./ManageAdmins.jsx";

export default function Dashboard({ user, onProfileUpdated }) {
  const isAdmin = user.role === "admin";
  const [view, setView] = useState(isAdmin ? "overview" : "dashboard");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  function goToView(id) {
    setSelectedWorkerId(null);
    setView(id);
  }

  function openWorkerProfile(workerId) {
    setSelectedWorkerId(workerId);
  }

  function backFromWorkerProfile() {
    setSelectedWorkerId(null);
  }

  return (
    <div className="dashboard-shell">
      <Sidebar role={user.role} active={view} onSelect={goToView} />

      <section className="dashboard-content">
        {selectedWorkerId ? (
          <WorkerProfileView
            workerId={selectedWorkerId}
            onBack={backFromWorkerProfile}
          />
        ) : (
          <>
            {view === "overview" && isAdmin && <AdminOverview />}
            {view === "workers" && isAdmin && (
              <WorkersList onSelectWorker={openWorkerProfile} />
            )}
            {view === "manage-admins" && isAdmin && (
              <ManageAdmins currentUserId={user.id} />
            )}
            {view === "settings" && isAdmin && <PayRateAdmin />}

            {view === "dashboard" && !isAdmin && <HoursTracker user={user} />}

            {view === "leaderboard" && (
              <TopEarners
                currentUserId={user.id}
                onSelectWorker={isAdmin ? openWorkerProfile : undefined}
              />
            )}
            {view === "profile" && (
              <ProfileForm user={user} onUpdated={onProfileUpdated} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
