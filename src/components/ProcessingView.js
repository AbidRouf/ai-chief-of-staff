'use client';

export default function ProcessingView({ currentStep }) {
  const steps = [
    { key: 'reading', label: 'Reading messages', icon: '📨' },
    { key: 'analyzing', label: 'Analyzing context and cross-references', icon: '🔍' },
    { key: 'threads', label: 'Detecting conversation threads', icon: '🔗' },
    { key: 'triaging', label: 'Triaging messages', icon: '📊' },
    { key: 'flags', label: 'Identifying flags and risks', icon: '🚩' },
    { key: 'briefing', label: 'Generating daily briefing', icon: '📋' },
  ];

  const currentIdx = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="processing-container fade-in">
      <div className="processing-card">
        <h1 className="processing-title">Processing your morning</h1>
        <div className="processing-steps">
          {steps.map((step, i) => {
            const isActive = i === currentIdx;
            const isDone = i < currentIdx;
            return (
              <div
                key={step.key}
                className={`processing-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              >
                <div className="processing-step-icon">
                  {isDone ? '✓' : isActive ? <span className="spinner" /> : '○'}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
