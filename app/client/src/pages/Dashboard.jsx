import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { StatusDot } from '../components/StatusDot';
import { PriorityBadge } from '../components/PriorityBadge';
import { Tag } from '../components/Tag';

const API_URL = 'http://localhost:3001/api';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function SectionHeader({ children }) {
  return <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-medium mb-2">{children}</p>;
}

function ItemRow({ item, showType }) {
  const path = `/${item._type}/${item.id}`;
  return (
    <Link
      to={path}
      className="flex items-center gap-2 px-3 py-[7px] border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors min-w-0"
    >
      <StatusDot status={item._status} />
      <span className="text-[12px] text-[var(--text-h)] truncate flex-1 min-w-0">{item.title}</span>
      <span className="text-[10px] text-[var(--text-muted)] shrink-0">{timeAgo(item.updated)}</span>
    </Link>
  );
}

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
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  const allItems = [
    ...feats.map(i => ({ ...i, _type: 'feats' })),
    ...bugs.map(i => ({ ...i, _type: 'bugs' })),
  ];

  const inProgress = allItems.filter(i => i._status === 'inprogress');
  const urgent = allItems.filter(i => ['critical', 'high'].includes(i.priority) && i._status !== 'finished');

  const agentActivity = allItems
    .flatMap(i => (i.timeline || []).map(t => ({ ...t, itemId: i.id, itemTitle: i.title, itemType: i._type })))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  const countByStatus = (items, status) => items.filter(i => i._status === status).length;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 py-4 max-w-4xl">
        <h1 className="text-[16px] font-semibold text-[var(--text-h)] mb-4">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { label: 'Features', count: feats.length, sub: `${countByStatus(feats, 'inprogress')} active` },
            { label: 'Bugs', count: bugs.length, sub: `${countByStatus(bugs, 'new')} new` },
            { label: 'In Progress', count: inProgress.length, sub: 'across all' },
            { label: 'Urgent', count: urgent.length, sub: 'critical/high', accent: urgent.length > 0 },
          ].map((s, i) => (
            <div key={i} className="px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md">
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{s.label}</p>
              <p className={`text-[20px] font-semibold mt-0.5 leading-none ${s.accent ? 'text-red-400' : 'text-[var(--text-h)]'}`}>{s.count}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Two-column: In Progress + Urgent */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <SectionHeader>In Progress</SectionHeader>
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md overflow-hidden">
              {inProgress.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12px] text-[var(--text-muted)]">Nothing in progress</p>
              ) : (
                inProgress.slice(0, 5).map(item => <ItemRow key={item.id} item={item} />)
              )}
            </div>
          </div>
          <div>
            <SectionHeader>Critical & Urgent</SectionHeader>
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md overflow-hidden">
              {urgent.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12px] text-[var(--text-muted)]">No urgent items</p>
              ) : (
                urgent.slice(0, 5).map(item => <ItemRow key={item.id} item={item} showType />)
              )}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <SectionHeader>Activity Feed</SectionHeader>
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-md overflow-hidden">
            {agentActivity.length === 0 ? (
              <p className="px-3 py-4 text-center text-[12px] text-[var(--text-muted)]">No activity yet</p>
            ) : (
              agentActivity.map((entry, i) => (
                <Link
                  key={i}
                  to={`/${entry.itemType}/${entry.itemId}`}
                  className="flex items-center gap-2 px-3 py-[6px] border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors min-w-0"
                >
                  <span className="w-[5px] h-[5px] rounded-full bg-[var(--accent)] shrink-0" />
                  <span className="text-[12px] text-[var(--text)] truncate min-w-0 flex-1">{entry.details}</span>
                  <span className="text-[11px] text-[var(--text-muted)] truncate max-w-[140px] shrink-0">{entry.itemTitle}</span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-10 text-right">{timeAgo(entry.date)}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
