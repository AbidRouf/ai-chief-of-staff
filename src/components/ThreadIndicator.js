'use client';

export default function ThreadIndicator({ thread, onClickMessage }) {
  if (!thread) return null;

  return (
    <div
      className="thread-indicator"
      onClick={() => onClickMessage && onClickMessage(thread.messageIds[0])}
      title={`Thread: ${thread.name} (${thread.messageIds.length} messages)`}
    >
      <span>🔗</span>
      <span>{thread.name}</span>
      <span style={{ opacity: 0.7 }}>({thread.messageIds.length})</span>
    </div>
  );
}
