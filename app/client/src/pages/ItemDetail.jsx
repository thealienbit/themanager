import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

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
    fetchItem();
  }, [type, id]);

  const handleMove = async (targetStatus) => {
    if (!confirm(`Move this ${typeLabel.toLowerCase()} to ${targetStatus}?`)) {
      return;
    }
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
    if (!confirm(`Are you sure you want to delete this ${typeLabel.toLowerCase()}?`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/items/${type}/${id}`);
      navigate(`/${type}`);
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link to={`/${type}`} className="text-[var(--accent)] mt-4 inline-block">
          Back to {typeLabel}s
        </Link>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const statusLabels = {
    new: 'New',
    inprogress: 'In Progress',
    finished: 'Finished'
  };

  const getMoveButtons = () => {
    const buttons = [];
    if (item._status === 'new') {
      buttons.push(
        <button
          key="inprogress"
          onClick={() => handleMove('inprogress')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Start Progress
        </button>
      );
      buttons.push(
        <button
          key="finished"
          onClick={() => handleMove('finished')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Mark Finished
        </button>
      );
    } else if (item._status === 'inprogress') {
      buttons.push(
        <button
          key="new"
          onClick={() => handleMove('new')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Move to New
        </button>
      );
      buttons.push(
        <button
          key="finished"
          onClick={() => handleMove('finished')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Mark Finished
        </button>
      );
    } else if (item._status === 'finished') {
      buttons.push(
        <button
          key="new"
          onClick={() => handleMove('new')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Reopen (New)
        </button>
      );
      buttons.push(
        <button
          key="inprogress"
          onClick={() => handleMove('inprogress')}
          disabled={moving}
          className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors disabled:opacity-50"
        >
          Reopen (In Progress)
        </button>
      );
    }
    return buttons;
  };

  const getStatusBadgeClass = () => {
    switch (item._status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'inprogress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'finished':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to={`/${type}`} className="text-sm text-[var(--text)] hover:text-[var(--accent)]">
            ← Back to {typeLabel}s
          </Link>
          <h2 className="text-2xl mt-2 mb-1">{item.title}</h2>
          <span className="text-sm text-[var(--text)]">{item.id}</span>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/${type}/${id}/edit`}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeClass()}`}>
          {statusLabels[item._status] || item._status}
        </span>
        <span className="text-xs text-[var(--text)]">
          Created: {item.created}
        </span>
        {item.updated && item.updated !== item.created && (
          <span className="text-xs text-[var(--text)]">
            Updated: {item.updated}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {getMoveButtons()}
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <ReactMarkdown>{item.body || '_No content yet_'}</ReactMarkdown>
      </div>
    </div>
  );
}

export default ItemDetail;
