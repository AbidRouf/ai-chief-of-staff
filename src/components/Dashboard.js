'use client';

import { useState } from 'react';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import Briefing from './Briefing';
import CommandBar from './CommandBar';

export default function Dashboard({ data, onUpdateData }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isCommandLoading, setIsCommandLoading] = useState(false);

  const { messages, threads, flags, briefing, rules } = data;

  const selectedMessage = messages?.find(m => m.id === selectedId);

  function getThread(messageId) {
    return threads?.find(t => t.messageIds?.includes(messageId));
  }

  async function handleReclassify(messageId, newCategory) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg || msg.triage?.category === newCategory) return;

    try {
      const res = await fetch('/api/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, newCategory }),
      });
      const result = await res.json();

      if (result.triage) {
        const updatedMessages = messages.map(m =>
          m.id === messageId ? { ...m, triage: result.triage } : m
        );
        onUpdateData({ ...data, messages: updatedMessages });
      }
    } catch (err) {
      console.error('Reclassify failed:', err);
    }
  }

  async function handleApprove(messageId, approved) {
    try {
      await fetch('/api/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, approved }),
      });

      const updatedMessages = messages.map(m =>
        m.id === messageId
          ? { ...m, triage: { ...m.triage, approved } }
          : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Approve failed:', err);
    }
  }

  async function handleDelegateStatus(messageId, status) {
    try {
      await fetch('/api/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, delegateStatus: status }),
      });

      const updatedMessages = messages.map(m =>
        m.id === messageId
          ? { ...m, triage: { ...m.triage, delegateStatus: status } }
          : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Delegate status failed:', err);
    }
  }

  async function handleCommand(command) {
    setIsCommandLoading(true);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const result = await res.json();

      if (result.type === 'rule' && result.messages) {
        onUpdateData({
          ...data,
          messages: result.messages,
          rules: result.rules || data.rules,
        });
      } else if (result.type === 'action' && result.messages) {
        onUpdateData({ ...data, messages: result.messages });
      }

      return result;
    } catch (err) {
      console.error('Command failed:', err);
      return { response: 'Something went wrong. Please try again.', type: 'error' };
    } finally {
      setIsCommandLoading(false);
    }
  }

  async function handleDeleteRule(ruleId) {
    try {
      const res = await fetch(`/api/rules?id=${ruleId}`, { method: 'DELETE' });
      const result = await res.json();
      onUpdateData({ ...data, rules: result.rules });
    } catch (err) {
      console.error('Delete rule failed:', err);
    }
  }

  function handleSelectMessage(messageId) {
    setSelectedId(messageId);
  }

  const dateStr = messages?.[0]?.timestamp
    ? new Date(messages[0].timestamp).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });

  return (
    <div className="fade-in">
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo">Chief of Staff</span>
          <span className="app-date">{dateStr}</span>
        </div>
        <div className="app-header-right">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {messages?.length || 0} messages processed
          </span>
        </div>
      </header>

      <div className="dashboard">
        <MessageList
          messages={messages || []}
          threads={threads || []}
          selectedId={selectedId}
          onSelect={handleSelectMessage}
          onReclassify={handleReclassify}
        />
        <MessageDetail
          message={selectedMessage}
          thread={selectedMessage ? getThread(selectedMessage.id) : null}
          onApprove={handleApprove}
          onDelegateStatus={handleDelegateStatus}
          onSelectMessage={handleSelectMessage}
        />
        <Briefing
          briefing={briefing}
          flags={flags || []}
          rules={rules || []}
          onDeleteRule={handleDeleteRule}
          onSelectMessage={handleSelectMessage}
        />
      </div>

      <CommandBar onCommand={handleCommand} isLoading={isCommandLoading} />
    </div>
  );
}
