"""Module Planning : créneaux d'intervention, format FullCalendar."""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from ..extensions import db
from ..models import Planning
from .auth import role_required

planning_bp = Blueprint("planning", __name__)


@planning_bp.get("")
@jwt_required()
def liste():
    items = Planning.query.order_by(Planning.date_debut).all()
    return jsonify([p.to_dict() for p in items])


@planning_bp.get("/calendar")
@jwt_required()
def calendar():
    """Évènements au format FullCalendar pour le frontend."""
    return jsonify([p.to_fullcalendar() for p in Planning.query.all()])


@planning_bp.post("")
@role_required("admin", "responsable")
def planifier():
    d = request.get_json() or {}
    p = Planning(
        ordre_travail_id=d["ordre_travail_id"], technicien_id=d.get("technicien_id"),
        date_debut=datetime.fromisoformat(d["date_debut"]),
        date_fin=datetime.fromisoformat(d["date_fin"]),
        recurrent=d.get("recurrent", False),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201
