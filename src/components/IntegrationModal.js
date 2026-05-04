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
      techSteps: [
        'Register project in Google Cloud Console & enable Gmail API',
        'Configure OAuth consent screen with gmail.readonly scope',
        'Implement OAuth flow (e.g., NextAuth.js) to get access/refresh tokens',
        'Set up Google Cloud Pub/Sub push notifications for inbox changes',
        'Webhook receives push, fetches new message via users.messages.get',
        'Parse MIME parts and pipe to AI triage pipeline',
      ],
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
      techSteps: [
        'Create Slack App in api.slack.com & enable Socket Mode / Events API',
        'Request scopes: channels:history, groups:history, im:history',
        'Install App to Workspace to generate xoxb- bot token',
        'Subscribe to message.channels and message.im events',
        'Create endpoint to handle POST from Slack, verifying request signature',
        'Queue incoming payload and pass to AI triage pipeline',
      ],
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
      techSteps: [
        'Register Meta Developer App and select WhatsApp product',
        'Verify business to access production Cloud API',
        'Configure Webhook endpoint with verify_token',
        'Subscribe to "messages" webhook field',
        'Parse incoming POST request from Meta (entry[0].changes[0].value.messages)',
        'Reply with 200 OK immediately, then process asynchronously with AI',
      ],
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

        {config.techSteps && (
          <details className="tech-details" style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '0.75rem', background: 'var(--canvas)' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Developer Implementation Plan
            </summary>
            <ol style={{ marginTop: 12, paddingLeft: 20, color: 'var(--text-tertiary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {config.techSteps.map((step, idx) => (
                <li key={idx} style={{ lineHeight: 1.4 }}>{step}</li>
              ))}
            </ol>
          </details>
        )}

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
