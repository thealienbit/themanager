import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function ItemList({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const typeLabel = type === 'feats' ? 'Features' : 'Bugs';

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get(`${API_URL}/items/${type}`);
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [type]);

  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item._status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
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

  const statusLabels = {
    new: 'New',
    inprogress: 'In Progress',
    finished: 'Finished'
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl m-0">{typeLabel}</h2>
        <Link
          to={`/${type}/new`}
          className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm font-medium"
        >
          + New {typeLabel.slice(0, -1)}
        </Link>
      </div>

      <div className="flex gap-2">
        {['all', 'new', 'inprogress', 'finished'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              filter === status
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--code-bg)] text-[var(--text)] hover:bg-[var(--border)]'
            }`}
          >
            {status === 'all' ? 'All' : statusLabels[status]}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-[var(--text)]">
          No {typeLabel.toLowerCase()} found
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              to={`/${type}/${item.id}`}
              className="block p-4 border border-[var(--border)] rounded-lg hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium m-0">{item.title}</h3>
                  <span className="text-sm text-[var(--text)]">{item.id}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeClass(item._status)}`}>
                  {statusLabels[item._status] || item._status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ItemList;
