"""Extensions Flask instanciées séparément pour éviter les imports circulaires."""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()
