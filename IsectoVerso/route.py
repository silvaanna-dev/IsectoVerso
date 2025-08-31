from flask import render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import db
from models import Usuario, Inseto, Comentario, Coleta, Descricao, Imagem
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
@app.route('/api/comentarios_pendentes')
def api_comentarios_pendentes():
    try:
        
        # Verificar autenticação
        if 'usuario_id' not in session:
            return jsonify({'success': False, 'message': 'Não autorizado'}), 401
        
        # Verificar se é administrador
        user = Usuario.query.get(session['usuario_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404
        
        if user.cargo != 'administrador':
            return jsonify({'success': False, 'message': 'Acesso negado'}), 403
        
        # Buscar comentários pendentes
        comentarios = Comentario.query.filter_by(status='pendente').all()
        
        resultado = []
        for comentario in comentarios:
            
            # Obter nome do autor
            autor_nome = comentario.autor.nome if comentario.autor else 'Usuário Desconhecido'
            
            # Obter nome da imagem (se existir)
            imagem_nome = 'Nenhuma imagem associada'
            if comentario.imagem_id:
                imagem = Imagem.query.get(comentario.imagem_id)
                imagem_nome = imagem.nome if imagem else 'Imagem não encontrada'
            
            resultado.append({
                'id': str(comentario.id),  # Garantir que é string
                'texto': comentario.texto,
                'data': comentario.criado_em.strftime('%d/%m/%Y %H:%M'),
                'usuario': autor_nome,
                'imagem_nome': imagem_nome
            })
        
        return jsonify({
            'success': True, 
            'comentarios': resultado,
            'total': len(resultado)
        })
        
    except Exception as e:
        print(f"ERRO na API: {str(e)}")
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
    
#Rota misc  

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('home'))

@app.route("/esq_senha")
def esq_senha():
    return render_template("recu.html")
