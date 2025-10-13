from main import app, db, Comentario
with app.app_context():
    comentarios = Comentario.query.all()
    print(f"Total de comentários no banco: {len(comentarios)}")
    
    comentarios_pendentes = Comentario.query.filter_by(status='pendente').all()
    print(f"Comentários pendentes: {len(comentarios_pendentes)}")
    
    for comentario in comentarios_pendentes:
        print(f"ID: {comentario.id}")
        print(f"Texto: {comentario.texto}")
        print(f"Autor ID: {comentario.usuario_id}")
        print(f"Imagem ID: {comentario.imagem_id}")
        print("---")