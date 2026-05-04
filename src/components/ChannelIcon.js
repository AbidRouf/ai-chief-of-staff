export default function ChannelIcon({ channel, size = 16 }) {
  let src = '';
  
  if (channel === 'email') {
    src = 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg';
  } else if (channel === 'slack') {
    src = 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg';
  } else if (channel === 'whatsapp') {
    src = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
  }

  if (src) {
    return (
      <img 
        src={src} 
        alt={`${channel} logo`} 
        style={{ width: size, height: size, objectFit: 'contain' }} 
        className={`channel-icon ${channel}`}
      />
    );
  }

  // fallback
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="channel-icon" style={{ minWidth: size, color: 'var(--text-tertiary)' }}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );
}
