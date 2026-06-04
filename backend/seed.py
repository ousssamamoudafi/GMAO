"""
Script de peuplement de la base GMAO.
Importe l'inventaire réel HUPSA depuis 'inventaire_hupsa.xlsx' (271 équipements),
crée les comptes utilisateurs (incluant un major par service) et quelques
données de démonstration (pièces, OT, alertes).

Usage : python seed.py
"""
import os
import re
import unicodedata
from datetime import datetime, date, timedelta
import pandas as pd

from app import create_app
from app.extensions import db
from app.models import (Utilisateur, Equipement, OrdreTravail, Planning,
                        Piece, OTPiece, MouvementStock, Alerte)

BASE = os.path.dirname(os.path.abspath(__file__))
INVENTAIRE = os.path.join(BASE, "inventaire_hupsa.xlsx")

app = create_app()


def _val(v):
    """Convertit NaN/NaT pandas en None et nettoie les chaînes."""
    if v is None:
        return None
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, str):
        v = v.strip()
        return v if v else None
    return v


def _slug(s):
    """'Perfusion et injection' -> 'perfusion-et-injection' (pour les emails)."""
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s


def importer_inventaire():
    """Charge les 271 équipements depuis le fichier Excel HUPSA."""
    if not os.path.exists(INVENTAIRE):
        print(f"⚠ Fichier d'inventaire absent : {INVENTAIRE}")
        return [], set()

    df = pd.read_excel(INVENTAIRE)
    equipements, services = [], set()
    fallback_counter = 1

    for _, r in df.iterrows():
        codif = _val(r.get("CODIFICATION"))
        if not codif:
            codif = f"HSA-AUTO-{fallback_counter:04d}"
            fallback_counter += 1

        nom = _val(r.get("DESIGNATION")) or "Équipement non identifié"
        etage = _val(r.get("Étage"))
        local = _val(r.get("LOCAL"))
        desc_local = _val(r.get("DESCRIPTION LOCAL"))
        localisation = " · ".join(p for p in [etage, desc_local] if p) or None
        service = _val(r.get("SOUS FAMILLE"))
        if service:
            services.add(service)

        # Calcul fin de garantie (si date début + durée connus)
        garantie_fin = None
        deb = r.get("Date de début de garantie ")
        duree = _val(r.get("Durée de garantie"))
        if pd.notna(deb) and duree:
            try:
                d = pd.to_datetime(deb).date()
                # durée peut être "2 ans", "24 mois", un nombre...
                if isinstance(duree, str):
                    m = re.search(r"(\d+)", duree)
                    if m:
                        n = int(m.group(1))
                        mois = n * 12 if ("an" in duree.lower()) else n
                else:
                    mois = int(duree) * 12  # nombre brut = années
                garantie_fin = d + timedelta(days=mois * 30)
            except Exception:
                pass

        annee = _val(r.get("Année fabrication"))
        try:
            annee = int(annee) if annee else None
        except (ValueError, TypeError):
            annee = None

        equipements.append(Equipement(
            nom=nom,
            marque=_val(r.get("Marque")),
            modele=_val(r.get("Modèle")),
            numero_serie=codif,
            numero_serie_fabricant=_val(r.get("Numéro de série")),
            service=service,
            departement=_val(r.get("DEPARTEMENT")),
            etage=etage, local=local, description_local=desc_local,
            localisation=localisation,
            fournisseur=_val(r.get("Fournisseur")),
            annee_fabrication=annee,
            garantie_fin=garantie_fin,
            statut="operationnel",
        ))
    return equipements, services


def run():
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("→ Tables (re)créées.")

        # 1. Import de l'inventaire réel
        equipements, services = importer_inventaire()
        if equipements:
            db.session.add_all(equipements)
            db.session.commit()
            print(f"✓ {len(equipements)} équipements importés ({len(services)} services distincts)")
        services = sorted(services)

        # 2. Utilisateurs : admin + responsable + 2 techniciens + 1 major par service
        users = [
            Utilisateur(nom="El Amrani", prenom="Oussama", email="admin@hupsa.ma",
                        role="admin", specialite="IT / Système"),
            Utilisateur(nom="Benani", prenom="Salma", email="resp@hupsa.ma",
                        role="responsable", specialite="Génie biomédical"),
            Utilisateur(nom="Tazi", prenom="Karim", email="tech1@hupsa.ma",
                        role="technicien", specialite="Imagerie & monitoring"),
            Utilisateur(nom="Fassi", prenom="Nadia", email="tech2@hupsa.ma",
                        role="technicien", specialite="Bloc & réanimation"),
        ]
        # Un major par sous-famille
        prenoms = ["Hassan", "Amina", "Youssef", "Khadija", "Rachid", "Latifa",
                   "Said", "Fatima", "Mehdi", "Zineb", "Omar"]
        for i, svc in enumerate(services):
            users.append(Utilisateur(
                nom=f"Major {svc.split()[0]}",
                prenom=prenoms[i % len(prenoms)],
                email=f"major.{_slug(svc)[:25]}@hupsa.ma",
                role="major", service=svc,
                specialite=f"Major de service — {svc}",
            ))
        for u in users:
            u.set_password("hupsa2026")
            db.session.add(u)
        db.session.commit()
        print(f"✓ {len(users)} utilisateurs créés ({sum(1 for u in users if u.role=='major')} majors)")

        # 3. Pièces de rechange (données de démo)
        pieces = [
            Piece(reference="PR-SONDE-01", designation="Sonde échographe cardiaque", marque="GE",
                  quantite_stock=1, seuil_alerte=2, prix_unitaire=8500, emplacement="Magasin A - R3"),
            Piece(reference="PR-FILTRE-02", designation="Filtre HEPA respirateur", marque="Dräger",
                  quantite_stock=0, seuil_alerte=5, prix_unitaire=340, emplacement="Magasin A - R1"),
            Piece(reference="PR-CABLE-03", designation="Câble ECG 5 brins", marque="Philips",
                  quantite_stock=12, seuil_alerte=4, prix_unitaire=210, emplacement="Magasin B - R2"),
            Piece(reference="PR-BATT-04", designation="Batterie Li-Ion pousse-seringue", marque="Fresenius",
                  quantite_stock=3, seuil_alerte=5, prix_unitaire=480, emplacement="Magasin A - R2"),
            Piece(reference="PR-CAPT-05", designation="Capteur SpO2 adulte", marque="Masimo",
                  quantite_stock=8, seuil_alerte=3, prix_unitaire=620, emplacement="Magasin B - R1"),
        ]
        db.session.add_all(pieces)
        db.session.commit()

        # 4. Quelques OT de démo sur les vrais équipements
        eqs = Equipement.query.limit(20).all()
        if len(eqs) >= 4:
            ots = [
                OrdreTravail(numero="OT-2026-0001", titre=f"Calibration annuelle — {eqs[0].nom}",
                             type_ot="preventive", priorite="normale", statut="termine",
                             equipement_id=eqs[0].id, technicien_id=3, createur_id=2,
                             cout_main_oeuvre=1200, duree_minutes=180,
                             observations="Calibration conforme. RAS."),
                OrdreTravail(numero="OT-2026-0002", titre=f"Panne — {eqs[1].nom}",
                             type_ot="corrective", priorite="critique", statut="en_cours",
                             equipement_id=eqs[1].id, technicien_id=4, createur_id=2),
                OrdreTravail(numero="OT-2026-0003", titre=f"Pièce à remplacer — {eqs[2].nom}",
                             type_ot="corrective", priorite="haute", statut="attente_pieces",
                             equipement_id=eqs[2].id, technicien_id=3, createur_id=2,
                             observations="Pièce en commande chez le fournisseur."),
                OrdreTravail(numero="OT-2026-0004", titre=f"Contrôle préventif — {eqs[3].nom}",
                             type_ot="preventive", priorite="basse", statut="ouvert",
                             equipement_id=eqs[3].id, createur_id=2),
            ]
            db.session.add_all(ots)
            # Mettre l'équipement #2 en panne (cohérent avec son OT critique)
            eqs[1].statut = "en_panne"
            db.session.commit()

            # Plannings sur les OT
            now = datetime.utcnow()
            db.session.add_all([
                Planning(ordre_travail_id=2, technicien_id=4,
                         date_debut=now + timedelta(days=1, hours=2),
                         date_fin=now + timedelta(days=1, hours=5)),
                Planning(ordre_travail_id=3, technicien_id=3,
                         date_debut=now + timedelta(days=3, hours=4),
                         date_fin=now + timedelta(days=3, hours=6)),
                Planning(ordre_travail_id=1, technicien_id=3, statut="termine", recurrent=True,
                         date_debut=now - timedelta(days=20),
                         date_fin=now - timedelta(days=20) + timedelta(hours=3)),
            ])

            # OT-Piece (classe d'association)
            db.session.add(OTPiece(ordre_travail_id=1, piece_id=3,
                                    quantite_utilisee=1, prix_unitaire=210))

            # Alertes
            db.session.add_all([
                Alerte(type_alerte="stock_bas", piece_id=2,
                       message="Filtre HEPA respirateur en rupture de stock (0 / seuil 5)"),
                Alerte(type_alerte="stock_bas", piece_id=1,
                       message="Sonde échographe sous le seuil (1 / seuil 2)"),
                Alerte(type_alerte="panne", equipement_id=eqs[1].id,
                       message=f"Panne signalée : {eqs[1].nom}"),
            ])
            db.session.commit()

        print("\n=== Récapitulatif ===")
        print(f"  Utilisateurs : {Utilisateur.query.count()}")
        print(f"  Équipements  : {Equipement.query.count()}")
        print(f"  Services     : {len(services)} -> {', '.join(services[:5])}{'…' if len(services)>5 else ''}")
        print(f"  OT / Pièces / Alertes : {OrdreTravail.query.count()} / {Piece.query.count()} / {Alerte.query.count()}")
        print(f"\n  Mot de passe démo : hupsa2026")
        print(f"  Comptes principaux : admin@hupsa.ma | resp@hupsa.ma | tech1@hupsa.ma | tech2@hupsa.ma")
        print(f"  Majors : major.<service>@hupsa.ma (voir la table utilisateurs)")


if __name__ == "__main__":
    run()
