'use client';

import { useState } from 'react';

export default function CommandBar({ onCommand, isLoading }) {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    setInput('');
    setResponse({ text: 'Thinking...', type: 'loading' });

    const result = await onCommand(command);
    if (result) {
      setResponse({ text: result.response, type: result.type });
      setTimeout(() => setResponse(null), 8000);
    } else {
      setResponse(null);
    }
  }

  return (
    <>
      {response && (
        <div className="command-response">
          {response.type === 'loading' ? (
            <span><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginRight: 8, verticalAlign: 'middle' }} /> {response.text}</span>
          ) : (
            <span>
              {response.type === 'rule' && '📌 '}
              {response.type === 'query' && '💬 '}
              {response.type === 'action' && '✓ '}
              {response.text}
            </span>
          )}
        </div>
      )}
      <form className="command-bar" onSubmit={handleSubmit}>
        <span className="command-icon">⌘</span>
        <input
          className="command-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Try "flag all messages from Mark" or "what did Sarah send?"'
          disabled={isLoading}
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </>
  );
}
