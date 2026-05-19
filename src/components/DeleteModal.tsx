interface Props {
  type: 'fuel' | 'service';
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteModal({ type, onConfirm, onClose }: Props) {
  const label = type === 'fuel' ? 'fuel entry' : 'service entry';
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-title">🗑 Delete Entry?</div>
        <p style={{ color: 'var(--text2)', fontSize: '.84rem', lineHeight: 1.5 }}>
          This will permanently remove this {label}.
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            style={{ background: 'var(--red)' }}
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
