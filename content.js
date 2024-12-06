/*
Exemplo de uso:

Clica em um processo
Abre pop-up no canto com o chat do processo
Carrega/renderiza mensagens do chat do ID_PROCESSO (GET /proc/ID_PROCESSO/chat)
Pode enviar uma mensagem (faz um POST /proc/ID_PROCESSO/chat)

*/

var lastMsgListSize = 0;
var baseUrl = 'https://bosta.sa-east-1.elasticbeanstalk.com';

function pegarIDProcesso() {
    const url = window.location.href;
    const regex = /(\d+)/;
    const match = url.match(regex);

    if (match) {
        return match[1];
    }

    return null;
}

function getCurrentUser() {
    // Retorna o ID do usuário logado

    const span = document.querySelector('.user-name-popover');
    if (span) {
        return span.innerText;
    } else {
        return 'null';
    }
}

function displayMessages(messages) {
    // renderiza as msgs, uma por uma na div .chat-messages
    // messages: array de objetos {msg: 'conteudo', username: 'nome'}

    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.innerHTML = '';

    chatMessages.innerHTML = messages.map(msg => `
        <div class="message ${msg.username === getCurrentUser() ? 'sent' : 'received'}">
            <span class="user-name">${msg.username}</span>
            <span class="timestamp">${msg.timestamp}</span>
            <p>${msg.msg}</p>
        </div>
    `).join('');

    // scroll para o final da div
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function fetchMessages(procID) {
    try {
        const response = await fetch(`${baseUrl}/proc/${procID}/chat`);
        // const response = await fetch(`http://127.0.0.1:5000/proc/${procID}/chat`);
        const chat = await response.json();

        if (!response.ok) {
            throw new Error(`Erro ao carregar mensagens para processo ID: ${procID}`);
        }

        return chat.messages;

    } catch (error) {
        // reject promise
        console.error('Erro ao carregar mensagens:', error);
        return [];
    }
}

function updateMsgBox(processoId) {
    console.log('ATUALIZANDO MSGS...');

    fetchMessages(processoId).then((msgs) => {
        if (msgs.length !== lastMsgListSize) {
            lastMsgListSize = msgs.length;
            displayMessages(msgs);
        }
    });
}

function checkUrl(processoId) {
    // verifica se estamos na página de um processo, se nao, esconde o chat

    console.log('CHECANDE SE ESTÁ NA PAG DE UM PROCESSO...');

    const chatModal = document.querySelector('.chat-modal');

    if (chatModal) {
        window.location.href.includes('processos/processos/D') || window.location.href.includes('processos/processos/d') || window.location.href.includes('processos/processos/C') ? chatModal.style.display = 'block' : chatModal.style.display = 'none';
    }
}

async function sendMessage(procID, msgContent) {
    // envia msg para o server salvar no DB, para o respectivo procID

    // msg_obj que vai no request.body (json)
    const date = new Date();
    const formattedTimestamp = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const msg_obj = {
        "msg": msgContent,
        "username": getCurrentUser(),
        timestamp: formattedTimestamp
    };

    try {
        const response = await fetch(`${baseUrl}/proc/${procID}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(msg_obj) // converte para JSON string
        });

        if (response.ok) {
            // Recarrega mensagens após envio bem-sucedido
            updateMsgBox(procID);
        }
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}

function buildChatModal(processoId) {
    // cria o modal/popup do chat com as msgs

    const chatModal = document.createElement('div');
    chatModal.className = 'chat-modal';

    chatModal.innerHTML = `
      <div class="chat-header">
        <h3>Chat do processo [${processoId}]</h3>
        <button class="close-btn">-</button>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input">
        <textarea placeholder="Digite sua mensagem..."></textarea>
        <button class="send-btn">Enviar</button>
      </div>
    `;

    document.body.appendChild(chatModal);

    // carrega mensagens do backend (listOfMessages = [ {msg: 'conteudo', username: 'nome'}, ... ])
    updateMsgBox(processoId);

    // adiciona handlers para envio de mensagens
    const sendBtn = chatModal.querySelector('.send-btn');
    const textarea = chatModal.querySelector('textarea');

    sendBtn.addEventListener('click', () => {
        if (textarea.value.length > 0) {
            sendMessage(processoId, textarea.value.trim());
            textarea.value = '';
        }
    });

    // handler para minimizar o chat
    const msgHeader = chatModal.querySelector('.chat-header');
    msgHeader.addEventListener('click', () => {
        const chatMsgsBox = document.querySelector('.chat-messages');
        const chatInput = document.querySelector('.chat-input');

        // toggle class '.hidden' para esconder chat
        chatMsgsBox.classList.toggle('hidden');
        chatInput.classList.toggle('hidden');
    });
}

window.onload = function () {
    // verifica se estamos na página de um tarefa
    console.log('EXTENCAO ATIVA!!');

    if (window.location.href.includes('processos/processos/D') || window.location.href.includes('processos/processos/d') || window.location.href.includes('processos/processos/C')) {
        console.log('NA PAG. DO PROCESSO! CARREGANDO MSGS...');

        const processoId = pegarIDProcesso(); // pega id da url
        console.log('PROCESSO ID:', processoId);

        buildChatModal(processoId); // rederiza chat modal com o header, msgs e botoes...

        // fechar o chat caso esteja em outra tela
        setInterval(() => {updateMsgBox(processoId); checkUrl(processoId)}, 1000);

    } else {
        // hide chat
        const chatModal = document.querySelector('.chat-modal');
        if (chatModal) {
            chatModal.remove();
        }
    }
};