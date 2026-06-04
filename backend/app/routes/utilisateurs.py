"""Module Utilisateurs : gestion des comptes (réservé admin)."""
from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models import Utilisateur
from .auth import role_required

users_bp = Blueprint("utilisateurs", __name__)


@users_bp.get("")
@role_required("admin")
def liste():
    return jsonify([u.to_dict() for u in Utilisateur.query.all()])


@users_bp.post("")
@role_required("admin")
def creer():
    data = request.get_json() or {}
    u = Utilisateur(
        nom=data["nom"], prenom=data["prenom"], email=data["email"],
        role=data.get("role", "technicien"), specialite=data.get("specialite"),
        telephone=data.get("telephone"),
    )
    u.set_password(data.get("password", "changeme"))
    db.session.add(u)
    db.session.commit()
    return jsonify(u.to_dict()), 201
