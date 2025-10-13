// Variáveis globais
let imagemSelecionadaId = null;

// ===== DECLARAÇÕES DE FUNÇÕES PRIMEIRO =====

// ========= NAVEGAÇÃO =========
function abrir(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('ativo');
    });
    document.getElementById(sectionId).classList.add('ativo');
    
    // Atualizar título da página
    const alvo = document.getElementById(sectionId);
    if (alvo) {
        const titulo = alvo.querySelector('h1, h2');
        document.title = `Mundo dos Insetos 🐞 - ${titulo ? titulo.textContent : 'Seção'}`;
    }
    
    clearMessages();
    
    // Carregar conteúdo específico da seção
    if (sectionId === 'moderar') {
        carregarComentariosModeracao();
    } else if (sectionId === 'comentario') {
        carregarMeusComentarios();
    }
}

// ========= UTILS =========
function showMessage(elementId, text, isSuccess = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
        element.className = 'message ' + (isSuccess ? 'success' : 'error');
    }
}

function clearMessages() {
    const messages = document.querySelectorAll('.message');
    messages.forEach(msg => {
        msg.textContent = '';
        msg.className = 'message';
    });
}

function toggleSenha(id, el){
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
    el.textContent = input.type === 'password' ? '🐜' : '🐞';
}

// ======= FUNCTION =======
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

// Abrir popup de comentários
function abrirComentarios(imagemId) {
    imagemSelecionadaId = imagemId;
    
    // Buscar informações da imagem
    fetch(`/api/imagem/${imagemId}`)
        .then(response => response.json())
        .then(imagem => {
            document.getElementById('imagemPopup').innerHTML = `
                <img src="data:image/jpeg;base64,${imagem.data_url}" alt="${imagem.nome}">
                <p><strong>${imagem.nome}</strong></p>
            `;
            document.getElementById('popupComentario').style.display = 'block';
            document.getElementById('textoComentario').value = '';
        })
        .catch(error => {
            console.error('Erro ao carregar imagem:', error);
            alert('Erro ao carregar imagem. Tente novamente.');
        });
}

// Função para fechar o popup de comentários
function fecharPopupComentario() {
    console.log("Fechando popup de comentários");
    document.getElementById('popupComentario').style.display = 'none';
    imagemSelecionadaId = null;
}

// Função para enviar comentário
function enviarComentario() {
    const texto = document.getElementById('textoComentario').value.trim();
    
    if (!texto) {
        alert('Por favor, digite um comentário.');
        return;
    }
    
    if (!imagemSelecionadaId) {
        alert('Erro: imagem não selecionada.');
        return;
    }
    
    // Enviar comentário para a API
    fetch('/api/comentario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imagem_id: imagemSelecionadaId,
            texto: texto
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Comentário enviado com sucesso! Aguarde aprovação do administrador.');
            fecharPopupComentario();
        } else {
            alert('Erro ao enviar comentário: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar comentário. Tente novamente.');
    });
}

// ===== SISTEMA DE MODERAÇÃO =====
function carregarComentariosModeracao() {
    console.log("=== CARREGANDO COMENTÁRIOS PARA MODERAÇÃO ===");
    
    document.getElementById('listaPendentes').innerHTML = '<p>Carregando comentários...</p>';
    
    // Primeiro verificar se o usuário é administrador via API
    fetch('/api/verificar_admin')
        .then(response => response.json())
        .then(adminData => {
            if (!adminData.is_admin) {
                document.getElementById('listaPendentes').innerHTML = '<p>Acesso restrito a administradores</p>';
                return;
            }
            
            // Se for admin, carregar os comentários
            fetch('/api/comentarios_pendentes')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Atualizar estatísticas
                        document.getElementById('totalComentarios').textContent = data.total || 0;
                        document.getElementById('pendentesComentarios').textContent = data.pendentes || 0;
                        document.getElementById('respondidosComentarios').textContent = data.respondidos || 0;
                        
                        if (data.comentarios && data.comentarios.length > 0) {
                            let html = '';
                            data.comentarios.forEach(comentario => {
                                html += `
                                    <div class="comentario-item comentario-pendente">
                                        <div class="comentario-cabecalho">
                                            <div class="comentario-info">
                                                <span class="comentario-imagem"><strong>Imagem:</strong> ${comentario.imagem_nome}</span>
                                                <span class="comentario-usuario"><strong>Usuário:</strong> ${comentario.usuario}</span>
                                                <span class="comentario-data"><strong>Data:</strong> ${comentario.data}</span>
                                            </div>
                                        </div>
                                        <div class="comentario-texto">
                                            <strong>Comentário:</strong> ${comentario.texto}
                                        </div>`;
                                
                                if (comentario.resposta) {
                                    html += `
                                        <div class="comentario-resposta">
                                            <div class="resposta-header">
                                                <span>Sua Resposta</span>
                                                <span>${comentario.data_resposta || 'Data não disponível'}</span>
                                            </div>
                                            <div class="resposta-texto">${comentario.resposta}</div>
                                        </div>`;
                                } else {
                                    html += `
                                        <div class="form-resposta" id="form-resposta-${comentario.id}">
                                            <textarea id="resposta-${comentario.id}" placeholder="Digite sua resposta..."></textarea>
                                            <div class="botoes-resposta">
                                                <button class="btn-excluir" onclick="excluirComentario('${comentario.id}')">
                                                    <i class="fas fa-trash"></i> Excluir
                                                </button>
                                                <button class="btn-responder" onclick="responderComentario('${comentario.id}')">
                                                    <i class="fas fa-reply"></i> Responder
                                                </button>
                                            </div>
                                        </div>`;
                                }
                                
                                html += `</div>`;
                            });
                            
                            document.getElementById('listaPendentes').innerHTML = html;
                        } else {
                            document.getElementById('listaPendentes').innerHTML = '<p>Nenhum comentário para moderar.</p>';
                        }
                    } else {
                        document.getElementById('listaPendentes').innerHTML = `<p>Erro: ${data.message || 'Erro desconhecido'}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar comentários:', error);
                    document.getElementById('listaPendentes').innerHTML = '<p>Erro ao carregar comentários.</p>';
                });
        })
        .catch(error => {
            console.error('Erro ao verificar admin:', error);
            document.getElementById('listaPendentes').innerHTML = '<p>Erro ao verificar permissões.</p>';
        });
}

function responderComentario(comentarioId) {
    const respostaTextarea = document.getElementById(`resposta-${comentarioId}`);
    const resposta = respostaTextarea.value.trim();
    
    if (!resposta) {
        alert('Por favor, digite uma resposta.');
        return;
    }
    
    fetch(`/api/responder_comentario/${comentarioId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resposta: resposta })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Resposta enviada com sucesso!');
            carregarComentariosModeracao();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao enviar resposta.');
    });
}

function excluirComentario(comentarioId) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }
    
    fetch(`/api/excluir_comentario/${comentarioId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Comentário excluído com sucesso!');
            carregarComentariosModeracao();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao excluir comentário.');
    });
}

// ===== SISTEMA DE COMENTÁRIOS DO USUÁRIO =====
function carregarMeusComentarios(filtro = 'todos') {
    console.log("=== CARREGANDO MEUS COMENTÁRIOS ===");
    
    if (!document.getElementById('comentario').classList.contains('ativo')) {
        return;
    }
    
    document.getElementById('meusComentarios').innerHTML = '<p>Carregando seus comentários...</p>';
    
    fetch('/api/meus_comentarios')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let comentarios = data.comentarios;
                
                if (filtro === 'pendentes') {
                    comentarios = comentarios.filter(c => c.status === 'pendente' || !c.status);
                } else if (filtro === 'respondidos') {
                    comentarios = comentarios.filter(c => c.resposta && c.resposta.trim() !== '');
                }
                
                if (comentarios.length === 0) {
                    document.getElementById('meusComentarios').innerHTML = '<p>Nenhum comentário encontrado.</p>';
                    return;
                }
                
                document.getElementById('meusComentarios').innerHTML = comentarios.map(comentario => `
                    <div class="comentario-item ${comentario.resposta ? 'comentario-respondido' : 'comentario-pendente'}">
                        <div class="comentario-cabecalho">
                            <div class="comentario-info">
                                <span class="comentario-imagem"><strong>Imagem:</strong> ${comentario.imagem_nome}</span>
                                <span class="comentario-data"><strong>Enviado em:</strong> ${comentario.data_envio}</span>
                                <span class="badge-status badge-${comentario.resposta ? 'respondido' : (comentario.status || 'pendente')}">
                                    ${comentario.resposta ? 'Respondido' : (comentario.status || 'Pendente')}
                                </span>
                            </div>
                        </div>
                        <div class="comentario-texto">
                            <strong>Seu comentário:</strong> ${comentario.texto}
                        </div>
                        ${comentario.resposta ? `
                            <div class="comentario-resposta">
                                <div class="resposta-header">
                                    <span>Resposta do Administrador</span>
                                    <span>${comentario.data_resposta || 'Data não disponível'}</span>
                                </div>
                                <div class="resposta-texto">${comentario.resposta}</div>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            } else {
                document.getElementById('meusComentarios').innerHTML = `<p>Erro: ${data.message}</p>`;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar comentários:', error);
            document.getElementById('meusComentarios').innerHTML = '<p>Erro ao carregar comentários.</p>';
        });
}

function filtrarComentarios(filtro) {
    console.log("Filtrando comentários:", filtro);
    
    document.querySelectorAll('.btn-filtro').forEach(btn => {
        btn.classList.remove('ativo');
    });
    event.target.classList.add('ativo');
    
    carregarMeusComentarios(filtro);
}

// ===== EVENT LISTENERS =====
document.addEventListener('click', function(event) {
    const popup = document.getElementById('popupComentario');
    if (event.target === popup) {
        fecharPopupComentario();
    }
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharPopupComentario();
    }
});

document.addEventListener('DOMContentLoaded', function() {
    console.log("Página carregada - Sistema de comentários pronto");
    
    // Verificar se o popup existe no DOM
    const popup = document.getElementById('popupComentario');
    if (popup) {
        console.log("Popup de comentários encontrado no DOM");
    } else {
        console.error("Popup de comentários NÃO encontrado no DOM");
    }
    
    // Configurar página de registro (se os elementos existirem)
    const tipoUsuario = document.getElementById('tipoUsuario');
    const areaAdmin = document.getElementById('areaAdmin');
    const areaAluno = document.getElementById('areaAluno');
    
    if (tipoUsuario && areaAdmin && areaAluno) {
        areaAdmin.style.display = tipoUsuario.value === 'administrador' ? 'block' : 'none';
        areaAluno.style.display = tipoUsuario.value === 'aluno' ? 'block' : 'none';
        
        tipoUsuario.addEventListener('change', () => {
            areaAdmin.style.display = tipoUsuario.value === 'administrador' ? 'block' : 'none';
            areaAluno.style.display = tipoUsuario.value === 'aluno' ? 'block' : 'none';
        });
        
        console.log("Configuração de tipo de usuário inicializada");
    }
});

// ===== SISTEMA DE DESCRIÇÕES DE INSETOS =====

// ===== SISTEMA DE DESCRIÇÕES DE INSETOS =====

let descricaoEditando = null;

// Carregar descrições de insetos - VERSÃO CORRIGIDA
function carregarDescricoesInsetos() {
    console.log("=== CARREGANDO DESCRIÇÕES DE INSETOS ===");
    
    if (!document.getElementById('descricoes').classList.contains('ativo')) {
        return;
    }
    
    document.getElementById('listaDescricoes').innerHTML = '<p>Carregando descrições...</p>';
    
    // Verificar se é administrador
    fetch('/api/verificar_admin')
        .then(response => response.json())
        .then(adminData => {
            console.log("Dados do admin:", adminData);
            
            // Mostrar/ocultar controles de admin
            const adminControls = document.getElementById('adminControls');
            if (adminControls) {
                adminControls.style.display = adminData.is_admin ? 'block' : 'none';
            }
            
            // Carregar descrições
            fetch('/api/descricoes_insetos')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Erro ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Resposta da API:", data);
                    if (data.success) {
                        exibirDescricoes(data.descricoes, adminData.is_admin); // ← CORRIGIDO: passar is_admin como parâmetro
                        carregarInsetosParaFiltro(data.descricoes);
                    } else {
                        document.getElementById('listaDescricoes').innerHTML = 
                            `<p>Erro ao carregar descrições: ${data.message}</p>`;
                    }
                })
                .catch(error => {
                    console.error('Erro:', error);
                    document.getElementById('listaDescricoes').innerHTML = 
                        `<p>Erro ao carregar descrições. Tente recarregar a página.</p>`;
                });
        })
        .catch(error => {
            console.error('Erro ao verificar admin:', error);
            document.getElementById('listaDescricoes').innerHTML = 
                '<p>Erro ao verificar permissões.</p>';
        });
}

// Exibir descrições na lista - VERSÃO CORRIGIDA
function exibirDescricoes(descricoes, isAdmin) { // ← CORRIGIDO: receber isAdmin como parâmetro
    console.log("Exibindo descrições:", descricoes);
    console.log("É admin?", isAdmin);
    
    if (!descricoes || descricoes.length === 0) {
        document.getElementById('listaDescricoes').innerHTML = `
            <div class="sem-descricoes">
                <p>📝 Nenhuma descrição encontrada.</p>
                ${isAdmin ? '<p>Clique em "Adicionar Descrição" para criar a primeira!</p>' : ''}
            </div>`;
        return;
    }
    
    const html = descricoes.map(descricao => {
        // Verificar se há imagem do inseto
        const imagemHtml = descricao.inseto_imagem ? `
            <div class="descricao-imagem">
                <img src="data:image/jpeg;base64,${descricao.inseto_imagem}" alt="${descricao.inseto_nome}">
            </div>
        ` : '';
        
        return `
        <div class="descricao-item" data-inseto="${descricao.inseto_nome.toLowerCase()}">
            <div class="descricao-header">
                <h3>${descricao.titulo}</h3>
                <span class="descricao-inseto">${descricao.inseto_nome}</span>
            </div>
            
            ${imagemHtml}
            
            <div class="descricao-conteudo">
                <div class="descricao-texto">
                    <p>${descricao.descricao}</p>
                </div>
                
                ${descricao.caracteristicas ? `
                    <div class="descricao-secao">
                        <h4>🔍 Características</h4>
                        <p>${descricao.caracteristicas}</p>
                    </div>
                ` : ''}
                
                ${descricao.habitat ? `
                    <div class="descricao-secao">
                        <h4>🌿 Habitat</h4>
                        <p>${descricao.habitat}</p>
                    </div>
                ` : ''}
                
                ${descricao.curiosidades ? `
                    <div class="descricao-secao">
                        <h4>💡 Curiosidades</h4>
                        <p>${descricao.curiosidades}</p>
                    </div>
                ` : ''}
            </div>
            
            <div class="descricao-footer">
                <span class="descricao-autor">Por: ${descricao.autor}</span>
                <span class="descricao-data">Atualizado em: ${descricao.data_atualizacao || descricao.data_criacao}</span>
            </div>
            
            ${isAdmin ? `
            <div class="descricao-acoes">
                <button class="btn-editar" onclick="editarDescricao('${descricao.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-excluir" onclick="excluirDescricao('${descricao.id}')">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
            ` : ''}
        </div>
        `;
    }).join('');
    
    document.getElementById('listaDescricoes').innerHTML = html;
}

// Carregar insetos para o filtro
function carregarInsetosParaFiltro(descricoes) {
    const filtroInseto = document.getElementById('filtroInseto');
    const insetosUnicos = [...new Set(descricoes.map(d => d.inseto_nome))];
    
    // Limpar opções existentes (exceto a primeira)
    while (filtroInseto.children.length > 1) {
        filtroInseto.removeChild(filtroInseto.lastChild);
    }
    
    insetosUnicos.forEach(inseto => {
        const option = document.createElement('option');
        option.value = inseto.toLowerCase();
        option.textContent = inseto;
        filtroInseto.appendChild(option);
    });
}

// Filtrar descrições
function filtrarDescricoes() {
    const busca = document.getElementById('buscarDescricao').value.toLowerCase();
    const insetoFiltro = document.getElementById('filtroInseto').value;
    
    const descricoes = document.querySelectorAll('.descricao-item');
    
    descricoes.forEach(descricao => {
        const texto = descricao.textContent.toLowerCase();
        const inseto = descricao.getAttribute('data-inseto');
        
        const matchBusca = texto.includes(busca);
        const matchInseto = !insetoFiltro || inseto === insetoFiltro;
        
        descricao.style.display = (matchBusca && matchInseto) ? 'block' : 'none';
    });
}

// Modal functions
function abrirModalDescricao(descricao = null) {
    descricaoEditando = descricao;
    const modal = document.getElementById('modalDescricao');
    const tituloModal = document.getElementById('tituloModal');
    
    if (descricao) {
        tituloModal.textContent = 'Editar Descrição';
        preencherFormularioDescricao(descricao);
    } else {
        tituloModal.textContent = 'Adicionar Descrição';
        document.getElementById('formDescricao').reset();
        document.getElementById('descricaoId').value = '';
    }
    
    carregarInsetosParaFormulario();
    modal.style.display = 'block';
}

function fecharModalDescricao() {
    document.getElementById('modalDescricao').style.display = 'none';
    descricaoEditando = null;
}

// Carregar insetos para o formulário
function carregarInsetosParaFormulario() {
    fetch('/api/insetos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const select = document.getElementById('insetoSelect');
                select.innerHTML = '<option value="">Selecione um inseto</option>';
                
                data.insetos.forEach(inseto => {
                    const option = document.createElement('option');
                    option.value = inseto.id;
                    option.textContent = inseto.nome;
                    select.appendChild(option);
                });
                
                // Se estiver editando, selecionar o inseto correto
                if (descricaoEditando) {
                    select.value = descricaoEditando.inseto_id;
                }
            } else {
                console.error('Erro ao carregar insetos:', data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar insetos:', error);
        });
}

// Preencher formulário para edição
function preencherFormularioDescricao(descricao) {
    document.getElementById('descricaoId').value = descricao.id;
    document.getElementById('tituloDescricao').value = descricao.titulo;
    document.getElementById('descricaoCompleta').value = descricao.descricao;
    document.getElementById('caracteristicas').value = descricao.caracteristicas || '';
    document.getElementById('habitat').value = descricao.habitat || '';
    document.getElementById('curiosidades').value = descricao.curiosidades || '';
}

// Enviar formulário de descrição
document.addEventListener('DOMContentLoaded', function() {
    const formDescricao = document.getElementById('formDescricao');
    if (formDescricao) {
        formDescricao.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                titulo: document.getElementById('tituloDescricao').value,
                descricao: document.getElementById('descricaoCompleta').value,
                caracteristicas: document.getElementById('caracteristicas').value,
                habitat: document.getElementById('habitat').value,
                curiosidades: document.getElementById('curiosidades').value,
                inseto_id: document.getElementById('insetoSelect').value
            };
            
            const descricaoId = document.getElementById('descricaoId').value;
            const url = descricaoId ? `/api/descricao_inseto/${descricaoId}` : '/api/descricao_inseto';
            const method = descricaoId ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    fecharModalDescricao();
                    carregarDescricoesInsetos();
                } else {
                    alert('Erro: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Erro ao salvar descrição.');
            });
        });
    }
});

// Editar descrição
function editarDescricao(descricaoId) {
    fetch('/api/descricoes_insetos')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const descricao = data.descricoes.find(d => d.id === descricaoId);
                if (descricao) {
                    abrirModalDescricao(descricao);
                } else {
                    alert('Descrição não encontrada.');
                }
            } else {
                alert('Erro ao carregar descrições: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar descrições.');
        });
}

// Excluir descrição
function excluirDescricao(descricaoId) {
    if (!confirm('Tem certeza que deseja excluir esta descrição?')) {
        return;
    }
    
    fetch(`/api/descricao_inseto/${descricaoId}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            carregarDescricoesInsetos();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao excluir descrição.');
    });
}

// Atualizar a função abrir() para incluir a nova seção
function abrir(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.remove('ativo');
    });
    document.getElementById(sectionId).classList.add('ativo');
    
    if (sectionId === 'moderar') {
        carregarComentariosModeracao();
    } else if (sectionId === 'comentario') {
        carregarMeusComentarios();
    } else if (sectionId === 'descricoes') {
        carregarDescricoesInsetos();
    }
}