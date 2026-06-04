import { useEffect, useState } from "react";
import { planningApi } from "../api/client";
import { Card, Badge, Loader } from "../components/ui";

export default function Planning() {
  const [list, setList] = useState(null);
  useEffect(() => { planningApi.liste().then((r) => setList(r.data)); }, []);
  if (!list) return <Loader />;

  const fmt = (d) => new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" });
  const fmtH = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fadeup">
      <Card style={{ padding: 0 }}>
        {list.map((p, i) => (
          <div key={p.id} style={{ display: "flex", gap: 18, padding: "18px 22px", borderBottom: i < list.length - 1 ? "1px solid #27313f" : "none", alignItems: "center" }}>
            <div style={{ textAlign: "center", minWidth: 64 }}>
              <div className="font-mono" style={{ fontSize: 12, color: "#5d6b7a", textTransform: "capitalize" }}>{fmt(p.date_debut)}</div>
              <div className="font-display" style={{ fontSize: 20, fontWeight: 600, color: "var(--teal)" }}>{fmtH(p.date_debut)}</div>
            </div>
            <div style={{ width: 1, alignSelf: "stretch", background: "#27313f" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{p.ordre_titre}</div>
              <div style={{ fontSize: 13, color: "#9aa7b5", marginTop: 2 }}>
                <span className="font-mono">{p.ordre_numero}</span> · {p.technicien_nom} · {fmtH(p.date_debut)}–{fmtH(p.date_fin)}
                {p.recurrent && <span style={{ marginLeft: 8 }}>🔁 récurrent</span>}
              </div>
            </div>
            <Badge color={p.statut === "termine" ? "var(--green)" : "var(--blue)"}>{p.statut === "termine" ? "Terminé" : "Planifié"}</Badge>
          </div>
        ))}
        {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#5d6b7a" }}>Aucune intervention planifiée.</div>}
      </Card>
    </div>
  );
}
