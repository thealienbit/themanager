import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import { StatusDot, statusLabels } from '../components/StatusDot';
import { PriorityBadge } from '../components/PriorityBadge';
import { Tag } from '../components/Tag';

const API_URL = 'http://localhost:3001/api';

const timelineDotColors = {
  created: 'bg-green-400',
  status_changed: 'bg-blue-400',
  title_changed: 'bg-yellow-400',
  priority_changed: 'bg-orange-400',
  labels_changed: 'bg-purple-400',
};

function formatTimestamp(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ItemDetail({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [moving, setMoving] = useState(false);

  const typeLabel = type === 'feats' ? 'Feature' : 'Bug';

  const fetchItem = async () => {
    try {
      const res = await axios.get(`${API_URL}/items/${type}/${id}`);
      setItem(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchItem();
  }, [type, id]);

  const handleMove = async (targetStatus) => {
    setMoving(true);
    try {
      await axios.patch(`${API_URL}/items/${type}/${id}/move`, { status: targetStatus });
      await fetchItem();
    } catch (err) {
      alert('Failed to move item');
    } finally {
      setMoving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete this ${typeLabel.toLowerCase()}?`)) return;
    try {
      await axios.delete(`${API_URL}/items/${type}/${id}`);
      navigate(`/${type}`);
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-red-400 text-sm">{error || 'Not found'}</p>
        <Link to={`/${type}`} className="text-[var(--accent)] text-sm mt-2 hover:underline">Back to {typeLabel}s</Link>
      </div>
    );
  }

  const timeline = (item.timeline || []).slice().reverse();
  const filePath = `${type}/${item._status}/${item.id}.md`;
  const moveTargets = {
    new: ['inprogress', 'finished'],
    inprogress: ['new', 'finished'],
    finished: ['new', 'inprogress'],
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-5 py-2 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px]">
          <Link to={`/${type}`} className="text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors">
            {typeLabel}s
          </Link>
          <span className="text-[var(--text-muted)] opacity-30">/</span>
          <span className="text-[var(--text-muted)] font-mono">{item.id}</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to={`/${type}/${id}/edit`} className="px-2.5 py-1 text-[12px] text-[var(--text)] hover:text-[var(--text-h)] hover:bg-[var(--bg-elevated)] rounded transition-colors">
            Edit
          </Link>
          <button onClick={handleDelete} className="px-2.5 py-1 text-[12px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors">
            Delete
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex gap-6 px-6 py-5 max-w-5xl">

          {/* Left: main content */}
          <div className="flex-1 min-w-0">
            {/* Title + inline status */}
            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1.5"><StatusDot status={item._status} size="md" /></div>
              <div className="min-w-0">
                <h1 className="text-[20px] font-semibold text-[var(--text-h)] leading-tight">{item.title}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <PriorityBadge priority={item.priority || 'medium'} showLabel />
                  {(item.labels || []).map(l => <Tag key={l} label={l} />)}
                </div>
              </div>
            </div>

            {/* Move actions */}
            <div className="flex items-center gap-1.5 mb-5">
              {(moveTargets[item._status] || []).map(s => (
                <button
                  key={s}
                  onClick={() => handleMove(s)}
                  disabled={moving}
                  className="inline-flex items-center gap-1.5 px-2.5 py-[5px] text-[12px] text-[var(--text)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-md hover:border-[var(--accent-border)] hover:text-[var(--text-h)] transition-all disabled:opacity-50"
                >
                  <StatusDot status={s} />
                  {statusLabels[s]}
                </button>
              ))}
            </div>

            {/* Markdown body */}
            <div className="prose max-w-none">
              <ReactMarkdown>{item.body || '_No content yet._'}</ReactMarkdown>
            </div>

            {/* Activity Timeline */}
            {timeline.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[var(--border)]">
                <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-3">Activity</p>
                <div>
                  {timeline.map((entry, i) => (
                    <div key={i} className="flex gap-3 pb-3 group">
                      <div className="flex flex-col items-center pt-[5px]">
                        <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${timelineDotColors[entry.action] || 'bg-gray-500'}`} />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1" />}
                      </div>
                      <div className="min-w-0 pb-1">
                        <p className="text-[12px] text-[var(--text)] leading-snug">{entry.details}</p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatTimestamp(entry.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar: metadata + suggestions */}
          <div className="w-[220px] shrink-0">
            {/* Metadata card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md overflow-hidden mb-4">
              <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Details</p>
              </div>
              <div className="divide-y divide-[var(--border-subtle)]">
                {[
                  { label: 'Status', value: <StatusDot status={item._status} showLabel /> },
                  { label: 'Priority', value: <PriorityBadge priority={item.priority || 'medium'} showLabel /> },
                  ...(item.labels?.length ? [{ label: 'Labels', value: <div className="flex gap-1 flex-wrap">{item.labels.map(l => <Tag key={l} label={l} />)}</div> }] : []),
                  { label: 'Created', value: <span className="text-[11px] text-[var(--text)]">{item.created}</span> },
                  ...(item.updated && item.updated !== item.created ? [{ label: 'Updated', value: <span className="text-[11px] text-[var(--text)]">{item.updated}</span> }] : []),
                  { label: 'File', value: <code className="text-[10px] text-[var(--text-muted)] bg-transparent p-0 font-mono break-all">{filePath}</code> },
                ].map((row, i) => (
                  <div key={i} className="px-3 py-2 flex items-start gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider w-[52px] shrink-0 pt-0.5">{row.label}</span>
                    <div className="min-w-0">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agent Suggestions */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-medium">Suggestions</p>
              </div>
              <div className="py-1">
                {[
                  'Add test cases',
                  'Define acceptance criteria',
                  'Link related items',
                  'Estimate complexity',
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-[6px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer group">
                    <span className="w-[5px] h-[5px] rounded-full bg-[var(--accent)] shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-h)] transition-colors">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
