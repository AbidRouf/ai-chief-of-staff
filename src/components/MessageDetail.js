'use client';

import { useState } from 'react';
import TriageBadge from './TriageBadge';
import ThreadIndicator from './ThreadIndicator';

const CHANNEL_ICONS = { email: '📧', slack: '💬', whatsapp: '📱' };

export default function MessageDetail({ message, thread, onApprove, onDelegateStatus, onSelectMessage }) {
  const [draft, setDraft] = useState(message?.triage?.draftedResponse || '');
  const [prevId, setPrevId] = useState(null);

  if (message?.id !== prevId) {
    setPrevId(message?.id);
    if (message?.triage?.draftedResponse) {
      setDraft(message.triage.draftedResponse);
    }
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
  const time = new Date(message.timestamp).toLocaleString('en-GB', {
    weekday: 'short', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short',
  });
  const triage = message.triage;

  return (
    <div className="panel fade-in" style={{ background: 'var(--surface)' }}>
      <div className="detail-header">
        <div className="detail-from">
          <span>{CHANNEL_ICONS[message.channel]}</span>
          <span>{senderName}</span>
          <TriageBadge category={triage?.category || 'ignore'} />
          {triage?.overriddenBy && <span className="override-badge">{triage.overriddenBy}</span>}
        </div>
        <div className="detail-meta">
          <div className="detail-meta-item">
            <span style={{ color: 'var(--text-tertiary)' }}>via</span>
            <span style={{ textTransform: 'capitalize' }}>{message.channel}</span>
            {message.channelName && <span style={{ color: 'var(--text-tertiary)' }}>in {message.channelName}</span>}
          </div>
          <div className="detail-meta-item">
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{time}</span>
          </div>
          {senderEmail && (
            <div className="detail-meta-item" style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
              {senderEmail}
            </div>
          )}
        </div>
        {thread && (
          <div style={{ marginTop: 10 }}>
            <ThreadIndicator thread={thread} onClickMessage={onSelectMessage} />
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
          <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--flag-warning)', fontFamily: 'var(--font-mono)' }}>
            Deadline: {triage.deadline}
          </div>
        )}
      </div>

      {triage?.category === 'delegate' && triage?.delegateTo && (
        <div className="detail-section">
          <div className="detail-section-title">Delegation</div>
          <div className="delegate-info">
            <span>→ Assigned to <strong>{triage.delegateTo}</strong></span>
            <span
              className={`delegate-status ${triage.delegateStatus || 'pending'}`}
              onClick={() => onDelegateStatus && onDelegateStatus(
                message.id,
                triage.delegateStatus === 'done' ? 'pending' : 'done'
              )}
            >
              {triage.delegateStatus === 'done' ? '✓ Done' : '○ Pending'}
            </span>
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
      </div>
    </div>
  );
}
