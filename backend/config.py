"""Configuration de l'application GMAO.
Couche Persistance : SQLite en développement, PostgreSQL en production
(il suffit de changer DATABASE_URL — cf. diagramme de composants, couche 5).
"""
import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-hupsa-secret-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-hupsa-secret-2026")
    # SQLite en dev — pour PostgreSQL : postgresql://user:pass@host/gmao
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///" + os.path.join(BASE_DIR, "gmao.db")
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = 60 * 60 * 8  # 8 heures
