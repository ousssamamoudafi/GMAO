import { useEffect, useState } from "react";
import { stockApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, Badge, Modal, Loader } from "../components/ui";

function Stat({ label, value, sub, color }) {
  return (
    <Card style={{ padding: "18px 20px", flex: 1 }}>
      <div style={{ fontSize: 12.5, color: "#9aa7b5", fontWeight: 500 }}>{label}</div>
      <div className="font-display" style={{ fontSize: 34, fontWeight: 600, color, margin: "4px 0 2px", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#5d6b7a" }}>{sub}</div>
    </Card>
  );
}

export default function Stock() {
  const { user, notify } = useAuth();
  const [list, setList] = useState(null);
  const [detail, setDetail] = useState(null);
  const canReappro = user.role !== "technicien";

  const charger = () => stockApi.liste().then((r) => setList(r.data));
  useEffect(() => { charger(); }, []);

  const consommer = async (id, q) => {
    const { data } = await stockApi.consommer(id, q);
    notify(`${q} pièce(s) consommée(s)`);
    setDetail(data); charger();
  };
  const reappro = async (id, q) => {
    const { data } = await stockApi.reapprovisionner(id, q);
    notify(`+${q} en stock`);
    setDetail(data); charger();
  };

  if (!list) return <Loader />;
  const valeur = list.reduce((s, p) => s + p.valeur_stock, 0);

  return (
    <div className="fadeup">
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <Stat label="Références" value={list.length} sub="en catalogue" color="var(--teal)" />
        <Stat label="Sous le seuil" value={list.filter((p) => p.stock_bas).length} sub="à réapprovisionner" color="var(--orange)" />
        <Stat label="Valeur du stock" value={valeur.toLocaleString("fr-FR")} sub="DH" color="var(--blue)" />
      </div>

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr .8fr .8fr 130px", padding: "13px 20px", borderBottom: "1px solid #27313f", fontSize: 12, color: "#5d6b7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <div>Pièce</div><div>Référence</div><div>Stock</div><div>Prix</div><div></div>
        </div>
        {list.map((p) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr .8fr .8fr 130px", padding: "14px 20px", borderBottom: "1px solid #27313f", alignItems: "center", fontSize: 14 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{p.designation}</div>
              <div style={{ fontSize: 12.5, color: "#5d6b7a" }}>{p.marque} · {p.emplacement}</div>
            </div>
            <div className="font-mono" style={{ fontSize: 12.5, color: "#9aa7b5" }}>{p.reference}</div>
            <div>
              <span className="font-mono" style={{ fontWeight: 700, color: p.stock_bas ? "var(--orange)" : "#e6edf3" }}>{p.quantite_stock}</span>
              <span style={{ fontSize: 11.5, color: "#5d6b7a" }}> / {p.seuil_alerte}</span>
              {p.stock_bas && <div><Badge color="var(--orange)">Stock bas</Badge></div>}
            </div>
            <div className="font-mono" style={{ color: "#9aa7b5" }}>{p.prix_unitaire} DH</div>
            <div style={{ textAlign: "right" }}><Btn variant="soft" small onClick={() => setDetail(p)}>Gérer</Btn></div>
          </div>
        ))}
      </Card>

      {detail && (
        <Modal title={detail.designation} onClose={() => setDetail(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 20 }}>
            {[["Référence", detail.reference], ["Marque", detail.marque], ["Emplacement", detail.emplacement],
              ["Prix unitaire", detail.prix_unitaire + " DH"], ["Stock actuel", detail.quantite_stock], ["Seuil d'alerte", detail.seuil_alerte]]
              .map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 12, color: "#5d6b7a" }}>{k}</div><div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div></div>
              ))}
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 14, borderTop: "1px solid #27313f" }}>
            <Btn variant="soft" style={{ flex: 1 }} onClick={() => consommer(detail.id, 1)}>− Consommer 1</Btn>
            {canReappro && <Btn style={{ flex: 1 }} onClick={() => reappro(detail.id, 10)}>+ Réapprovisionner 10</Btn>}
          </div>
        </Modal>
      )}
    </div>
  );
}
