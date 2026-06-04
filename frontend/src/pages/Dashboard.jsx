import { useEffect, useState } from "react";
import { dashboardApi, reportsApi } from "../api/client";
import { Card, Btn, Loader, STATUTS_EQ, STATUTS_OT } from "../components/ui";

function Stat({ label, value, sub, color }) {
  return (
    <Card style={{ padding: "18px 20px", flex: 1 }}>
      <div style={{ fontSize: 12.5, color: "#9aa7b5", fontWeight: 500 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 34, fontWeight: 600, color: color || "#e6edf3", margin: "4px 0 2px", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#5d6b7a" }}>{sub}</div>
    </Card>
  );
}

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { dashboardApi.stats().then((r) => setS(r.data)); }, []);
  if (!s) return <Loader />;

  const otEntries = Object.keys(STATUTS_OT).map((k) => ({ k, ...STATUTS_OT[k], n: s.ot_par_statut[k] || 0 }));
  const maxN = Math.max(...otEntries.map((r) => r.n), 1);

  const exporterPDF = async () => {
    setBusy(true);
    try { await reportsApi.rapportDashboard(); } finally { setBusy(false); }
  };

  return (
    <div className="fadeup">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Btn variant="soft" onClick={exporterPDF} disabled={busy}>
          {busy ? "Génération…" : "📄 Exporter en PDF"}
        </Btn>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <Stat label="Équipements" value={s.equipements_total} sub={`${s.equipements_par_statut.en_panne} en panne`} color="var(--teal)" />
        <Stat label="OT actifs" value={s.ot_actifs} sub={`${s.ot_total} au total`} color="var(--blue)" />
        <Stat label="Pièces en alerte" value={s.pieces_stock_bas} sub={`${s.pieces_total} références`} color="var(--orange)" />
        <Stat label="Alertes non lues" value={s.alertes_non_lues} sub="à traiter" color="var(--red)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        <Card style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>Répartition des ordres de travail</h3>
          {otEntries.map((r) => (
            <div key={r.k} style={{ marginBottom: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: "#9aa7b5" }}>{r.label}</span>
                <span className="font-mono" style={{ fontWeight: 600 }}>{r.n}</span>
              </div>
              <div style={{ height: 8, background: "#1a2330", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(r.n / maxN) * 100}%`, background: r.color, borderRadius: 99, transition: "width .6s" }} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 18 }}>État du parc d'équipements</h3>
          {Object.keys(STATUTS_EQ).map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
              <span style={{ width: 10, height: 10, borderRadius: 99, background: STATUTS_EQ[k].color }} />
              <span style={{ flex: 1, fontSize: 13.5, color: "#9aa7b5" }}>{STATUTS_EQ[k].label}</span>
              <span className="font-mono" style={{ fontWeight: 600, fontSize: 14 }}>{s.equipements_par_statut[k]}</span>
            </div>
          ))}
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #27313f", fontSize: 12.5, color: "#5d6b7a" }}>
            Taux de disponibilité :
            <span className="font-mono" style={{ color: "var(--green)", fontWeight: 700, marginLeft: 6, fontSize: 14 }}>{s.taux_disponibilite}%</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
