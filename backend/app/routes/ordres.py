"""
Module Ordres de travail.
Machine à états fidèle au diagramme d'états UML :
    ouvert -> en_cours -> {attente_pieces <-> en_cours} -> termine
    (annule possible depuis tout état non-final)
Règle métier n°5 : la clôture met l'équipement en 'operationnel'.

Permissions :
- admin / responsable : tout
- major : voit + crée des OT pour les équipements de son service
- technicien : voit les OT, exécute ceux qui lui sont assignés
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import OrdreTravail, Equipement
from .auth import role_required, current_user

ordres_bp = Blueprint("ordres", __name__)

TRANSITIONS = {
    "ouvert": {"en_cours", "annule"},
    "en_cours": {"attente_pieces", "termine", "annule"},
    "attente_pieces": {"en_cours", "annule"},
    "termine": set(),
    "annule": set(),
}


def _scope_to_user(query, user):
    """Major : filtre sur les OT dont l'équipement appartient à son service."""
    if user.role == "major" and user.service:
        query = query.join(Equipement).filter(Equipement.service == user.service)
    return query


@ordres_bp.get("")
@jwt_required()
def liste():
    user = current_user()
    q = _scope_to_user(OrdreTravail.query, user).order_by(OrdreTravail.id.desc())
    statut = request.args.get("statut")
    if statut:
        q = q.filter(OrdreTravail.statut == statut)
    return jsonify([o.to_dict() for o in q.all()])


@ordres_bp.get("/<int:oid>")
@jwt_required()
def detail(oid):
    user = current_user()
    o = OrdreTravail.query.get_or_404(oid)
    if user.role == "major" and (not o.equipement or o.equipement.service != user.service):
        return jsonify({"msg": "OT hors de votre service"}), 403
    data = o.to_dict()
    data["pieces"] = [p.to_dict() for p in o.pieces_utilisees]
    return jsonify(data)


@ordres_bp.post("")
@role_required("admin", "responsable", "major")
def creer():
    """Règle métier n°1 : un OT démarre toujours à l'état 'ouvert'.
    Le major ne peut créer un OT que pour un équipement de son service."""
    user = current_user()
    d = request.get_json() or {}
    eq = Equipement.query.get(d.get("equipement_id"))
    if not eq:
        return jsonify({"msg": "Équipement introuvable"}), 404
    if user.role == "major" and eq.service != user.service:
        return jsonify({"msg": "Vous ne pouvez créer un OT que pour votre service"}), 403

    o = OrdreTravail(
        numero=OrdreTravail.generer_numero(),
        titre=d["titre"], description=d.get("description"),
        type_ot=d.get("type_ot", "corrective"), priorite=d.get("priorite", "normale"),
        statut="ouvert", equipement_id=eq.id, createur_id=user.id,
    )
    db.session.add(o)
    db.session.commit()
    return jsonify(o.to_dict()), 201


@ordres_bp.patch("/<int:oid>/transition")
@jwt_required()
def transition(oid):
    """Applique une transition d'état (machine à états)."""
    user = current_user()
    o = OrdreTravail.query.get_or_404(oid)

    # Le major ne pilote pas le cycle de vie : il signale, c'est tout
    if user.role == "major":
        return jsonify({"msg": "Le major ne peut pas modifier le statut d'un OT"}), 403

    d = request.get_json() or {}
    cible = d.get("statut")
    if cible not in TRANSITIONS.get(o.statut, set()):
        return jsonify({
            "msg": f"Transition interdite : {o.statut} -> {cible}",
            "transitions_possibles": sorted(TRANSITIONS.get(o.statut, set())),
        }), 400

    if o.statut == "ouvert" and cible == "en_cours":
        tech = d.get("technicien_id")
        if not tech:
            return jsonify({"msg": "Un technicien doit être assigné pour démarrer"}), 400
        o.technicien_id = tech
        o.date_debut = datetime.utcnow()

    if cible == "termine":
        o.date_fin = datetime.utcnow()
        o.observations = d.get("observations", o.observations)
        o.cout_main_oeuvre = d.get("cout_main_oeuvre", o.cout_main_oeuvre)
        if o.date_debut:
            o.duree_minutes = int((o.date_fin - o.date_debut).total_seconds() // 60)
        if o.equipement:
            o.equipement.statut = "operationnel"

    o.statut = cible
    db.session.commit()
    return jsonify(o.to_dict())
