const priorityConfig = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', icon: '!!', label: 'Critical' },
  high: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: '!', label: 'High' },
  medium: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: '-', label: 'Medium' },
  low: { bg: 'bg-slate-500/10', text: 'text-slate-500', icon: '↓', label: 'Low' },
};

export function PriorityBadge({ priority, showLabel = false }) {
  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded ${config.bg} ${config.text}`}>
      <span className="font-mono text-[10px]">{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export { priorityConfig };
