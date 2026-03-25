import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MDEditor from '@uiw/react-md-editor';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function ItemEditor({ type }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [item, setItem] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('active');
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
          setItem(res.data);
          setTitle(res.data.title || '');
          setStatus(res.data.status || 'active');
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

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNew) {
        const res = await axios.post(`${API_URL}/items/${type}`, {
          title,
          status,
          body,
        });
        navigate(`/${type}/${res.data.id}`);
      } else {
        await axios.put(`${API_URL}/items/${type}/${id}`, {
          title,
          status,
          body,
        });
        navigate(`/${type}/${id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to={isNew ? `/${type}` : `/${type}/${id}`} className="text-sm text-[var(--text)] hover:text-[var(--accent)]">
            ← Cancel
          </Link>
          <h2 className="text-2xl mt-2 mb-1">
            {isNew ? `New ${typeLabel}` : `Edit ${typeLabel}`}
          </h2>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={`Enter ${typeLabel.toLowerCase()} title`}
            className="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Content
          </label>
          <div data-color-mode="auto">
            <MDEditor
              value={body}
              onChange={setBody}
              height={400}
              preview="edit"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemEditor;
