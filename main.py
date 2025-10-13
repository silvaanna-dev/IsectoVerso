from flask import Flask
from db import db
from models import Usuario, Inseto, Comentario, Coleta, DescricaoInseto, Imagem

app = Flask(__name__)
app.config['SECRET_KEY'] = 'X149350491TSK9019320X'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 102
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///usuarios.db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

from route import *

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)