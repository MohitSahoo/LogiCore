import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function ChatView({ apiBase }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load chat history
    loadHistory();
    // Add welcome message
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I\'m your Supply Chain AI Assistant. I can help you with:\n\n• Checking inventory levels\n• Finding low stock items\n• Order status inquiries\n• Product information\n• Stock forecasts\n\nWhat would you like to know?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${apiBase}/unified/chat/history/${sessionId}`);
      if (res.data.history && res.data.history.length > 0) {
        const historyMessages = res.data.history.flatMap(chat => [
          {
            role: 'user',
            content: chat.query,
            timestamp: chat.timestamp
          },
          {
            role: 'assistant',
            content: chat.response,
            timestamp: chat.timestamp
          }
        ]);
        setMessages(prev => [...prev, ...historyMessages]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${apiBase}/unified/chat`, {
        query: input,
        session_id: sessionId
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.response,
        data: res.data.data,
        intent: res.data.intent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const errorMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again or rephrase your question.',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuery = (query) => {
    setInput(query);
  };

  const quickQueries = [
    'Which products need restocking?',
    'Show me order status',
    'What is the total inventory value?',
    'List all low stock items',
    'Show me recent orders',
    'What products are overstocked?'
  ];

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isError = message.error;

    return (
      <div key={index} className={`chat-message ${isUser ? 'user' : 'assistant'} ${isError ? 'error' : ''}`}>
        <div className="message-avatar">
          {isUser ? '👤' : '🤖'}
        </div>
        <div className="message-content">
          <div className="message-header">
            <span className="message-role">{isUser ? 'You' : 'AI Assistant'}</span>
            <span className="message-time">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div className="message-text">
            {message.content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
          {message.intent && (
            <div className="message-intent">
              <span className="intent-badge">{message.intent}</span>
            </div>
          )}
          {message.data && Array.isArray(message.data) && message.data.length > 0 && (
            <div className="message-data">
              <details>
                <summary>View {message.data.length} items</summary>
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Stock</th>
                        <th>Reorder Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {message.data.slice(0, 10).map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td><code>{item.sku}</code></td>
                          <td>{item.stock_quantity}</td>
                          <td>{item.reorder_level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-title">
          <h2>💬 AI Chat Assistant</h2>
          <p>Ask questions about your inventory in natural language</p>
        </div>
        <button 
          onClick={() => {
            setMessages([messages[0]]);
            setInput('');
          }}
          className="btn-secondary"
        >
          🔄 Clear Chat
        </button>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => renderMessage(message, index))}
          {loading && (
            <div className="chat-message assistant loading-message">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-quick-queries">
          <p className="quick-queries-label">Quick queries:</p>
          <div className="quick-queries-grid">
            {quickQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuery(query)}
                className="quick-query-btn"
                disabled={loading}
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="chat-input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your inventory..."
            disabled={loading}
            className="chat-input"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="chat-send-btn"
          >
            {loading ? '⏳' : '📤'} Send
          </button>
        </form>
      </div>
    </div>
  );
}
