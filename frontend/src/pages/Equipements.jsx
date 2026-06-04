import { useEffect, useState, useMemo } from "react";
import api, { equipementsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, Badge, Modal, Loader, STATUTS_EQ, STATUTS_OT } from "../components/ui";

const PAGE_SIZE = 20;

export default function Equipements() {
  const { user, notify } = useAuth();
  const [list, setList] = useState(null);
  const [services, setServices] = useState([]);
  const [q, setQ] = useState("");
  const [filtStatut, setFiltStatut] = useState("tous");
  const [filtService, setFiltService] = useState("tous");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

  const charger = () => equipementsApi.liste().then((r) => setList(r.data));
  useEffect(() => {
    charger();
    api.get("/equipements/services").then((r) => setServices(r.data));
  }, []);
  useEffect(() => { setPage(1); }, [q, filtStatut, filtService]);

  const ouvrir = async (id) => {
    const { data } = await equipementsApi.detail(id);
    setDetail(data);
  };
  const changerStatut = async (id, statut) => {
    await equipementsApi.changerStatut(id, statut);
    notify("Statut mis à jour");
    setDetail((d) => ({ ...d, statut }));
    charger();
  };

  const filtered = useMemo(() => {
    if (!list) return [];
    return list.filter((e) => {
      const m = !q || (`${e.nom || ""} ${e.marque || ""} ${e.modele || ""} ${e.numero_serie || ""} ${e.local || ""} ${e.description_local || ""}`)
        .toLowerCase().includes(q.toLowerCase());
      const s = filtStatut === "tous" || e.statut === filtStatut;
      const v = filtService === "tous" || e.service === filtService;
      return m && s && v;
    });
  }, [list, q, filtStatut, filtService]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!list) return <Loader />;
  const isMajor = user.role === "major";

  return (
    <div className="fadeup">
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Rechercher (nom, marque, codification, local…)" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 2, minWidth: 240 }} />
        {!isMajor && (
          <select value={filtService} onChange={(e) => setFiltService(e.target.value)} style={{ flex: 1, minWidth: 180 }}>
            <option value="tous">Tous les services</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={filtStatut} onChange={(e) => setFiltStatut(e.target.value)} style={{ width: 180 }}>
          <option value="tous">Tous les statuts</option>
          {Object.keys(STATUTS_EQ).map((k) => <option key={k} value={k}>{STATUTS_EQ[k].label}</option>)}
        </select>
      </div>

      <div style={{ fontSize: 13, color: "#5d6b7a", marginBottom: 10 }}>
        {filtered.length} équipement{filtered.length > 1 ? "s" : ""}
        {isMajor && <span> · <span style={{ color: "#06b6d4" }}>scope : {user.service}</span></span>}
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1.1fr .9fr 110px", padding: "13px 20px", borderBottom: "1px solid #27313f", fontSize: 12, color: "#5d6b7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <div>Équipement</div><div>Service</div><div>Localisation</div><div>Statut</div><div></div>
        </div>
        {pageItems.map((e) => (
          <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.1fr 1.1fr .9fr 110px", padding: "13px 20px", borderBottom: "1px solid #27313f", alignItems: "center", fontSize: 14 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.nom}</div>
              <div className="font-mono" style={{ fontSize: 11.5, color: "#5d6b7a" }}>{e.numero_serie}{e.marque ? ` · ${e.marque}` : ""}</div>
            </div>
            <div style={{ color: "#9aa7b5", fontSize: 13, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.service || "—"}</div>
            <div style={{ color: "#9aa7b5", fontSize: 13, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.localisation || "—"}</div>
            <div><Badge color={STATUTS_EQ[e.statut].color}>{STATUTS_EQ[e.statut].label}</Badge></div>
            <div style={{ textAlign: "right" }}><Btn variant="soft" small onClick={() => ouvrir(e.id)}>Détails</Btn></div>
          </div>
        ))}
        {pageItems.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#5d6b7a" }}>Aucun équipement trouvé.</div>}
      </Card>

      {pageCount > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13 }}>
          <Btn variant="soft" small disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>‹ Précédent</Btn>
          <span style={{ padding: "0 12px", color: "#9aa7b5" }}>Page {page} / {pageCount}</span>
          <Btn variant="soft" small disabled={page === pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>Suivant ›</Btn>
        </div>
      )}

      {detail && (
        <Modal wide title={detail.nom} onClose={() => setDetail(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", marginBottom: 20 }}>
            {[["Marque", detail.marque], ["Modèle", detail.modele], ["Codification", detail.numero_serie],
              ["N° série fabricant", detail.numero_serie_fabricant], ["Service", detail.service],
              ["Département", detail.departement], ["Étage", detail.etage],
              ["Local", [detail.local, detail.description_local].filter(Boolean).join(" · ")],
              ["Fournisseur", detail.fournisseur], ["Année fabrication", detail.annee_fabrication],
              ["Fin de garantie", detail.garantie_fin ? new Date(detail.garantie_fin).toLocaleDateString("fr-FR") : null]]
              .filter(([, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 12, color: "#5d6b7a", marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
                </div>
              ))}
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: "#5d6b7a", marginBottom: 8 }}>Changer le statut</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.keys(STATUTS_EQ).map((k) => (
                <button key={k} onClick={() => changerStatut(detail.id, k)} style={{
                  padding: "7px 13px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: detail.statut === k ? `1px solid ${STATUTS_EQ[k].color}` : "1px solid #27313f",
                  background: detail.statut === k ? `color-mix(in srgb, ${STATUTS_EQ[k].color} 16%, transparent)` : "#1a2330",
                  color: detail.statut === k ? STATUTS_EQ[k].color : "#9aa7b5",
                }}>{STATUTS_EQ[k].label}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: "#5d6b7a", marginBottom: 8 }}>Historique des interventions</div>
            {(detail.historique || []).map((o) => (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#1a2330", borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                <span className="font-mono" style={{ color: "#9aa7b5", fontSize: 12 }}>{o.numero}</span>
                <span style={{ flex: 1 }}>{o.titre}</span>
                <Badge color={STATUTS_OT[o.statut].color}>{STATUTS_OT[o.statut].label}</Badge>
              </div>
            ))}
            {(!detail.historique || detail.historique.length === 0) && <div style={{ color: "#5d6b7a", fontSize: 13 }}>Aucune intervention enregistrée.</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
