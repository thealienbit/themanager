import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { StatusDot, statusLabels } from '../components/StatusDot';
import { PriorityBadge } from '../components/PriorityBadge';
import { Tag } from '../components/Tag';

const API_URL = 'http://localhost:3001/api';
const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function FilterBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-[3px] text-[11px] rounded whitespace-nowrap transition-colors ${
        active
          ? 'bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]'
          : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] border border-transparent'
      }`}
    >
      {children}
    </button>
  );
}

function ItemList({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const navigate = useNavigate();

  const typeLabel = type === 'feats' ? 'Features' : 'Bugs';
  const typeSingular = type === 'feats' ? 'Feature' : 'Bug';

  useEffect(() => {
    const s = searchParams.get('status');
    if (s) setStatusFilter(s);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API_URL}/items/${type}`).then(res => {
      setItems(res.data);
    }).catch(err => {
      console.error('Failed to fetch items:', err);
    }).finally(() => setLoading(false));
  }, [type]);

  let filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item._status !== statusFilter) return false;
    if (priorityFilter !== 'all' && (item.priority || 'medium') !== priorityFilter) return false;
    return true;
  });

  if (sortBy === 'priority') {
    filteredItems = [...filteredItems].sort((a, b) =>
      (priorityOrder[a.priority || 'medium'] ?? 2) - (priorityOrder[b.priority || 'medium'] ?? 2)
    );
  }

  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => {
        const next = Math.min(i + 1, filteredItems.length - 1);
        setSelectedId(filteredItems[next]?.id);
        return next;
      });
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => {
        const next = Math.max(i - 1, 0);
        setSelectedId(filteredItems[next]?.id);
        return next;
      });
    } else if (e.key === 'Enter' && selectedId) {
      navigate(`/${type}/${selectedId}`);
    } else if (e.key === 'c') {
      navigate(`/${type}/new`);
    }
  }, [filteredItems, selectedId, type, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[13px] font-semibold text-[var(--text-h)]">{typeLabel}</h1>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{filteredItems.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to={`/${type}/board`} className="px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--bg-elevated)] rounded transition-colors shrink-0">
              Board
            </Link>
            <Link to={`/${type}/new`} className="px-2.5 py-1 text-[11px] bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity font-medium whitespace-nowrap shrink-0">
              + {typeSingular}
            </Link>
          </div>
        </div>

        {/* Filters — single row */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {/* Status */}
          {['all', 'new', 'inprogress', 'finished'].map(s => (
            <FilterBtn key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
              {s === 'all' ? 'All' : statusLabels[s]}
            </FilterBtn>
          ))}
          <div className="w-px h-3.5 bg-[var(--border)] mx-1 shrink-0" />
          {/* Priority */}
          {['all', 'critical', 'high', 'medium', 'low'].map(p => (
            <FilterBtn key={p} active={priorityFilter === p} onClick={() => setPriorityFilter(p)}>
              {p === 'all' ? 'Any priority' : p[0].toUpperCase() + p.slice(1)}
            </FilterBtn>
          ))}
          <div className="w-px h-3.5 bg-[var(--border)] mx-1 shrink-0" />
          <FilterBtn active={sortBy === 'priority'} onClick={() => setSortBy(s => s === 'created' ? 'priority' : 'created')}>
            {sortBy === 'created' ? '↕ Date' : '↕ Priority'}
          </FilterBtn>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--text-muted)] text-sm">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[var(--text-muted)]">
            <p className="text-sm">No {typeLabel.toLowerCase()} found</p>
            <Link to={`/${type}/new`} className="text-[var(--accent)] text-sm mt-1 hover:underline">Create one →</Link>
          </div>
        ) : (
          filteredItems.map((item, i) => (
            <Link
              key={item.id}
              to={`/${type}/${item.id}`}
              className={`flex items-center gap-2.5 px-4 py-[7px] border-b border-[var(--border-subtle)] transition-colors min-w-0 ${
                selectedId === item.id ? 'bg-[var(--accent-bg)]' : 'hover:bg-[var(--bg-surface)]'
              }`}
              onMouseEnter={() => { setSelectedIndex(i); setSelectedId(item.id); }}
            >
              <StatusDot status={item._status} />
              <span className="text-[13px] text-[var(--text-h)] font-medium truncate flex-1 min-w-0">{item.title}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                {(item.labels || []).slice(0, 2).map(l => <Tag key={l} label={l} />)}
                <PriorityBadge priority={item.priority || 'medium'} />
                <span className="text-[10px] text-[var(--text-muted)] font-mono w-12 text-right">{item.id.split('-')[1]?.slice(0, 6)}</span>
                <span className="text-[10px] text-[var(--text-muted)] w-6 text-right">{timeAgo(item.updated)}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Footer shortcuts */}
      <div className="shrink-0 px-4 py-1 border-t border-[var(--border)] bg-[var(--bg)] flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
        <span><kbd className="px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[9px]">J</kbd><kbd className="px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[9px] ml-0.5">K</kbd> nav</span>
        <span><kbd className="px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[9px]">↵</kbd> open</span>
        <span><kbd className="px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[9px]">C</kbd> new</span>
      </div>
    </div>
  );
}

export default ItemList;
