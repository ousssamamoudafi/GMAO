/** Composants UI reutilisables, partages par toutes les pages. */

export function Badge({ color, children, soft = true }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{
        color: soft ? color : "#0d1117",
        background: soft ? `color-mix(in srgb, ${color} 16%, transparent)` : color,
        border: soft ? `1px solid color-mix(in srgb, ${color} 35%, transparent)` : "none",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      {children}
    </span>
  );
}

export function Card({ children, className = "", style }) {
  return (
    <div
      className={`bg-panel border border-line rounded-xl transition-colors duration-300 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function Btn({ children, onClick, variant = "primary", small, disabled, style, className = "", type = "button" }) {
  const baseClasses = "font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizeClasses = small ? "text-sm px-3 py-1.5" : "text-sm px-4 py-2.5";
  
  const variantClasses = {
    primary: "bg-teal text-[#06231f] hover:brightness-110",
    ghost: "bg-transparent text-inksoft border border-line hover:bg-panel2 hover:text-ink",
    danger: "bg-red-500/15 text-red-500 border border-red-500/35 hover:bg-red-500/25",
    soft: "bg-panel2 text-ink border border-line hover:bg-panel hover:border-inkfaint",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      {children}
    </button>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        className="pop bg-panel border border-line rounded-2xl w-full max-h-[90vh] overflow-auto"
        style={{ maxWidth: wide ? 640 : 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-line">
          <h3 className="font-display text-lg md:text-xl font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-2xl text-inkfaint hover:text-ink transition-colors leading-none"
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, error }) {
  return (
    <label className="block mb-4">
      <div className="text-sm text-inksoft mb-1.5 font-medium">{label}</div>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </label>
  );
}

export function Loader() {
  return (
    <div className="p-16 text-center text-inkfaint">
      <svg
        className="w-8 h-8 mx-auto mb-3 spin text-teal"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M21 12a9 9 0 11-6.219-8.56" />
      </svg>
      <span>Chargement...</span>
    </div>
  );
}

export function Skeleton({ className = "", style }) {
  return (
    <div
      className={`animate-pulse bg-panel2 rounded-lg ${className}`}
      style={style}
    />
  );
}

// Referentiels d'affichage (libelles + couleurs des statuts)
export const STATUTS_EQ = {
  operationnel: { label: "Operationnel", color: "var(--green)" },
  en_panne: { label: "En panne", color: "var(--red)" },
  maintenance: { label: "En maintenance", color: "var(--amber)" },
  reforme: { label: "Reforme", color: "var(--grey)" },
};
export const STATUTS_OT = {
  ouvert: { label: "Ouvert", color: "var(--blue)" },
  en_cours: { label: "En cours", color: "var(--amber)" },
  attente_pieces: { label: "En attente pieces", color: "var(--orange)" },
  termine: { label: "Termine", color: "var(--green)" },
  annule: { label: "Annule", color: "var(--grey)" },
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
  technicien: "Technicien biomedical",
};
