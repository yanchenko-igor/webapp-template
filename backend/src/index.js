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

// In-memory storage
const rooms = new Map();
const connectedClients = new Map();

// Initialize default "general" room
rooms.set('general', {
  id: 'general',
  name: 'General',
  type: 'public',
  password: null,
  messages: [],
  users: new Set(),
  createdAt: new Date().toISOString()
});

// Helper function to get or create room
function getOrCreateRoom(roomId, roomData = {}) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      name: roomData.name || roomId,
      type: roomData.type || 'public',
      password: roomData.password || null,
      messages: [],
      users: new Set(),
      createdAt: new Date().toISOString()
    });
  }
  return rooms.get(roomId);
}

// Helper function to serialize room (convert Set to Array)
function serializeRoom(room) {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    hasPassword: !!room.password,
    userCount: room.users.size,
    messageCount: room.messages.length,
    createdAt: room.createdAt
  };
}

// REST API Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    connections: connectedClients.size,
    rooms: rooms.size
  });
});

// Get all rooms
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(serializeRoom);
  res.json({ rooms: roomList });
});

// Get room details
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ room: serializeRoom(room) });
});

// Create new room
app.post('/api/rooms', (req, res) => {
  const { name, type, password } = req.body;
  
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }
  
  if (!['public', 'private'].includes(type)) {
    return res.status(400).json({ error: 'Type must be public or private' });
  }
  
  if (type === 'private' && !password) {
    return res.status(400).json({ error: 'Password required for private rooms' });
  }
  
  const roomId = uuidv4();
  const room = getOrCreateRoom(roomId, { name, type, password });
  
  // Broadcast new room to all clients
  broadcast({
    type: 'room_created',
    data: serializeRoom(room)
  });
  
  res.status(201).json({ room: serializeRoom(room) });
});

// Join room (verify password for private rooms)
app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { password } = req.body;
  
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (room.type === 'private' && room.password !== password) {
    return res.status(403).json({ error: 'Incorrect password' });
  }
  
  res.json({ 
    success: true,
    room: serializeRoom(room)
  });
});

// Get messages for a room
app.get('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({ 
    messages: room.messages.slice(-50) // Return last 50 messages
  });
});

// Post message to a room
app.post('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const { username, text } = req.body;
  
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required' });
  }
  
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const message = {
    id: uuidv4(),
    roomId,
    username,
    text,
    timestamp: new Date().toISOString()
  };

  room.messages.push(message);
  
  // Broadcast to all clients in this room
  broadcastToRoom(roomId, {
    type: 'new_message',
    data: message
  });

  res.status(201).json({ message });
});

// Get stats
app.get('/api/stats', (req, res) => {
  res.json({
    totalRooms: rooms.size,
    connectedUsers: connectedClients.size,
    uptime: process.uptime()
  });
});

// Legacy endpoint for backward compatibility
app.get('/api/messages', (req, res) => {
  const generalRoom = rooms.get('general');
  res.json({ 
    messages: generalRoom ? generalRoom.messages.slice(-50) : []
  });
});

app.post('/api/messages', (req, res) => {
  const { username, text } = req.body;
  
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required' });
  }

  const generalRoom = getOrCreateRoom('general');
  const message = {
    id: uuidv4(),
    roomId: 'general',
    username,
    text,
    timestamp: new Date().toISOString()
  };

  generalRoom.messages.push(message);
  
  broadcastToRoom('general', {
    type: 'new_message',
    data: message
  });

  res.status(201).json({ message });
});

// WebSocket handling
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  const clientData = {
    ws,
    username: null,
    currentRoom: 'general' // Default room
  };
  
  connectedClients.set(clientId, clientData);
  
  console.log(`Client connected: ${clientId} (Total: ${connectedClients.size})`);

  // Send current room list and join general room
  const generalRoom = getOrCreateRoom('general');
  generalRoom.users.add(clientId);
  
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      clientId,
      rooms: Array.from(rooms.values()).map(serializeRoom),
      currentRoom: 'general',
      messages: generalRoom.messages.slice(-20)
    }
  }));

  // Broadcast updated user count
  broadcastRoomUpdate('general');

  ws.on('message', (data) => {
    try {
      const payload = JSON.parse(data);
      const client = connectedClients.get(clientId);
      
      switch (payload.type) {
        case 'set_username':
          client.username = payload.username;
          break;
          
        case 'join_room':
          const { roomId, password } = payload;
          const targetRoom = rooms.get(roomId);
          
          if (!targetRoom) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Room not found' }
            }));
            break;
          }
          
          // Check password for private rooms
          if (targetRoom.type === 'private' && targetRoom.password !== password) {
            ws.send(JSON.stringify({
              type: 'error',
              data: { message: 'Incorrect password' }
            }));
            break;
          }
          
          // Leave current room
          const currentRoom = rooms.get(client.currentRoom);
          if (currentRoom) {
            currentRoom.users.delete(clientId);
            broadcastRoomUpdate(client.currentRoom);
          }
          
          // Join new room
          targetRoom.users.add(clientId);
          client.currentRoom = roomId;
          
          ws.send(JSON.stringify({
            type: 'room_joined',
            data: {
              room: serializeRoom(targetRoom),
              messages: targetRoom.messages.slice(-20)
            }
          }));
          
          broadcastRoomUpdate(roomId);
          break;
          
        case 'message':
          const room = rooms.get(client.currentRoom);
          if (!room) break;
          
          const message = {
            id: uuidv4(),
            roomId: client.currentRoom,
            username: payload.username || client.username || 'Anonymous',
            text: payload.text,
            timestamp: new Date().toISOString()
          };
          
          room.messages.push(message);
          broadcastToRoom(client.currentRoom, {
            type: 'new_message',
            data: message
          });
          break;
          
        case 'typing':
          broadcastToRoom(client.currentRoom, {
            type: 'user_typing',
            data: {
              username: payload.username || client.username,
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
    const client = connectedClients.get(clientId);
    
    if (client && client.currentRoom) {
      const room = rooms.get(client.currentRoom);
      if (room) {
        room.users.delete(clientId);
        broadcastRoomUpdate(client.currentRoom);
      }
    }
    
    connectedClients.delete(clientId);
    console.log(`Client disconnected: ${clientId} (Total: ${connectedClients.size})`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
});

// Helper functions
function broadcast(message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  connectedClients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.ws.readyState === 1) {
      client.ws.send(messageStr);
    }
  });
}

function broadcastToRoom(roomId, message, excludeClientId = null) {
  const messageStr = JSON.stringify(message);
  
  connectedClients.forEach((client, clientId) => {
    if (client.currentRoom === roomId && 
        clientId !== excludeClientId && 
        client.ws.readyState === 1) {
      client.ws.send(messageStr);
    }
  });
}

function broadcastRoomUpdate(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  broadcastToRoom(roomId, {
    type: 'room_update',
    data: serializeRoom(room)
  });
  
  // Also broadcast room list update to all clients
  broadcast({
    type: 'rooms_updated',
    data: {
      rooms: Array.from(rooms.values()).map(serializeRoom)
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🏠 Default room: general`);
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
