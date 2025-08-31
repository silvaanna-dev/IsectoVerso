// ========= ELEMENTOS =========
const tipoUsuario = document.getElementById('tipoUsuario');
const areaAdmin = document.getElementById('areaAdmin');
const areaAluno = document.getElementById('areaAluno');
const formCadastro = document.getElementById('formCadastro');
const formLogin = document.getElementById('formLogin');
const formRec = document.getElementById('formRecuperar');
const msgCadastro = document.getElementById('msgCadastro');
const msgLogin = document.getElementById('msgLogin');
const msgRec = document.getElementById('msgRecuperar');
const novaSenhaBox = document.getElementById('novaSenhaBox');
const toggleLink = document.getElementById('toggleLink');
const blocoForms = document.getElementById('blocoForms');
const paginaApp = document.getElementById('paginaApp');
const boasVindas = document.getElementById('boasVindas');
const perfilBadge = document.getElementById('perfilBadge');

// ========= UTILS =========
const LS = {
    get: (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def)),
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    usersKey: 'usuarios',
    insectsKey: 'insetos',
    sessionKey: 'usuarioLogado',
    userdataKey: (email) => `userdata:${email}`
};

function b64(s){return btoa(s)}
function unb64(s){return atob(s)}
function emailValido(e){return /\S+@\S+\.\S+/.test(e)}
function senhaValida(s){return s.length>=8 && /[a-zA-Z]/.test(s) && /\d/.test(s)}
function limparMensagens(){
    [msgCadastro,msgLogin,msgRec].forEach(el=>{if(!el) return; el.textContent=''; el.className='message'})
    ;['msgDescricao','msgColeta','msgImagem','msgDados','msgAdminInseto'].forEach(id=>{
    const el=document.getElementById(id); if(el){el.textContent='';el.className='message'}
    })
}
function setMsg(el, txt, ok=false){el.textContent = txt; el.className = 'message '+(ok?'success':'error')}
function toggleSenha(id, el){
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
    el.textContent = input.type === 'password' ? '🐜' : '🐞';
}
function nowISO(){return new Date().toISOString()}

// ========= MUDANÇA TIPO USUÁRIO =========
tipoUsuario.addEventListener('change', ()=>{
    areaAdmin.style.display = tipoUsuario.value==='administrador'?'block':'none';
    areaAluno.style.display = tipoUsuario.value==='aluno'?'block':'none';
});

// ========= TROCA CADASTRO/LOGIN =========
toggleLink.addEventListener('click', ()=>{
    if (formCadastro.style.display!=='none'){ mostrarLogin() } else { mostrarCadastro() }
    limparMensagens()
});

function mostrarCadastro(){
    formCadastro.style.display='block'; formLogin.style.display='none'; formRec.style.display='none';
    document.getElementById('tituloForm').textContent='Cadastro Inicial 🐛';
    toggleLink.textContent='Já tem uma conta? Faça login';
    blocoForms.style.display='block'; paginaApp.classList.remove('mostrar');
}
function mostrarLogin(){
    formCadastro.style.display='none'; formLogin.style.display='block'; formRec.style.display='none';
    document.getElementById('tituloForm').textContent='Login 🐝';
    toggleLink.textContent='Ainda não tem conta? Cadastre-se';
    blocoForms.style.display='block'; paginaApp.classList.remove('mostrar');
}
function mostrarRecuperacao(){
    formCadastro.style.display='none'; formLogin.style.display='none'; formRec.style.display='block';
    document.getElementById('tituloForm').textContent='Recuperação de senha 🔐';
    toggleLink.textContent='Voltar para o cadastro';
    novaSenhaBox.style.display='none'; msgRec.textContent='';
}

// ========= CADASTRO =========
formCadastro.addEventListener('submit', (e)=>{
    e.preventDefault();
    limparMensagens();
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const idAdmin = document.getElementById('idAdmin').value.trim();
    const idAluno = document.getElementById('idAluno').value.trim();

    let erroCampos = [];
    if(!tipoUsuario.value) erroCampos.push('tipoUsuario');
    if(!nome) erroCampos.push('nome');
    if(!email) erroCampos.push('email');
    if(!senha) erroCampos.push('senha');
    if(!confirmarSenha) erroCampos.push('confirmarSenha');

    if(tipoUsuario.value==='administrador'){
    if(!idAdmin) erroCampos.push('idAdmin');
    if(idAdmin && !/^215\d{9}$/.test(idAdmin)) erroCampos.push('idAdmin');
    }
    if(tipoUsuario.value==='aluno'){
    if(!idAluno) erroCampos.push('idAluno');
    if(idAluno && !/^115\d{9}$/.test(idAluno)) erroCampos.push('idAluno');
    }

    document.querySelectorAll('.input-error').forEach(el=>el.classList.remove('input-error'));
    erroCampos.forEach(id=>document.getElementById(id)?.classList.add('input-error'));

    if(erroCampos.length){ return setMsg(msgCadastro,'⚠ Preencha/valide os campos obrigatórios.',false) }
    if(!emailValido(email)) return setMsg(msgCadastro,'📧 Email inválido.',false)
    if(!senhaValida(senha)) return setMsg(msgCadastro,'🔒 Senha deve ter ao menos 8 caracteres, letras e números.',false)
    if(senha!==confirmarSenha) return setMsg(msgCadastro,'🔒 As senhas não coincidem.',false)

    let users = LS.get(LS.usersKey,[]);
    if (users.find(u=>u.email.toLowerCase()===email.toLowerCase()))
    return setMsg(msgCadastro,'❌ Já existe usuário com esse e-mail.',false);

    users.push({
    nome, email, senha:b64(senha),
    tipo: tipoUsuario.value, idAdmin: idAdmin||null, idAluno: idAluno||null, criadoEm: nowISO()
    });
    LS.set(LS.usersKey, users);

    // cria base de dados do usuário
    LS.set(LS.userdataKey(email), { descricoes:[], coletados:[], imagens:[], coletas:[] });

    setMsg(msgCadastro,'✅ Cadastro realizado com sucesso! Faça login.',true);
    formCadastro.reset(); mostrarLogin();
});

// ========= LOGIN =========
formLogin.addEventListener('submit',(e)=>{
    e.preventDefault(); limparMensagens();
    const email = document.getElementById('loginEmail').value.trim();
    const senha = document.getElementById('loginSenha').value;

    if(!email || !senha){ return setMsg(msgLogin,'⚠ Preencha todos os campos.',false) }
    const users = LS.get(LS.usersKey,[]);
    const u = users.find(x=>x.email.toLowerCase()===email.toLowerCase());
    if(!u || u.senha!==b64(senha)) return setMsg(msgLogin,'❌ E-mail ou senha incorretos.',false);

    LS.set(LS.sessionKey, { email:u.email, nome:u.nome, tipo:u.tipo });
    entrar(u);
});

function entrar(usuario){
    blocoForms.style.display='none'; paginaApp.classList.add('mostrar');
    boasVindas.textContent = `🎉 Bem-vindo(a), ${usuario.nome}!`;
    perfilBadge.textContent = `Perfil: ${usuario.tipo}`;
    document.title = 'Mundo dos Insetos 🐞 - Início';
    // painel admin no catálogo
    document.getElementById('painelAdmin').style.display = (usuario.tipo==='administrador')?'block':'none';
    abrir('inicio');
    renderColetados();
    renderCatalogo();
    renderModeracao();
}

// ========= LOGOUT =========
function fazerLogout(){
    localStorage.removeItem(LS.sessionKey);
    mostrarLogin();
    blocoForms.style.display='block'; paginaApp.classList.remove('mostrar');
    setTimeout(()=>{ window.scrollTo({top:0,behavior:'smooth'}) }, 50);
}

// ========= RECUPERAÇÃO =========
function verificarRecEmail(){
    const email = document.getElementById('recEmail').value.trim();
    msgRec.textContent=''; msgRec.className='message';
    if(!emailValido(email)) return setMsg(msgRec,'📧 Email inválido.',false);
    const users = LS.get(LS.usersKey,[]);
    if(!users.find(u=>u.email.toLowerCase()===email.toLowerCase())) return setMsg(msgRec,'❌ Email não cadastrado.',false);
    novaSenhaBox.style.display='block'; setMsg(msgRec,'✅ Email verificado! Insira a nova senha.',true);
}
function atualizarSenha(){
    const email = document.getElementById('recEmail').value.trim();
    const ns = document.getElementById('novaSenha').value;
    const cs = document.getElementById('confNovaSenha').value;
    if(!senhaValida(ns)) return setMsg(msgRec,'🔒 Senha deve ter ao menos 8 caracteres, letras e números.',false);
    if(ns!==cs) return setMsg(msgRec,'🔒 As senhas não coincidem.',false);
    let users = LS.get(LS.usersKey,[]);
    const uIdx = users.findIndex(u=>u.email.toLowerCase()===email.toLowerCase());
    if(uIdx<0) return setMsg(msgRec,'❌ Usuário não encontrado.',false);
    users[uIdx].senha = b64(ns); LS.set(LS.usersKey, users);
    setMsg(msgRec,'✅ Senha atualizada! Faça login.',true);
    setTimeout(()=>{ mostrarLogin(); formRec.reset(); novaSenhaBox.style.display='none' }, 1200);
}

// ========= NAVEGAÇÃO INTERNA =========
function abrir(id){
    document.querySelectorAll('.conteudo section').forEach(s=>s.classList.remove('ativo'));
    const alvo = document.getElementById(id); if(alvo) alvo.classList.add('ativo');
    document.title = `Mundo dos Insetos 🐞 - ${alvo?.querySelector('h1, h2')?.textContent || 'Seção'}`;
    limparMensagens();
}

// ========= DADOS POR USUÁRIO (descrições, coletados, imagens, coletas) =========
function getSess(){ return LS.get(LS.sessionKey,null) }
function getUserData(){
    const s=getSess(); if(!s) return null;
    return LS.get(LS.userdataKey(s.email), { descricoes:[], coletados:[], imagens:[], coletas:[] });
}
function saveUserData(data){
    const s=getSess(); if(!s) return;
    LS.set(LS.userdataKey(s.email), data);
}

function salvarDescricao(){
    const data = getUserData(); if(!data) return;
    const txt = document.getElementById('descricaoTexto').value.trim();
    if(!txt) return setMsg(document.getElementById('msgDescricao'),'⚠ Digite uma descrição.',false);
    data.descricoes.push({ texto:txt, data:nowISO() });
    saveUserData(data);
    setMsg(document.getElementById('msgDescricao'),'✅ Descrição salva!',true);
    document.getElementById('descricaoTexto').value='';
}

function adicionarInsetoColetado(){
    const data = getUserData(); if(!data) return;
    const nome = document.getElementById('nomeInsetoColetado').value.trim();
    if(!nome) return setMsg(document.getElementById('msgColeta'),'⚠ Informe o nome.',false);
    data.coletados.push({ nome, data:nowISO() });
    saveUserData(data);
    document.getElementById('nomeInsetoColetado').value='';
    setMsg(document.getElementById('msgColeta'),'✅ Adicionado!',true);
    renderColetados();
}

function renderColetados(){
    const div = document.getElementById('listaColetados'); if(!div) return;
    div.innerHTML='';
    const data = getUserData(); if(!data){ div.textContent=''; return }
    if(!data.coletados.length){ div.innerHTML='<p>Nenhum inseto coletado.</p>'; return }
    data.coletados.slice().reverse().forEach(item=>{
    const p = document.createElement('p');
    p.textContent = `• ${item.nome} — ${new Date(item.data).toLocaleString()}`;
    div.appendChild(p);
    });
}

function enviarImagem(){
    const file = document.getElementById('arquivoImagem').files[0];
    const msg = document.getElementById('msgImagem');
    const prev = document.getElementById('previewImagem');
    if(!file) return setMsg(msg,'⚠ Selecione uma imagem.',false);
    const reader = new FileReader();
    reader.onload = ()=>{
    const data = getUserData(); if(!data) return;
    data.imagens.push({ dataURL: reader.result, nome:file.name, data:nowISO() });
    saveUserData(data);
    prev.innerHTML = `<img src="${reader.result}" alt="preview" class="inseto-img" style="max-width:320px">`;
    setMsg(msg,'✅ Imagem salva!',true);
    };
    reader.readAsDataURL(file);
}

function salvarDadosColeta(){
    const local = document.getElementById('localColeta').value.trim();
    const dataC = document.getElementById('dataColeta').value;
    const obs = document.getElementById('obsColeta').value.trim();
    const msg = document.getElementById('msgDados');
    if(!local || !dataC) return setMsg(msg,'⚠ Informe local e data.',false);
    const data = getUserData(); if(!data) return;
    data.coletas.push({ local, data:dataC, obs, criadoEm:nowISO() });
    saveUserData(data);
    setMsg(msg,'✅ Dados salvos!',true);
    ['localColeta','dataColeta','obsColeta'].forEach(id=>document.getElementById(id).value='');
}

// ========= CATÁLOGO DE INSETOS (global) =========
function getInsetos(){ return LS.get(LS.insectsKey,[]) }
function saveInsetos(arr){ LS.set(LS.insectsKey, arr) }

function adminAdicionarInseto(){
    const s = getSess(); if(!s || s.tipo!=='administrador') return;
    const nome = document.getElementById('cadNomeInseto').value.trim();
    const desc = document.getElementById('cadDescInseto').value.trim();
    const file = document.getElementById('cadImgInseto').files[0];
    const msg = document.getElementById('msgAdminInseto');
    if(!nome || !desc) return setMsg(msg,'⚠ Preencha nome e descrição.',false);

    const salvar = (dataURL) => {
    const insetos = getInsetos();
    const novo = {
        id: crypto.randomUUID(),
        nome, descricao: desc,
        imagem: dataURL || null,
        criadoEm: nowISO(),
        comentarios: [] // {id, autorEmail, autorNome, texto, status:'pendente'|'aprovado', criadoEm}
    };
    insetos.push(novo); saveInsetos(insetos);
    setMsg(msg,'✅ Inseto adicionado ao catálogo!',true);
    document.getElementById('cadNomeInseto').value='';
    document.getElementById('cadDescInseto').value='';
    document.getElementById('cadImgInseto').value='';
    renderCatalogo(); renderModeracao();
    };

    if(file){
    const reader = new FileReader();
    reader.onload = ()=> salvar(reader.result);
    reader.readAsDataURL(file);
    } else {
    salvar(null);
    }
}

function renderCatalogo(){
    const lista = document.getElementById('listaInsetos');
    const s = getSess();
    lista.innerHTML='';
    const insetos = getInsetos();
    if(!insetos.length){ lista.innerHTML='<p>Nenhum inseto no catálogo.</p>'; return }

    insetos.slice().reverse().forEach(ins=>{
    const card = document.createElement('div'); card.className='inseto-card';
    card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <h3 style="margin:0">${ins.nome}</h3>
        <span class="pill">ID: ${ins.id.slice(0,8)}...</span>
        </div>
        ${ins.imagem ? `<img src="${ins.imagem}" alt="${ins.nome}" class="inseto-img">` : ''}
        <p>${ins.descricao}</p>
        <div class="linha"></div>
        <div id="comentarios-${ins.id}"></div>
        ${s && s.tipo==='aluno' ? `
        <div style="margin-top:6px">
            <label>💬 Comentar:</label>
            <div style="display:flex;gap:6px;align-items:flex-start">
            <textarea id="txt-${ins.id}" rows="3" placeholder="Escreva seu comentário..."></textarea>
            <button onclick="enviarComentario('${ins.id}')">Enviar</button>
            </div>
            <small>Comentários de alunos ficam <b>pendentes</b> até aprovação do administrador.</small>
        </div>` : ''
        }
    `;
    lista.appendChild(card);
    renderComentariosDoInseto(ins.id);
    });
}

function renderComentariosDoInseto(insetoId){
    const wrap = document.getElementById(`comentarios-${insetoId}`); if(!wrap) return;
    const s = getSess();
    const insetos = getInsetos();
    const ins = insetos.find(x=>x.id===insetoId); if(!ins) return;
    wrap.innerHTML = '<h4 style="margin:6px 0">Comentários</h4>';

    if(!ins.comentarios.length){ wrap.innerHTML += '<p>📝 Nenhum comentário ainda.</p>'; return }

    ins.comentarios.slice().reverse().forEach(c=>{
    if(c.status!=='aprovado' && (!s || s.tipo!=='administrador')) {
        // só admin vê pendentes aqui (aluno vê status no envio)
        return;
    }
    const div = document.createElement('div');
    div.className = `comentario ${c.status}`;
    const quando = new Date(c.criadoEm).toLocaleString();
    div.innerHTML = `
        <div class="meta"><strong>${c.autorNome}</strong> — ${quando} ${c.status==='pendente' ? ' • PENDENTE' : ''}</div>
        <div>${c.texto}</div>
    `;
    wrap.appendChild(div);
    });
}

function enviarComentario(insetoId){
    const s = getSess(); if(!s){ alert('Faça login.'); return }
    if(s.tipo!=='aluno'){ alert('Apenas alunos podem comentar.'); return }
    const ta = document.getElementById(`txt-${insetoId}`);
    const texto = ta.value.trim(); if(!texto){ ta.focus(); return }
    const insetos = getInsetos();
    const idx = insetos.findIndex(x=>x.id===insetoId); if(idx<0) return;
    insetos[idx].comentarios.push({
    id: crypto.randomUUID(), autorEmail:s.email, autorNome:s.nome,
    texto, status:'pendente', criadoEm: nowISO()
    });
    saveInsetos(insetos);
    ta.value='';
    // feedback ao aluno
    const wrap = document.getElementById(`comentarios-${insetoId}`);
    const aviso = document.createElement('div');
    aviso.className='comentario pendente';
    aviso.innerHTML = `<div class="meta"><strong>${s.nome}</strong> — agora</div><div>${texto}</div><small>⏳ Aguardando aprovação do administrador.</small>`;
    wrap.prepend(aviso);
    renderModeracao(); // atualiza fila do admin
}

// ========= MODERAÇÃO =========
function renderComentarios(){
    const s = getSess();
    const boxPend = document.getElementById('listaPendentes');
    const boxAprov = document.getElementById('listaAprovados');
    if(!s || s.tipo!=='administrador'){
    document.getElementById('moderar').style.display='none';
    return;
    }
    document.getElementById('moderar').style.display='block';
    boxPend.innerHTML=''; boxAprov.innerHTML='';
    const insetos = getInsetos();

    let pendentes = [];
    let aprovados = [];
    insetos.forEach(ins=>{
    ins.comentarios.forEach(c=>{
        const linha = { insetoId:ins.id, insetoNome:ins.nome, ...c };
        if(c.status==='pendente') pendentes.push(linha); else aprovados.push(linha);
    })
    });

    if(!pendentes.length) boxPend.innerHTML='<p>🎉 Nenhum comentário pendente.</p>';
    pendentes.slice().reverse().forEach(c=>{
    const el = document.createElement('div');
    el.className='comentario pendente';
    el.innerHTML = `
        <div class="meta"><strong>${c.autorNome}</strong> em <b>${c.insetoNome}</b> — ${new Date(c.criadoEm).toLocaleString()}</div>
        <div style="margin:6px 0">${c.texto}</div>
        <div class="acoes">
        <button onclick="aprovarComent('${c.insetoId}','${c.id}')">✅ Aprovar</button>
        <button onclick="excluirComent('${c.insetoId}','${c.id}')">🗑 Excluir</button>
        </div>
    `;
    boxPend.appendChild(el);
    });

    if(!aprovados.length) boxAprov.innerHTML='<p>Sem comentários aprovados ainda.</p>';
    aprovados.slice().reverse().forEach(c=>{
    const el = document.createElement('div');
    el.className='comentario aprovado';
    el.innerHTML = `
        <div class="meta"><strong>${c.autorNome}</strong> em <b>${c.insetoNome}</b> — ${new Date(c.criadoEm).toLocaleString()}</div>
        <div>${c.texto}</div>
        <div class="acoes">
        <button onclick="excluirComent('${c.insetoId}','${c.id}')">🗑 Excluir</button>
        </div>
    `;
    boxAprov.appendChild(el);
    });
}

function aprovarComent(insetoId, comentId){
    const insetos = getInsetos();
    const ins = insetos.find(i=>i.id===insetoId); if(!ins) return;
    const cm = ins.comentarios.find(c=>c.id===comentId); if(!cm) return;
    cm.status='aprovado';
    saveInsetos(insetos);
    renderModeracao();
    renderCatalogo();
}

function excluirComent(insetoId, comentId){
    let insetos = getInsetos();
    const insIdx = insetos.findIndex(i=>i.id===insetoId); if(insIdx<0) return;
    insetos[insIdx].comentarios = insetos[insIdx].comentarios.filter(c=>c.id!==comentId);
    saveInsetos(insetos);
    renderModeracao();
    renderCatalogo();
}

// ========= INICIALIZAÇÃO =========
function mostrarLogin(){ // redefine para rolar pro topo
    formCadastro.style.display='none'; formLogin.style.display='block'; formRec.style.display='none';
    document.getElementById('tituloForm').textContent='Login 🐝';
    toggleLink.textContent='Ainda não tem conta? Cadastre-se';
    blocoForms.style.display='block'; paginaApp.classList.remove('mostrar');
    window.scrollTo({top:0,behavior:'smooth'});
}
function mostrarCadastro(){ // redefine (já existia, mantido)
    formCadastro.style.display='block'; formLogin.style.display='none'; formRec.style.display='none';
    document.getElementById('tituloForm').textContent='Cadastro Inicial 🐛';
    toggleLink.textContent='Já tem uma conta? Faça login';
    blocoForms.style.display='block'; paginaApp.classList.remove('mostrar');
    window.scrollTo({top:0,behavior:'smooth'});
}

function boot(){
    const sess = getSess();
    if(sess){
    const users = LS.get(LS.usersKey,[]);
    const u = users.find(x=>x.email===sess.email);
    if(u){ entrar(u); return; }
    }
    mostrarCadastro();
}

// Start
boot();

// ===== VARIÁVEIS GLOBAIS =====
let imagemSelecionadaId = null;

// ===== FUNÇÕES DE CONTROLE DA APLICAÇÃO =====

// Função para abrir seções
function abrir(sectionId) {
  document.querySelectorAll('section').forEach(section => {
    section.classList.remove('ativo');
  });
  document.getElementById(sectionId).classList.add('ativo');
  
  // Se abriu a seção de moderação, carregar os comentários
  if (sectionId === 'moderar') {
    carregarComentariosModeracao();
  }
}

// Função para visualizar a imagem antes de enviar
function previewImage(event) {
  const input = event.target;
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImagem');
  
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      previewImg.src = e.target.result;
      previewContainer.style.display = 'block';
    }
    
    reader.readAsDataURL(input.files[0]);
  } else {
    previewContainer.style.display = 'none';
  }
}







// ===== FUNÇÕES DE EXEMPLO =====

function salvarDescricao() {
  const messageElement = document.getElementById('msgDescricao');
  messageElement.textContent = 'Descrição salva com sucesso!';
  messageElement.className = 'message success';
}

function adicionarInsetoColetado() {
  const messageElement = document.getElementById('msgColeta');
  messageElement.textContent = 'Inseto adicionado com sucesso!';
  messageElement.className = 'message success';
}

function salvarDadosColeta() {
  const messageElement = document.getElementById('msgDados');
  messageElement.textContent = 'Dados de coleta salvos com sucesso!';
  messageElement.className = 'message success';
}

function adminAdicionarInseto() {
  const messageElement = document.getElementById('msgAdminInseto');
  messageElement.textContent = 'Inseto adicionado ao catálogo com sucesso!';
  messageElement.className = 'message success';
}

function fazerLogout() {
  if (confirm('Tem certeza que deseja sair?')) {
    window.location.href = "{{ url_for('logout') }}";
  }
}

