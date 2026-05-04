'use client';

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

    const isMidnight = d.getHours() === 0 && d.getMinutes() === 0;

    return d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
      ...(isMidnight ? {} : { hour: '2-digit', minute: '2-digit' })
    }) + (relative ? ' ' + relative : '');
  } catch {
    return deadlineStr;
  }
}

export default function Briefing({ briefing, flags, rules, onDeleteRule, onSelectMessage }) {
  if (!briefing) {
    return (
      <div className="panel" style={{ background: 'var(--surface)' }}>
        <div className="detail-empty">Briefing will appear after processing</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ background: 'var(--surface)' }}>
      <div className="panel-header">
        <h2>Daily Briefing</h2>
        <div style={{ marginTop: 6 }}>
          <button className="btn btn-sm" onClick={() => window.print()}>
            Print Briefing
          </button>
        </div>
      </div>
      <div className="panel-content" style={{ padding: '0 20px 20px' }}>

        <div className="briefing-section" style={{ marginTop: 16 }}>
          <div className="detail-section-title">Executive Summary</div>
          <p className="briefing-summary">{briefing.executiveSummary}</p>
        </div>

        {flags && flags.length > 0 && (
          <div className="briefing-section">
            <div className="detail-section-title">Flags ({flags.length})</div>
            {flags.map((flag, i) => (
              <div
                key={i}
                className={`flag-item ${flag.severity}`}
                onClick={() => flag.relatedMessages?.[0] && onSelectMessage(flag.relatedMessages[0])}
              >
                <div className="flag-title">
                  <span className={`flag-severity ${flag.severity}`}>{flag.severity}</span>
                  {flag.title}
                </div>
                <div className="flag-desc">{flag.description}</div>
              </div>
            ))}
          </div>
        )}

        {briefing.decisionsNeeded && briefing.decisionsNeeded.length > 0 && (
          <div className="briefing-section">
            <div className="detail-section-title">Decisions Needed ({briefing.decisionsNeeded.length})</div>
            {briefing.decisionsNeeded.map((decision, i) => (
              <div
                key={i}
                className="briefing-decision-item"
                onClick={() => decision.messageIds?.[0] && onSelectMessage(decision.messageIds[0])}
              >
                <div className="briefing-decision-title">{decision.title}</div>
                <div className="briefing-decision-desc">{decision.description}</div>
                {decision.deadline && (
                  <div className="briefing-decision-deadline">⏰ {friendlyDeadline(decision.deadline)}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {briefing.timeline && briefing.timeline.length > 0 && (
          <div className="briefing-section">
            <div className="detail-section-title">Timeline</div>
            {briefing.timeline.map((item, i) => (
              <div
                key={i}
                className="briefing-timeline-item"
                onClick={() => item.messageIds?.[0] && onSelectMessage(item.messageIds[0])}
              >
                <span className="briefing-timeline-time">{item.timeframe}</span>
                {item.item}
              </div>
            ))}
          </div>
        )}

        {briefing.delegatedItems && briefing.delegatedItems.length > 0 && (
          <div className="briefing-section">
            <div className="detail-section-title">Delegated Items ({briefing.delegatedItems.length})</div>
            {briefing.delegatedItems.map((item, i) => (
              <div
                key={i}
                className="briefing-delegate-item"
                onClick={() => item.messageIds?.[0] && onSelectMessage(item.messageIds[0])}
              >
                <span className="briefing-delegate-who">→ {item.assignedTo}</span>
                <span style={{ margin: '0 6px', color: 'var(--text-tertiary)' }}>·</span>
                {item.task}
              </div>
            ))}
          </div>
        )}

        {rules && rules.length > 0 && (
          <div className="rules-section" style={{ padding: 0, borderTop: 'none', marginTop: 8 }}>
            <div className="detail-section-title">Active Rules ({rules.length})</div>
            {rules.map((rule) => (
              <div key={rule.id} className="rule-item">
                <span className="rule-text">{rule.naturalText}</span>
                <button
                  className="rule-delete"
                  onClick={() => onDeleteRule(rule.id)}
                  title="Remove rule"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
