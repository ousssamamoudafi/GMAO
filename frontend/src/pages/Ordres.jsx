import { useEffect, useState } from "react";
import { ordresApi, equipementsApi, utilisateursApi, reportsApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, Badge, Modal, Field, Loader, STATUTS_OT, PRIORITES } from "../components/ui";

// Transitions autorisées (miroir de la machine à états du backend / diagramme UML)
const TRANSITIONS = {
  ouvert: [{ to: "en_cours", label: "Démarrer" }, { to: "annule", label: "Annuler" }],
  en_cours: [{ to: "attente_pieces", label: "Bloquer (pièce manquante)" }, { to: "termine", label: "Clôturer" }, { to: "annule", label: "Annuler" }],
  attente_pieces: [{ to: "en_cours", label: "Pièces reçues → reprendre" }, { to: "annule", label: "Annuler" }],
  termine: [], annule: [],
};

export default function Ordres() {
  const { user, notify } = useAuth();
  const [list, setList] = useState(null);
  const [filt, setFilt] = useState("tous");
  const [detail, setDetail] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [equipements, setEquipements] = useState([]);
  const [techs, setTechs] = useState([]);
  const canCreate = user.role !== "technicien";

  const charger = () => ordresApi.liste().then((r) => setList(r.data));
  useEffect(() => {
    charger();
    equipementsApi.liste().then((r) => setEquipements(r.data));
    if (user.role === "admin") utilisateursApi.liste().then((r) => setTechs(r.data.filter((u) => u.role === "technicien")));
  }, []);

  // Pour responsable/technicien : on déduit les techniciens depuis les OT (l'endpoint users est admin-only)
  useEffect(() => {
    if (user.role !== "admin" && list) {
      const seen = {};
      list.forEach((o) => { if (o.technicien_id) seen[o.technicien_id] = { id: o.technicien_id, prenom: o.technicien_nom?.split(" ")[0] || "Tech", nom: o.technicien_nom?.split(" ")[1] || "", specialite: "" }; });
      setTechs((t) => (t.length ? t : Object.values(seen)));
    }
  }, [list]);

  const transition = async (ot, t, extra = {}) => {
    try {
      const { data } = await ordresApi.transition(ot.id, { statut: t.to, ...extra });
      notify(`${ot.numero} → ${STATUTS_OT[t.to].label}`);
      setDetail(data);
      charger();
    } catch (e) {
      notify(e.response?.data?.msg || "Transition refusée");
    }
  };

  const creer = async (form) => {
    const { data } = await ordresApi.creer(form);
    notify(`${data.numero} créé`);
    setShowNew(false);
    charger();
  };

  if (!list) return <Loader />;
  const filtered = list.filter((o) => filt === "tous" || o.statut === filt);

  return (
    <div className="fadeup">
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select value={filt} onChange={(e) => setFilt(e.target.value)} style={{ width: 210 }}>
          <option value="tous">Tous les statuts</option>
          {Object.keys(STATUTS_OT).map((k) => <option key={k} value={k}>{STATUTS_OT[k].label}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        {canCreate && <Btn onClick={() => setShowNew(true)}>+ Nouvel ordre de travail</Btn>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px,1fr))", gap: 14 }}>
        {filtered.map((o) => (
          <Card key={o.id} style={{ padding: 18, cursor: "pointer" }}>
            <div onClick={() => ordresApi.detail(o.id).then((r) => setDetail(r.data))}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <span className="font-mono" style={{ fontSize: 12, color: "#5d6b7a" }}>{o.numero}</span>
                <Badge color={PRIORITES[o.priorite].color}>{PRIORITES[o.priorite].label}</Badge>
              </div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{o.titre}</div>
              <div style={{ fontSize: 13, color: "#9aa7b5", marginBottom: 14 }}>{o.equipement_nom || "—"} · {o.technicien_nom || "Non assigné"}</div>
              <Badge color={STATUTS_OT[o.statut].color}>{STATUTS_OT[o.statut].label}</Badge>
            </div>
          </Card>
        ))}
      </div>

      {detail && <OTDetail ot={detail} onClose={() => setDetail(null)} transition={transition} techs={techs} />}
      {showNew && (
        <Modal title="Nouvel ordre de travail" onClose={() => setShowNew(false)}>
          <NewOTForm equipements={equipements} onSubmit={creer} />
        </Modal>
      )}
    </div>
  );
}

function OTDetail({ ot, onClose, transition, techs }) {
  const { notify } = useAuth();
  const trans = TRANSITIONS[ot.statut];
  const [obs, setObs] = useState(ot.observations || "");
  const [cout, setCout] = useState(ot.cout_main_oeuvre || 0);
  const [assignTo, setAssignTo] = useState(ot.technicien_id || "");

  const doTransition = (t) => {
    if (t.to === "en_cours" && ot.statut === "ouvert" && !assignTo) { notify("Assignez d'abord un technicien"); return; }
    let extra = {};
    if (t.to === "en_cours" && ot.statut === "ouvert") extra.technicien_id = Number(assignTo);
    if (t.to === "termine") extra = { ...extra, observations: obs, cout_main_oeuvre: Number(cout) || 0 };
    transition(ot, t, extra);
  };

  return (
    <Modal wide title={ot.titre} onClose={onClose}>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        <span className="font-mono" style={{ fontSize: 13, color: "#9aa7b5" }}>{ot.numero}</span>
        <Badge color={STATUTS_OT[ot.statut].color}>{STATUTS_OT[ot.statut].label}</Badge>
        <Badge color={PRIORITES[ot.priorite].color}>{PRIORITES[ot.priorite].label}</Badge>
        <div style={{ flex: 1 }} />
        <Btn variant="soft" small onClick={() => reportsApi.rapportOT(ot.id, ot.numero)}>
          📄 PDF
        </Btn>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap", padding: "12px 14px", background: "#1a2330", borderRadius: 10 }}>
        {["ouvert", "en_cours", "attente_pieces", "termine"].map((sk, i) => (
          <span key={sk} style={{ display: "contents" }}>
            {i > 0 && <span style={{ color: "#5d6b7a" }}>→</span>}
            <span style={{
              fontSize: 12, fontWeight: 600, padding: "4px 9px", borderRadius: 7,
              color: ot.statut === sk ? "#06231f" : "#5d6b7a",
              background: ot.statut === sk ? STATUTS_OT[sk].color : "transparent",
              border: ot.statut === sk ? "none" : "1px solid #27313f",
            }}>{STATUTS_OT[sk].label}</span>
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 18 }}>
        {[["Équipement", ot.equipement_nom || "—"], ["Type", ot.type_ot],
          ["Créé le", ot.date_creation ? new Date(ot.date_creation).toLocaleDateString("fr-FR") : "—"],
          ["Coût total", `${ot.cout_total} DH`]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 12, color: "#5d6b7a" }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 500, textTransform: k === "Type" ? "capitalize" : "none" }}>{v}</div>
            </div>
          ))}
      </div>

      {ot.statut === "ouvert" && (
        <Field label="Assigner à un technicien">
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
            <option value="">— Choisir —</option>
            {techs.map((t) => <option key={t.id} value={t.id}>{t.prenom} {t.nom}{t.specialite ? ` (${t.specialite})` : ""}</option>)}
          </select>
        </Field>
      )}

      {ot.statut === "en_cours" && (
        <>
          <Field label="Observations"><textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} /></Field>
          <Field label="Coût main d'œuvre (DH)"><input type="number" value={cout} onChange={(e) => setCout(e.target.value)} /></Field>
        </>
      )}

      {ot.observations && ot.statut !== "en_cours" && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: "#5d6b7a", marginBottom: 4 }}>Observations</div>
          <div style={{ fontSize: 14, color: "#9aa7b5" }}>{ot.observations}</div>
        </div>
      )}

      {trans.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 8, borderTop: "1px solid #27313f", marginTop: 4 }}>
          {trans.map((t) => (
            <Btn key={t.to} variant={t.to === "annule" ? "danger" : t.to === "termine" ? "primary" : "soft"} onClick={() => doTransition(t)}>{t.label}</Btn>
          ))}
        </div>
      ) : (
        <div style={{ paddingTop: 14, borderTop: "1px solid #27313f", color: "#5d6b7a", fontSize: 13.5 }}>🔒 État final — cet ordre ne peut plus être modifié.</div>
      )}
    </Modal>
  );
}

function NewOTForm({ equipements, onSubmit }) {
  const [f, setF] = useState({ titre: "", equipement_id: equipements[0]?.id, type_ot: "corrective", priorite: "normale" });
  return (
    <div>
      <Field label="Titre de l'intervention"><input value={f.titre} onChange={(e) => setF({ ...f, titre: e.target.value })} placeholder="Ex. Remplacement filtre" /></Field>
      <Field label="Équipement concerné">
        <select value={f.equipement_id} onChange={(e) => setF({ ...f, equipement_id: Number(e.target.value) })}>
          {equipements.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Type">
          <select value={f.type_ot} onChange={(e) => setF({ ...f, type_ot: e.target.value })}>
            <option value="corrective">Corrective</option><option value="preventive">Préventive</option>
          </select>
        </Field>
        <Field label="Priorité">
          <select value={f.priorite} onChange={(e) => setF({ ...f, priorite: e.target.value })}>
            {Object.keys(PRIORITES).map((k) => <option key={k} value={k}>{PRIORITES[k].label}</option>)}
          </select>
        </Field>
      </div>
      <Btn disabled={!f.titre} onClick={() => onSubmit(f)} style={{ width: "100%", marginTop: 6 }}>Créer l'ordre de travail</Btn>
    </div>
  );
}
