'use client';

export default function TriageBadge({ category }) {
  return (
    <span className={`triage-badge ${category}`}>
      {category}
    </span>
  );
}
