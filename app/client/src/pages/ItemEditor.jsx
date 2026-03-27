import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import axios from 'axios';
import { Tag } from '../components/Tag';

const API_URL = 'http://localhost:3001/api';

function ItemEditor({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [labels, setLabels] = useState([]);
  const [labelInput, setLabelInput] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const typeLabel = type === 'feats' ? 'Feature' : 'Bug';

  useEffect(() => {
    if (!isNew) {
      const fetchItem = async () => {
        try {
          const res = await axios.get(`${API_URL}/items/${type}/${id}`);
          setTitle(res.data.title || '');
          setPriority(res.data.priority || 'medium');
          setLabels(res.data.labels || []);
          setBody(res.data.body || '');
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to load item');
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [type, id, isNew]);

  const handleAddLabel = () => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
    }
    setLabelInput('');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        const res = await axios.post(`${API_URL}/items/${type}`, { title, priority, labels, body });
        navigate(`/${type}/${res.data.id}`);
      } else {
        await axios.put(`${API_URL}/items/${type}/${id}`, { title, priority, labels, body });
        navigate(`/${type}/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to={isNew ? `/${type}` : `/${type}/${id}`} className="text-[12px] text-[var(--text-muted)] hover:text-[var(--text-h)] transition-colors">
            ← Cancel
          </Link>
          <span className="text-[var(--border)]">/</span>
          <span className="text-[12px] text-[var(--text-muted)]">{isNew ? `New ${typeLabel}` : `Edit ${typeLabel}`}</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1 text-[12px] bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl px-6 py-4 space-y-4">
          {error && <p className="text-red-400 text-[12px]">{error}</p>}

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={`${typeLabel} title...`}
            className="w-full text-[20px] font-semibold text-[var(--text-h)] bg-transparent border-none outline-none placeholder:text-[var(--text-muted)]"
            autoFocus
          />

          {/* Meta row */}
          <div className="flex items-center gap-4 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Priority</span>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="text-[12px] bg-[var(--bg-surface)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-h)] outline-none focus:border-[var(--accent-border)]"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Labels</span>
              <div className="flex items-center gap-1 flex-wrap">
                {labels.map(l => (
                  <Tag key={l} label={l} onRemove={() => setLabels(labels.filter(x => x !== l))} />
                ))}
                <input
                  type="text"
                  value={labelInput}
                  onChange={e => setLabelInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLabel(); } }}
                  placeholder="+ add"
                  className="text-[12px] bg-transparent border-none outline-none w-16 text-[var(--text)] placeholder:text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>

          {/* Markdown editor */}
          <div data-color-mode="dark">
            <MDEditor
              value={body}
              onChange={setBody}
              height={450}
              preview="edit"
              visibleDragbar={false}
              overflow={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemEditor;
