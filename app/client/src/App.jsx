import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import WorkspaceSelect from './pages/WorkspaceSelect';
import Dashboard from './pages/Dashboard';
import ItemList from './pages/ItemList';
import ItemDetail from './pages/ItemDetail';
import ItemEditor from './pages/ItemEditor';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WorkspaceSelect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="feats" element={<ItemList type="feats" />} />
          <Route path="bugs" element={<ItemList type="bugs" />} />
          <Route path="feats/:id" element={<ItemDetail type="feats" />} />
          <Route path="bugs/:id" element={<ItemDetail type="bugs" />} />
          <Route path="feats/:id/edit" element={<ItemEditor type="feats" />} />
          <Route path="bugs/:id/edit" element={<ItemEditor type="bugs" />} />
          <Route path="feats/new" element={<ItemEditor type="feats" />} />
          <Route path="bugs/new" element={<ItemEditor type="bugs" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
