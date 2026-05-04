'use client';

import { useState } from 'react';
import ChannelIcon from './ChannelIcon';

export default function IntegrationModal({ service, onClose }) {
  const configs = {
    gmail: {
      icon: '📧',
      title: 'Connect Gmail',
      description: 'Automatically import emails from your Gmail inbox every morning. The system will process unread messages and apply your triage rules.',
      steps: [
        'Authenticate with your Google account',
        'Select which labels to monitor (Inbox, Important, etc.)',
        'Set your processing schedule (e.g., every morning at 7:00 AM)',
        'AI Chief of Staff will automatically triage new emails',
      ],
      api: 'Gmail API with OAuth 2.0',
    },
    slack: {
      icon: '💬',
      title: 'Connect Slack',
      description: 'Monitor Slack channels and direct messages. The system will surface messages that need your attention from selected channels.',
      steps: [
        'Install the Chief of Staff Slack app to your workspace',
        'Select channels to monitor (#general, #engineering, #sales, etc.)',
        'Configure which DMs to include',
        'Messages will be triaged alongside your other communications',
      ],
      api: 'Slack Web API with Bot Token',
    },
    whatsapp: {
      icon: '📱',
      title: 'Connect WhatsApp',
      description: 'Import WhatsApp messages from key contacts. Uses WhatsApp Business API to process messages from your business number.',
      steps: [
        'Connect your WhatsApp Business account',
        'Select contacts to monitor (COO, investors, board members)',
        'Messages are imported securely via end-to-end encrypted channel',
        'Personal messages are automatically filtered unless explicitly included',
      ],
      api: 'WhatsApp Business Cloud API via Meta',
    },
  };

  const config = configs[service];
  if (!config) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: 16, display: 'flex' }}>
          <ChannelIcon channel={service === 'gmail' ? 'email' : service} size={48} />
        </div>
        <h2 className="modal-title">{config.title}</h2>
        <p className="modal-desc">{config.description}</p>

        <div className="modal-steps">
          {config.steps.map((step, i) => (
            <div key={i} className="modal-step">
              <div className="modal-step-num">{i + 1}</div>
              <div>{step}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 16, fontFamily: 'var(--font-mono)' }}>
          Integration via {config.api}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Close</button>
          <button className="btn btn-primary" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            Coming Soon
          </button>
        </div>
      </div>
    </div>
  );
}
