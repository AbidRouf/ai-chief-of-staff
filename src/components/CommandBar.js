'use client';

import { useState, useRef, useEffect } from 'react';

export default function CommandBar({ onCommand, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: command }]);
    setInput('');

    setMessages(prev => [...prev, { role: 'ai', text: 'Thinking...', loading: true }]);

    const result = await onCommand(command);

    setMessages(prev => {
      const updated = prev.filter(m => !m.loading);
      if (result) {
        const prefix = result.type === 'rule' ? '📌 ' : result.type === 'action' ? '✓ ' : '';
        updated.push({ role: 'ai', text: prefix + (result.response || result.answer || 'Done.') });
      }
      return updated;
    });
  }

  return (
    <div className="command-float">
      {isOpen && (
        <div className="command-panel">
          <div className="command-panel-header">
            <span>⌘ AI Assistant</span>
            <button className="command-panel-close" onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="command-messages">
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
                Try: &ldquo;flag all messages from Mark&rdquo; or &ldquo;what did Sarah send?&rdquo;
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`command-msg ${msg.role}`}>
                <div className="command-msg-bubble">
                  {msg.loading ? (
                    <span><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginRight: 6, verticalAlign: 'middle' }} /> {msg.text}</span>
                  ) : msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="command-bar" onSubmit={handleSubmit}>
            <span className="command-icon">⌘</span>
            <input
              className="command-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question or set a rule..."
              disabled={isLoading}
              autoFocus
            />
            <button type="submit" className="btn btn-sm btn-primary" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}

      <button className="command-toggle" onClick={() => setIsOpen(!isOpen)} title="AI Assistant">
        {isOpen ? '×' : '⌘'}
      </button>
    </div>
  );
}
