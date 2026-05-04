'use client';

import { useState, useRef, useEffect } from 'react';
import TriageBadge from './TriageBadge';
import ThreadIndicator from './ThreadIndicator';

const CHANNEL_ICONS = { email: '📧', slack: '💬', whatsapp: '📱' };

function friendlyDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function friendlyDeadline(deadlineStr) {
  if (!deadlineStr) return null;
  try {
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return deadlineStr;
    const now = new Date();
    const diffMs = d - now;
    const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let relative = '';
    if (diffHrs < 0) relative = '(overdue)';
    else if (diffHrs < 24) relative = `(in ${diffHrs} hours)`;
    else if (diffDays <= 7) relative = `(in ${diffDays} days)`;

    return d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit',
    }) + (relative ? ' ' + relative : '');
  } catch {
    return deadlineStr;
  }
}

const URGENCY_LABELS = { 1: 'Low', 2: 'Minor', 3: 'Medium', 4: 'High', 5: 'Critical' };

export default function MessageDetail({ message, thread, allMessages, onApprove, onDelegateStatus, onDelegateChange, onSelectMessage, onChangeCategory, onChangeUrgency }) {
  const [draft, setDraft] = useState(message?.triage?.draftedResponse || '');
  const [prevId, setPrevId] = useState(null);
  const [editingDelegate, setEditingDelegate] = useState(false);
  const [delegateInput, setDelegateInput] = useState('');
  const [showDelegateDropdown, setShowDelegateDropdown] = useState(false);
  const delegateRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (delegateRef.current && !delegateRef.current.contains(e.target)) {
        setShowDelegateDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allDelegates = Array.from(new Set(
    (allMessages || [])
      .map(m => m.triage?.delegateTo)
      .filter(Boolean)
  )).sort();

  const filteredDelegates = allDelegates.filter(d =>
    d.toLowerCase().includes(delegateInput.toLowerCase())
  );

  if (message?.id !== prevId) {
    setPrevId(message?.id);
    if (message?.triage?.draftedResponse) {
      setDraft(message.triage.draftedResponse);
    }
    setEditingDelegate(false);
  }

  if (!message) {
    return (
      <div className="panel" style={{ background: 'var(--surface)' }}>
        <div className="detail-empty">Select a message to view details</div>
      </div>
    );
  }

  const senderName = message.sender?.replace(/<.*>/, '').trim() || message.sender;
  const senderEmail = message.sender?.match(/<(.+)>/)?.[1];
  const time = friendlyDate(message.timestamp);
  const triage = message.triage;

  function handleDelegateEdit() {
    setDelegateInput(triage?.delegateTo || '');
    setEditingDelegate(true);
  }

  function handleDelegateSave() {
    if (delegateInput.trim() && onDelegateChange) {
      onDelegateChange(message.id, delegateInput.trim());
    }
    setEditingDelegate(false);
  }

  function handleDelegateKeyDown(e) {
    if (e.key === 'Enter') handleDelegateSave();
    if (e.key === 'Escape') setEditingDelegate(false);
  }

  return (
    <div className="panel fade-in" style={{ background: 'var(--surface)' }}>
      <div className="detail-header">
        <div className="detail-from">
          <span>{CHANNEL_ICONS[message.channel]}</span>
          <span>{senderName}</span>
          <TriageBadge
            category={triage?.category || 'ignore'}
            editable={true}
            onChangeCategory={(cat) => onChangeCategory && onChangeCategory(message.id, cat)}
          />
          {triage?.overriddenBy && <span className="override-badge">{triage.overriddenBy}</span>}
        </div>
        <div className="detail-meta">
          <div className="detail-meta-item">
            <span style={{ color: 'var(--text-tertiary)' }}>via</span>
            <span style={{ textTransform: 'capitalize' }}>{message.channel}</span>
            {message.channelName && <span style={{ color: 'var(--text-tertiary)' }}>in {message.channelName}</span>}
          </div>
          <div className="detail-meta-item">
            <span style={{ fontSize: '0.72rem' }}>{time}</span>
          </div>
          {senderEmail && (
            <div className="detail-meta-item" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {senderEmail}
            </div>
          )}
        </div>
        <div className="urgency-editor">
          <span className="urgency-editor-label">Severity</span>
          <div className="urgency-dots-editable">
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className={`urgency-dot-editable ${i <= (triage?.urgency || 1) ? 'filled' : ''}`}
                onClick={() => onChangeUrgency && onChangeUrgency(message.id, i)}
                title={`Set severity to ${i} (${URGENCY_LABELS[i]})`}
              />
            ))}
          </div>
          <span className="urgency-level-text">
            {triage?.urgency || 1}/5 {URGENCY_LABELS[triage?.urgency || 1]}
          </span>
        </div>
        {thread && (
          <div style={{ marginTop: 10 }}>
            <ThreadIndicator thread={thread} currentMessageId={message.id} allMessages={allMessages || []} onClickMessage={onSelectMessage} />
          </div>
        )}
      </div>

      {message.subject && (
        <div className="detail-section">
          <div className="detail-section-title">Subject</div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{message.subject}</div>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title">Original Message</div>
        <div className="detail-body">{message.body}</div>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">AI Analysis</div>
        <div className="detail-reasoning">{triage?.reasoning}</div>
        {triage?.deadline && (
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--flag-warning)' }}>
            ⏰ {friendlyDeadline(triage.deadline)}
          </div>
        )}
      </div>

      {triage?.category === 'delegate' && (
        <div className="detail-section">
          <div className="detail-section-title">Delegation</div>
          <div className="delegate-info">
            {editingDelegate ? (
              <div ref={delegateRef} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>→ Assign to: </span>
                <div style={{ position: 'relative' }}>
                  <input
                    className="delegate-edit-input"
                    value={delegateInput}
                    onChange={(e) => {
                      setDelegateInput(e.target.value);
                      setShowDelegateDropdown(true);
                    }}
                    onFocus={() => setShowDelegateDropdown(true)}
                    onKeyDown={handleDelegateKeyDown}
                    autoFocus
                    placeholder="Team or person..."
                  />
                  {showDelegateDropdown && filteredDelegates.length > 0 && (
                    <div className="delegate-dropdown">
                      {filteredDelegates.map(d => (
                        <div
                          key={d}
                          className="delegate-dropdown-item"
                          onClick={() => {
                            setDelegateInput(d);
                            setShowDelegateDropdown(false);
                          }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button className="delegate-edit-btn" onClick={handleDelegateSave}>Save</button>
                <button className="delegate-edit-btn" onClick={() => setEditingDelegate(false)}>Cancel</button>
              </div>
            ) : (
              <>
                <span>→ Assigned to <strong>{triage.delegateTo || 'Unassigned'}</strong></span>
                <button className="delegate-edit-btn" onClick={handleDelegateEdit}>Change</button>
                <span
                  className={`delegate-status ${triage.delegateStatus || 'pending'}`}
                  onClick={() => onDelegateStatus && onDelegateStatus(
                    message.id,
                    triage.delegateStatus === 'done' ? 'pending' : 'done'
                  )}
                >
                  {triage.delegateStatus === 'done' ? '✓ Done' : '○ Pending'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="detail-section">
        <div className="detail-section-title">Drafted Response</div>
        <textarea
          className="detail-draft-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          readOnly={triage?.approved}
          style={triage?.approved ? { opacity: 0.7 } : {}}
        />
        <div className="detail-actions">
          <button
            className={`btn btn-approve ${triage?.approved ? 'approved' : ''}`}
            onClick={() => onApprove && onApprove(message.id, !triage?.approved)}
          >
            {triage?.approved ? '✓ Approved' : 'Approve Draft'}
          </button>
          <button className="btn" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Coming soon">
            Send Response
          </button>
        </div>
        {triage?.approved && (
          <div className="approved-banner">
            ✓ This response has been reviewed and approved. Ready to send when integrations are connected. Click "Approved" to revoke.
          </div>
        )}
      </div>
    </div>
  );
}
