'use client';

import { useState, useRef } from 'react';
import IntegrationModal from './IntegrationModal';

export default function UploadZone({ onLoadSample, onUpload }) {
  const [dragover, setDragover] = useState(false);
  const [integrationService, setIntegrationService] = useState(null);
  const fileRef = useRef(null);

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      readFile(file);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) readFile(file);
  }

  function readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        onUpload(data);
      } catch {
        alert('Invalid JSON file. Please upload a valid messages.json file.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="upload-container fade-in">
      <div className="upload-card">
        <h1 className="upload-title">Good morning</h1>
        <p className="upload-subtitle">
          Upload your communications and let AI triage your inbox,
          flag what matters, and brief you in under two minutes.
        </p>

        <div
          className={`upload-dropzone ${dragover ? 'dragover' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="upload-dropzone-text">
            Drop your messages.json here
          </div>
          <div className="upload-dropzone-hint">
            or click to browse
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <button className="btn btn-primary" onClick={onLoadSample} style={{ width: '100%', padding: '12px' }}>
          Load Sample Data (20 messages)
        </button>

        <div className="upload-divider">
          <span>or connect a source</span>
        </div>

        <div className="upload-sources">
          <button className="source-btn" onClick={() => setIntegrationService('gmail')}>
            <span className="source-icon">📧</span> Gmail
          </button>
          <button className="source-btn" onClick={() => setIntegrationService('slack')}>
            <span className="source-icon">💬</span> Slack
          </button>
          <button className="source-btn" onClick={() => setIntegrationService('whatsapp')}>
            <span className="source-icon">📱</span> WhatsApp
          </button>
        </div>
      </div>

      {integrationService && (
        <IntegrationModal
          service={integrationService}
          onClose={() => setIntegrationService(null)}
        />
      )}
    </div>
  );
}
