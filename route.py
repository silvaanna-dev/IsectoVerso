from flask import render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from models import Usuario, Inseto, Comentario, Coleta, DescricaoInseto, Imagem
import uuid
from datetime import datetime
from main import app
import base64

# ========= ROTAS PRINCIPAIS =========
@app.route("/", methods=["GET", "POST"])
def home():
    if 'usuario_id' in session:
        return redirect(url_for('pagina_app'))
    
    if request.method == "POST":
        nome = request.form.get('nome')
        email = request.form.get('email')
        senha = request.form.get('senha')
        confirmar_senha = request.form.get('confirmar_senha')
        cargo = request.form.get('cargo')
        id_admin = request.form.get('id_admin')
        id_aluno = request.form.get('id_aluno')
        
        # Verificar se as senhas coincidem
        if senha != confirmar_senha:
            flash('As senhas não coincidem.', 'error')
            return render_template('index.html')
        
        # Verificar se o email já existe
        if Usuario.query.filter_by(email=email).first():
            flash('Este e-mail já está cadastrado.', 'error')
            return render_template('index.html')
        
        # Validar IDs específicos
        if cargo == 'administrador' and (not id_admin or len(id_admin) != 12):
            flash('ID de administrador inválido. Deve ter 12 dígitos.', 'error')
            return render_template('index.html')
            
        if cargo == 'aluno' and (not id_aluno  or len(id_aluno) != 12):
            flash('ID de aluno inválido. Deve ter 12 dígitos.', 'error')
            return render_template('index.html')
        
        # Criar novo usuário
        try:
            novo_usuario = Usuario(
                nome=nome,
                email=email,
                senha=generate_password_hash(senha),
                cargo=cargo,
                id_admin=id_admin if cargo == 'administrador' else None,
                id_aluno=id_aluno if cargo == 'aluno' else None
            )
            
            db.session.add(novo_usuario)
            db.session.commit()
            
            flash('Conta criada com sucesso! Faça login para continuar.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            flash('Erro ao criar conta. Tente novamente.', 'error')
            return render_template('index.html')
    
    return render_template('index.html')

@app.route("/login", methods=["GET", "POST"])
def login():
    print("=== LOGIN ACESSADO ===")
    
    if 'usuario_id' in session:
        print("Usuário já logado, redirecionando...")
        return redirect(url_for('pagina_app'))
    
    if request.method == "POST":
        email = request.form.get('email')
        senha = request.form.get('senha')
        
        print(f"Tentativa de login - Email: {email}")
        
        # Verificar se os campos estão preenchidos
        if not email or not senha:
            print("Campos não preenchidos")
            flash('Por favor, preencha todos os campos.', 'error')
            return render_template('login.html')
        
        usuario = Usuario.query.filter_by(email=email).first()
        
        if usuario:
            print(f"Usuário encontrado: {usuario.nome}")
            print(f"Senha hash no BD: {usuario.senha}")
            
            if check_password_hash(usuario.senha, senha):
                print("Senha correta - Login bem-sucedido")
                # Login bem-sucedido - criar sessão
                session['usuario_id'] = usuario.id
                session['usuario_nome'] = usuario.nome
                session['usuario_email'] = usuario.email
                session['usuario_cargo'] = usuario.cargo
                
                flash('Login realizado com sucesso!', 'success')
                return redirect(url_for('pagina_app'))
            else:
                print("Senha incorreta")
        else:
            print("Usuário não encontrado")
        
        flash('E-mail ou senha incorretos.', 'error')
    
    return render_template('login.html')

@app.route("/app", methods=["GET", "POST"])
def pagina_app():
    if 'usuario_id' not in session:
        return redirect(url_for('login'))
    
    usuario_info = {
        'nome': session['usuario_nome'],
        'cargo': session['usuario_cargo']
    }

    imagens = Imagem.query.order_by(Imagem.criado_em.desc()).all()
    
    return render_template("app.html", users=usuario_info, imagens=imagens)

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')
    
    usuario = Usuario.query.filter_by(email=email).first()
    
    if usuario and check_password_hash(usuario.senha, senha):
        return jsonify({
            'success': True,
            'usuario': {
                'email': usuario.email,
                'nome': usuario.nome,
                'tipo': usuario.cargo
            }
        })
    else:
        return jsonify({
            'success': False,
            'message': 'E-mail ou senha incorretos.'
        })
    
# ROTAS API/FUNCTION

@app.route('/adicionar_imagem', methods=['POST'])
def adicionar_imagem():
    user_id = session.get('usuario_id')

    #Verificar se está logado
    if not user_id:
        print("erro logar")
        flash('imagem', 'Você precisa estar logado para realizar esta ação.')
        return redirect(url_for('login'))
    
    user = Usuario.query.get(user_id)
    
    # Verificar se o usuário é administrador
    if user.cargo != 'administrador':
        print("erro admin")
        flash('imagem', 'Apenas administradores podem adicionar imagens.')
        return redirect(url_for('pagina_app'))
    
    # Obter dados do formulário
    nome = request.form.get('nomeImagem')
    arquivo = request.files.get('arquivoImagem')
    
    if not nome or not arquivo:
        print("erro campos")
        flash('imagem', 'Por favor, preencha todos os campos.')
        return redirect(url_for('pagina_app'))
    
    # Verificar se o arquivo é uma imagem
    if not arquivo.content_type.startswith('image/'):
        print("erro arq imagem")
        flash('imagem', 'Por favor, envie apenas arquivos de imagem.')
        return redirect(url_for('pagina_app'))
    
    try:
        # Ler e codificar a imagem em base64
        dados_imagem = base64.b64encode(arquivo.read()).decode('utf-8')
        
        # Criar nova imagem no banco de dados
        nova_imagem = Imagem(
            id=str(uuid.uuid4()),
            nome=nome,
            data_url=dados_imagem,
            usuario_id=user_id,
            criado_em=datetime.utcnow()
        )
        novo_inseto = Inseto(
            id=str(uuid.uuid4()),
            nome=nova_imagem.nome,
            descricao = None,
            imagem=nova_imagem.data_url,
            criado_em=datetime.utcnow()
        )
        
        db.session.add(nova_imagem)
        db.session.commit()

        print("sucess")
        flash('imagem', 'Imagem enviada com sucesso!')
    except Exception as e:
        db.session.rollback()
        print("erro envio:", str(e))
        flash('imagem', f'Erro ao enviar imagem: {str(e)}')
    
    return redirect(url_for('pagina_app'))

# API para buscar informações da imagem
@app.route('/api/imagem/<imagem_id>')
def api_imagem(imagem_id):
    if 'usuario_id' not in session:
        return jsonify({'success': False, 'message': 'Não autorizado'}), 401
    
    imagem = Imagem.query.get(imagem_id)
    if not imagem:
        return jsonify({'success': False, 'message': 'Imagem não encontrada'}), 404
    
    return jsonify({
        'success': True,
        'id': imagem.id,
        'nome': imagem.nome,
        'data_url': imagem.data_url
    })

# API para adicionar comentário - CORRIGIDA
@app.route('/api/comentario', methods=['POST'])
def api_comentario():
    if 'usuario_id' not in session:
        return jsonify({'success': False, 'message': 'Não autorizado'}), 401
    
    data = request.get_json()
    imagem_id = data.get('imagem_id')
    texto = data.get('texto')
    
    if not imagem_id or not texto:
        return jsonify({'success': False, 'message': 'Dados incompletos'}), 400
    
    # Verificar se a imagem existe
    imagem = Imagem.query.get(imagem_id)
    if not imagem:
        return jsonify({'success': False, 'message': 'Imagem não encontrada'}), 404
    
    try:
        # Criar novo comentário
        novo_comentario = Comentario(
            texto=texto,
            usuario_id=session['usuario_id'],
            imagem_id=imagem_id
        )
        
        db.session.add(novo_comentario)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Comentário enviado com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# API para listar comentários pendentes - Versão Corrigida
# API para listar comentários pendentes - VERSÃO CORRIGIDA
@app.route('/api/comentarios_pendentes')
def api_comentarios_pendentes():
    try:
        print("=== ACESSANDO API COMENTÁRIOS PENDENTES ===")
        
        # Verificar autenticação
        if 'usuario_id' not in session:
            print("Usuário não autenticado")
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user:
            print("Usuário não encontrado")
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
        
        if user.cargo != 'administrador':
            print(f"Acesso negado - Cargo: {user.cargo}")
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        # Buscar comentários pendentes - CORREÇÃO AQUI
        comentarios = Comentario.query.filter(
            (Comentario.status == 'pendente') | (Comentario.status.is_(None))
        ).all()
        
        print(f"Encontrados {len(comentarios)} comentários pendentes")
        
        resultado = []
        for comentario in comentarios:
            print(f"Processando comentário ID: {comentario.id}")
            
            # Obter nome do autor
            autor_nome = comentario.autor.nome if comentario.autor else 'Usuário Desconhecido'
            
            # Obter nome da imagem (se existir)
            imagem_nome = 'Nenhuma imagem associada'
            if comentario.imagem_id:
                imagem = Imagem.query.get(comentario.imagem_id)
                imagem_nome = imagem.nome if imagem else 'Imagem não encontrada'
            elif comentario.inseto_id:
                inseto = Inseto.query.get(comentario.inseto_id)
                imagem_nome = inseto.nome if inseto else 'Inseto não encontrado'
            
            # Garantir que o ID seja string serializável
            comentario_id = str(comentario.id)
            
            resultado.append({
                'id': comentario_id,
                'texto': comentario.texto,
                'data': comentario.criado_em.strftime('%d/%m/%Y %H:%M'),
                'usuario': autor_nome,
                'imagem_nome': imagem_nome,
                'resposta': comentario.resposta,
                'data_resposta': comentario.resposta_criada_em.strftime('%d/%m/%Y %H:%M') if comentario.resposta_criada_em else None
            })
        
        # Estatísticas
        total = Comentario.query.count()
        pendentes = Comentario.query.filter(
            (Comentario.status == 'pendente') | (Comentario.status.is_(None))
        ).count()
        respondidos = Comentario.query.filter_by(status='respondido').count()
        
        return jsonify({
            'success': True, 
            'comentarios': resultado,
            'total': total,
            'pendentes': pendentes,
            'respondidos': respondidos
        })
        
    except Exception as e:
        print(f"ERRO na API comentarios_pendentes: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500

# API para moderar comentário - Versão Corrigida
@app.route('/api/moderar_comentario/<comentario_id>', methods=['POST'])
def api_moderar_comentario(comentario_id):
    try:
        print(f"=== MODERANDO COMENTÁRIO {comentario_id} ===")
        
        # Verificar autenticação
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'Dados não fornecidos'}), 400
        
        acao = data.get('acao')
        
        # Buscar comentário
        comentario = Comentario.query.get(comentario_id)
        if not comentario:
            return jsonify({'success': False, 'message': 'Comentário não encontrado'}), 404
        
        # Aplicar ação
        if acao == 'aprovar':
            comentario.status = 'aprovado'
            mensagem = 'Comentário aprovado com sucesso!'
        elif acao == 'rejeitar':
            comentario.status = 'rejeitado'
            mensagem = 'Comentário removido com sucesso!'
        else:
            return jsonify({'success': False, 'message': 'Ação inválida'}), 400
        
        db.session.commit()
        return jsonify({'success': True, 'message': mensagem})
        
    except Exception as e:
        db.session.rollback()
        print(f"ERRO ao moderar comentário: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': f'Erro interno: {str(e)}'}), 500

# API para listar comentários do usuário logado
@app.route('/api/meus_comentarios')
def api_meus_comentarios():
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        usuario_id = session['usuario_id']
        comentarios = Comentario.query.filter_by(usuario_id=usuario_id).order_by(Comentario.criado_em.desc()).all()
        
        resultado = []
        for comentario in comentarios:
            imagem_nome = 'Nenhuma imagem associada'
            if comentario.imagem_id:
                imagem = Imagem.query.get(comentario.imagem_id)
                imagem_nome = imagem.nome if imagem else 'Imagem não encontrada'
            
            resultado.append({
                'id': comentario.id,
                'texto': comentario.texto,
                'status': comentario.status,
                'data_envio': comentario.criado_em.strftime('%d/%m/%Y %H:%M'),
                'data_resposta': comentario.resposta_criada_em.strftime('%d/%m/%Y %H:%M') if comentario.resposta_criada_em else None,
                'imagem_nome': imagem_nome,
                'resposta': comentario.resposta
            })
        
        return jsonify({'success': True, 'comentarios': resultado})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# API para responder comentário
@app.route('/api/responder_comentario/<comentario_id>', methods=['POST'])
def api_responder_comentario(comentario_id):
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        data = request.get_json()
        resposta = data.get('resposta')
        
        if not resposta:
            return jsonify({'success': False, 'message': 'Resposta não fornecida'}), 400
        
        comentario = Comentario.query.get(comentario_id)
        if not comentario:
            return jsonify({'success': False, 'message': 'Comentário não encontrado'}), 404
        
        # Atualizar comentário com resposta
        comentario.resposta = resposta
        comentario.resposta_criada_em = datetime.utcnow()
        comentario.administrador_id = user.id
        comentario.status = 'respondido'  # Atualizar status
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Resposta enviada com sucesso',
            'data_resposta': comentario.resposta_criada_em.strftime('%d/%m/%Y %H:%M')
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    
# API para listar todos os comentários (apenas administradores)
@app.route('/api/todos_comentarios')
def api_todos_comentarios():
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        comentarios = Comentario.query.order_by(Comentario.criado_em.desc()).all()
        
        resultado = []
        for comentario in comentarios:
            # Informações do autor
            autor = Usuario.query.get(comentario.usuario_id)
            autor_nome = autor.nome if autor else 'Usuário não encontrado'
            
            # Informações da imagem
            imagem_nome = 'Nenhuma imagem associada'
            if comentario.imagem_id:
                imagem = Imagem.query.get(comentario.imagem_id)
                imagem_nome = imagem.nome if imagem else 'Imagem não encontrada'
            
            # Informações do inseto
            inseto_nome = 'Nenhum inseto associado'
            if comentario.inseto_id:
                inseto = Inseto.query.get(comentario.inseto_id)
                inseto_nome = inseto.nome if inseto else 'Inseto não encontrado'
            
            resultado.append({
                'id': comentario.id,
                'texto': comentario.texto,
                'status': comentario.status,
                'autor_nome': autor_nome,
                'autor_email': autor.email if autor else '',
                'data_envio': comentario.criado_em.strftime('%d/%m/%Y %H:%M'),
                'data_resposta': comentario.resposta_criada_em.strftime('%d/%m/%Y %H:%M') if comentario.resposta_criada_em else None,
                'imagem_nome': imagem_nome,
                'inseto_nome': inseto_nome,
                'resposta': comentario.resposta
            })
        
        return jsonify({'success': True, 'comentarios': resultado})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    
# API para excluir comentário
@app.route('/api/excluir_comentario/<comentario_id>', methods=['DELETE'])
def api_excluir_comentario(comentario_id):
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        comentario = Comentario.query.get(comentario_id)
        if not comentario:
            return jsonify({'success': False, 'message': 'Comentário não encontrado'}), 404
        
        # Verificar se é o autor ou administrador
        user = Usuario.query.get(session['usuario_id'])
        if comentario.usuario_id != user.id and user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        db.session.delete(comentario)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Comentário excluído com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500  

# API para verificar se usuário é administrador
@app.route('/api/verificar_admin')
def api_verificar_admin():
    try:
        if 'usuario_id' not in session:
            return jsonify({'is_admin': False})
        
        user = Usuario.query.get(session['usuario_id'])
        if user and user.cargo == 'administrador':
            return jsonify({'is_admin': True})
        else:
            return jsonify({'is_admin': False})
            
    except Exception as e:
        return jsonify({'is_admin': False})



#Rota misc  

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route("/esq_senha")
def esq_senha():
    return render_template("recu.html")


# ===== API PARA DESCRIÇÕES DE INSETOS =====

# API para listar descrições de insetos (acesso público)
@app.route('/api/descricoes_insetos')
def api_descricoes_insetos():
    try:
        descricoes = DescricaoInseto.query.filter_by(status='ativo').order_by(DescricaoInseto.criado_em.desc()).all()
        
        resultado = []
        for descricao in descricoes:
            resultado.append({
                'id': descricao.id,
                'titulo': descricao.titulo,
                'descricao': descricao.descricao,
                'caracteristicas': descricao.caracteristicas,
                'habitat': descricao.habitat,
                'curiosidades': descricao.curiosidades,
                'inseto_nome': descricao.inseto.nome,
                'inseto_imagem': descricao.inseto.imagem,
                'autor': descricao.usuario.nome,
                'data_criacao': descricao.criado_em.strftime('%d/%m/%Y'),
                'data_atualizacao': descricao.atualizado_em.strftime('%d/%m/%Y') if descricao.atualizado_em else None
            })
        
        return jsonify({'success': True, 'descricoes': resultado})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# API para adicionar descrição (apenas administradores)
@app.route('/api/descricao_inseto', methods=['POST'])
def api_adicionar_descricao_inseto():
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not data.get('titulo') or not data.get('descricao') or not data.get('inseto_id'):
            return jsonify({'success': False, 'message': 'Título, descrição e inseto são obrigatórios'}), 400
        
        # Verificar se o inseto existe
        inseto = Inseto.query.get(data.get('inseto_id'))
        if not inseto:
            return jsonify({'success': False, 'message': 'Inseto não encontrado'}), 404
        
        # Criar nova descrição
        nova_descricao = DescricaoInseto(
            titulo=data.get('titulo'),
            descricao=data.get('descricao'),
            caracteristicas=data.get('caracteristicas', ''),
            habitat=data.get('habitat', ''),
            curiosidades=data.get('curiosidades', ''),
            usuario_id=user.id,
            inseto_id=data.get('inseto_id')
        )
        
        db.session.add(nova_descricao)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Descrição adicionada com sucesso!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# API para editar descrição (apenas administradores)
@app.route('/api/descricao_inseto/<descricao_id>', methods=['PUT'])
def api_editar_descricao_inseto(descricao_id):
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        descricao = DescricaoInseto.query.get(descricao_id)
        if not descricao:
            return jsonify({'success': False, 'message': 'Descrição não encontrada'}), 404
        
        data = request.get_json()
        
        # Atualizar campos
        if 'titulo' in data:
            descricao.titulo = data['titulo']
        if 'descricao' in data:
            descricao.descricao = data['descricao']
        if 'caracteristicas' in data:
            descricao.caracteristicas = data['caracteristicas']
        if 'habitat' in data:
            descricao.habitat = data['habitat']
        if 'curiosidades' in data:
            descricao.curiosidades = data['curiosidades']
        if 'inseto_id' in data:
            # Verificar se o novo inseto existe
            inseto = Inseto.query.get(data['inseto_id'])
            if inseto:
                descricao.inseto_id = data['inseto_id']
        
        descricao.atualizado_em = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Descrição atualizada com sucesso!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# API para excluir descrição (apenas administradores)
@app.route('/api/descricao_inseto/<descricao_id>', methods=['DELETE'])
def api_excluir_descricao_inseto(descricao_id):
    try:
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user or user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        descricao = DescricaoInseto.query.get(descricao_id)
        if not descricao:
            return jsonify({'success': False, 'message': 'Descrição não encontrada'}), 404
        
        # Excluir a descrição
        db.session.delete(descricao)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Descrição excluída com sucesso!'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# API para listar insetos (para o select no formulário)
@app.route('/api/insetos')
def api_insetos():
    try:
        insetos = Inseto.query.all()  # ← CORRIGIDO: buscar insetos, não imagens
        resultado = [{'id': inseto.id, 'nome': inseto.nome} for inseto in insetos]
        return jsonify({'success': True, 'insetos': resultado})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500