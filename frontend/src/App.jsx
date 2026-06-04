import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { alertesApi } from "./api/client";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Equipements from "./pages/Equipements";
import Ordres from "./pages/Ordres";
import Planning from "./pages/Planning";
import Stock from "./pages/Stock";
import Alertes from "./pages/Alertes";
import Utilisateurs from "./pages/Utilisateurs";

const PAGES = { dashboard: Dashboard, equipements: Equipements, ordres: Ordres, planning: Planning, stock: Stock, alertes: Alertes, utilisateurs: Utilisateurs };
const TITLES = {
  dashboard: "Tableau de bord", equipements: "Gestion des équipements", ordres: "Ordres de travail",
  planning: "Planning des interventions", stock: "Stock & pièces de rechange",
  alertes: "Centre d'alertes", utilisateurs: "Gestion des utilisateurs",
};

export default function App() {
  const { user, toast } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) alertesApi.liste().then((r) => setUnread(r.data.filter((a) => !a.lue).length)).catch(() => {});
  }, [user, page]);

  if (!user) return <Login />;
  const Page = PAGES[page];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar page={page} setPage={setPage} unread={unread} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ padding: "22px 32px", borderBottom: "1px solid #27313f" }}>
          <h1 className="font-display" style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>{TITLES[page]}</h1>
          <p style={{ fontSize: 13, color: "#5d6b7a", marginTop: 2 }}>
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </header>
        <main style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          <Page />
        </main>
      </div>
      {toast && (
        <div className="pop" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--teal)", color: "#06231f", padding: "11px 20px", borderRadius: 11,
          fontWeight: 600, fontSize: 14, boxShadow: "0 10px 30px rgba(0,0,0,.4)", zIndex: 200,
        }}>{toast}</div>
      )}
    </div>
  );
}
