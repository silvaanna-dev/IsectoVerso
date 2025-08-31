from db import db
from datetime import datetime
import uuid

class Usuario(db.Model):
    __tablename__ = 'usuario'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)
    cargo = db.Column(db.String(20), nullable=False)
    id_admin = db.Column(db.String(12), unique=True, nullable=True)
    id_aluno = db.Column(db.String(12), unique=True, nullable=True)

    # REMOVER os relacionamentos daqui para evitar conflitos

class Inseto(db.Model):
    __tablename__ = 'inseto'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    imagem = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

class Comentario(db.Model):
    __tablename__ = 'comentario'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    texto = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(10), default='pendente')
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Chaves estrangeiras
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    imagem_id = db.Column(db.String(36), db.ForeignKey('imagem.id'), nullable=True)
    inseto_id = db.Column(db.String(36), db.ForeignKey('inseto.id'), nullable=True)
    
    # Relacionamentos - definir apenas aqui
    autor = db.relationship('Usuario', backref=db.backref('comentarios', lazy=True))
    imagem_rel = db.relationship('Imagem', backref=db.backref('comentarios', lazy=True))
    inseto = db.relationship('Inseto', backref=db.backref('comentarios', lazy=True))

class Descricao(db.Model):
    __tablename__ = 'descricao'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    texto = db.Column(db.Text, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Chave estrangeira
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref=db.backref('descricoes', lazy=True))

class Imagem(db.Model):
    __tablename__ = 'imagem'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = db.Column(db.String(100), nullable=False)
    data_url = db.Column(db.Text, nullable=False)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Chave estrangeira
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref=db.backref('imagens', lazy=True))

class Coleta(db.Model):
    __tablename__ = 'coleta'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = db.Column(db.String(100), nullable=False)
    local = db.Column(db.String(200), nullable=True)
    data_coleta = db.Column(db.DateTime, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Chave estrangeira
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    
    # Relacionamento
    usuario = db.relationship('Usuario', backref=db.backref('coletas', lazy=True))