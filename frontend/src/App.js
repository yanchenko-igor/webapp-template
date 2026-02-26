import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Use relative URLs when behind nginx proxy
const API_URL = process.env.REACT_APP_API_URL || '/api';
const WS_URL = process.env.REACT_APP_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  // Room state
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Room creation form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('public');
  const [newRoomPassword, setNewRoomPassword] = useState('');
  
  // Room joining
  const [joinPassword, setJoinPassword] = useState('');
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Fetch rooms list
    fetch(`${API_URL}/rooms`)
      .then(res => res.json())
      .then(data => setRooms(data.rooms))
      .catch(err => console.error('Failed to fetch rooms:', err));

    // Setup WebSocket connection
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'init':
          setRooms(data.data.rooms);
          setCurrentRoom({ id: 'general', name: 'General' });
          setMessages(data.data.messages);
          break;
          
        case 'new_message':
          setMessages(prev => [...prev, data.data]);
          break;
          
        case 'room_joined':
          setCurrentRoom(data.data.room);
          setMessages(data.data.messages);
          setShowJoinRoom(false);
          setJoinPassword('');
          break;
          
        case 'room_created':
          setRooms(prev => [...prev, data.data]);
          break;
          
        case 'rooms_updated':
          setRooms(data.data.rooms);
          break;
          
        case 'room_update':
          setRooms(prev => prev.map(r => 
            r.id === data.data.id ? data.data : r
          ));
          if (currentRoom && currentRoom.id === data.data.id) {
            setCurrentRoom(data.data);
          }
          break;
          
        case 'user_typing':
          if (data.data.isTyping) {
            setTypingUsers(prev => new Set([...prev, data.data.username]));
          } else {
            setTypingUsers(prev => {
              const next = new Set(prev);
              next.delete(data.data.username);
              return next;
            });
          }
          break;
          
        case 'error':
          alert(data.data.message);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSetUsername = (e) => {
    e.preventDefault();
    if (username.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'set_username',
        username: username.trim()
      }));
      setIsUsernameSet(true);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          type: newRoomType,
          password: newRoomType === 'private' ? newRoomPassword : null
        })
      });
      
      if (response.ok) {
        const { room } = await response.json();
        setShowCreateRoom(false);
        setNewRoomName('');
        setNewRoomPassword('');
        setNewRoomType('public');
        
        // Join the newly created room
        handleJoinRoom(room.id, newRoomType === 'private' ? newRoomPassword : null);
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = (roomId, password = null) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'join_room',
        roomId,
        password
      }));
    }
  };

  const handleJoinRoomClick = (room) => {
    if (room.hasPassword) {
      setSelectedRoom(room);
      setShowJoinRoom(true);
    } else {
      handleJoinRoom(room.id);
    }
  };

  const handleJoinWithPassword = (e) => {
    e.preventDefault();
    if (selectedRoom) {
      handleJoinRoom(selectedRoom.id, joinPassword);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (messageText.trim() && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        username,
        text: messageText.trim()
      }));
      
      setMessageText('');
      handleTyping(false);
    }
  };

  const handleTyping = (isTyping) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        username,
        isTyping
      }));
    }
  };

  const handleMessageChange = (e) => {
    setMessageText(e.target.value);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    } else {
      handleTyping(true);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isUsernameSet) {
    return (
      <div className="App">
        <div className="username-container">
          <h1>Welcome to Chat</h1>
          <form onSubmit={handleSetUsername}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <h1>💬 Chat Rooms</h1>
          <div className="status">
            <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'} {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="current-room-info">
          <span className="room-name">
            {currentRoom ? (
              <>
                {currentRoom.hasPassword && '🔒'} {currentRoom.name}
                {currentRoom.userCount > 0 && ` (${currentRoom.userCount} online)`}
              </>
            ) : 'No room selected'}
          </span>
        </div>
      </header>

      <div className="main-container">
        <aside className="rooms-sidebar">
          <div className="rooms-header">
            <h2>Rooms</h2>
            <button 
              className="create-room-btn"
              onClick={() => setShowCreateRoom(true)}
              title="Create new room"
            >
              +
            </button>
          </div>
          
          <div className="rooms-list">
            {rooms.map(room => (
              <div 
                key={room.id}
                className={`room-item ${currentRoom && currentRoom.id === room.id ? 'active' : ''}`}
                onClick={() => handleJoinRoomClick(room)}
              >
                <div className="room-item-header">
                  <span className="room-item-name">
                    {room.hasPassword && '🔒'} {room.name}
                  </span>
                  <span className="room-type-badge">{room.type}</span>
                </div>
                <div className="room-item-info">
                  <span>👥 {room.userCount}</span>
                  <span>💬 {room.messageCount}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="chat-container">
          <div className="messages-container">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`message ${msg.username === username ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="username">{msg.username}</span>
                  <span className="timestamp">{formatTimestamp(msg.timestamp)}</span>
                </div>
                <div className="message-text">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
            
            {typingUsers.size > 0 && (
              <div className="typing-indicator">
                {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}
          </div>

          <form className="message-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="Type a message..."
              value={messageText}
              onChange={handleMessageChange}
              disabled={!isConnected || !currentRoom}
            />
            <button type="submit" disabled={!isConnected || !messageText.trim() || !currentRoom}>
              Send
            </button>
          </form>
        </main>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="modal-overlay" onClick={() => setShowCreateRoom(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Room</h2>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                required
                autoFocus
              />
              
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    value="public"
                    checked={newRoomType === 'public'}
                    onChange={(e) => setNewRoomType(e.target.value)}
                  />
                  Public
                </label>
                <label>
                  <input
                    type="radio"
                    value="private"
                    checked={newRoomType === 'private'}
                    onChange={(e) => setNewRoomType(e.target.value)}
                  />
                  Private
                </label>
              </div>
              
              {newRoomType === 'private' && (
                <input
                  type="password"
                  placeholder="Room password"
                  value={newRoomPassword}
                  onChange={(e) => setNewRoomPassword(e.target.value)}
                  required
                />
              )}
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCreateRoom(false)}>
                  Cancel
                </button>
                <button type="submit">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Private Room Modal */}
      {showJoinRoom && selectedRoom && (
        <div className="modal-overlay" onClick={() => setShowJoinRoom(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Join {selectedRoom.name}</h2>
            <p>This room is private. Enter the password to join.</p>
            <form onSubmit={handleJoinWithPassword}>
              <input
                type="password"
                placeholder="Enter password"
                value={joinPassword}
                onChange={(e) => setJoinPassword(e.target.value)}
                required
                autoFocus
              />
              
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowJoinRoom(false);
                  setJoinPassword('');
                }}>
                  Cancel
                </button>
                <button type="submit">Join</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
