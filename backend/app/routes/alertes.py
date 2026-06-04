"""Module Alertes : notifications système.
Majors : ne voient que les alertes liées aux équipements de leur service."""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Alerte, Equipement
from .auth import current_user

alertes_bp = Blueprint("alertes", __name__)


@alertes_bp.get("")
@jwt_required()
def liste():
    user = current_user()
    q = Alerte.query
    if user.role == "major" and user.service:
        q = q.outerjoin(Equipement, Alerte.equipement_id == Equipement.id) \
             .filter(Equipement.service == user.service)
    items = q.order_by(Alerte.created_at.desc()).all()
    return jsonify([a.to_dict() for a in items])


@alertes_bp.patch("/<int:aid>/lue")
@jwt_required()
def marquer_lue(aid):
    a = Alerte.query.get_or_404(aid)
    a.marquer_lue()
    db.session.commit()
    return jsonify(a.to_dict())


@alertes_bp.patch("/tout-lire")
@jwt_required()
def tout_lire():
    for a in Alerte.query.filter_by(lue=False).all():
        a.marquer_lue()
    db.session.commit()
    return jsonify({"msg": "Toutes les alertes marquées comme lues"})
