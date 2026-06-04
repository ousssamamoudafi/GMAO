import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Card, Btn, ROLES } from "../components/ui";

const avatarColor = (r) =>
  r === "admin" ? "var(--violet)"
  : r === "responsable" ? "var(--blue)"
  : r === "major" ? "#06b6d4"
  : "var(--teal)";

export default function Login() {
  const { login } = useAuth();
  const [comptes, setComptes] = useState(null);
  const [sel, setSel] = useState(null);
  const [majorOpen, setMajorOpen] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  // Charge la liste des comptes via une route publique du backend
  useEffect(() => {
    axios.get("http://localhost:5000/api/auth/comptes-demo")
      .then((r) => setComptes(r.data))
      .catch(() => setErr("Backend introuvable sur le port 5000. Lancez 'python run.py' dans le dossier backend."));
  }, []);

  const connecter = async () => {
    if (!sel) return;
    setBusy(true); setErr("");
    try {
      await login(sel.email, "hupsa2026");
    } catch {
      setErr("Identifiants invalides.");
      setBusy(false);
    }
  };

  const principaux = comptes ? comptes.filter((u) => u.role !== "major") : [];
  const majors = comptes ? comptes.filter((u) => u.role === "major") : [];

  return (
    <div style={{
      height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(1200px 600px at 70% -10%, rgba(45,212,191,.10), transparent), #0d1117", padding: 20,
    }}>
      <div className="fadeup" style={{ width: 440, maxWidth: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, margin: "0 auto 18px",
            background: "linear-gradient(135deg, var(--teal), var(--tealdeep))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 30px rgba(45,212,191,.25)",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#06231f" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 6l-3 3M8 8l-2 2 4 4M12 12l4 4 2-2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="6" r="2" />
            </svg>
          </div>
          <h1 className="font-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>GMAO</h1>
          <p style={{ color: "#9aa7b5", fontSize: 14.5, marginTop: 4 }}>Gestion de Maintenance — Clinique HUPSA</p>
        </div>

        <Card style={{ padding: 22 }}>
          {!comptes && !err && <p style={{ fontSize: 13, color: "#9aa7b5" }}>Chargement des comptes…</p>}
          {err && <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{err}</p>}

          {comptes && (
            <>
              <p style={{ fontSize: 12.5, color: "#5d6b7a", marginBottom: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.4 }}>Comptes principaux</p>
              {principaux.map((u) => (
                <button key={u.email} onClick={() => setSel(u)} style={{
                  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
                  padding: "10px 12px", borderRadius: 10, marginBottom: 6, border: "none",
                  background: sel?.email === u.email ? "color-mix(in srgb, var(--teal) 12%, transparent)" : "#1a2330",
                  outline: sel?.email === u.email ? "1px solid var(--teal)" : "1px solid #27313f",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 99, flexShrink: 0, background: avatarColor(u.role),
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#06231f", fontSize: 13,
                  }}>{u.prenom[0]}{u.nom[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.prenom} {u.nom}</div>
                    <div style={{ fontSize: 12, color: "#5d6b7a" }}>{ROLES[u.role]}</div>
                  </div>
                  {sel?.email === u.email && <span style={{ color: "var(--teal)" }}>✓</span>}
                </button>
              ))}

              {majors.length > 0 && (
                <>
                  <button onClick={() => setMajorOpen((o) => !o)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                    padding: "11px 13px", borderRadius: 10, marginTop: 10, border: "1px dashed #27313f",
                    background: "transparent", color: "#9aa7b5", fontWeight: 600, fontSize: 13,
                  }}>
                    <span style={{ flex: 1 }}>👥 Majors de service ({majors.length})</span>
                    <span style={{ transition: "transform .2s", transform: majorOpen ? "rotate(90deg)" : "none" }}>›</span>
                  </button>
                  {majorOpen && (
                    <div style={{ marginTop: 6, maxHeight: 220, overflowY: "auto" }}>
                      {majors.map((u) => (
                        <button key={u.email} onClick={() => setSel(u)} style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                          padding: "8px 12px", borderRadius: 8, marginBottom: 3, border: "none",
                          background: sel?.email === u.email ? "color-mix(in srgb, #06b6d4 14%, transparent)" : "transparent",
                          outline: sel?.email === u.email ? "1px solid #06b6d4" : "none",
                        }}>
                          <div style={{
                            width: 26, height: 26, borderRadius: 99, flexShrink: 0, background: "#06b6d4",
                            display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#06231f", fontSize: 11,
                          }}>{u.prenom[0]}M</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.service}</div>
                          </div>
                          {sel?.email === u.email && <span style={{ color: "#06b6d4", fontSize: 13 }}>✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <Btn onClick={connecter} disabled={!sel || busy} style={{ width: "100%", marginTop: 14 }}>
                {busy ? "Connexion…" : sel ? `Se connecter — ${sel.prenom} ${sel.nom}` : "Sélectionnez un compte"}
              </Btn>
            </>
          )}
        </Card>
        <p className="font-mono" style={{ textAlign: "center", marginTop: 16, fontSize: 11.5, color: "#5d6b7a" }}>
          Mot de passe démo : hupsa2026
        </p>
      </div>
    </div>
  );
}
