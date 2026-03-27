const statusConfig = {
  new: { color: 'bg-gray-400' },
  inprogress: { color: 'bg-yellow-400' },
  finished: { color: 'bg-green-400' },
};

const statusLabels = {
  new: 'New',
  inprogress: 'In Progress',
  finished: 'Finished',
};

export function StatusDot({ status, size = 'sm', showLabel = false }) {
  const config = statusConfig[status] || statusConfig.new;
  const sizeClass = size === 'sm' ? 'w-[7px] h-[7px]' : 'w-[9px] h-[9px]';

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className={`${sizeClass} rounded-full ${config.color} shrink-0`} />
      {showLabel && (
        <span className="text-[12px] text-[var(--text)]">{statusLabels[status] || status}</span>
      )}
    </span>
  );
}

export { statusLabels };
