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
      const response = await axios.post(`${API_URL}/workspace`, { path });
      console.log('Workspace set response:', response.data);
      localStorage.setItem('workspace', path);
      navigate('/dashboard');
    } catch (err) {
      console.error('Workspace set error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to set workspace';
      setError(`${errorMessage} (Server: ${serverStatus})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-center mb-2">TheManager</h1>
        <p className="text-center text-[var(--text)] mb-8">
          Select a project directory to manage its features and bugs
        </p>

        <div className="my-4 text-center">
          <span className={`inline-block px-2 py-1 text-xs rounded ${
            serverStatus === 'online' 
              ? 'bg-green-100 text-green-700' 
              : serverStatus === 'offline'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            Server: {serverStatus}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="path" className="block text-sm font-medium mb-1">
              Project Path
            </label>
            <input
              type="text"
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="~/Dev/slate"
              className="w-full px-3 py-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text-h)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || serverStatus !== 'online'}
            className="w-full py-2 px-4 bg-[var(--accent)] text-white rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Setting Workspace...' : 'Open Project'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default WorkspaceSelect;
