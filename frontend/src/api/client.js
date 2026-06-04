/**
 * Couche d'accès API (Axios).
 * Communique avec le backend Flask via HTTP/JSON.
 * Cf. diagramme de composants : couche présentation -> API REST.
 */
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api" });

// Intercepteur : ajoute le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gmao_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

export const equipementsApi = {
  liste: (statut) => api.get("/equipements", { params: { statut } }),
  detail: (id) => api.get(`/equipements/${id}`),
  changerStatut: (id, statut) => api.patch(`/equipements/${id}/statut`, { statut }),
  creer: (data) => api.post("/equipements", data),
};

export const ordresApi = {
  liste: (statut) => api.get("/ordres", { params: { statut } }),
  detail: (id) => api.get(`/ordres/${id}`),
  creer: (data) => api.post("/ordres", data),
  transition: (id, data) => api.patch(`/ordres/${id}/transition`, data),
};

export const planningApi = {
  liste: () => api.get("/planning"),
};

export const stockApi = {
  liste: () => api.get("/stock"),
  consommer: (id, quantite) => api.patch(`/stock/${id}/consommer`, { quantite }),
  reapprovisionner: (id, quantite) => api.patch(`/stock/${id}/reapprovisionner`, { quantite }),
};

export const alertesApi = {
  liste: () => api.get("/alertes"),
  marquerLue: (id) => api.patch(`/alertes/${id}/lue`),
  toutLire: () => api.patch("/alertes/tout-lire"),
};

export const utilisateursApi = {
  liste: () => api.get("/utilisateurs"),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

export const reportsApi = {
  // Téléchargement de PDF : on demande un blob, on déclenche le download navigateur
  telecharger: async (path, filename) => {
    const r = await api.get(path, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([r.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); window.URL.revokeObjectURL(url);
  },
  rapportOT: (id, numero) => reportsApi.telecharger(`/reports/ot/${id}.pdf`, `${numero}.pdf`),
  rapportDashboard: () => reportsApi.telecharger(
    "/reports/dashboard.pdf",
    `rapport_gmao_${new Date().toISOString().slice(0, 10)}.pdf`
  ),
};

export default api;
