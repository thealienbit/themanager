import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function Layout() {
  const [workspace, setWorkspace] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedWorkspace = localStorage.getItem('workspace');
    if (savedWorkspace) {
      axios.post(`${API_URL}/workspace`, { path: savedWorkspace }).then((res) => {
        setWorkspace(res.data.path);
      }).catch(() => {
        localStorage.removeItem('workspace');
        navigate('/');
      });
    } else {
      axios.get(`${API_URL}/workspace`).then((res) => {
        if (res.data.path) {
          setWorkspace(res.data.path);
        } else {
          navigate('/');
        }
      });
    }
  }, [navigate]);

  const handleWorkspaceChange = () => {
    navigate('/');
  };

  if (!workspace) {
    return <Outlet />;
  }

  const pathParts = workspace.split('/');
  const projectName = pathParts[pathParts.length - 1] || workspace;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold m-0">{projectName}</h1>
            <span className="text-sm text-[var(--text)] truncate max-w-md" title={workspace}>
              {workspace}
            </span>
          </div>
          <button
            onClick={handleWorkspaceChange}
            className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--accent-bg)] transition-colors"
          >
            Change Workspace
          </button>
        </div>
      </header>

      <nav className="border-b border-[var(--border)] px-4 py-2">
        <div className="max-w-5xl mx-auto flex gap-6">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-sm px-2 py-1 rounded ${
                isActive ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:text-[var(--text-h)]'
              }`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/feats"
            className={({ isActive }) =>
              `text-sm px-2 py-1 rounded ${
                isActive ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:text-[var(--text-h)]'
              }`
            }
          >
            Features
          </NavLink>
          <NavLink
            to="/bugs"
            className={({ isActive }) =>
              `text-sm px-2 py-1 rounded ${
                isActive ? 'text-[var(--accent)] font-medium' : 'text-[var(--text)] hover:text-[var(--text-h)]'
              }`
            }
          >
            Bugs
          </NavLink>
        </div>
      </nav>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
