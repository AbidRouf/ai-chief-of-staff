'use client';

import { useState, useCallback } from 'react';
import UploadZone from '@/components/UploadZone';
import ProcessingView from '@/components/ProcessingView';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [state, setState] = useState('upload'); // upload | processing | dashboard
  const [processingStep, setProcessingStep] = useState('reading');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  const processMessages = useCallback(async (messages) => {
    setState('processing');
    setError(null);

    const steps = ['reading', 'analyzing', 'threads', 'triaging', 'flags', 'briefing'];
    let stepIndex = 0;

    const stepInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setProcessingStep(steps[stepIndex]);
      }
    }, 3000);

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      clearInterval(stepInterval);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.details || errData.error || 'Processing failed');
      }

      const data = await res.json();
      setDashboardData(data);
      setState('dashboard');
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message);
      setState('upload');
    }
  }, []);

  async function handleLoadSample() {
    try {
      const res = await fetch('/data/messages.json');
      const messages = await res.json();
      processMessages(messages);
    } catch {
      setError('Failed to load sample data');
    }
  }

  function handleUpload(messages) {
    if (Array.isArray(messages) && messages.length > 0) {
      processMessages(messages);
    } else {
      setError('Invalid file format. Expected a JSON array of messages.');
    }
  }

  function handleUpdateData(newData) {
    setDashboardData(newData);
  }

  if (state === 'processing') {
    return <ProcessingView currentStep={processingStep} />;
  }

  if (state === 'dashboard' && dashboardData) {
    return <Dashboard data={dashboardData} onUpdateData={handleUpdateData} />;
  }

  return (
    <>
      {error && (
        <div style={{
          padding: '12px 28px',
          background: 'var(--decide-bg)',
          borderBottom: '1px solid var(--decide-border)',
          color: 'var(--decide)',
          fontSize: '0.82rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span>Error: {error}</span>
          <button
            className="btn btn-sm"
            onClick={() => setError(null)}
            style={{ color: 'var(--decide)' }}
          >
            Dismiss
          </button>
        </div>
      )}
      <UploadZone onLoadSample={handleLoadSample} onUpload={handleUpload} />
    </>
  );
}
