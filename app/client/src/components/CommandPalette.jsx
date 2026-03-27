import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const staticCommands = [
  { id: 'new-feat', label: 'Create new feature', shortcut: 'C', action: '/feats/new', section: 'Create' },
  { id: 'new-bug', label: 'Create new bug', shortcut: 'C', action: '/bugs/new', section: 'Create' },
  { id: 'dashboard', label: 'Go to Dashboard', action: '/dashboard', section: 'Navigate' },
  { id: 'feats', label: 'Go to Features', action: '/feats', section: 'Navigate' },
  { id: 'bugs', label: 'Go to Bugs', action: '/bugs', section: 'Navigate' },
  { id: 'feats-board', label: 'Features Board', action: '/feats/board', section: 'Navigate' },
  { id: 'bugs-board', label: 'Bugs Board', action: '/bugs/board', section: 'Navigate' },
];

export function CommandPalette({ isOpen, onClose, items = [] }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const itemCommands = items.map(item => ({
    id: item.id,
    label: item.title,
    sublabel: `${item.id} · ${item._status}`,
    action: `/${item._type || (item.id.startsWith('feat') ? 'feats' : 'bugs')}/${item.id}`,
    section: 'Items',
  }));

  const allCommands = [...staticCommands, ...itemCommands];

  const filtered = query
    ? allCommands.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.sublabel && c.sublabel.toLowerCase().includes(query.toLowerCase()))
      )
    : allCommands;

  const execute = useCallback((cmd) => {
    if (cmd?.action) {
      navigate(cmd.action);
    }
    onClose();
    setQuery('');
    setSelectedIndex(0);
  }, [navigate, onClose]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      execute(filtered[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
      setQuery('');
    }
  };

  if (!isOpen) return null;

  let lastSection = '';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div
        className="relative w-[520px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-3 border-b border-[var(--border)]">
          <svg className="w-4 h-4 text-[var(--text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 px-3 py-2.5 bg-transparent text-[var(--text-h)] text-sm outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="text-[10px] text-[var(--text-muted)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">ESC</kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-[var(--text-muted)]">No results found</div>
          ) : (
            filtered.map((cmd, i) => {
              const showSection = cmd.section !== lastSection;
              lastSection = cmd.section;
              return (
                <div key={cmd.id}>
                  {showSection && (
                    <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                      {cmd.section}
                    </div>
                  )}
                  <button
                    className={`w-full px-3 py-1.5 flex items-center gap-2 text-left text-sm transition-colors ${
                      i === selectedIndex ? 'bg-[var(--accent-bg)] text-[var(--text-h)]' : 'text-[var(--text)] hover:bg-[var(--bg-elevated)]'
                    }`}
                    onClick={() => execute(cmd)}
                    onMouseEnter={() => setSelectedIndex(i)}
                  >
                    <span className="flex-1 truncate">{cmd.label}</span>
                    {cmd.sublabel && (
                      <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[180px]">{cmd.sublabel}</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
