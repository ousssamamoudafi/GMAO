"""Module Reporting : statistiques agrégées pour le tableau de bord.
Filtrage automatique pour le rôle 'major' (vue restreinte à son service)."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..models import Equipement, OrdreTravail, Piece, Alerte
from .auth import current_user

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/stats")
@jwt_required()
def stats():
    user = current_user()

    eq_q = Equipement.query
    if user.role == "major" and user.service:
        eq_q = eq_q.filter_by(service=user.service)
    equipements = eq_q.all()

    ot_q = OrdreTravail.query
    if user.role == "major" and user.service:
        ot_q = ot_q.join(Equipement).filter(Equipement.service == user.service)
    ordres = ot_q.all()

    # Le major ne voit pas le stock global (pas son périmètre)
    pieces = [] if user.role == "major" else Piece.query.all()

    def count_eq(s): return sum(1 for e in equipements if e.statut == s)
    def count_ot(s): return sum(1 for o in ordres if o.statut == s)

    total_eq = len(equipements) or 1
    return jsonify({
        "scope": user.service if user.role == "major" else "global",
        "equipements_total": len(equipements),
        "equipements_par_statut": {
            "operationnel": count_eq("operationnel"), "en_panne": count_eq("en_panne"),
            "maintenance": count_eq("maintenance"), "reforme": count_eq("reforme"),
        },
        "taux_disponibilite": round(count_eq("operationnel") / total_eq * 100),
        "ot_total": len(ordres),
        "ot_par_statut": {s: count_ot(s) for s in
                          ["ouvert", "en_cours", "attente_pieces", "termine", "annule"]},
        "ot_actifs": sum(count_ot(s) for s in ["ouvert", "en_cours", "attente_pieces"]),
        "pieces_total": len(pieces),
        "pieces_stock_bas": sum(1 for p in pieces if p.stock_bas()),
        "valeur_stock": sum(p.valeur_stock() for p in pieces),
        "alertes_non_lues": Alerte.query.filter_by(lue=False).count() if user.role != "major"
            else Alerte.query.join(Equipement, Alerte.equipement_id == Equipement.id)
                 .filter(Alerte.lue == False, Equipement.service == user.service).count(),
    })
