// Cria botão de perfil na sidebar
(function() {
function criarBotaoPerfil() {
const sidebar = document.querySelector('.sidebar');
if (!sidebar) return;
if (sidebar.querySelector('#btnPerfil')) return; // Já existe

const btn = document.createElement('a');
btn.id = 'btnPerfil';
btn.href = '#';
btn.innerHTML = '👤 Perfil de Usuário';
btn.style.background = '#a8d08d';
btn.style.color = '#2f4f1e';
btn.style.marginBottom = '6px';

btn.onclick = function(e){
    e.preventDefault();
    mostrarPerfilUsuario();
};

sidebar.insertBefore(btn, sidebar.children[1]);
}

// Exibe uma janela modal com informações do usuário logado
function mostrarPerfilUsuario(){
const LS = {
    get: (k, def) => JSON.parse(localStorage.getItem(k) || JSON.stringify(def)),
    sessionKey: 'usuarioLogado',
    usersKey: 'usuarios'
};
const s = LS.get(LS.sessionKey, null);
if (!s) return alert('Nenhum usuário logado.');

// Busca dados completos do usuário
const users = LS.get(LS.usersKey, []);
const u = users.find(x => x.email === s.email);

// Cria modal
let modal = document.getElementById('perfilModal');
if (modal) modal.remove();

modal = document.createElement('div');
modal.id = 'perfilModal';
Object.assign(modal.style, {
    position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh',
    background: 'rgba(0,0,0,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '9000'
});

const box = document.createElement('div');
Object.assign(box.style, {
    background: '#fff', borderRadius: '16px', boxShadow: '0 6px 22px rgba(59,110,34,.2)', padding: '34px 28px', minWidth: '320px', maxWidth: '95vw'
});

box.innerHTML = `
    <h2 style="text-align:center;color:#3b6e22;margin:0 0 8px">👤 Perfil do Usuário</h2>
    <div style="margin-bottom:16px;text-align:center">
    <span style="font-size:20px;background:#e6c993;padding:7px 18px;border-radius:999px">${u?.nome || 'Nome não encontrado'}</span>
    </div>
    <table style="width:100%;font-size:16px;margin-bottom:15px">
    <tr><td><b>E-mail:</b></td><td>${u?.email || '-'}</td></tr>
    <tr><td><b>Perfil:</b></td><td>${u?.tipo || '-'}</td></tr>
    ${u?.idAdmin ? `<tr><td><b>ID Admin:</b></td><td>${u.idAdmin}</td></tr>` : ''}
    ${u?.idAluno ? `<tr><td><b>ID Aluno:</b></td><td>${u.idAluno}</td></tr>` : ''}
    <tr><td><b>Criado em:</b></td><td>${u?.criadoEm ? new Date(u.criadoEm).toLocaleString() : '-'}</td></tr>
    </table>
    <div style="text-align:center"><button id="fecharPerfilBtn" style="background:#3b6e22;color:#fff;padding:8px 22px;border-radius:8px;border:none;font-size:15px;cursor:pointer">Fechar</button></div>
`;

modal.appendChild(box);
document.body.appendChild(modal);

document.getElementById('fecharPerfilBtn').onclick = function() {
    modal.remove();
};
modal.onclick = function(e){
    if(e.target===modal) modal.remove();
};
}

// Inicialização automática quando app carrega
function initPerfilMenu(){
let tentativas = 0;
function tentar(){
    tentativas++;
    if(document.querySelector('.sidebar')){
    criarBotaoPerfil();
    } else if(tentativas<50){
    setTimeout(tentar, 120);
    }
}
tentar();
}
initPerfilMenu();
})();