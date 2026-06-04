import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { alertesApi } from "../api/client";
import Sidebar from "./Sidebar";

const TITLES = {
  "/": "Tableau de bord",
  "/equipements": "Gestion des equipements",
  "/ordres": "Ordres de travail",
  "/planning": "Planning des interventions",
  "/stock": "Stock & pieces de rechange",
  "/alertes": "Centre d&apos;alertes",
  "/utilisateurs": "Gestion des utilisateurs",
};

export default function Layout() {
  const { user, toast } = useAuth();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      alertesApi.liste()
        .then((r) => setUnread(r.data.filter((a) => !a.lue).length))
        .catch(() => {});
    }
  }, [user, location.pathname]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const title = TITLES[location.pathname] || "GMAO";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        unread={unread}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-4 md:px-6 lg:px-8 border-b border-line flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-panel2 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <div className="flex-1">
            <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-xs md:text-sm text-inkfaint mt-0.5">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className="pop fixed bottom-4 left-1/2 -translate-x-1/2 bg-teal text-[#06231f] px-5 py-3 rounded-xl font-semibold text-sm shadow-lg z-50"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
