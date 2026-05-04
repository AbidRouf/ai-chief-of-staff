'use client';

import { useState } from 'react';
import TriageBadge from './TriageBadge';

const CHANNEL_ICONS = { email: '📧', slack: '💬', whatsapp: '📱' };

export default function MessageList({ messages, threads, selectedId, onSelect, onReclassify }) {
  const [filter, setFilter] = useState('all');
  const [dragOverCategory, setDragOverCategory] = useState(null);
  const [search, setSearch] = useState('');

  const searchLower = search.toLowerCase();
  const searchFiltered = search
    ? messages.filter(m =>
        (m.sender || '').toLowerCase().includes(searchLower) ||
        (m.subject || '').toLowerCase().includes(searchLower) ||
        (m.body || '').toLowerCase().includes(searchLower)
      )
    : messages;

  const filtered = filter === 'all'
    ? searchFiltered
    : searchFiltered.filter(m => m.triage?.category === filter);

  const categories = ['decide', 'delegate', 'ignore'];
  const grouped = {};
  for (const cat of categories) {
    grouped[cat] = filtered.filter(m => m.triage?.category === cat);
  }

  if (filter !== 'all') {
    grouped[filter] = filtered;
  }

  const counts = {
    all: messages.length,
    decide: messages.filter(m => m.triage?.category === 'decide').length,
    delegate: messages.filter(m => m.triage?.category === 'delegate').length,
    ignore: messages.filter(m => m.triage?.category === 'ignore').length,
  };

  function getThread(messageId) {
    return threads?.find(t => t.messageIds?.includes(messageId));
  }

  function handleDragStart(e, messageId) {
    e.dataTransfer.setData('text/plain', messageId.toString());
    e.currentTarget.classList.add('dragging');
  }

  function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    setDragOverCategory(null);
  }

  function handleDragOver(e, category) {
    e.preventDefault();
    setDragOverCategory(category);
  }

  function handleDrop(e, newCategory) {
    e.preventDefault();
    setDragOverCategory(null);
    const messageId = parseInt(e.dataTransfer.getData('text/plain'));
    if (messageId && onReclassify) {
      onReclassify(messageId, newCategory);
    }
  }

  function renderUrgency(urgency) {
    return (
      <div className="urgency-dots">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`urgency-dot ${i <= urgency ? 'filled' : ''}`} />
        ))}
      </div>
    );
  }

  function renderMessageItem(msg) {
    const thread = getThread(msg.id);
    const senderName = msg.sender?.replace(/<.*>/, '').trim() || msg.sender;
    const time = new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
      <div
        key={msg.id}
        className={`message-item ${selectedId === msg.id ? 'selected' : ''}`}
        onClick={() => onSelect(msg.id)}
        draggable
        onDragStart={(e) => handleDragStart(e, msg.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="message-item-header">
          <div className="message-sender">
            <span className="message-channel-icon">{CHANNEL_ICONS[msg.channel] || '📩'}</span>
            {senderName}
          </div>
          <span className="message-time">{time}</span>
        </div>
        <div className="message-subject">
          {msg.subject || msg.body?.substring(0, 60) + '...'}
        </div>
        <div className="message-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TriageBadge category={msg.triage?.category || 'ignore'} />
            {msg.triage?.overriddenBy && <span className="override-badge">{msg.triage.overriddenBy}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {thread && (
              <span className="message-thread-badge">
                🔗 {thread.messageIds.length}
              </span>
            )}
            {renderUrgency(msg.triage?.urgency || 1)}
          </div>
        </div>
      </div>
    );
  }

  function renderCategory(category, msgs) {
    if (msgs.length === 0) return null;
    return (
      <div
        key={category}
        className={`drop-zone ${dragOverCategory === category ? 'drag-over' : ''}`}
        onDragOver={(e) => handleDragOver(e, category)}
        onDragLeave={() => setDragOverCategory(null)}
        onDrop={(e) => handleDrop(e, category)}
      >
        <div style={{
          padding: '8px 20px',
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: `var(--${category})`,
          background: `var(--${category}-bg)`,
          position: 'sticky',
          top: 0,
          zIndex: 3,
        }}>
          {category} ({msgs.length})
        </div>
        {msgs
          .sort((a, b) => (b.triage?.urgency || 0) - (a.triage?.urgency || 0))
          .map(renderMessageItem)}
      </div>
    );
  }

  return (
    <div className="panel" style={{ background: 'var(--surface)' }}>
      <div className="panel-header">
        <h2>Messages</h2>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search messages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'decide', 'delegate', 'ignore'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}<span className="filter-tab-count">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="panel-content">
        {filter === 'all'
          ? categories.map(cat => renderCategory(cat, grouped[cat] || []))
          : (grouped[filter] || [])
              .sort((a, b) => (b.triage?.urgency || 0) - (a.triage?.urgency || 0))
              .map(renderMessageItem)
        }
      </div>
    </div>
  );
}
