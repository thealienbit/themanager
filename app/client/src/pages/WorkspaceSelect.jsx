import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

function WorkspaceSelect() {
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_URL}/workspace`).then(() => {
      setServerStatus('online');
    }).catch(() => {
      setServerStatus('offline');
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(`${API_URL}/workspace`, { path });
      localStorage.setItem('workspace', path);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to set workspace';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-[16px]">M</span>
          </div>
          <h1 className="text-[18px] font-semibold text-[var(--text-h)]">TheManager</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">Local-first project management for agentic coders</p>
        </div>

        <div className="flex justify-center mb-4">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] rounded-full ${
            serverStatus === 'online'
              ? 'bg-green-500/15 text-green-400'
              : serverStatus === 'offline'
              ? 'bg-red-500/15 text-red-400'
              : 'bg-yellow-500/15 text-yellow-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              serverStatus === 'online' ? 'bg-green-400' : serverStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
            }`} />
            Server {serverStatus}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="path" className="block text-[12px] font-medium text-[var(--text-muted)] mb-1">
              Project Path
            </label>
            <input
              type="text"
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/Users/you/projects/my-app"
              className="w-full px-3 py-2 text-[13px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-md text-[var(--text-h)] focus:outline-none focus:border-[var(--accent-border)] placeholder:text-[var(--text-muted)] font-mono"
              required
              autoFocus
            />
          </div>

          {error && <p className="text-red-400 text-[12px]">{error}</p>}

          <button
            type="submit"
            disabled={loading || serverStatus !== 'online'}
            className="w-full py-2 px-4 bg-[var(--accent)] text-white rounded-md text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Opening...' : 'Open Project'}
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--text-muted)] mt-4">
          Your data stays local. No cloud. No account.
        </p>
      </div>
    </div>
  );
}

export default WorkspaceSelect;
