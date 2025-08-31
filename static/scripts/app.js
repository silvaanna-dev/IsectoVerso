// Variáveis globais
let imagemSelecionadaId = null;

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

// Verificar e configurar a página de registro (se os elementos existirem)
document.addEventListener('DOMContentLoaded', function() {
    const tipoUsuario = document.getElementById('tipoUsuario');
    const areaAdmin = document.getElementById('areaAdmin');
    const areaAluno = document.getElementById('areaAluno');
    
    // Só executar se estiver na página de registro
    if (tipoUsuario && areaAdmin && areaAluno) {
        // Configurar estado inicial
        areaAdmin.style.display = tipoUsuario.value === 'administrador' ? 'block' : 'none';
        areaAluno.style.display = tipoUsuario.value === 'aluno' ? 'block' : 'none';
        
        // Adicionar event listener
        tipoUsuario.addEventListener('change', () => {
            areaAdmin.style.display = tipoUsuario.value === 'administrador' ? 'block' : 'none';
            areaAluno.style.display = tipoUsuario.value === 'aluno' ? 'block' : 'none';
        });
        
        console.log("Configuração de tipo de usuário inicializada");
    }
});


// ========= NAVEGAÇÃO =========

function abrir(id){
    document.querySelectorAll('.conteudo section').forEach(s=>s.classList.remove('ativo'));
    const alvo = document.getElementById(id); if(alvo) alvo.classList.add('ativo');
    document.title = `Mundo dos Insetos 🐞 - ${alvo?.querySelector('h1, h2')?.textContent || 'Seção'}`;
    
    clearMessages();
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


// Função para enviar comentário - CORRIGIDA
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

// ===== FUNÇÕES DE MODERAÇÃO =====

// Carregar comentários para moderação
function carregarComentariosModeracao() {
  if (document.getElementById('moderar').classList.contains('ativo')) {
    fetch('/api/comentarios_pendentes')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const listaPendentes = document.getElementById('listaPendentes');
          
          if (data.comentarios.length === 0) {
            listaPendentes.innerHTML = '<p>Nenhum comentário.</p>';
          } else {
            listaPendentes.innerHTML = data.comentarios.map(comentario => `
              <div class="comentario-item comentario-pendente">
                <div class="comentario-cabecalho">
                  <div class="comentario-info">
                    <span class="comentario-imagem">Imagem: ${comentario.imagem_nome}</span>• 
                    <span class="comentario-usuario">Usuário: ${comentario.usuario}</span>• 
                    <span class="comentario-data">${comentario.data}</span>
                  </div>
                </div>
                <div class="comentario-texto"> • Comentário: ${comentario.texto}</div>
                <div class="comentario-acoes">
                  <button class="btn-excluir" onclick="moderarComentario('${comentario.id}', 'rejeitar')">Excluir</button>
                </div>
              </div>
            `).join('');
          }
        } else {
          listaPendentes.innerHTML = '<p>Erro ao carregar comentários.</p>';
        }
      })
      .catch(error => {
        console.error('Erro:', error);
        document.getElementById('listaPendentes').innerHTML = '<p>Erro ao carregar comentários.</p>';
      });
  }
}

// Moderar comentário (aprovar/rejeitar)
function moderarComentario(comentarioId, acao) {
  fetch(`/api/moderar_comentario/${comentarioId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ acao: acao })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert(data.message);
      carregarComentariosModeracao(); // Recarregar a lista
    } else {
      alert('Erro: ' + data.message);
    }
  })
  .catch(error => {
    console.error('Erro:', error);
    alert('Erro ao moderar comentário.');
  });
}

// Atualizar a função abrir() para carregar comentários quando a seção de moderação for aberta
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

// ===== EVENT LISTENERS =====

// Fechar popup ao clicar fora dele
document.addEventListener('click', function(event) {
  const popup = document.getElementById('popupComentario');
  if (event.target === popup) {
    fecharPopupComentario();
  }
});

// Fechar popup com a tecla ESC
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    fecharPopupComentario();
  }
});

// Verificar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  console.log("Página carregada - Sistema de comentários pronto");
  
  // Verificar se o popup existe no DOM
  const popup = document.getElementById('popupComentario');
  if (popup) {
    console.log("Popup de comentários encontrado no DOM");
  } else {
    console.error("Popup de comentários NÃO encontrado no DOM");
  }
});