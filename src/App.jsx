import React, { useEffect, useState } from "react";
import { getCurrentUser, logout } from "./services/dataService.js";
import Navbar from "./components/Navbar.jsx";
import Login from "./components/Login.jsx";
import SignUp from "./components/SignUp.jsx";
import Dashboard from "./components/Dashboard.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login"); // "login" | "signup"
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setChecked(true);
  }, []);

  function handleAuthed(u) {
    setUser(u);
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  function refreshUser() {
    setUser(getCurrentUser());
  }

  if (!checked) return null;

  return (
    <div className="app-shell">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="app-main">
        {!user ? (
          authView === "login" ? (
            <Login
              onSuccess={handleAuthed}
              switchToSignUp={() => setAuthView("signup")}
            />
          ) : (
            <SignUp
              onSuccess={handleAuthed}
              switchToLogin={() => setAuthView("login")}
            />
          )
        ) : (
          <Dashboard user={user} onProfileUpdated={refreshUser} />
        )}
      </main>
    </div>
  );
}
