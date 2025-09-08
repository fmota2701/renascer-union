const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const Database = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Inicializar banco de dados
const db = new Database();

// Servir arquivos estáticos do frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// API Routes
app.get('/api/guild-data', async (req, res) => {
  try {
    const data = await db.getGuildData();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/guild-data', async (req, res) => {
  try {
    const { data } = req.body;
    await db.saveGuildData(data);
    
    // Notificar todos os clientes conectados sobre a atualização
    io.emit('data-updated', data);
    
    res.json({ success: true, message: 'Dados salvos com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const players = await db.getPlayers();
    res.json(players);
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/api/players', async (req, res) => {
  try {
    const player = req.body;
    const newPlayer = await db.addPlayer(player);
    
    // Notificar todos os clientes sobre o novo jogador
    io.emit('player-added', newPlayer);
    
    res.json(newPlayer);
  } catch (error) {
    console.error('Erro ao adicionar jogador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedPlayer = await db.updatePlayer(id, updates);
    
    // Notificar todos os clientes sobre a atualização
    io.emit('player-updated', updatedPlayer);
    
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Erro ao atualizar jogador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.delete('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.deletePlayer(id);
    
    // Notificar todos os clientes sobre a remoção
    io.emit('player-deleted', { id });
    
    res.json({ success: true, message: 'Jogador removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover jogador:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Socket.io para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar dados atuais para o cliente recém-conectado
  socket.on('request-initial-data', async () => {
    try {
      const data = await db.getGuildData();
      socket.emit('initial-data', data);
    } catch (error) {
      console.error('Erro ao enviar dados iniciais:', error);
      socket.emit('error', { message: 'Erro ao carregar dados' });
    }
  });
  
  // Lidar com atualizações em tempo real
  socket.on('update-data', async (data) => {
    try {
      await db.saveGuildData(data);
      // Notificar outros clientes (exceto o remetente)
      socket.broadcast.emit('data-updated', data);
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      socket.emit('error', { message: 'Erro ao salvar dados' });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// Inicializar servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado.');
    process.exit(0);
  });
});