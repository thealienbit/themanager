import { NavLink, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const statusLabels = { new: 'New', inprogress: 'In Progress', finished: 'Finished' };

function SidebarSection({ title, type, counts, onQuickCreate }) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(`/${type}`);

  return (
    <div className="mb-1">
      <div className="flex items-center justify-between px-3 py-1 group">
        <NavLink
          to={`/${type}`}
          className={`text-[12px] font-semibold uppercase tracking-wider ${
            isActive ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
          } hover:text-[var(--text-h)] transition-colors`}
        >
          {title}
        </NavLink>
        <button
          onClick={onQuickCreate}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--accent)] transition-all text-sm leading-none"
          title={`New ${title.slice(0, -1)}`}
        >
          +
        </button>
      </div>
      <div className="space-y-0.5">
        {['new', 'inprogress', 'finished'].map(status => {
          const count = counts[status] || 0;
          const dotColor = status === 'new' ? 'bg-gray-400' : status === 'inprogress' ? 'bg-yellow-400' : 'bg-green-400';
          return (
            <NavLink
              key={status}
              to={`/${type}?status=${status}`}
              className={({ isActive: active }) =>
                `flex items-center gap-2 px-3 py-1 text-[13px] rounded-md mx-1 transition-colors ${
                  active && location.search.includes(status)
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-h)]'
                    : 'text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-h)]'
                }`
              }
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
              <span className="flex-1">{statusLabels[status]}</span>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">{count}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({ workspace }) {
  const [featCounts, setFeatCounts] = useState({ new: 0, inprogress: 0, finished: 0 });
  const [bugCounts, setBugCounts] = useState({ new: 0, inprogress: 0, finished: 0 });
  const location = useLocation();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [featsRes, bugsRes] = await Promise.all([
          axios.get(`${API_URL}/items/feats`),
          axios.get(`${API_URL}/items/bugs`),
        ]);
        const fc = { new: 0, inprogress: 0, finished: 0 };
        featsRes.data.forEach(i => fc[i._status]++);
        setFeatCounts(fc);

        const bc = { new: 0, inprogress: 0, finished: 0 };
        bugsRes.data.forEach(i => bc[i._status]++);
        setBugCounts(bc);
      } catch (err) {
        // silent
      }
    };
    fetchCounts();
  }, [location.pathname]);

  const pathParts = workspace?.split('/') || [];
  const projectName = pathParts[pathParts.length - 1] || 'Project';

  return (
    <aside className="w-[240px] shrink-0 bg-[var(--bg)] border-r border-[var(--border)] flex flex-col h-full overflow-hidden">
      {/* Workspace header */}
      <div className="px-3 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-[var(--accent)] flex items-center justify-center text-[11px] font-bold text-white">
            {projectName[0]?.toUpperCase()}
          </div>
          <span className="text-[13px] font-semibold text-[var(--text-h)] truncate">{projectName}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2 px-3 py-1.5 mx-1 text-[13px] rounded-md transition-colors ${
              isActive
                ? 'bg-[var(--bg-elevated)] text-[var(--text-h)]'
                : 'text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-h)]'
            }`
          }
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Dashboard
        </NavLink>

        <div className="mt-3">
          <SidebarSection
            title="Features"
            type="feats"
            counts={featCounts}
            onQuickCreate={() => window.location.href = '/feats/new'}
          />
        </div>

        <div className="mt-2">
          <SidebarSection
            title="Bugs"
            type="bugs"
            counts={bugCounts}
            onQuickCreate={() => window.location.href = '/bugs/new'}
          />
        </div>

        <div className="mt-3 px-1 space-y-0.5">
          <NavLink
            to="/feats/board"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-1.5 text-[13px] rounded-md transition-colors ${
                isActive
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-h)]'
                  : 'text-[var(--text)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-h)]'
              }`
            }
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7" />
            </svg>
            Board
          </NavLink>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--border)]">
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
          <kbd className="px-1 py-0.5 bg-[var(--bg-surface)] border border-[var(--border)] rounded text-[10px]">⌘K</kbd>
          <span>Command palette</span>
        </div>
      </div>
    </aside>
  );
}
