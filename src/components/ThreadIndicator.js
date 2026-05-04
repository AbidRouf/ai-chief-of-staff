'use client';

import { useState, useRef, useEffect } from 'react';

export default function ThreadIndicator({ thread, currentMessageId, allMessages, onClickMessage }) {
  if (!thread) return null;

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const threadMessages = (thread.messageIds || [])
    .map(id => allMessages?.find(m => m.id === id))
    .filter(Boolean);

  function handleClick(e) {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  }

  function handleSelectMessage(id) {
    onClickMessage && onClickMessage(id);
    setShowDropdown(false);
  }

  const currentIndex = thread.messageIds.indexOf(currentMessageId);
  const otherCount = thread.messageIds.length - 1;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className="thread-indicator"
        onClick={handleClick}
        title={`This message is part of a ${thread.messageIds.length}-message thread: "${thread.name}". Click to see all related messages across channels.`}
      >
        <span>🔗</span>
        <span>{thread.name}</span>
        <span style={{ opacity: 0.7 }}>({thread.messageIds.length})</span>
        <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>{showDropdown ? '▲' : '▼'}</span>
      </div>

      {showDropdown && threadMessages.length > 0 && (
        <div className="thread-dropdown">
          <div className="thread-dropdown-header">
            <strong>Thread: {thread.name}</strong>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {thread.summary || `${thread.messageIds.length} related messages across channels`}
            </div>
          </div>
          {threadMessages.map(msg => {
            const senderName = msg.sender?.replace(/<.*>/, '').trim() || msg.sender;
            const isCurrentMsg = msg.id === currentMessageId;
            const channelIcon = msg.channel === 'email' ? '📧' : msg.channel === 'slack' ? '💬' : '📱';
            const time = new Date(msg.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={msg.id}
                className={`thread-dropdown-item ${isCurrentMsg ? 'current' : ''}`}
                onClick={() => handleSelectMessage(msg.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.72rem' }}>{channelIcon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>{senderName}</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{time}</span>
                  {isCurrentMsg && <span style={{ fontSize: '0.6rem', color: 'var(--delegate)' }}>viewing</span>}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.subject || msg.body?.substring(0, 60)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
