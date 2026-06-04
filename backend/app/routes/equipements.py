"""Module Équipements : CRUD, changement de statut, historique.
Les majors de service ne voient que les équipements de leur SOUS FAMILLE."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Equipement
from .auth import role_required, current_user

equip_bp = Blueprint("equipements", __name__)


def _scope_to_user(query, user):
    """Restreint la requête au service du major (sinon : toutes les données)."""
    if user.role == "major" and user.service:
        query = query.filter(Equipement.service == user.service)
    return query


@equip_bp.get("")
@jwt_required()
def liste():
    user = current_user()
    q = _scope_to_user(Equipement.query, user)
    statut = request.args.get("statut")
    if statut:
        q = q.filter_by(statut=statut)
    service = request.args.get("service")
    if service and user.role != "major":
        q = q.filter_by(service=service)
    return jsonify([e.to_dict() for e in q.all()])


@equip_bp.get("/services")
@jwt_required()
def liste_services():
    """Liste des services (sous-familles) pour le filtre côté frontend."""
    user = current_user()
    if user.role == "major":
        return jsonify([user.service])
    rows = db.session.query(Equipement.service).distinct().filter(Equipement.service.isnot(None)).all()
    return jsonify(sorted(r[0] for r in rows))


@equip_bp.get("/<int:eid>")
@jwt_required()
def detail(eid):
    user = current_user()
    e = Equipement.query.get_or_404(eid)
    if user.role == "major" and e.service != user.service:
        return jsonify({"msg": "Équipement hors de votre service"}), 403
    data = e.to_dict()
    data["historique"] = e.get_historique()
    return jsonify(data)


@equip_bp.post("")
@role_required("admin", "responsable")
def creer():
    d = request.get_json() or {}
    e = Equipement(
        nom=d["nom"], marque=d.get("marque"), modele=d.get("modele"),
        numero_serie=d["numero_serie"], service=d.get("service"),
        localisation=d.get("localisation"), statut=d.get("statut", "operationnel"),
    )
    db.session.add(e)
    db.session.commit()
    return jsonify(e.to_dict()), 201


@equip_bp.patch("/<int:eid>/statut")
@jwt_required()
def changer_statut(eid):
    user = current_user()
    e = Equipement.query.get_or_404(eid)
    if user.role == "major" and e.service != user.service:
        return jsonify({"msg": "Équipement hors de votre service"}), 403
    e.statut = (request.get_json() or {}).get("statut", e.statut)
    db.session.commit()
    return jsonify(e.to_dict())
