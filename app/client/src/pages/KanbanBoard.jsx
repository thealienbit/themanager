import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import axios from 'axios';
import { StatusDot, statusLabels } from '../components/StatusDot';
import { PriorityBadge } from '../components/PriorityBadge';
import { Tag } from '../components/Tag';

const API_URL = 'http://localhost:3001/api';

function KanbanCard({ item, type, isDragging }) {
  return (
    <div className={`px-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-md ${isDragging ? 'opacity-40' : 'hover:border-[var(--accent-border)]'} transition-colors`}>
      <Link to={`/${type}/${item.id}`} className="block">
        <div className="flex items-center gap-2 mb-1">
          <StatusDot status={item._status} />
          <span className="text-[13px] text-[var(--text-h)] font-medium truncate flex-1">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5 pl-4">
          <PriorityBadge priority={item.priority || 'medium'} />
          {(item.labels || []).slice(0, 2).map(l => <Tag key={l} label={l} />)}
          <span className="text-[10px] text-[var(--text-muted)] font-mono ml-auto">{item.id.split('-')[1]?.slice(0, 6)}</span>
        </div>
      </Link>
    </div>
  );
}

function DraggableCard({ item, type }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <KanbanCard item={item} type={type} isDragging={isDragging} />
    </div>
  );
}

function KanbanColumn({ status, items, type }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const dotColor = status === 'new' ? 'bg-gray-400' : status === 'inprogress' ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-0 rounded-md border border-[var(--border)] ${
        isOver ? 'bg-[var(--accent-bg)] border-[var(--accent-border)]' : 'bg-[var(--bg-surface)]'
      } transition-colors flex flex-col overflow-hidden`}
    >
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[12px] font-medium text-[var(--text-h)]">{statusLabels[status]}</span>
        <span className="text-[11px] text-[var(--text-muted)] font-mono ml-auto">{items.length}</span>
      </div>
      <div className="p-2 space-y-1.5 flex-1 overflow-y-auto min-h-[120px]">
        {items.map(item => (
          <DraggableCard key={item.id} item={item} type={type} />
        ))}
      </div>
    </div>
  );
}

function KanbanBoard({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);

  const typeLabel = type === 'feats' ? 'Features' : 'Bugs';
  const typeSingular = type === 'feats' ? 'Feature' : 'Bug';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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

  const columns = {
    new: items.filter(i => i._status === 'new'),
    inprogress: items.filter(i => i._status === 'inprogress'),
    finished: items.filter(i => i._status === 'finished'),
  };

  const handleDragStart = (event) => {
    setActiveItem(items.find(i => i.id === event.active.id));
  };

  const handleDragEnd = async (event) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const targetStatus = over.id;
    const draggedItem = items.find(i => i.id === active.id);
    if (!draggedItem || draggedItem._status === targetStatus) return;

    setItems(prev => prev.map(i => i.id === active.id ? { ...i, _status: targetStatus } : i));

    try {
      await axios.patch(`${API_URL}/items/${type}/${active.id}/move`, { status: targetStatus });
    } catch (err) {
      setItems(prev => prev.map(i => i.id === active.id ? { ...i, _status: draggedItem._status } : i));
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[15px] font-semibold text-[var(--text-h)]">{typeLabel} Board</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/${type}`}
            className="px-2 py-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-h)] hover:bg-[var(--bg-elevated)] rounded transition-colors shrink-0"
          >
            List
          </Link>
          <Link
            to={`/${type}/new`}
            className="px-2.5 py-1 text-[11px] bg-[var(--accent)] text-white rounded hover:opacity-90 transition-opacity font-medium whitespace-nowrap shrink-0"
          >
            + {typeSingular}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 h-full">
            {['new', 'inprogress', 'finished'].map(status => (
              <KanbanColumn key={status} status={status} items={columns[status]} type={type} />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <div className="rotate-1 opacity-90 shadow-xl">
                <KanbanCard item={activeItem} type={type} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default KanbanBoard;
