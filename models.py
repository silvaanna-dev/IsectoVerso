from db import db
from datetime import datetime
import uuid

# models.py - Correção dos relacionamentos
class Usuario(db.Model):
    __tablename__ = 'usuario'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(100), nullable=False)
    cargo = db.Column(db.String(20), nullable=False)
    id_admin = db.Column(db.String(12), unique=True, nullable=True)
    id_aluno = db.Column(db.String(12), unique=True, nullable=True)

    # REMOVER ESTES - estão causando conflito
    # comentarios_feitos = db.relationship('Comentario', foreign_keys='Comentario.usuario_id', backref='autor_completo')
    # respostas_administrador = db.relationship('Comentario', foreign_keys='Comentario.administrador_id', backref='admin_completo')

class Comentario(db.Model):
    __tablename__ = 'comentario'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    texto = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(10), default='pendente')
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    
    resposta = db.Column(db.Text, nullable=True)
    resposta_criada_em = db.Column(db.DateTime, nullable=True)
    administrador_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)

    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    imagem_id = db.Column(db.String(36), db.ForeignKey('imagem.id'), nullable=True)
    inseto_id = db.Column(db.String(36), db.ForeignKey('inseto.id'), nullable=True)
    
    # Manter apenas estes relacionamentos
    autor = db.relationship('Usuario', foreign_keys=[usuario_id], backref='comentarios_enviados')
    administrador = db.relationship('Usuario', foreign_keys=[administrador_id], backref='comentarios_respondidos')
    imagem_rel = db.relationship('Imagem', backref='comentarios_imagem')
    inseto = db.relationship('Inseto', backref='comentarios_inseto')

class Inseto(db.Model):
    __tablename__ = 'inseto'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    imagem = db.Column(db.Text, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

class DescricaoInseto(db.Model):
    __tablename__ = 'descricao_inseto'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    titulo = db.Column(db.String(200), nullable=False)
    descricao = db.Column(db.Text, nullable=False)
    caracteristicas = db.Column(db.Text, nullable=True)  # Características principais
    habitat = db.Column(db.Text, nullable=True)         # Habitat natural
    curiosidades = db.Column(db.Text, nullable=True)    # Curiosidades
    status = db.Column(db.String(20), default='ativo')  # ativo, inativo
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)
    atualizado_em = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Chaves estrangeiras
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    inseto_id = db.Column(db.String(36), db.ForeignKey('inseto.id'), nullable=False)
    
    # Relacionamentos
    usuario = db.relationship('Usuario', backref=db.backref('descricoes_insetos', lazy=True))
    inseto = db.relationship('Inseto', backref=db.backref('descricoes', lazy=True))
    
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