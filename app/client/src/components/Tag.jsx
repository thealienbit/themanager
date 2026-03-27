export function Tag({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]">
      {label}
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="hover:text-red-400 ml-0.5 leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
