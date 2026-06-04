"""Module Stock : pièces de rechange, consommation, mouvements, alertes de seuil."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Piece, MouvementStock, Alerte
from .auth import role_required

stock_bp = Blueprint("stock", __name__)


@stock_bp.get("")
@jwt_required()
def liste():
    return jsonify([p.to_dict() for p in Piece.query.all()])


@stock_bp.post("")
@role_required("admin", "responsable")
def creer():
    d = request.get_json() or {}
    p = Piece(
        reference=d["reference"], designation=d["designation"], marque=d.get("marque"),
        quantite_stock=d.get("quantite_stock", 0), seuil_alerte=d.get("seuil_alerte", 5),
        prix_unitaire=d.get("prix_unitaire", 0), emplacement=d.get("emplacement"),
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(p.to_dict()), 201


def _mouvement(piece, type_mvt, qte, motif, uid):
    db.session.add(MouvementStock(
        piece_id=piece.id, utilisateur_id=uid,
        type_mouvement=type_mvt, quantite=qte, motif=motif,
    ))


@stock_bp.patch("/<int:pid>/consommer")
@jwt_required()
def consommer(pid):
    """Sortie de stock + génération d'alerte automatique si seuil atteint."""
    p = Piece.query.get_or_404(pid)
    qte = (request.get_json() or {}).get("quantite", 1)
    p.quantite_stock = max(0, p.quantite_stock - qte)
    _mouvement(p, "sortie", qte, "Consommation OT", int(get_jwt_identity()))
    if p.stock_bas():
        db.session.add(Alerte(
            type_alerte="stock_bas", piece_id=p.id,
            message=f"{p.designation} sous le seuil ({p.quantite_stock} / {p.seuil_alerte})",
        ))
    db.session.commit()
    return jsonify(p.to_dict())


@stock_bp.patch("/<int:pid>/reapprovisionner")
@role_required("admin", "responsable")
def reapprovisionner(pid):
    p = Piece.query.get_or_404(pid)
    qte = (request.get_json() or {}).get("quantite", 10)
    p.quantite_stock += qte
    _mouvement(p, "entree", qte, "Réapprovisionnement", int(get_jwt_identity()))
    db.session.commit()
    return jsonify(p.to_dict())


@stock_bp.get("/mouvements")
@jwt_required()
def mouvements():
    items = MouvementStock.query.order_by(MouvementStock.date_mouvement.desc()).all()
    return jsonify([m.to_dict() for m in items])
