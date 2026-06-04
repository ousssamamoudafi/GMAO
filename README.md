# GMAO — Clinique HUPSA

Application de **Gestion de Maintenance Assistée par Ordinateur** pour la Clinique HUPSA.
Implémentation complète de la conception UML : backend Flask + SQLAlchemy, frontend React + Tailwind + Axios.

## Architecture (diagramme de composants — 5 couches)

```
React 18 + Tailwind + Axios   ← Couche présentation (frontend/)
        ↓ HTTP/JSON
Flask 3 + Blueprints          ← Couche API REST     (backend/app/routes/)
JWT + Flask-CORS              ← Couche Sécurité      (auth, role_required)
SQLAlchemy 2                  ← Couche ORM           (backend/app/models.py — 8 modèles)
SQLite (dev) / PostgreSQL     ← Couche Persistance   (gmao.db)
```

## Données réelles intégrées

L'application est livrée avec **l'inventaire réel de la clinique** (`backend/inventaire_hupsa.xlsx`) :
- **271 équipements biomédicaux** répartis sur **11 services**
- Importé automatiquement par `seed.py` (codification HSA-XXX, étage, local, marque, modèle, garantie…)

## Rôles utilisateurs (4 rôles + filtrage par service)

| Rôle | Accès |
|------|-------|
| **Administrateur** | Tout (y compris gestion des utilisateurs) |
| **Responsable maintenance** | Création OT, planification, dashboard global, rapports |
| **Major de service** ⭐ | **Voit + crée des OT pour les équipements de son service uniquement** |
| **Technicien biomédical** | Consultation, exécution des OT assignés, stock |

Les **majors de service** (11 comptes, un par sous-famille : Imagerie, Cardiologie, Bloc opératoire, etc.) ont une **vue strictement limitée à leur service** — filtrage appliqué côté serveur (sécurisé, pas seulement visuel).

---

## Lancement

### 1. Backend (Flask) — port 5000

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows : venv\Scripts\activate
pip install -r requirements.txt
python seed.py                    # crée gmao.db + importe les 271 équipements
python run.py                     # API sur http://localhost:5000
```

### 2. Frontend (React) — port 5173

Dans un **second terminal** :

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

---

## Comptes de démonstration (mot de passe commun : `hupsa2026`)

La page de connexion les charge automatiquement depuis l'API.

**Comptes principaux :**
- `admin@hupsa.ma` — Administrateur (Oussama El Amrani)
- `resp@hupsa.ma` — Responsable maintenance (Salma Benani)
- `tech1@hupsa.ma` — Technicien biomédical (Karim Tazi)
- `tech2@hupsa.ma` — Technicien biomédical (Nadia Fassi)

**Majors de service** (un par sous-famille de l'inventaire) :
- `major.imagerie-medicale@hupsa.ma` — voit 12 équipements d'imagerie
- `major.cardiologie-et-urgences@hupsa.ma`
- `major.chirurgie-bloc-operatoire@hupsa.ma`
- `major.consultation@hupsa.ma`
- `major.laboratoire@hupsa.ma`
- `major.monitoring-et-surveillance@hupsa.ma` — voit 47 équipements
- `major.perfusion-et-injection@hupsa.ma` — voit 96 équipements
- `major.pediatrie-neonatalogie@hupsa.ma`
- `major.respiration-anesthesie-r@hupsa.ma`
- `major.sterilisation@hupsa.ma`
- `major.mobilier-et-manutention-m@hupsa.ma`

---

## Correspondance avec les 6 diagrammes UML

| Diagramme UML        | Implémentation |
|----------------------|----------------|
| Cas d'utilisation    | 4 rôles + permissions (`role_required`), 7 modules de navigation |
| Classes (8 classes)  | `backend/app/models.py` — 8 modèles SQLAlchemy avec attributs et méthodes |
| Entité-Relation      | Les 8 tables + relations FK générées par `db.create_all()` |
| Séquence             | Cycle de vie d'un OT : création → planification → exécution → clôture |
| États                | Machine à états des OT dans `routes/ordres.py` (transitions contrôlées) |
| Composants           | Architecture en couches ci-dessus |

## Règles métier implémentées (diagramme d'états)

1. Un OT démarre toujours à l'état **Ouvert**.
2. Le passage en **En cours** exige l'assignation d'un technicien (sinon HTTP 400).
3. Si une pièce manque → bascule en **En attente pièces**, puis retour possible en **En cours**.
4. La clôture (**Terminé**) calcule la durée + le coût total et remet l'équipement en *opérationnel*.
5. Un OT **Terminé** ou **Annulé** est figé (états finaux — transitions refusées par le backend).
6. Consommer une pièce sous son seuil génère automatiquement une **alerte de stock**.
7. **(Nouveau)** Le **major** peut créer un OT, mais uniquement pour un équipement **de son service** (sinon HTTP 403). Il ne pilote pas le cycle de vie (réservé au responsable et aux techniciens).

## Migration vers PostgreSQL (production)

Une seule variable d'environnement à définir :

```bash
export DATABASE_URL="postgresql://user:password@localhost/gmao"
```

## Structure du projet

```
gmao/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # app factory + enregistrement des Blueprints
│   │   ├── extensions.py        # db, jwt
│   │   ├── models.py            # 8 modèles SQLAlchemy
│   │   └── routes/              # 1 Blueprint par module fonctionnel
│   │       ├── auth.py          # login JWT + role_required + current_user
│   │       ├── utilisateurs.py
│   │       ├── equipements.py   # filtrage par service (major)
│   │       ├── ordres.py        # machine à états + permissions major
│   │       ├── planning.py
│   │       ├── stock.py
│   │       ├── alertes.py       # alertes filtrées par service
│   │       └── dashboard.py     # stats scopées
│   ├── config.py
│   ├── seed.py                  # import inventaire HUPSA + comptes
│   ├── inventaire_hupsa.xlsx    # 271 équipements réels
│   ├── run.py                   # point d'entrée Flask
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js        # couche Axios
    │   ├── context/AuthContext.jsx
    │   ├── components/          # Sidebar + UI réutilisable
    │   ├── pages/               # 7 pages (1 par module)
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```
