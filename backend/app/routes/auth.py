"""Module Authentification : login JWT + helper d'autorisation par rôle."""
from functools import wraps
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from ..extensions import db
from ..models import Utilisateur

auth_bp = Blueprint("auth", __name__)


def current_user():
    """Retourne l'utilisateur connecté (depuis le JWT)."""
    return Utilisateur.query.get(int(get_jwt_identity()))


def role_required(*roles):
    """Décorateur d'autorisation : restreint une route à certains rôles
    (traduction des permissions du diagramme de cas d'utilisation)."""
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorated(*args, **kwargs):
            claims = get_jwt()
            if roles and claims.get("role") not in roles:
                return jsonify({"msg": "Accès refusé pour votre rôle"}), 403
            return fn(*args, **kwargs)
        return decorated
    return wrapper


@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    user = Utilisateur.query.filter_by(email=data.get("email")).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"msg": "Identifiants invalides"}), 401
    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "service": user.service},
    )
    return jsonify({"access_token": token, "user": user.to_dict()})


@auth_bp.get("/me")
@jwt_required()
def me():
    return jsonify(current_user().to_dict())


@auth_bp.get("/comptes-demo")
def comptes_demo():
    """Route PUBLIQUE de démonstration : retourne la liste des comptes (sans mot de passe)
    pour que la page de login propose un sélecteur pratique au jury."""
    users = Utilisateur.query.filter_by(actif=True).all()
    ordre = {"admin": 0, "responsable": 1, "technicien": 2, "major": 3}
    users.sort(key=lambda u: (ordre.get(u.role, 9), u.service or "", u.nom))
    return jsonify([{
        "email": u.email, "prenom": u.prenom, "nom": u.nom,
        "role": u.role, "service": u.service,
    } for u in users])
