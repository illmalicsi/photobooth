import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import FrameSelector from './FrameSelector'

const FRAMES = [
  {
    id: 'cherry-pop',
    label: 'Cherry Pop',
    border: '#ef476f',
    accent: '#ffdbe4',
    background: '#fff8fb',
  },
  {
    id: 'mint-candy',
    label: 'Mint Candy',
    border: '#06d6a0',
    accent: '#cafceb',
    background: '#f4fffb',
  },
  {
    id: 'sunny-check',
    label: 'Sunny Check',
    border: '#ff9f1c',
    accent: '#ffe4b5',
    background: '#fffaf0',
  },
]

const START_STICKERS = [
  { id: 's1', emoji: '✨', x: 16, y: 20 },
  { id: 's2', emoji: '💖', x: 72, y: 34 },
]

const STICKER_BANK = ['🌸', '🍒', '🐰', '✨', '💗', '🫧', '🎀']

const PhotoStrip = forwardRef(function PhotoStrip({ photos }, forwardedRef) {
  const stripRef = useRef(null)
  const dragStateRef = useRef(null)

  const [frameId, setFrameId] = useState(FRAMES[0].id)
  const [stickers, setStickers] = useState(START_STICKERS)

  useImperativeHandle(forwardedRef, () => stripRef.current)

  useEffect(() => {
    const onMove = (event) => {
      if (!dragStateRef.current || !stripRef.current) {
        return
      }

      const rect = stripRef.current.getBoundingClientRect()
      const nextX = ((event.clientX - rect.left - dragStateRef.current.offsetX) / rect.width) * 100
      const nextY = ((event.clientY - rect.top - dragStateRef.current.offsetY) / rect.height) * 100

      const clampedX = Math.max(2, Math.min(90, nextX))
      const clampedY = Math.max(4, Math.min(94, nextY))

      setStickers((current) =>
        current.map((sticker) =>
          sticker.id === dragStateRef.current.id
            ? { ...sticker, x: clampedX, y: clampedY }
            : sticker,
        ),
      )
    }

    const onRelease = () => {
      dragStateRef.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onRelease)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onRelease)
    }
  }, [])

  const selectedFrame = useMemo(
    () => FRAMES.find((frame) => frame.id === frameId) ?? FRAMES[0],
    [frameId],
  )

  const addSticker = (emoji) => {
    setStickers((current) => [
      ...current,
      {
        id: `${Date.now()}-${emoji}`,
        emoji,
        x: 14 + Math.random() * 70,
        y: 12 + Math.random() * 74,
      },
    ])
  }

  const onStickerDown = (event, id) => {
    const targetRect = event.currentTarget.getBoundingClientRect()
    dragStateRef.current = {
      id,
      offsetX: event.clientX - targetRect.left,
      offsetY: event.clientY - targetRect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  return (
    <section className="step-panel customize-panel">
      <div className="panel-header">
        <h2>Strip Customization</h2>
        <p>Choose a frame, drag stickers around, then print or save your final strip.</p>
      </div>

      <div className="customize-grid">
        <div className="control-card">
          <h3>Frame Selector</h3>
          <FrameSelector options={FRAMES} selectedId={frameId} onSelect={setFrameId} />

          <h3>Sticker Bar</h3>
          <div className="sticker-picker">
            {STICKER_BANK.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="sticker-btn"
                onClick={() => addSticker(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="print-root">
          <div
            ref={stripRef}
            className="photo-strip"
            style={{
              '--frame-border': selectedFrame.border,
              '--frame-accent': selectedFrame.accent,
              '--frame-bg': selectedFrame.background,
            }}
          >
            <div className="strip-header">
              <p>K-Style Studio</p>
              <span>2026</span>
            </div>

            <div className="strip-grid">
              {photos.map((photo, index) => (
                <figure key={photo} className="strip-shot">
                  <img src={photo} alt={`Photobooth capture ${index + 1}`} />
                </figure>
              ))}
            </div>

            <div className="sticker-layer" aria-hidden="true">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  className="sticker-overlay"
                  style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
                  onPointerDown={(event) => onStickerDown(event, sticker.id)}
                >
                  {sticker.emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
})

export default PhotoStrip
