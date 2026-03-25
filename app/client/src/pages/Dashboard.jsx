import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Dashboard() {
  const [feats, setFeats] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featsRes, bugsRes] = await Promise.all([
          axios.get(`${API_URL}/items/feats`),
          axios.get(`${API_URL}/items/bugs`),
        ]);
        setFeats(featsRes.data);
        setBugs(bugsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const countByStatus = (items, status) => items.filter((i) => i._status === status).length;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="block p-6 border border-[var(--border)] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium m-0">Features</h3>
            <span className="text-3xl font-bold text-[var(--accent)]">{feats.length}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">New</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(feats, 'new')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">In Progress</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(feats, 'inprogress')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">Finished</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(feats, 'finished')}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <Link
              to="/feats/new"
              className="block w-full py-2 text-center border border-dashed border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors text-sm"
            >
              + New Feature
            </Link>
          </div>
        </div>

        <div className="block p-6 border border-[var(--border)] rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium m-0">Bugs</h3>
            <span className="text-3xl font-bold text-[var(--accent)]">{bugs.length}</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">New</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(bugs, 'new')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">In Progress</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(bugs, 'inprogress')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text)]">Finished</span>
              <span className="font-medium text-[var(--text-h)]">{countByStatus(bugs, 'finished')}</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <Link
              to="/bugs/new"
              className="block w-full py-2 text-center border border-dashed border-[var(--border)] rounded hover:border-[var(--accent)] transition-colors text-sm"
            >
              + New Bug
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
