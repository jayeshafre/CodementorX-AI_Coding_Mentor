import React, { useState, useRef, useEffect } from 'react';
import "./codementorx.css"

const API_URL = 'http://localhost:8000';

function CodementorXApp({ user, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('codementorx_chat_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setChatHistory(parsed);
        setFilteredHistory(parsed);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('codementorx_chat_history', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  // Filter chat history based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredHistory(chatHistory);
    } else {
      const filtered = chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredHistory(filtered);
    }
  }, [searchQuery, chatHistory]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessage = (content) => {
    if (typeof content !== 'string') return content;
    
    const parts = content.split(/(```[\s\S]*?```)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const codeContent = part.slice(3, -3);
        const lines = codeContent.split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n');
        
        return (
          <div key={index} className="code-block">
            {language && <div className="code-header">{language}</div>}
            <pre className="code-content">
              <code>{code}</code>
            </pre>
          </div>
        );
      } else {
        return (
          <div key={index} className="text-content">
            {formatTextContent(part)}
          </div>
        );
      }
    });
  };

  const formatTextContent = (text) => {
    const lines = text.split('\n');
    const formattedLines = [];
    let listItems = [];
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/^###\s+/.test(line)) {
        formattedLines.push(
          <h3 key={i} style={{ fontWeight: 'bold', fontSize: '1.2em', margin: '15px 0 8px', color: '#2d3748' }}>
            {line.replace(/^###\s+/, '')}
          </h3>
        );
        continue;
      }
      
      if (/^##\s+/.test(line)) {
        formattedLines.push(
          <h2 key={i} style={{ fontWeight: 'bold', fontSize: '1.4em', margin: '18px 0 10px', color: '#1a202c' }}>
            {line.replace(/^##\s+/, '')}
          </h2>
        );
        continue;
      }
      
      if (/[*_]{2}.*?[*_]{2}/.test(line)) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        formattedLines.push(
          <p key={i} style={{ fontWeight: '500', fontSize: '1.05em', margin: '10px 0', lineHeight: '1.6' }}>
            {parts.map((part, idx) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={idx}>{part.slice(2, -2)}</strong>
              ) : (
                <span key={idx}>{part}</span>
              )
            )}
          </p>
        );
        continue;
      }

      if (/^\d+\.\s/.test(line.trim())) {
        if (listType !== 'ol') {
          if (listItems.length > 0) {
            formattedLines.push(createList(listItems, listType));
            listItems = [];
          }
          listType = 'ol';
        }
        const content = line.replace(/^\d+\.\s*/, '');
        listItems.push(formatInlineText(content));
      }
      else if (/^[-*]\s/.test(line.trim())) {
        if (listType !== 'ul') {
          if (listItems.length > 0) {
            formattedLines.push(createList(listItems, listType));
            listItems = [];
          }
          listType = 'ul';
        }
        const content = line.replace(/^[-*]\s*/, '');
        listItems.push(formatInlineText(content));
      }
      else {
        if (listItems.length > 0) {
          formattedLines.push(createList(listItems, listType));
          listItems = [];
          listType = null;
        }
        
        if (line.trim() === '') {
          formattedLines.push(<br key={i} />);
        } else {
          formattedLines.push(
            <p key={i} style={{ margin: '8px 0', lineHeight: '1.6' }}>
              {formatInlineText(line)}
            </p>
          );
        }
      }
    }

    if (listItems.length > 0) {
      formattedLines.push(createList(listItems, listType));
    }

    return formattedLines;
  };

  const createList = (items, type) => {
    const ListComponent = type === 'ol' ? 'ol' : 'ul';
    return React.createElement(
      ListComponent,
      {
        key: `list-${Date.now()}-${Math.random()}`,
        style: {
          margin: '10px 0',
          paddingLeft: '20px',
          lineHeight: '1.6'
        }
      },
      items.map((item, index) => (
        <li key={index} style={{ marginBottom: '5px' }}>
          {item}
        </li>
      ))
    );
  };

  const formatInlineText = (text) => {
    let formatted = text.replace(/`([^`]+)`/g, '<code style="background: #f1f3f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 0.9em;">$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #667eea; text-decoration: underline;">$1</a>');
    
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const newChat = () => {
    const chatId = Date.now().toString();
    setCurrentChatId(chatId);
    setMessages([]);
    setError('');
    setInput('');
  };

  const saveCurrentChat = (firstMessage, newMessages) => {
    if (newMessages.length > 0 && currentChatId) {
      const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      
      const chatData = {
        id: currentChatId,
        title: title,
        messages: newMessages,
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => {
        const existingIndex = prev.findIndex(chat => chat.id === currentChatId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = chatData;
          return updated;
        } else {
          return [chatData, ...prev];
        }
      });
    }
  };

  const loadChat = (chatData) => {
    setCurrentChatId(chatData.id);
    setMessages(chatData.messages);
    setError('');
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      newChat();
    }
  };

  const clearAllHistory = () => {
    setChatHistory([]);
    setFilteredHistory([]);
    localStorage.removeItem('codementorx_chat_history');
    newChat();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const currentInput = input.trim();
    const userMessage = { role: 'user', content: currentInput };
    
    if (!currentChatId) {
      const chatId = Date.now().toString();
      setCurrentChatId(chatId);
    }
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: currentInput,
          history: messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error && data.error.trim()) {
        setError(data.error);
        return;
      }

      if (data.response && data.response.trim()) {
        const aiMessage = { 
          role: 'assistant', 
          content: data.response.trim()
        };
        
        const finalMessages = [...newMessages, aiMessage];
        setMessages(finalMessages);
        
        setTimeout(() => saveCurrentChat(currentInput, finalMessages), 100);
      } else {
        setError('Received empty response from CodementorX. Please try again.');
      }
    } catch (err) {
      console.error('Request failed:', err);
      setError(`Connection failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    newChat();
  };

  const insertSampleQuestion = (question) => {
    setInput(question);
  };

  const highlightSearchText = (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="search-highlight">{part}</span> : 
        part
    );
  };

  const sampleQuestions = [
    "Help me plan a full-stack web application",
    "Review this React component for best practices",
    "I'm getting a CORS error, how do I fix it?",
    "What's the best database for a social media app?",
    "How do I implement user authentication?",
    "Help me optimize this slow SQL query"
  ];

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button onClick={newChat} className="new-chat-btn">
            ➕ New chat
          </button>
        </div>

        {sidebarOpen && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        )}

        {sidebarOpen && (
          <div className="chat-history">
            <div className="chat-history-title">
              Recent Chats
              {chatHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    float: 'right',
                    fontSize: '0.7rem'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="search-results">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat)}
                  className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                >
                  <div className="chat-item-content">
                    <div className="chat-item-title">
                      {highlightSearchText(chat.title, searchQuery)}
                    </div>
                    <div className="chat-timestamp">
                      {formatTimestamp(chat.timestamp)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="chat-delete-btn"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            
            {filteredHistory.length === 0 && chatHistory.length > 0 && searchQuery && (
              <div className="no-chats">
                No chats found matching "{searchQuery}"
              </div>
            )}
            
            {chatHistory.length === 0 && (
              <div className="no-chats">
                No recent chats
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="chat-container">
          {/* Header with User Info and Logout */}
          <div className="chat-header">
            <div className="header-left">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="sidebar-toggle"
              >
                ☰
              </button>
              
              <div className="logo-container">
                <div className="logo-wrapper">
                  <div className="logo-circle">
                    <div className="logo-brackets">
                      <span className="bracket-left">{'{'}</span>
                      <div className="logo-dots">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                      <span className="bracket-right">{'}'}</span>
                    </div>
                  </div>
                </div>
                <div className="header-text">
                  <h1>CodementorX</h1>
                  <p>Welcome, {user?.username || user?.email || 'User'}!</p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={clearChat} className="clear-btn">
                🗑️ Clear
              </button>
              <button 
                onClick={onLogout}
                style={{
                  background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.15) 100%)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  color: '#dc2626',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  backdropFilter: 'blur(8px)'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.25) 0%, rgba(185, 28, 28, 0.25) 100%)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.15) 100%)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="messages">
            {messages.length === 0 && (
              <div className="welcome">
                <div className="welcome-header">
                  <h2>Welcome to CodementorX! 👋</h2>
                  <p>I'm your AI coding mentor, ready to help you build amazing projects!</p>
                </div>
                
                <div className="expertise-grid">
                  {[
                    { icon: '🎯', title: 'Project Planning', desc: 'Architecture design & roadmaps' },
                    { icon: '💻', title: 'Full-Stack Dev', desc: 'React, Node.js, Python & more' },
                    { icon: '🐛', title: 'Debugging', desc: 'Error analysis & solutions' },
                    { icon: '📋', title: 'Code Review', desc: 'Best practices & optimization' }
                  ].map((card, i) => (
                    <div key={i} className="expertise-card">
                      <div className="card-icon">{card.icon}</div>
                      <h3>{card.title}</h3>
                      <p>{card.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="sample-questions">
                  <h3>Try asking me:</h3>
                  <div className="questions-grid">
                    {sampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => insertSampleQuestion(question)}
                        className="sample-question"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="messages-container">
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`message ${message.role}`}
                  >
                    <div className="message-content">
                      <div className="message-role">
                        {message.role === 'user' ? '👤 You' : '🤖 CodementorX'}
                      </div>
                      <div className="message-text">
                        {formatMessage(message.content)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loading && (
              <div className="typing">
                <div className="message-content">
                  <div className="message-role">🤖 CodementorX</div>
                  <div className="typing-content">
                    <div className="typing-dots">
                      <span className="dot1"></span>
                      <span className="dot2"></span>
                      <span className="dot3"></span>
                    </div>
                    Analyzing your request...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="error">
              ⚠️ {error}
              <button 
                onClick={() => setError('')}
                className="error-close"
              >
                ×
              </button>
            </div>
          )}

          {/* Input */}
          <div className="input-container">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                disabled={loading}
                className="message-input"
                rows="2"
              />
              <button 
                onClick={sendMessage} 
                disabled={loading || !input.trim()}
                className="send-btn"
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </div>
            <div className="input-hint">
              Press Enter to send • Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodementorXApp;