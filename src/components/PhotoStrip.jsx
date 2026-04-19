import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

const FRAMES = [
  {
    id: 'petal',
    label: 'Petal',
    tagline: 'soft & romantic',
    border: '#C4706A',
    accent: '#F9EDE8',
    headerBg: '#F0D4CC',
    headerText: '#9B4E49',
    photoBorder: 'rgba(196,112,106,0.25)',
  },
  {
    id: 'sage',
    label: 'Sage',
    tagline: 'calm & earthy',
    border: '#7A9E7E',
    accent: '#EDF4EE',
    headerBg: '#D4E8D6',
    headerText: '#3D6640',
    photoBorder: 'rgba(122,158,126,0.25)',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    tagline: 'moody & golden',
    border: '#C9A96E',
    accent: '#FDF8F0',
    headerBg: '#EDD9B0',
    headerText: '#7A5A1E',
    photoBorder: 'rgba(201,169,110,0.25)',
  },
  {
    id: 'ink',
    label: 'Ink',
    tagline: 'bold & editorial',
    border: '#2C1810',
    accent: '#F5F2F0',
    headerBg: '#2C1810',
    headerText: '#F5EBE6',
    photoBorder: 'rgba(44,24,16,0.2)',
  },
]

const START_STICKERS = [
  { id: 's1', emoji: '✨', x: 12, y: 8 },
  { id: 's2', emoji: '💖', x: 68, y: 18 },
]

const STICKER_BANK = [
  { emoji: '🌸', label: 'blossom' },
  { emoji: '🍒', label: 'cherry' },
  { emoji: '🐰', label: 'bunny' },
  { emoji: '✨', label: 'sparkle' },
  { emoji: '💗', label: 'heart' },
  { emoji: '🫧', label: 'bubble' },
  { emoji: '🎀', label: 'bow' },
  { emoji: '🌙', label: 'moon' },
  { emoji: '🍓', label: 'berry' },
  { emoji: '🦋', label: 'butterfly' },
  { emoji: '🌷', label: 'tulip' },
  { emoji: '⭐', label: 'star' },
]

const PhotoStrip = forwardRef(function PhotoStrip({ photos }, forwardedRef) {
  const stripRef = useRef(null)
  const dragStateRef = useRef(null)

  const [frameId, setFrameId] = useState(FRAMES[0].id)
  const [stickers, setStickers] = useState(START_STICKERS)
  const [activeStickerId, setActiveStickerId] = useState(null)
  const [stickerCategory, setStickerCategory] = useState('all')

  useImperativeHandle(forwardedRef, () => stripRef.current)

  useEffect(() => {
    const onMove = (e) => {
      if (!dragStateRef.current || !stripRef.current) return
      const rect = stripRef.current.getBoundingClientRect()
      const nx = ((e.clientX - rect.left - dragStateRef.current.ox) / rect.width) * 100
      const ny = ((e.clientY - rect.top - dragStateRef.current.oy) / rect.height) * 100
      setStickers(cur => cur.map(s =>
        s.id === dragStateRef.current.id
          ? { ...s, x: Math.max(2, Math.min(90, nx)), y: Math.max(2, Math.min(95, ny)) }
          : s
      ))
    }
    const onUp = () => { dragStateRef.current = null; setActiveStickerId(null) }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [])

  const selectedFrame = useMemo(() => FRAMES.find(f => f.id === frameId) ?? FRAMES[0], [frameId])

  const addSticker = (emoji) => {
    setStickers(cur => [...cur, {
      id: `${Date.now()}-${emoji}`,
      emoji,
      x: 14 + Math.random() * 66,
      y: 10 + Math.random() * 78,
    }])
  }

  const removeSticker = (id, e) => {
    e.stopPropagation()
    setStickers(cur => cur.filter(s => s.id !== id))
  }

  const onStickerDown = (e, id) => {
    const r = e.currentTarget.getBoundingClientRect()
    dragStateRef.current = { id, ox: e.clientX - r.left, oy: e.clientY - r.top }
    e.currentTarget.setPointerCapture(e.pointerId)
    setActiveStickerId(id)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        :root {
          --blush: #F9EDE8;
          --blush-mid: #F0D4CC;
          --blush-dark: #D4927E;
          --rose: #C4706A;
          --rose-deep: #9B4E49;
          --cream: #FDF8F5;
          --warm-white: #FAF5F2;
          --text-dark: #2C1810;
          --text-mid: #6B3D35;
          --text-soft: #B07D74;
          --border: rgba(196, 112, 106, 0.15);
          --border-med: rgba(196, 112, 106, 0.3);
          --shadow-card: 0 4px 32px rgba(155, 78, 73, 0.1);
          --r: 16px;
          --r-sm: 10px;
          --r-pill: 100px;
        }

        .ps-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          min-height: 100svh;
          display: grid;
          grid-template-rows: auto 1fr;
          color: var(--text-dark);
        }

        .ps-root,
        .ps-body,
        .ps-sidebar,
        .ps-canvas {
          min-width: 0;
        }

        .ps-root button {
          font-family: 'DM Sans', sans-serif;
          line-height: 1.2;
        }

        /* ── Top Bar ── */
        .ps-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: clamp(12px, 2vw, 20px) clamp(12px, 3vw, 36px);
          border-bottom: 1px solid var(--border);
          background: #fff;
        }

        .ps-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ps-brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--rose);
          box-shadow: 0 0 0 3px var(--blush);
        }

        .ps-brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(18px, 1.6vw, 22px);
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--rose-deep);
          text-transform: uppercase;
        }

        .ps-step-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--blush);
          border: 1px solid var(--border-med);
          border-radius: var(--r-pill);
          min-height: 34px;
          padding: 6px 14px;
          font-size: 12px;
          color: var(--text-mid);
          letter-spacing: 0.08em;
          font-weight: 500;
          text-align: center;
        }

        .ps-step-pill-num {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--rose);
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
          font-weight: 500;
        }

        .ps-save-btn {
          background: var(--rose);
          border: none;
          border-radius: var(--r-sm);
          min-height: 40px;
          padding: 9px 20px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .ps-save-btn:hover {
          background: var(--rose-deep);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(196,112,106,0.3);
        }

        /* ── Body Layout ── */
        .ps-body {
          display: grid;
          grid-template-columns: 300px 1fr;
          overflow: hidden;
        }

        @media (max-width: 1200px) {
          .ps-body {
            grid-template-columns: minmax(250px, 280px) minmax(0, 1fr);
          }

          .ps-canvas {
            padding: clamp(16px, 2vw, 30px);
          }
        }

        /* ── Controls Sidebar ── */
        .ps-sidebar {
          background: #fff;
          border-right: 1px solid var(--border);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ps-section {
          padding: 24px;
          border-bottom: 1px solid var(--border);
        }

        .ps-section-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: var(--text-soft);
          text-transform: uppercase;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ps-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        /* Frame Cards */
        .frame-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .frame-card {
          border: 1.5px solid var(--border);
          border-radius: var(--r-sm);
          min-height: 72px;
          padding: 12px 10px;
          cursor: pointer;
          background: var(--warm-white);
          transition: all 0.2s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 5px;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
        }

        .frame-card:hover {
          border-color: var(--blush-dark);
          background: var(--blush);
        }

        .frame-card.selected {
          border-width: 2px;
          background: var(--blush);
        }

        .frame-card-swatch {
          width: 28px; height: 5px;
          border-radius: 3px;
          margin-bottom: 2px;
        }

        .frame-card-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-dark);
          line-height: 1.2;
        }

        .frame-card-tagline {
          font-size: 11px;
          color: var(--text-soft);
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          line-height: 1.2;
        }

        .frame-card-check {
          position: absolute;
          top: 8px; right: 8px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--rose);
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .frame-card.selected .frame-card-check { opacity: 1; }

        .frame-card-check::after {
          content: '';
          width: 6px; height: 4px;
          border-left: 1.5px solid white;
          border-bottom: 1.5px solid white;
          transform: rotate(-45deg) translateY(-1px);
        }

        /* Sticker Bank */
        .sticker-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 4px;
        }

        .sticker-add-btn {
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: 8px;
          min-height: 42px;
          width: 100%;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.15s;
          position: relative;
        }

        .sticker-add-btn:hover {
          background: var(--blush);
          border-color: var(--blush-dark);
          transform: scale(1.08);
        }

        .sticker-add-btn:active { transform: scale(0.96); }

        /* Layer list */
        .layer-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .layer-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 36px;
          padding: 6px 10px;
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-mid);
        }

        .layer-emoji { font-size: 16px; }

        .layer-remove {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: var(--text-soft);
          padding: 0 2px;
          border-radius: 4px;
          transition: color 0.15s;
          font-family: 'DM Sans', sans-serif;
          line-height: 1;
        }

        .layer-remove:hover { color: var(--rose); }

        /* ── Strip Canvas ── */
        .ps-canvas {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: var(--cream);
          position: relative;
          overflow: hidden;
        }

        .ps-canvas::before {
          content: '';
          position: absolute;
          bottom: -80px; right: -80px;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,237,232,0.9) 0%, transparent 70%);
          pointer-events: none;
        }

        .strip-wrap {
          position: relative;
          width: 260px;
          flex-shrink: 0;
        }

        .strip-shadow {
          position: absolute;
          inset: 0;
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(44,24,16,0.2), 0 4px 16px rgba(44,24,16,0.1);
          pointer-events: none;
          z-index: 0;
        }

        .photo-strip {
          position: relative;
          width: 260px;
          border-radius: 18px;
          overflow: hidden;
          border: 3px solid var(--frame-border, #C4706A);
          background: var(--frame-bg, #fff8fb);
          z-index: 1;
          user-select: none;
        }

        .strip-top-bar {
          background: var(--frame-header-bg, #F0D4CC);
          padding: 12px 16px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .strip-studio-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--frame-header-text, #9B4E49);
        }

        .strip-year {
          font-size: 10px;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: var(--frame-header-text, #9B4E49);
          opacity: 0.7;
        }

        .strip-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .strip-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--frame-header-text, #9B4E49);
          opacity: 0.35;
        }

        .strip-photos {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 10px;
          gap: 8px;
        }

        .strip-photo {
          border-radius: 8px;
          overflow: hidden;
          aspect-ratio: 4/3;
          border: 2px solid var(--frame-photo-border, rgba(196,112,106,0.2));
          background: #eee;
          position: relative;
        }

        .strip-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .strip-photo-num {
          position: absolute;
          bottom: 5px; right: 6px;
          font-size: 9px;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
          letter-spacing: 0.06em;
        }

        .strip-footer {
          padding: 10px 16px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .strip-footer-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 11px;
          font-style: italic;
          color: var(--frame-header-text, #9B4E49);
          opacity: 0.6;
          letter-spacing: 0.06em;
        }

        .strip-hearts {
          font-size: 11px;
          letter-spacing: 3px;
          opacity: 0.45;
        }

        /* Sticker overlay */
        .sticker-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
        }

        .sticker-overlay {
          position: absolute;
          font-size: 24px;
          transform: translate(-50%, -50%);
          cursor: grab;
          pointer-events: all;
          background: none;
          border: none;
          padding: 4px;
          border-radius: 6px;
          transition: outline 0.1s;
          line-height: 1;
          touch-action: none;
          outline: 2px solid transparent;
        }

        .sticker-overlay:hover {
          outline: 2px dashed rgba(196,112,106,0.5);
          cursor: grab;
        }

        .sticker-overlay.dragging {
          cursor: grabbing;
          outline: 2px dashed var(--rose);
          z-index: 20;
        }

        /* Tips area */
        .ps-tip {
          padding: 20px 24px;
        }

        .tip-card {
          background: var(--blush);
          border: 1px solid var(--border-med);
          border-radius: var(--r-sm);
          padding: 12px 14px;
          font-size: 12px;
          color: var(--text-mid);
          line-height: 1.6;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }

        @media (max-width: 1080px) {
          .ps-topbar {
            padding: 16px 20px;
          }

          .ps-body {
            grid-template-columns: 260px 1fr;
          }

          .ps-canvas {
            padding: 24px;
          }
        }

        @media (min-width: 901px) and (max-width: 1100px) {
          .strip-wrap,
          .photo-strip {
            width: min(38vw, 320px);
          }

          .sticker-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        @media (min-width: 1400px) {
          .ps-body {
            grid-template-columns: 330px 1fr;
          }

          .strip-wrap,
          .photo-strip {
            width: min(22vw, 340px);
          }
        }

        @media (max-width: 900px) {
          .ps-root {
            min-height: auto;
          }

          .ps-topbar {
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
          }

          .ps-save-btn {
            width: 100%;
            min-height: 44px;
            font-size: 12px;
          }

          .ps-body {
            grid-template-columns: 1fr;
            overflow: visible;
          }

          .ps-canvas {
            order: 1;
            padding: 18px 14px;
          }

          .strip-wrap,
          .photo-strip {
            width: min(86vw, 320px);
          }

          .ps-sidebar {
            order: 2;
            border-right: none;
            border-top: 1px solid var(--border);
            overflow: visible;
          }

          .ps-section {
            padding: 18px 14px;
          }

          .frame-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .sticker-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }

          .ps-tip {
            padding: 14px;
          }
        }

        @media (max-width: 768px) {
          .ps-topbar {
            align-items: stretch;
          }

          .ps-brand,
          .ps-step-pill,
          .ps-save-btn {
            width: 100%;
            justify-content: center;
          }

          .ps-save-btn {
            min-height: 42px;
          }
        }

        @media (max-width: 560px) {
          .ps-topbar {
            padding: 12px;
            gap: 8px;
          }

          .ps-brand-name {
            font-size: 17px;
          }

          .ps-step-pill {
            width: 100%;
            justify-content: center;
            font-size: 11px;
          }

          .ps-canvas {
            padding: 12px;
          }

          .strip-wrap,
          .photo-strip {
            width: min(90vw, 280px);
          }

          .strip-top-bar {
            padding: 10px 12px 8px;
          }

          .strip-photos {
            padding: 8px;
            gap: 6px;
          }

          .strip-footer {
            padding: 9px 12px 11px;
          }

          .frame-grid {
            grid-template-columns: 1fr;
          }

          .sticker-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 6px;
          }

          .sticker-add-btn {
            font-size: 20px;
          }

          .layer-item {
            min-height: 38px;
          }

          .frame-card-name {
            font-size: 12px;
          }

          .frame-card-tagline {
            font-size: 10px;
          }
        }

        @media (max-width: 400px) {
          .ps-topbar {
            padding: 10px;
          }

          .ps-brand-name {
            font-size: 15px;
          }

          .ps-step-pill {
            font-size: 10px;
            letter-spacing: 0.05em;
          }

          .ps-save-btn {
            min-height: 40px;
            font-size: 11px;
            padding: 8px 12px;
          }

          .ps-canvas {
            padding: 10px;
          }

          .strip-wrap,
          .photo-strip {
            width: min(92vw, 250px);
          }

          .sticker-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .layer-item {
            font-size: 11px;
          }
        }
      `}</style>

      <div className="ps-root">
        {/* Top bar */}
        <header className="ps-topbar">
          <div className="ps-brand">
            <div className="ps-brand-dot" />
            <span className="ps-brand-name">K-Booth</span>
          </div>

          <div className="ps-step-pill">
            <div className="ps-step-pill-num">3</div>
            <span>Customize your strip</span>
          </div>

          <button type="button" className="ps-save-btn">
            ✦ Save Strip
          </button>
        </header>

        <div className="ps-body">
          {/* Sidebar */}
          <aside className="ps-sidebar">
            {/* Frame Selector */}
            <div className="ps-section">
              <div className="ps-section-label">Frame</div>
              <div className="frame-grid">
                {FRAMES.map(frame => (
                  <button
                    key={frame.id}
                    type="button"
                    className={`frame-card ${frameId === frame.id ? 'selected' : ''}`}
                    onClick={() => setFrameId(frame.id)}
                    style={{ borderColor: frameId === frame.id ? frame.border : undefined }}
                  >
                    <div className="frame-card-swatch" style={{ background: frame.border }} />
                    <div className="frame-card-name">{frame.label}</div>
                    <div className="frame-card-tagline">{frame.tagline}</div>
                    <div className="frame-card-check" style={{ background: frame.border }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker Bank */}
            <div className="ps-section">
              <div className="ps-section-label">Stickers</div>
              <div className="sticker-grid">
                {STICKER_BANK.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    className="sticker-add-btn"
                    onClick={() => addSticker(emoji)}
                    title={`Add ${label}`}
                    aria-label={`Add ${label} sticker`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer / sticker manager */}
            {stickers.length > 0 && (
              <div className="ps-section">
                <div className="ps-section-label">Layers</div>
                <div className="layer-list">
                  {[...stickers].reverse().map(s => (
                    <div key={s.id} className="layer-item">
                      <span className="layer-emoji">{s.emoji}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-soft)', flex: 1, marginLeft: 8 }}>
                        {Math.round(s.x)}%, {Math.round(s.y)}%
                      </span>
                      <button
                        type="button"
                        className="layer-remove"
                        onClick={(e) => removeSticker(s.id, e)}
                        aria-label="Remove sticker"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="ps-tip">
              <div className="tip-card">
                Drag stickers anywhere on the strip. Tap a sticker in the bank to add more. Use the × in Layers to remove.
              </div>
            </div>
          </aside>

          {/* Strip Canvas */}
          <div className="ps-canvas">
            <div className="strip-wrap">
              <div className="strip-shadow" />

              <div
                ref={stripRef}
                className="photo-strip"
                style={{
                  '--frame-border': selectedFrame.border,
                  '--frame-bg': selectedFrame.accent,
                  '--frame-header-bg': selectedFrame.headerBg,
                  '--frame-header-text': selectedFrame.headerText,
                  '--frame-photo-border': selectedFrame.photoBorder,
                }}
              >
                {/* Strip header */}
                <div className="strip-top-bar">
                  <span className="strip-studio-name">K-Booth</span>
                  <div className="strip-dots" aria-hidden="true">
                    <div className="strip-dot" />
                    <div className="strip-dot" />
                    <div className="strip-dot" />
                  </div>
                  <span className="strip-year">2026</span>
                </div>

                {/* Photos */}
                <div className="strip-photos">
                  {photos.map((photo, i) => (
                    <div key={photo} className="strip-photo">
                      <img src={photo} alt={`Photo ${i + 1}`} />
                      <div className="strip-photo-num">0{i + 1}</div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="strip-footer">
                  <span className="strip-footer-text">your moment, captured.</span>
                  <span className="strip-hearts" aria-hidden="true">♡ ♡ ♡</span>
                </div>

                {/* Sticker Layer */}
                <div className="sticker-layer" aria-hidden="true">
                  {stickers.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`sticker-overlay ${activeStickerId === s.id ? 'dragging' : ''}`}
                      style={{ left: `${s.x}%`, top: `${s.y}%` }}
                      onPointerDown={(e) => onStickerDown(e, s.id)}
                      aria-label={`Sticker ${s.emoji}`}
                    >
                      {s.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export default PhotoStrip