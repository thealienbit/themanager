import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Sidebar } from './Sidebar';
import { CommandPalette } from './CommandPalette';

const API_URL = 'http://localhost:3001/api';

function Layout() {
  const [workspace, setWorkspace] = useState(null);
  const [checked, setChecked] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [allItems, setAllItems] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedWorkspace = localStorage.getItem('workspace');
    if (savedWorkspace) {
      axios.post(`${API_URL}/workspace`, { path: savedWorkspace }).then((res) => {
        setWorkspace(res.data.path);
      }).catch(() => {
        localStorage.removeItem('workspace');
      }).finally(() => setChecked(true));
    } else {
      axios.get(`${API_URL}/workspace`).then((res) => {
        if (res.data.path) {
          setWorkspace(res.data.path);
          localStorage.setItem('workspace', res.data.path);
        }
      }).finally(() => setChecked(true));
    }
  }, []);

  useEffect(() => {
    if (!workspace) return;
    const fetch = async () => {
      try {
        const [featsRes, bugsRes] = await Promise.all([
          axios.get(`${API_URL}/items/feats`),
          axios.get(`${API_URL}/items/bugs`),
        ]);
        setAllItems([
          ...featsRes.data.map(i => ({ ...i, _type: 'feats' })),
          ...bugsRes.data.map(i => ({ ...i, _type: 'bugs' })),
        ]);
      } catch (err) { /* silent */ }
    };
    fetch();
  }, [workspace]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setPaletteOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // On root path with no workspace — full-screen workspace select
  if (location.pathname === '/') {
    if (!checked) {
      return <div className="h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text-muted)] text-sm">Loading...</div>;
    }
    if (!workspace) {
      return (
        <div className="h-screen bg-[var(--bg)]">
          <Outlet />
        </div>
      );
    }
    // Workspace exists, redirect to dashboard
    return (
      <div className="h-screen bg-[var(--bg)]">
        <Outlet />
      </div>
    );
  }

  // All other pages: sidebar layout
  if (!workspace && checked) {
    // No workspace but trying to access a page — redirect
    navigate('/');
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar workspace={workspace} />
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <Outlet context={{ workspace, allItems }} />
      </main>
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        items={allItems}
      />
    </div>
  );
}

export default Layout;
