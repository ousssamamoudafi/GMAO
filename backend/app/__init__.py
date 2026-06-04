"""
Application factory.
Couche API REST (Flask 3 + Blueprints) + Couche Sécurité (JWT + CORS).
Cf. diagramme de composants : routes organisées en Blueprints par module fonctionnel.
"""
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from .extensions import db, jwt


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Couche Sécurité : CORS (autorise le frontend React) + JWT
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    jwt.init_app(app)

    # --- Enregistrement des Blueprints (un par module fonctionnel) ---
    from .routes.auth import auth_bp
    from .routes.utilisateurs import users_bp
    from .routes.equipements import equip_bp
    from .routes.ordres import ordres_bp
    from .routes.planning import planning_bp
    from .routes.stock import stock_bp
    from .routes.alertes import alertes_bp
    from .routes.dashboard import dashboard_bp
    from .routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/utilisateurs")
    app.register_blueprint(equip_bp, url_prefix="/api/equipements")
    app.register_blueprint(ordres_bp, url_prefix="/api/ordres")
    app.register_blueprint(planning_bp, url_prefix="/api/planning")
    app.register_blueprint(stock_bp, url_prefix="/api/stock")
    app.register_blueprint(alertes_bp, url_prefix="/api/alertes")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "GMAO HUPSA API"})

    return app
