'use client';

import { useState, useRef, useEffect } from 'react';

export default function TriageBadge({ category, editable, onChangeCategory }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const categories = ['decide', 'delegate', 'ignore'];

  if (!editable) {
    return <span className={`triage-badge ${category}`}>{category}</span>;
  }

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span
        className={`triage-badge ${category}`}
        style={{ cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
        title="Click to change category"
      >
        {category} <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>{showDropdown ? '▲' : '▼'}</span>
      </span>
      {showDropdown && (
        <div className="triage-dropdown">
          {categories.map(cat => (
            <div
              key={cat}
              className={`triage-dropdown-item ${cat === category ? 'current' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (cat !== category && onChangeCategory) onChangeCategory(cat);
                setShowDropdown(false);
              }}
            >
              <span className={`triage-badge ${cat}`} style={{ fontSize: '0.6rem' }}>{cat}</span>
              {cat === category && <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>current</span>}
            </div>
          ))}
        </div>
      )}
    </span>
  );
}
