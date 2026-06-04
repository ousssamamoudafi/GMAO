import { useEffect, useState } from "react";
import { alertesApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, Loader } from "../components/ui";

const ICONS = { stock_bas: "📦", garantie: "📅", panne: "⚠️" };
const COLORS = { stock_bas: "var(--orange)", garantie: "var(--amber)", panne: "var(--red)" };

export default function Alertes() {
  const { notify } = useAuth();
  const [list, setList] = useState(null);
  const charger = () => alertesApi.liste().then((r) => setList(r.data));
  useEffect(() => { charger(); }, []);

  const marquerLue = async (id) => { await alertesApi.marquerLue(id); charger(); };
  const toutLire = async () => { await alertesApi.toutLire(); notify("Toutes les alertes marquées lues"); charger(); };

  if (!list) return <Loader />;

  return (
    <div className="fadeup">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: "#9aa7b5" }}>{list.filter((a) => !a.lue).length} alerte(s) non lue(s)</div>
        <Btn variant="ghost" small onClick={toutLire}>Tout marquer comme lu</Btn>
      </div>
      {list.map((a) => (
        <Card key={a.id} style={{ padding: "15px 18px", marginBottom: 10, display: "flex", gap: 14, alignItems: "center", opacity: a.lue ? 0.6 : 1, borderLeft: `3px solid ${COLORS[a.type_alerte]}` }}>
          <div style={{ fontSize: 22 }}>{ICONS[a.type_alerte]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: a.lue ? 500 : 600, fontSize: 14.5 }}>{a.message}</div>
            <div style={{ fontSize: 12, color: "#5d6b7a", marginTop: 2 }}>
              {a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : ""} · {a.type_alerte.replace("_", " ")}
            </div>
          </div>
          {!a.lue && <Btn variant="soft" small onClick={() => marquerLue(a.id)}>Marquer lu</Btn>}
        </Card>
      ))}
      {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#5d6b7a" }}>Aucune alerte.</div>}
    </div>
  );
}
