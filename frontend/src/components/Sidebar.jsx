import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { ROLES } from "./ui";

const NAV = [
  { path: "/", label: "Tableau de bord", roles: ["admin", "responsable", "major", "technicien"], icon: "M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" },
  { path: "/equipements", label: "Equipements", roles: ["admin", "responsable", "major", "technicien"], icon: "M12 2l9 4.5v11L12 22l-9-4.5v-11zM12 2v20M3 6.5l9 4.5 9-4.5" },
  { path: "/ordres", label: "Ordres de travail", roles: ["admin", "responsable", "major", "technicien"], icon: "M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { path: "/planning", label: "Planning", roles: ["admin", "responsable", "technicien"], icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  { path: "/stock", label: "Stock & Pieces", roles: ["admin", "responsable", "technicien"], icon: "M21 8v13H3V8M1 3h22v5H1zM10 12h4" },
  { path: "/alertes", label: "Alertes", roles: ["admin", "responsable", "major", "technicien"], icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" },
  { path: "/utilisateurs", label: "Utilisateurs", roles: ["admin"], icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
];

const avatarColor = (role) =>
  role === "admin" ? "var(--violet)"
  : role === "responsable" ? "var(--blue)"
  : role === "major" ? "#06b6d4"
  : "var(--teal)";

// Sun icon for light mode
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

// Moon icon for dark mode
function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

export default function Sidebar({ unread, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <>
      {/* Sidebar container */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-64 flex-shrink-0
          bg-panel border-r border-line
          flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-tealdeep flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06231f" strokeWidth="2.2" strokeLinecap="round">
                <path d="M14 6l-3 3M8 8l-2 2 4 4M12 12l4 4 2-2" />
                <circle cx="6" cy="18" r="2" />
                <circle cx="18" cy="6" r="2" />
              </svg>
            </div>
            <div>
              <div className="font-display text-lg font-semibold leading-tight text-ink">GMAO</div>
              <div className="text-xs text-inkfaint">Clinique HUPSA</div>
            </div>
          </div>
          
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-panel2 text-inksoft transition-colors"
            aria-label="Fermer le menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {items.map((n) => (
            <NavLink
              key={n.path}
              to={n.path}
              end={n.path === "/"}
              className={({ isActive }) => `
                flex items-center gap-3 w-full text-left
                px-3 py-2.5 rounded-lg mb-1 relative
                font-medium text-sm transition-colors
                ${isActive
                  ? "bg-panel2 text-ink font-semibold"
                  : "text-inksoft hover:bg-panel2 hover:text-ink"
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-teal" />
                  )}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0"
                  >
                    <path d={n.icon} />
                  </svg>
                  <span className="flex-1 truncate">{n.label}</span>
                  {n.path === "/alertes" && unread > 0 && (
                    <span className="bg-red text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5">
                      {unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-line">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-3 text-inksoft hover:bg-panel2 hover:text-ink transition-colors text-sm font-medium"
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            <span>{theme === "dark" ? "Mode clair" : "Mode sombre"}</span>
          </button>

          {/* User info */}
          <div className="flex items-center gap-3 px-2 py-2">
            <div
              className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
              style={{ background: avatarColor(user.role), color: "#06231f" }}
            >
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-ink truncate">
                {user.prenom} {user.nom}
              </div>
              <div className="text-xs text-inkfaint truncate">
                {user.role === "major" && user.service ? user.service : ROLES[user.role]}
              </div>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            className="w-full mt-2 px-3 py-2 rounded-lg border border-line text-inksoft hover:bg-panel2 hover:text-ink transition-colors text-sm font-medium"
          >
            Deconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
