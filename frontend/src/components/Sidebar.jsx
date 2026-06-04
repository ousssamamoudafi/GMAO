import { useAuth } from "../context/AuthContext";
import { ROLES } from "./ui";

const NAV = [
  { key: "dashboard", label: "Tableau de bord", roles: ["admin", "responsable", "major", "technicien"], icon: "M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" },
  { key: "equipements", label: "Équipements", roles: ["admin", "responsable", "major", "technicien"], icon: "M12 2l9 4.5v11L12 22l-9-4.5v-11zM12 2v20M3 6.5l9 4.5 9-4.5" },
  { key: "ordres", label: "Ordres de travail", roles: ["admin", "responsable", "major", "technicien"], icon: "M9 11l3 3 8-8M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { key: "planning", label: "Planning", roles: ["admin", "responsable", "technicien"], icon: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
  { key: "stock", label: "Stock & Pièces", roles: ["admin", "responsable", "technicien"], icon: "M21 8v13H3V8M1 3h22v5H1zM10 12h4" },
  { key: "alertes", label: "Alertes", roles: ["admin", "responsable", "major", "technicien"], icon: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" },
  { key: "utilisateurs", label: "Utilisateurs", roles: ["admin"], icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
];

const avatarColor = (role) =>
  role === "admin" ? "var(--violet)"
  : role === "responsable" ? "var(--blue)"
  : role === "major" ? "#06b6d4"
  : "var(--teal)";

export default function Sidebar({ page, setPage, unread }) {
  const { user, logout } = useAuth();
  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div style={{
      width: 248, flexShrink: 0, background: "#141b24", borderRight: "1px solid #27313f",
      display: "flex", flexDirection: "column", height: "100vh",
    }}>
      <div style={{ padding: "22px 22px 18px", borderBottom: "1px solid #27313f", display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: "linear-gradient(135deg, var(--teal), var(--tealdeep))",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06231f" strokeWidth="2.2" strokeLinecap="round">
            <path d="M14 6l-3 3M8 8l-2 2 4 4M12 12l4 4 2-2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" />
          </svg>
        </div>
        <div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 600, lineHeight: 1 }}>GMAO</div>
          <div style={{ fontSize: 11, color: "#5d6b7a" }}>Clinique HUPSA</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "14px 12px", overflowY: "auto" }}>
        {items.map((n) => {
          const active = page === n.key;
          return (
            <button key={n.key} onClick={() => setPage(n.key)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 10, marginBottom: 3, position: "relative",
              border: "none", background: active ? "#1a2330" : "transparent",
              color: active ? "#e6edf3" : "#9aa7b5", fontWeight: active ? 600 : 500, fontSize: 14,
            }}>
              {active && <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 3, background: "var(--teal)" }} />}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={n.icon} />
              </svg>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.key === "alertes" && unread > 0 && (
                <span style={{
                  background: "var(--red)", color: "#fff", fontSize: 11, fontWeight: 700,
                  minWidth: 18, height: 18, borderRadius: 99, display: "flex",
                  alignItems: "center", justifyContent: "center", padding: "0 5px",
                }}>{unread}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: 14, borderTop: "1px solid #27313f" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "8px 6px" }}>
          <div style={{
            width: 36, height: 36, borderRadius: 99, flexShrink: 0, background: avatarColor(user.role),
            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#06231f", fontSize: 14,
          }}>{user.prenom[0]}{user.nom[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.prenom} {user.nom}</div>
            <div style={{ fontSize: 11.5, color: "#5d6b7a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.role === "major" && user.service ? user.service : ROLES[user.role]}
            </div>
          </div>
        </div>
        <button onClick={logout} style={{
          width: "100%", marginTop: 6, padding: "7px 13px", borderRadius: 9,
          background: "transparent", color: "#9aa7b5", border: "1px solid #27313f", fontSize: 13, fontWeight: 600,
        }}>Déconnexion</button>
      </div>
    </div>
  );
}
