'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import MessageList from './MessageList';
import MessageDetail from './MessageDetail';
import Briefing from './Briefing';
import CommandBar from './CommandBar';
import IntegrationModal from './IntegrationModal';
import ChannelIcon from './ChannelIcon';

export default function Dashboard({ data, onUpdateData }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showSettings, setShowSettings] = useState(false);
  const [integrationService, setIntegrationService] = useState(null);
  const [mobileTab, setMobileTab] = useState('messages');

  // Resizable panels
  const [panelWidths, setPanelWidths] = useState([320, null, 360]);
  const dashboardRef = useRef(null);
  const dragInfo = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleMouseDown = useCallback((e, dividerIndex) => {
    e.preventDefault();
    dragInfo.current = { dividerIndex, startX: e.clientX, startWidths: [...panelWidths] };

    const handleMouseMove = (e) => {
      if (!dragInfo.current || !dashboardRef.current) return;
      const { dividerIndex, startX, startWidths } = dragInfo.current;
      const delta = e.clientX - startX;
      const totalWidth = dashboardRef.current.offsetWidth;
      const newWidths = [...startWidths];

      if (dividerIndex === 0) {
        const newLeft = Math.max(200, Math.min(totalWidth * 0.6, (startWidths[0] || 320) + delta));
        newWidths[0] = newLeft;
      } else {
        const newRight = Math.max(200, Math.min(totalWidth * 0.6, (startWidths[2] || 360) - delta));
        newWidths[2] = newRight;
      }
      setPanelWidths(newWidths);
    };

    const handleMouseUp = () => {
      dragInfo.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelWidths]);

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
        m.id === messageId ? { ...m, triage: { ...m.triage, approved } } : m
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
        m.id === messageId ? { ...m, triage: { ...m.triage, delegateStatus: status } } : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Delegate status failed:', err);
    }
  }

  async function handleDelegateChange(messageId, newDelegate) {
    try {
      const res = await fetch('/api/reclassify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, newCategory: 'delegate' }),
      });
      const result = await res.json();
      const updatedMessages = messages.map(m =>
        m.id === messageId
          ? { ...m, triage: { ...(result.triage || m.triage), delegateTo: newDelegate } }
          : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Delegate change failed:', err);
    }
  }

  async function handleChangeCategory(messageId, newCategory) {
    try {
      await fetch('/api/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, category: newCategory }),
      });
      const updatedMessages = messages.map(m =>
        m.id === messageId
          ? { ...m, triage: { ...m.triage, category: newCategory, overriddenBy: 'user' } }
          : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Category change failed:', err);
    }
  }

  async function handleChangeUrgency(messageId, urgency) {
    try {
      await fetch('/api/triage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, urgency }),
      });
      const updatedMessages = messages.map(m =>
        m.id === messageId
          ? { ...m, triage: { ...m.triage, urgency } }
          : m
      );
      onUpdateData({ ...data, messages: updatedMessages });
    } catch (err) {
      console.error('Urgency change failed:', err);
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
        onUpdateData({ ...data, messages: result.messages, rules: result.rules || data.rules });
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
            {messages?.length || 0} messages
          </span>
          <button className="theme-toggle" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="btn btn-sm" onClick={() => setShowSettings(true)}>
            ⚙ Settings
          </button>
        </div>
      </header>

      <div className="mobile-tabs">
        <button className={`mobile-tab ${mobileTab === 'messages' ? 'active' : ''}`} onClick={() => setMobileTab('messages')}>
          Messages<span className="mobile-tab-badge">{messages?.length || 0}</span>
        </button>
        <button className={`mobile-tab ${mobileTab === 'detail' ? 'active' : ''}`} onClick={() => setMobileTab('detail')}>
          Detail
        </button>
        <button className={`mobile-tab ${mobileTab === 'briefing' ? 'active' : ''}`} onClick={() => setMobileTab('briefing')}>
          Briefing
        </button>
      </div>

      <div className="dashboard" ref={dashboardRef}>
        <div className={mobileTab === 'messages' ? 'mobile-active' : ''} style={{ width: panelWidths[0] || 320, flexShrink: 0, minWidth: 200, height: '100%', overflow: 'hidden' }}>
          <MessageList
            messages={messages || []}
            threads={threads || []}
            selectedId={selectedId}
            onSelect={(id) => { setSelectedId(id); setMobileTab('detail'); }}
            onReclassify={handleReclassify}
          />
        </div>
        <div
          className="panel-resize-handle"
          onMouseDown={(e) => handleMouseDown(e, 0)}
        />
        <div className={mobileTab === 'detail' ? 'mobile-active' : ''} style={{ flex: 1, minWidth: 200, height: '100%', overflow: 'hidden' }}>
          <MessageDetail
            message={selectedMessage}
            thread={selectedMessage ? getThread(selectedMessage.id) : null}
            allMessages={messages || []}
            onApprove={handleApprove}
            onDelegateStatus={handleDelegateStatus}
            onDelegateChange={handleDelegateChange}
            onChangeCategory={handleChangeCategory}
            onChangeUrgency={handleChangeUrgency}
            onSelectMessage={(id) => { setSelectedId(id); setMobileTab('detail'); }}
          />
        </div>
        <div
          className="panel-resize-handle"
          onMouseDown={(e) => handleMouseDown(e, 1)}
        />
        <div className={mobileTab === 'briefing' ? 'mobile-active' : ''} style={{ width: panelWidths[2] || 360, flexShrink: 0, minWidth: 200, height: '100%', overflow: 'hidden' }}>
          <Briefing
            briefing={briefing}
            flags={flags || []}
            rules={rules || []}
            onDeleteRule={handleDeleteRule}
            onSelectMessage={(id) => { setSelectedId(id); setMobileTab('detail'); }}
          />
        </div>
      </div>

      <CommandBar onCommand={handleCommand} isLoading={isCommandLoading} />

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div className="settings-overlay" onClick={() => setShowSettings(false)} />
          <div className="settings-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2>Settings</h2>
              <button className="btn btn-sm" onClick={() => setShowSettings(false)}>✕ Close</button>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Active Rules ({rules?.length || 0})</div>
              {(!rules || rules.length === 0) ? (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', fontStyle: 'italic', lineHeight: 1.6 }}>
                  No rules set. Use the AI chat to create rules, for example:<br />
                  &bull; &ldquo;Ignore all messages from Tom&rdquo;<br />
                  &bull; &ldquo;Flag emails about API migration&rdquo;<br />
                  &bull; &ldquo;Always prioritize Sarah Chen&rdquo;
                </div>
              ) : (
                rules.map(rule => {
                  let condition = {};
                  let action = {};
                  try { condition = JSON.parse(rule.condition); } catch {}
                  try { action = JSON.parse(rule.action); } catch {}

                  const actionLabel = action.set_category || (action.flag ? 'flag' : '');
                  const actionColor = actionLabel === 'decide' ? 'var(--decide)' : actionLabel === 'delegate' ? 'var(--delegate)' : actionLabel === 'ignore' ? 'var(--ignore)' : 'var(--flag-warning)';

                  return (
                    <div key={rule.id} style={{
                      padding: '10px 14px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 8,
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, marginBottom: 4 }}>
                          {rule.naturalText}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ padding: '1px 6px', borderRadius: 100, fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: actionColor, color: 'white' }}>
                            {actionLabel}
                          </span>
                          {condition.field && (
                            <span>When {condition.field} {condition.operator} &ldquo;{condition.value}&rdquo;</span>
                          )}
                        </div>
                      </div>
                      <button className="rule-delete" onClick={() => handleDeleteRule(rule.id)} title="Remove rule">×</button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Connected Sources</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="source-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setIntegrationService('gmail')}>
                  <span className="source-icon" style={{ display: 'flex' }}><ChannelIcon channel="email" size={18} /></span> Connect Gmail
                </button>
                <button className="source-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setIntegrationService('slack')}>
                  <span className="source-icon" style={{ display: 'flex' }}><ChannelIcon channel="slack" size={18} /></span> Connect Slack
                </button>
                <button className="source-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setIntegrationService('whatsapp')}>
                  <span className="source-icon" style={{ display: 'flex' }}><ChannelIcon channel="whatsapp" size={18} /></span> Connect WhatsApp
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Appearance</div>
              <button className="theme-toggle" style={{ width: '100%' }} onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
                {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
              </button>
            </div>
          </div>
        </>
      )}

      {integrationService && (
        <IntegrationModal
          service={integrationService}
          onClose={() => setIntegrationService(null)}
        />
      )}
    </div>
  );
}
