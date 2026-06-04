/** Composants UI réutilisables, partagés par toutes les pages. */

export function Badge({ color, children, soft = true }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
      padding: "3px 10px", borderRadius: 99,
      color: soft ? color : "#0d1117",
      background: soft ? `color-mix(in srgb, ${color} 16%, transparent)` : color,
      border: soft ? `1px solid color-mix(in srgb, ${color} 35%, transparent)` : "none",
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: color }} />
      {children}
    </span>
  );
}

export function Card({ children, className = "", style }) {
  return (
    <div className={className} style={{
      background: "#141b24", border: "1px solid #27313f", borderRadius: 14, ...style,
    }}>{children}</div>
  );
}

export function Btn({ children, onClick, variant = "primary", small, disabled, style }) {
  const variants = {
    primary: { background: "var(--teal)", color: "#06231f" },
    ghost: { background: "transparent", color: "#9aa7b5", border: "1px solid #27313f" },
    danger: { background: "color-mix(in srgb, var(--red) 16%, transparent)", color: "var(--red)", border: "1px solid color-mix(in srgb, var(--red) 35%, transparent)" },
    soft: { background: "#1a2330", color: "#e6edf3", border: "1px solid #27313f" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontWeight: 600, fontSize: small ? 13 : 14, padding: small ? "7px 13px" : "10px 18px",
      borderRadius: 9, border: "none", transition: "filter .15s",
      opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto",
      ...variants[variant], ...style,
    }}>{children}</button>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(5,8,12,.72)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
    }}>
      <div className="pop" onClick={(e) => e.stopPropagation()} style={{
        background: "#141b24", border: "1px solid #27313f", borderRadius: 16,
        width: wide ? 640 : 480, maxWidth: "100%", maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px", borderBottom: "1px solid #27313f",
        }}>
          <h3 className="font-display" style={{ fontSize: 20, fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{ fontSize: 22, color: "#5d6b7a", background: "none", border: "none", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, color: "#9aa7b5", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      {children}
    </label>
  );
}

export function Loader() {
  return <div style={{ padding: 60, textAlign: "center", color: "#5d6b7a" }}>Chargement…</div>;
}

// Référentiels d'affichage (libellés + couleurs des statuts)
export const STATUTS_EQ = {
  operationnel: { label: "Opérationnel", color: "var(--green)" },
  en_panne: { label: "En panne", color: "var(--red)" },
  maintenance: { label: "En maintenance", color: "var(--amber)" },
  reforme: { label: "Réformé", color: "var(--grey)" },
};
export const STATUTS_OT = {
  ouvert: { label: "Ouvert", color: "var(--blue)" },
  en_cours: { label: "En cours", color: "var(--amber)" },
  attente_pieces: { label: "En attente pièces", color: "var(--orange)" },
  termine: { label: "Terminé", color: "var(--green)" },
  annule: { label: "Annulé", color: "var(--grey)" },
};
export const PRIORITES = {
  basse: { label: "Basse", color: "var(--grey)" },
  normale: { label: "Normale", color: "var(--blue)" },
  haute: { label: "Haute", color: "var(--orange)" },
  critique: { label: "Critique", color: "var(--red)" },
};
export const ROLES = {
  admin: "Administrateur",
  responsable: "Responsable maintenance",
  major: "Major de service",
  technicien: "Technicien biomédical",
};
