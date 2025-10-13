
from models import Inseto, Imagem
from db import db
import uuid
import datetime
from main import app

with app.app_context():
    imagens = Imagem.query.all()
    
    for nova_imagem in imagens:
        novo_inseto = Inseto(
            id=str(uuid.uuid4()),
            nome=nova_imagem.nome,
            descricao="Descrição padrão",  # Forneça um valor padrão
            imagem=nova_imagem.data_url,
            criado_em=datetime.datetime.utcnow()
        )
        db.session.add(novo_inseto)
    
    db.session.commit()