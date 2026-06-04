import { useEffect, useState } from "react";
import { utilisateursApi } from "../api/client";
import { Card, Badge, Loader, ROLES } from "../components/ui";

const color = (r) => (r === "admin" ? "var(--violet)" : r === "responsable" ? "var(--blue)" : "var(--teal)");

export default function Utilisateurs() {
  const [list, setList] = useState(null);
  useEffect(() => { utilisateursApi.liste().then((r) => setList(r.data)); }, []);
  if (!list) return <Loader />;

  return (
    <div className="fadeup">
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 120px", padding: "13px 20px", borderBottom: "1px solid #27313f", fontSize: 12, color: "#5d6b7a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>
          <div>Nom</div><div>Email</div><div>Rôle</div><div>Spécialité</div><div>Statut</div>
        </div>
        {list.map((u) => (
          <div key={u.id} style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr 1fr 120px", padding: "14px 20px", borderBottom: "1px solid #27313f", alignItems: "center", fontSize: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: color(u.role), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#06231f", fontSize: 12.5 }}>{u.prenom[0]}{u.nom[0]}</div>
              <span style={{ fontWeight: 600 }}>{u.prenom} {u.nom}</span>
            </div>
            <div className="font-mono" style={{ fontSize: 12.5, color: "#9aa7b5" }}>{u.email}</div>
            <div><Badge color={color(u.role)}>{ROLES[u.role].split(" ")[0]}</Badge></div>
            <div style={{ color: "#9aa7b5", fontSize: 13 }}>{u.specialite}</div>
            <div><Badge color={u.disponible ? "var(--green)" : "var(--grey)"}>{u.disponible ? "Disponible" : "Occupé"}</Badge></div>
          </div>
        ))}
      </Card>
    </div>
  );
}
