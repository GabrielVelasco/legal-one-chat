
// servidor (middleware) que recebe requisicoes do front (extensao), e se comunica com o banco de dados firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getDatabase, ref, get, push, set } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import express from 'express';
import cors from 'cors';

// firebase config object... (sua configuração do firebase)
const firebaseConfig = {
    apiKey: "<sua-api-key>",
    authDomain: "<seu-auth-domain>",
    projectId: "<seu-project-id>",
    storageBucket: "<seu-storage-bucket>",
    messagingSenderId: "<seu-messaging-sender-id>",
    appId: "<seu-app-id>"
};

// initialize firebase app and database
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // use 'database', a firebase feature

// setup express server
const server = express();
server.use(express.json());
server.use(cors());

// GET - Buscar chat de um processo específico no banco de dados
server.get('/proc/:proc_id/chat', async (req, res) => {
    try {
        const procId = req.params.proc_id;
        const chatRef = ref(database, `processos/${procId}`);

        const snapshot = await get(chatRef);
        if (!snapshot.exists()) {
            return res.status(404).json({ error: 'Processo não encontrado' });
        }

        const chatData = snapshot.val();
        return res.json({
            id: procId,
            messages: chatData.messages || []
        });

    } catch (error) {
        console.error('Erro ao buscar chat:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - Adicionar mensagem ao chat de um processo específico no banco de dados
server.post('/proc/:proc_id/chat', async (req, res) => {
    try {
        const procId = req.params.proc_id;
        const newMessage = req.body;

        // validacoa de dados
        if (!newMessage.msg || !newMessage.username || !newMessage.timestamp) {
            return res.status(400).json({ error: 'Dados da mensagem incompletos' });
        }

        const messagesRef = ref(database, `processos/${procId}/messages`);

        // verf se o processo existe
        const procRef = ref(database, `processos/${procId}`);
        const procSnapshot = await get(procRef);

        if (!procSnapshot.exists()) {
            // se o processo não existe, criar novo com a primeira mensagem
            await set(procRef, {
                id: procId,
                messages: [newMessage]
            });

        } else {
            // se existe, adicionar à lista de mensagens
            const messages = procSnapshot.val().messages || [];
            messages.push(newMessage);

            await set(procRef, {
                id: procId,
                messages: messages
            });
        }

        return res.status(201).json({ message: 'Mensagem adicionada com sucesso' });

    } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        return res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});