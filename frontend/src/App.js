import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

function App() {
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState(new Set());
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Fetch initial messages
    fetch(`${API_URL}/api/messages`)
      .then(res => res.json())
      .then(data => setMessages(data.messages))
      .catch(err => console.error('Failed to fetch messages:', err));

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
          setMessages(data.data.messages);
          break;
          
        case 'new_message':
          setMessages(prev => [...prev, data.data]);
          break;
          
        case 'user_count':
          setUserCount(data.data.count);
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
    if (username.trim()) {
      setIsUsernameSet(true);
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
    
    // Typing indicator
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
        <h1>💬 Chat Room</h1>
        <div className="status">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'} {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="user-count">👥 {userCount} online</span>
        </div>
      </header>

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
          disabled={!isConnected}
        />
        <button type="submit" disabled={!isConnected || !messageText.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
