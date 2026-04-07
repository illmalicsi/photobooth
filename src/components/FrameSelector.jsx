function FrameSelector({ options, selectedId, onSelect }) {
  return (
    <div className="frame-selector">
      {options.map((frame) => (
        <button
          key={frame.id}
          type="button"
          className={`frame-swatch ${selectedId === frame.id ? 'active' : ''}`}
          onClick={() => onSelect(frame.id)}
        >
          <span
            className="frame-mini"
            style={{
              '--mini-border': frame.border,
              '--mini-bg': frame.background,
              '--mini-accent': frame.accent,
            }}
          />
          <span>{frame.label}</span>
        </button>
      ))}
    </div>
  )
}

export default FrameSelector
