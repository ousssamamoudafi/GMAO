"""
Couche ORM — SQLAlchemy.
Les 8 modèles correspondent exactement au diagramme de classes UML
et au diagramme entité-relation (8 modèles Python = 8 tables SQL).
"""
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from .extensions import db


# ============================================================
# 1. UTILISATEUR
# ============================================================
class Utilisateur(db.Model):
    __tablename__ = "utilisateurs"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(80), nullable=False)
    prenom = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)       # UK
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="technicien")  # admin|responsable|major|technicien
    specialite = db.Column(db.String(120))
    service = db.Column(db.String(120))   # rattachement à une SOUS FAMILLE (utilisé pour le rôle 'major')
    telephone = db.Column(db.String(30))
    disponible = db.Column(db.Boolean, default=True)
    actif = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    ot_crees = db.relationship("OrdreTravail", foreign_keys="OrdreTravail.createur_id", back_populates="createur")
    ot_assignes = db.relationship("OrdreTravail", foreign_keys="OrdreTravail.technicien_id", back_populates="technicien")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == "admin"

    def to_dict(self):
        return {
            "id": self.id, "nom": self.nom, "prenom": self.prenom,
            "email": self.email, "role": self.role, "specialite": self.specialite,
            "service": self.service, "telephone": self.telephone,
            "disponible": self.disponible, "actif": self.actif,
        }


# ============================================================
# 2. EQUIPEMENT
# ============================================================
class Equipement(db.Model):
    __tablename__ = "equipements"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(150), nullable=False)              # = DESIGNATION
    marque = db.Column(db.String(80))
    modele = db.Column(db.String(80))
    numero_serie = db.Column(db.String(80), unique=True, nullable=False)  # = CODIFICATION HSA-XX (UK)
    numero_serie_fabricant = db.Column(db.String(120))           # n° de série du constructeur
    service = db.Column(db.String(120))                          # = SOUS FAMILLE (rattachement major)
    departement = db.Column(db.String(120))                      # = DEPARTEMENT (Biomédical)
    etage = db.Column(db.String(30))                             # = Étage
    local = db.Column(db.String(60))                             # = LOCAL (code salle, ex HSA-4ET-01)
    description_local = db.Column(db.String(150))                # = DESCRIPTION LOCAL (nom salle)
    localisation = db.Column(db.String(200))                     # composé (étage · description)
    fournisseur = db.Column(db.String(120))
    annee_fabrication = db.Column(db.Integer)
    statut = db.Column(db.String(20), default="operationnel")    # operationnel|en_panne|maintenance|reforme
    date_acquisition = db.Column(db.Date)
    garantie_fin = db.Column(db.Date)
    technicien_referent_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    ordres = db.relationship("OrdreTravail", back_populates="equipement")
    alertes = db.relationship("Alerte", back_populates="equipement")

    STATUT_LABELS = {
        "operationnel": "Opérationnel", "en_panne": "En panne",
        "maintenance": "En maintenance", "reforme": "Réformé",
    }

    def statut_label(self):
        return self.STATUT_LABELS.get(self.statut, self.statut)

    def get_historique(self):
        return [o.to_dict() for o in self.ordres]

    def to_dict(self):
        return {
            "id": self.id, "nom": self.nom, "marque": self.marque, "modele": self.modele,
            "numero_serie": self.numero_serie,
            "numero_serie_fabricant": self.numero_serie_fabricant,
            "service": self.service, "departement": self.departement,
            "etage": self.etage, "local": self.local,
            "description_local": self.description_local, "localisation": self.localisation,
            "fournisseur": self.fournisseur, "annee_fabrication": self.annee_fabrication,
            "statut": self.statut, "statut_label": self.statut_label(),
            "garantie_fin": self.garantie_fin.isoformat() if self.garantie_fin else None,
        }


# ============================================================
# 3. ORDRE DE TRAVAIL
# ============================================================
class OrdreTravail(db.Model):
    __tablename__ = "ordres_travail"

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(30), unique=True, nullable=False)  # UK : OT-2026-XXXX
    titre = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    type_ot = db.Column(db.String(20), default="corrective")   # corrective|preventive
    priorite = db.Column(db.String(20), default="normale")     # basse|normale|haute|critique
    statut = db.Column(db.String(20), default="ouvert")        # ouvert|en_cours|attente_pieces|termine|annule
    equipement_id = db.Column(db.Integer, db.ForeignKey("equipements.id"))
    technicien_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    createur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)
    date_debut = db.Column(db.DateTime)
    date_fin = db.Column(db.DateTime)
    duree_minutes = db.Column(db.Integer, default=0)
    cout_main_oeuvre = db.Column(db.Float, default=0.0)
    observations = db.Column(db.Text)

    equipement = db.relationship("Equipement", back_populates="ordres")
    technicien = db.relationship("Utilisateur", foreign_keys=[technicien_id], back_populates="ot_assignes")
    createur = db.relationship("Utilisateur", foreign_keys=[createur_id], back_populates="ot_crees")
    pieces_utilisees = db.relationship("OTPiece", back_populates="ordre_travail", cascade="all, delete-orphan")
    planning = db.relationship("Planning", back_populates="ordre_travail", uselist=False)

    def cout_total(self):
        """Coût main-d'œuvre + coût des pièces consommées."""
        cout_pieces = sum(p.quantite_utilisee * p.prix_unitaire for p in self.pieces_utilisees)
        return (self.cout_main_oeuvre or 0) + cout_pieces

    @staticmethod
    def generer_numero():
        annee = datetime.utcnow().year
        count = OrdreTravail.query.count() + 1
        return f"OT-{annee}-{count:04d}"

    def to_dict(self):
        return {
            "id": self.id, "numero": self.numero, "titre": self.titre,
            "description": self.description, "type_ot": self.type_ot,
            "priorite": self.priorite, "statut": self.statut,
            "equipement_id": self.equipement_id, "equipement_nom": self.equipement.nom if self.equipement else None,
            "technicien_id": self.technicien_id,
            "technicien_nom": f"{self.technicien.prenom} {self.technicien.nom}" if self.technicien else None,
            "createur_id": self.createur_id,
            "date_creation": self.date_creation.isoformat() if self.date_creation else None,
            "duree_minutes": self.duree_minutes, "cout_main_oeuvre": self.cout_main_oeuvre,
            "cout_total": self.cout_total(), "observations": self.observations,
        }


# ============================================================
# 4. PLANNING
# ============================================================
class Planning(db.Model):
    __tablename__ = "plannings"

    id = db.Column(db.Integer, primary_key=True)
    ordre_travail_id = db.Column(db.Integer, db.ForeignKey("ordres_travail.id"))
    technicien_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    date_debut = db.Column(db.DateTime, nullable=False)
    date_fin = db.Column(db.DateTime, nullable=False)
    statut = db.Column(db.String(20), default="planifie")  # planifie|termine
    recurrent = db.Column(db.Boolean, default=False)
    frequence = db.Column(db.String(30))
    notes = db.Column(db.Text)

    ordre_travail = db.relationship("OrdreTravail", back_populates="planning")
    technicien = db.relationship("Utilisateur")

    def to_fullcalendar(self):
        """Format compatible avec la librairie FullCalendar côté frontend."""
        return {
            "id": self.id,
            "title": self.ordre_travail.titre if self.ordre_travail else "Intervention",
            "start": self.date_debut.isoformat(),
            "end": self.date_fin.isoformat(),
        }

    def to_dict(self):
        return {
            "id": self.id, "ordre_travail_id": self.ordre_travail_id,
            "ordre_titre": self.ordre_travail.titre if self.ordre_travail else None,
            "ordre_numero": self.ordre_travail.numero if self.ordre_travail else None,
            "technicien_id": self.technicien_id,
            "technicien_nom": f"{self.technicien.prenom} {self.technicien.nom}" if self.technicien else None,
            "date_debut": self.date_debut.isoformat(), "date_fin": self.date_fin.isoformat(),
            "statut": self.statut, "recurrent": self.recurrent,
        }


# ============================================================
# 5. PIECE
# ============================================================
class Piece(db.Model):
    __tablename__ = "pieces"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(50), unique=True, nullable=False)  # UK
    designation = db.Column(db.String(150), nullable=False)
    marque = db.Column(db.String(80))
    quantite_stock = db.Column(db.Integer, default=0)
    seuil_alerte = db.Column(db.Integer, default=5)
    prix_unitaire = db.Column(db.Float, default=0.0)
    fournisseur = db.Column(db.String(120))
    emplacement = db.Column(db.String(80))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mouvements = db.relationship("MouvementStock", back_populates="piece")
    alertes = db.relationship("Alerte", back_populates="piece")

    def stock_bas(self):
        return self.quantite_stock <= self.seuil_alerte

    def valeur_stock(self):
        return self.quantite_stock * self.prix_unitaire

    def to_dict(self):
        return {
            "id": self.id, "reference": self.reference, "designation": self.designation,
            "marque": self.marque, "quantite_stock": self.quantite_stock,
            "seuil_alerte": self.seuil_alerte, "prix_unitaire": self.prix_unitaire,
            "fournisseur": self.fournisseur, "emplacement": self.emplacement,
            "stock_bas": self.stock_bas(), "valeur_stock": self.valeur_stock(),
        }


# ============================================================
# 6. OTPIECE (classe d'association)
# ============================================================
class OTPiece(db.Model):
    __tablename__ = "ot_pieces"

    id = db.Column(db.Integer, primary_key=True)
    ordre_travail_id = db.Column(db.Integer, db.ForeignKey("ordres_travail.id"))
    piece_id = db.Column(db.Integer, db.ForeignKey("pieces.id"))
    quantite_utilisee = db.Column(db.Integer, default=1)
    prix_unitaire = db.Column(db.Float, default=0.0)  # prix au moment de la consommation

    ordre_travail = db.relationship("OrdreTravail", back_populates="pieces_utilisees")
    piece = db.relationship("Piece")

    def to_dict(self):
        return {
            "id": self.id, "ordre_travail_id": self.ordre_travail_id,
            "piece_id": self.piece_id,
            "piece_designation": self.piece.designation if self.piece else None,
            "quantite_utilisee": self.quantite_utilisee, "prix_unitaire": self.prix_unitaire,
        }


# ============================================================
# 7. MOUVEMENT DE STOCK
# ============================================================
class MouvementStock(db.Model):
    __tablename__ = "mouvements_stock"

    id = db.Column(db.Integer, primary_key=True)
    piece_id = db.Column(db.Integer, db.ForeignKey("pieces.id"))
    utilisateur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs.id"))
    type_mouvement = db.Column(db.String(20))  # entree|sortie|ajustement
    quantite = db.Column(db.Integer)
    motif = db.Column(db.String(150))
    date_mouvement = db.Column(db.DateTime, default=datetime.utcnow)

    piece = db.relationship("Piece", back_populates="mouvements")
    utilisateur = db.relationship("Utilisateur")

    def to_dict(self):
        return {
            "id": self.id, "piece_id": self.piece_id,
            "piece_designation": self.piece.designation if self.piece else None,
            "type_mouvement": self.type_mouvement, "quantite": self.quantite,
            "motif": self.motif,
            "date_mouvement": self.date_mouvement.isoformat() if self.date_mouvement else None,
        }


# ============================================================
# 8. ALERTE
# ============================================================
class Alerte(db.Model):
    __tablename__ = "alertes"

    id = db.Column(db.Integer, primary_key=True)
    type_alerte = db.Column(db.String(30))  # stock_bas|garantie|panne
    message = db.Column(db.String(255))
    lue = db.Column(db.Boolean, default=False)
    equipement_id = db.Column(db.Integer, db.ForeignKey("equipements.id"))
    piece_id = db.Column(db.Integer, db.ForeignKey("pieces.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    equipement = db.relationship("Equipement", back_populates="alertes")
    piece = db.relationship("Piece", back_populates="alertes")

    def marquer_lue(self):
        self.lue = True

    def badge_class(self):
        return {"stock_bas": "warning", "garantie": "info", "panne": "danger"}.get(self.type_alerte, "secondary")

    def to_dict(self):
        return {
            "id": self.id, "type_alerte": self.type_alerte, "message": self.message,
            "lue": self.lue, "equipement_id": self.equipement_id, "piece_id": self.piece_id,
            "badge_class": self.badge_class(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
