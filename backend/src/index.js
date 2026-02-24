const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for messages
const messages = [];
const connectedClients = new Map();

// REST API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connections: connectedClients.size
  });
});

app.get('/api/messages', (req, res) => {
  res.json({ 
    messages: messages.slice(-50) // Return last 50 messages
  });
});

app.post('/api/messages', (req, res) => {
  const { username, text } = req.body;
  
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required' });
  }

  const message = {
    id: uuidv4(),
    username,
    text,
    timestamp: new Date().toISOString()
  };

  messages.push(message);
  
  // Broadcast to all WebSocket clients
  broadcast({
    type: 'new_message',
    data: message
  });

  res.status(201).json({ message });
});

app.get('/api/stats', (req, res) => {
  res.json({
    totalMessages: messages.length,
    connectedUsers: connectedClients.size,
    uptime: process.uptime()
  });
});

// WebSocket handling
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  connectedClients.set(clientId, ws);
  
  console.log(`Client connected: ${clientId} (Total: ${connectedClients.size})`);

  // Send current message history to new client
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      messages: messages.slice(-20),
      clientId
    }
  }));

  // Broadcast user count update
  broadcastUserCount();

  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      
      switch (payload.type) {
        case 'message':
          const message = {
            id: uuidv4(),
            username: payload.username || 'Anonymous',
            text: payload.text,
            timestamp: new Date().toISOString()
          };
          messages.push(message);
          broadcast({
            type: 'new_message',
            data: message
          });
          break;
          
        case 'typing':
          broadcast({
            type: 'user_typing',
            data: {
              username: payload.username,
              isTyping: payload.isTyping
            }
          }, clientId);
          break;
          
        default:
          console.log('Unknown message type:', payload.type);
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    connectedClients.delete(clientId);
    console.log(`Client disconnected: ${clientId} (Total: ${connectedClients.size})`);
    broadcastUserCount();
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Helper functions
function broadcast(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  connectedClients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.readyState === 1) { // 1 = OPEN
      client.send(messageStr);
    }
  });
}

function broadcastUserCount() {
  broadcast({
    type: 'user_count',
    data: {
      count: connectedClients.size
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app; // For testing
