import { useEffect, useRef, useState } from 'react'

const FILTERS = {
  none: { label: 'Original', emoji: '✦', css: 'none' },
  warm: { label: 'Warm', emoji: '☀', css: 'saturate(1.15) contrast(1.08) brightness(1.04)' },
  vintage: { label: 'Vintage', emoji: '◈', css: 'sepia(0.45) contrast(1.2) saturate(0.85)' },
  bw: { label: 'Noir', emoji: '◐', css: 'grayscale(1) contrast(1.15)' },
  soft: { label: 'Soft', emoji: '❋', css: 'brightness(1.1) saturate(0.85) contrast(0.95)' },
}

const VIRTUAL_PROPS = [
  { id: 'none', label: 'None', icon: '✕' },
  { id: 'cat', label: 'Kitty', icon: '🐱' },
  { id: 'bow', label: 'Bow', icon: '🎀' },
  { id: 'frog', label: 'Frog', icon: '🐸' },
  { id: 'sign', label: 'Sign', icon: '💬' },
]

const SHUTTER_SOUND = 'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQ4AAAAAABQAKABQAHgAoADIAOgA8AD4A'

function Camera({ onComplete }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const streamRef = useRef(null)
  const timersRef = useRef([])

  const [permissionState, setPermissionState] = useState('pending')
  const [error, setError] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('warm')
  const [countdown, setCountdown] = useState(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedPhotos, setCapturedPhotos] = useState([])
  const [flashEnabled, setFlashEnabled] = useState(true)
  const [autoRetouch, setAutoRetouch] = useState(true)
  const [flashFrame, setFlashFrame] = useState(false)
  const [selectedProp, setSelectedProp] = useState('none')
  const [mobileSheet, setMobileSheet] = useState(null)
  const [mobileAdvancedOpen, setMobileAdvancedOpen] = useState(false)

  useEffect(() => {
    let isMounted = true
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        if (!isMounted) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setPermissionState('granted')
      } catch {
        setPermissionState('denied')
        setError('Camera access was blocked. Please allow camera permissions and refresh.')
      }
    }
    startCamera()
    return () => {
      isMounted = false
      timersRef.current.forEach(id => clearTimeout(id))
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  const queueTimeout = (cb, delay) => {
    const id = window.setTimeout(cb, delay)
    timersRef.current.push(id)
  }

  const playShutter = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => {})
  }

  const snapFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    const w = video.videoWidth, h = video.videoHeight
    if (!w || !h) return null
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.filter = FILTERS[selectedFilter].css
    if (autoRetouch) ctx.filter = `${ctx.filter} brightness(1.07) saturate(1.08) contrast(1.05)`
    ctx.save()
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, w, h)
    ctx.restore()
    return canvas.toDataURL('image/jpeg', 0.94)
  }

  const runCaptureSequence = (shotIndex, collected) => {
    if (shotIndex >= 4) {
      setCountdown(null); setIsCapturing(false)
      if (onComplete) onComplete(collected)
      return
    }
    const runCountdown = (seconds) => {
      setCountdown(seconds)
      if (seconds === 0) {
        if (flashEnabled) { setFlashFrame(true); queueTimeout(() => setFlashFrame(false), 160) }
        playShutter()
        const photo = snapFrame()
        if (photo) {
          const next = [...collected, photo]
          setCapturedPhotos(next)
          queueTimeout(() => runCaptureSequence(shotIndex + 1, next), 450)
        } else {
          setIsCapturing(false)
          setError('Could not capture a frame from the camera stream.')
        }
        return
      }
      queueTimeout(() => runCountdown(seconds - 1), 1000)
    }
    runCountdown(3)
  }

  const handleTakePhoto = () => {
    if (isCapturing || permissionState !== 'granted') return
    setMobileSheet(null)
    setError(''); setCapturedPhotos([]); setIsCapturing(true)
    runCaptureSequence(0, [])
  }

  const handleFilterSelect = (key) => {
    setSelectedFilter(key)
    setMobileSheet(null)
  }

  const handlePropSelect = (key) => {
    setSelectedProp(key)
    setMobileSheet(null)
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
          --sage: #8BA888;
          --gold: #C9A96E;
          --gold-light: #EDD9B0;
          --border: rgba(196, 112, 106, 0.18);
          --border-strong: rgba(196, 112, 106, 0.35);
          --shadow-soft: 0 2px 20px rgba(196, 112, 106, 0.1);
          --shadow-card: 0 4px 32px rgba(155, 78, 73, 0.12);
          --radius: 20px;
          --radius-sm: 12px;
          --radius-pill: 100px;
        }

        .booth-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--cream);
          min-height: 100vh;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 0;
          color: var(--text-dark);
          position: relative;
          overflow: hidden;
        }

        .booth-root,
        .studio,
        .viewfinder-outer,
        .mobile-sheet {
          min-width: 0;
        }

        .booth-root::before {
          content: '';
          position: absolute;
          top: -120px; right: -80px;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(249,237,232,0.8) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .booth-root button {
          font-family: 'DM Sans', sans-serif;
          line-height: 1.2;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          background: #fff;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 0;
          position: relative;
          z-index: 1;
          box-shadow: 4px 0 24px rgba(196,112,106,0.06);
        }

        .sidebar-header {
          padding: 32px 24px 24px;
          border-bottom: 1px solid var(--border);
        }

        .brand-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
        }

        .brand-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--rose);
          box-shadow: 0 0 0 3px var(--blush);
        }

        .brand-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--rose-deep);
          text-transform: uppercase;
        }

        .brand-sub {
          font-size: 11px;
          font-weight: 300;
          letter-spacing: 0.18em;
          color: var(--text-soft);
          text-transform: uppercase;
          margin-left: 18px;
        }

        .phase-steps {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .phase-step {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0.4;
          transition: opacity 0.3s;
        }

        .phase-step.active { opacity: 1; }

        .step-num {
          width: 24px; height: 24px;
          border-radius: 50%;
          border: 1px solid var(--border-strong);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          color: var(--text-soft);
          font-weight: 500;
          flex-shrink: 0;
          transition: background 0.3s, color 0.3s;
        }

        .phase-step.active .step-num {
          background: var(--rose);
          border-color: var(--rose);
          color: white;
        }

        .step-label {
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.04em;
          color: var(--text-mid);
          line-height: 1.3;
        }

        /* Controls block */
        .controls-block {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .control-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: var(--text-soft);
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .toggle-name {
          font-size: 14px;
          color: var(--text-mid);
          font-weight: 400;
        }

        .toggle-pill {
          width: 40px; height: 22px;
          background: var(--blush-mid);
          border-radius: 100px;
          border: none;
          cursor: pointer;
          position: relative;
          transition: background 0.25s;
          padding: 0;
        }

        .toggle-pill.on {
          background: var(--rose);
        }

        .toggle-pill span {
          position: absolute;
          top: 3px; left: 3px;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: white;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }

        .toggle-pill.on span {
          transform: translateX(18px);
        }

        /* Filter Grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }

        .filter-btn {
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          min-height: 44px;
          padding: 8px 6px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }

        .filter-btn:hover { background: var(--blush); border-color: var(--blush-dark); }

        .filter-btn.active {
          background: var(--blush);
          border-color: var(--rose);
          box-shadow: 0 0 0 2px rgba(196,112,106,0.15);
        }

        .filter-icon {
          font-size: 14px;
          color: var(--rose-deep);
        }

        .filter-name {
          font-size: 11px;
          color: var(--text-mid);
          font-weight: 400;
          letter-spacing: 0.04em;
          text-align: center;
        }

        /* Prop Grid */
        .prop-grid {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .prop-btn {
          background: var(--warm-white);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          min-height: 36px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 13px;
          color: var(--text-mid);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
          text-align: center;
        }

        .prop-btn:hover { background: var(--blush); border-color: var(--blush-dark); }

        .prop-btn.active {
          background: var(--blush);
          border-color: var(--rose);
          color: var(--rose-deep);
        }

        /* Capture Button */
        .capture-wrap {
          padding: 20px 24px;
          margin-top: auto;
          border-top: 1px solid var(--border);
        }

        .capture-hint {
          font-size: 11px;
          color: var(--text-soft);
          text-align: center;
          margin-bottom: 14px;
          letter-spacing: 0.04em;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
        }

        .capture-btn {
          width: 100%;
          background: var(--rose);
          border: none;
          border-radius: var(--radius-sm);
          min-height: 46px;
          padding: 14px;
          color: white;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        .capture-btn:hover:not(:disabled) {
          background: var(--rose-deep);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(196,112,106,0.35);
        }

        .capture-btn:active:not(:disabled) { transform: translateY(0); }

        .capture-btn:disabled {
          background: var(--blush-dark);
          cursor: not-allowed;
          transform: none;
        }

        /* ── MAIN STUDIO ── */
        .studio {
          display: flex;
          flex-direction: column;
          padding: 32px 36px;
          gap: 24px;
          position: relative;
          z-index: 1;
        }

        .studio-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .studio-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(24px, 2.2vw, 30px);
          font-weight: 300;
          font-style: italic;
          color: var(--rose-deep);
          letter-spacing: 0.02em;
          line-height: 1.1;
        }

        .shot-counter {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .shot-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--blush-mid);
          transition: background 0.3s, transform 0.3s;
        }

        .shot-dot.taken {
          background: var(--rose);
          transform: scale(1.2);
        }

        /* Viewfinder */
        .viewfinder-outer {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 88px;
          gap: 16px;
          min-height: 0;
        }

        .viewfinder-card {
          background: var(--text-dark);
          border-radius: var(--radius);
          overflow: hidden;
          position: relative;
          aspect-ratio: 3/4;
          max-height: 520px;
          width: 100%;
        }

        .live-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .viewfinder-frame {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .corner {
          position: absolute;
          width: 20px; height: 20px;
          border-color: rgba(255,255,255,0.5);
          border-style: solid;
        }

        .corner-tl { top: 12px; left: 12px; border-width: 2px 0 0 2px; }
        .corner-tr { top: 12px; right: 12px; border-width: 2px 2px 0 0; }
        .corner-bl { bottom: 12px; left: 12px; border-width: 0 0 2px 2px; }
        .corner-br { bottom: 12px; right: 12px; border-width: 0 2px 2px 0; }

        .virtual-prop {
          position: absolute;
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 42px;
          pointer-events: none;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        .sign-prop {
          background: rgba(255,255,255,0.9);
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          color: var(--rose-deep);
          font-family: 'DM Sans', sans-serif;
          top: 15%;
        }

        .flash-overlay {
          position: absolute;
          inset: 0;
          background: white;
          animation: flashIn 0.16s ease-out forwards;
          pointer-events: none;
          z-index: 10;
        }

        @keyframes flashIn {
          0% { opacity: 0.9; }
          100% { opacity: 0; }
        }

        .countdown-display {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(44,24,16,0.3);
          backdrop-filter: blur(2px);
          z-index: 5;
        }

        .countdown-num {
          font-family: 'Cormorant Garamond', serif;
          font-size: 96px;
          font-weight: 300;
          color: white;
          letter-spacing: -0.02em;
          line-height: 1;
          text-shadow: 0 4px 24px rgba(0,0,0,0.4);
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .countdown-snap {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          font-style: italic;
          color: white;
          text-shadow: 0 2px 12px rgba(0,0,0,0.4);
          animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .status-note {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          text-align: center;
          padding: 20px;
        }

        .status-note.error { color: #FFB3B0; }

        /* Film strip sidebar */
        .film-strip {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .film-slot {
          flex: 1;
          background: #1a0f0b;
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.3s;
        }

        .film-slot.filled {
          border-color: rgba(196,112,106,0.3);
        }

        .film-slot img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .film-slot-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .slot-num {
          font-size: 10px;
          color: rgba(255,255,255,0.2);
          font-weight: 300;
          letter-spacing: 0.08em;
        }

        .slot-icon {
          width: 20px; height: 16px;
          border: 1px dashed rgba(255,255,255,0.15);
          border-radius: 3px;
        }

        .hidden-canvas { display: none; }

        /* Error outside */
        .error-bar {
          background: #FEF0EF;
          border: 1px solid rgba(194,84,79,0.2);
          border-radius: var(--radius-sm);
          padding: 10px 14px;
          font-size: 12px;
          color: var(--rose-deep);
        }

        .divider-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          color: var(--text-soft);
          text-transform: uppercase;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .divider-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }

        .perm-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #2c1810 0%, #4a2520 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          z-index: 2;
        }

        .perm-icon {
          font-size: 32px;
          margin-bottom: 4px;
        }

        .perm-text {
          font-size: 13px;
          color: rgba(255,255,255,0.6);
          text-align: center;
          padding: 0 24px;
        }

        .mobile-controls {
          display: none;
        }

        .mobile-bottom-bar {
          display: none;
        }

        .mobile-sheet-backdrop {
          display: none;
        }

        .mobile-sheet {
          display: none;
        }

        .mobile-chip-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .mobile-advanced-btn {
          border: 1px solid var(--border-strong);
          background: var(--warm-white);
          border-radius: var(--radius-pill);
          min-height: 38px;
          padding: 8px 12px;
          color: var(--text-mid);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          text-align: center;
        }

        .mobile-advanced-panel {
          margin-top: 10px;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px;
          display: grid;
          gap: 10px;
          background: #fff;
        }

        @media (max-width: 980px) {
          .booth-root {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .studio {
            order: 1;
            padding: 20px;
            gap: 16px;
          }

          .sidebar {
            order: 2;
            border-right: none;
            border-top: 1px solid var(--border);
          }

          .viewfinder-card {
            max-height: min(68vh, 520px);
          }
        }

        @media (max-width: 760px) {
          .booth-root {
            overflow: visible;
          }

          .sidebar {
            display: none;
          }

          .studio {
            padding: 12px 12px calc(104px + env(safe-area-inset-bottom));
            gap: 10px;
          }

          .viewfinder-outer {
            flex: 0 0 auto;
            grid-template-columns: 1fr;
            gap: 8px;
            align-content: start;
          }

          .viewfinder-card {
            width: min(100%, 520px);
            margin-inline: auto;
            min-height: clamp(360px, 60svh, 620px);
            max-height: none;
          }

          .film-strip {
            width: min(100%, 520px);
            margin-inline: auto;
          }

          .film-strip {
            flex-direction: row;
            gap: 6px;
          }

          .film-slot {
            min-height: clamp(56px, 9.5svh, 82px);
          }

          .mobile-controls {
            display: block;
          }

          .mobile-bottom-bar {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 25;
            display: grid;
            grid-template-columns: auto auto 1fr;
            gap: 8px;
            padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
            background: rgba(253, 248, 245, 0.96);
            border-top: 1px solid var(--border);
            backdrop-filter: blur(8px);
            box-shadow: 0 -10px 22px rgba(155, 78, 73, 0.12);
          }

          .mobile-bar-btn {
            border: 1px solid var(--border-strong);
            background: #fff;
            color: var(--text-mid);
            border-radius: var(--radius-sm);
            min-height: 44px;
            padding: 0 12px;
            font-size: 12px;
            font-weight: 500;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            cursor: pointer;
            text-align: center;
            justify-content: center;
          }

          .mobile-bar-btn.active {
            border-color: var(--rose);
            color: var(--rose-deep);
            background: var(--blush);
          }

          .mobile-start-btn {
            min-height: 44px;
            border: 0;
            border-radius: var(--radius-sm);
            background: var(--rose);
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            text-align: center;
          }

          .mobile-start-btn:disabled {
            background: var(--blush-dark);
            cursor: not-allowed;
          }

          .mobile-sheet-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 30;
            background: rgba(44, 24, 16, 0.32);
          }

          .mobile-sheet {
            display: block;
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 31;
            background: #fff;
            border-radius: 16px 16px 0 0;
            border-top: 1px solid var(--border-strong);
            box-shadow: 0 -18px 30px rgba(155, 78, 73, 0.2);
            padding: 12px 12px calc(14px + env(safe-area-inset-bottom));
            max-height: min(58vh, 420px);
            overflow-y: auto;
          }

          .mobile-sheet-handle {
            width: 44px;
            height: 5px;
            border-radius: 999px;
            background: #dfc5bc;
            margin: 2px auto 10px;
          }

          .mobile-sheet-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
          }

          .mobile-sheet-title {
            margin: 0;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-soft);
            font-weight: 600;
          }

          .mobile-close-btn {
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--warm-white);
            color: var(--text-mid);
            font-size: 12px;
            min-height: 34px;
            padding: 0 10px;
            cursor: pointer;
            text-align: center;
          }

          .mobile-chip-grid .prop-btn,
          .mobile-chip-grid .filter-btn {
            width: 100%;
          }
        }

        @media (max-width: 560px) {
          .studio {
            padding: 12px;
            gap: 12px;
          }

          .studio-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }

          .studio-title {
            font-size: 22px;
          }

          .brand-name {
            font-size: 18px;
          }

          .brand-sub {
            font-size: 10px;
            margin-left: 14px;
          }

          .viewfinder-card {
            border-radius: 14px;
            aspect-ratio: 3 / 4;
            max-height: none;
            min-height: clamp(340px, 58svh, 560px);
          }

          .film-slot {
            min-height: 66px;
          }

          .mobile-bar-btn,
          .mobile-start-btn {
            font-size: 12px;
            min-height: 42px;
          }

          .filter-name {
            font-size: 10px;
          }

          .toggle-name {
            font-size: 13px;
          }
        }

        @media (max-width: 430px) {
          .studio {
            padding: 10px 10px calc(106px + env(safe-area-inset-bottom));
            gap: 8px;
          }

          .studio-header {
            gap: 4px;
          }

          .studio-title {
            font-size: 18px;
          }

          .viewfinder-card {
            min-height: clamp(350px, 61svh, 540px);
          }

          .mobile-bottom-bar {
            padding: 8px 10px calc(10px + env(safe-area-inset-bottom));
          }

          .mobile-bar-btn,
          .mobile-start-btn {
            font-size: 12px;
            min-height: 42px;
          }
        }

        @media (max-width: 400px) {
          .studio {
            padding: 10px 10px calc(112px + env(safe-area-inset-bottom));
            gap: 10px;
          }

          .studio-title {
            font-size: 19px;
          }

          .mobile-bottom-bar {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
            padding: 8px 10px calc(10px + env(safe-area-inset-bottom));
          }

          .mobile-start-btn {
            grid-column: 1 / -1;
          }

          .mobile-bar-btn,
          .mobile-start-btn {
            min-height: 40px;
            font-size: 11px;
            padding: 0 8px;
            letter-spacing: 0.04em;
          }

          .mobile-sheet {
            max-height: min(66vh, 460px);
            padding: 10px 10px calc(12px + env(safe-area-inset-bottom));
          }

          .mobile-sheet-title {
            font-size: 12px;
          }
        }

        @media (max-height: 480px) and (orientation: landscape) {
          .studio {
            padding-bottom: calc(96px + env(safe-area-inset-bottom));
          }

          .viewfinder-card {
            aspect-ratio: 16 / 9;
            min-height: min(52svh, 290px);
            max-height: 52svh;
          }

          .film-slot {
            min-height: 56px;
          }

          .mobile-sheet {
            max-height: 76vh;
          }
        }
      `}</style>

      <div className="booth-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="brand-mark">
              <div className="brand-dot" />
              <span className="brand-name">K-Booth</span>
            </div>
            <div className="brand-sub">Photo Studio</div>
          </div>

          <div className="phase-steps">
            <div className="phase-step active">
              <div className="step-num">1</div>
              <span className="step-label">Set your mood</span>
            </div>
            <div className={`phase-step ${isCapturing ? 'active' : ''}`}>
              <div className="step-num">2</div>
              <span className="step-label">Strike a pose</span>
            </div>
            <div className={`phase-step ${capturedPhotos.length === 4 ? 'active' : ''}`}>
              <div className="step-num">3</div>
              <span className="step-label">Collect your strip</span>
            </div>
          </div>

          <div className="controls-block">
            <div className="control-label">Settings</div>
            <div className="toggle-row">
              <span className="toggle-name">Flash</span>
              <button
                type="button"
                className={`toggle-pill ${flashEnabled ? 'on' : ''}`}
                onClick={() => setFlashEnabled(p => !p)}
                aria-label="Toggle flash"
              >
                <span />
              </button>
            </div>
            <div className="toggle-row">
              <span className="toggle-name">Auto Retouch</span>
              <button
                type="button"
                className={`toggle-pill ${autoRetouch ? 'on' : ''}`}
                onClick={() => setAutoRetouch(p => !p)}
                aria-label="Toggle retouch"
              >
                <span />
              </button>
            </div>
          </div>

          <div className="controls-block">
            <div className="control-label">Filter</div>
            <div className="filter-grid">
              {Object.entries(FILTERS).map(([key, f]) => (
                <button
                  key={key}
                  type="button"
                  className={`filter-btn ${selectedFilter === key ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(key)}
                  disabled={isCapturing}
                >
                  <span className="filter-icon">{f.emoji}</span>
                  <span className="filter-name">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="controls-block">
            <div className="control-label">Accessories</div>
            <div className="prop-grid">
              {VIRTUAL_PROPS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`prop-btn ${selectedProp === p.id ? 'active' : ''}`}
                  onClick={() => setSelectedProp(p.id)}
                >
                  <span style={{ fontSize: 13 }}>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="capture-wrap" style={{ marginTop: 'auto' }}>
            <div className="capture-hint">Pose for 4 automatic shots ✦</div>
            <button
              type="button"
              className="capture-btn"
              onClick={handleTakePhoto}
              disabled={isCapturing || permissionState !== 'granted'}
            >
              {isCapturing ? '✦ Capturing...' : '✦ Start Session'}
            </button>
          </div>
        </aside>

        {/* Main Studio */}
        <main className="studio">
          <div className="studio-header">
            <h1 className="studio-title">Your moment, captured.</h1>
            <div className="shot-counter" aria-label={`${capturedPhotos.length} of 4 shots taken`}>
              {[0,1,2,3].map(i => (
                <div key={i} className={`shot-dot ${i < capturedPhotos.length ? 'taken' : ''}`} />
              ))}
            </div>
          </div>

          <div className="viewfinder-outer">
            {/* Camera View */}
            <div className="viewfinder-card">
              {permissionState === 'pending' && (
                <div className="perm-overlay">
                  <div className="perm-icon">📷</div>
                  <div className="perm-text">Requesting camera access...</div>
                </div>
              )}
              {permissionState === 'denied' && (
                <div className="perm-overlay">
                  <div className="perm-icon">🔒</div>
                  <div className="perm-text">{error}</div>
                </div>
              )}

              <video
                ref={videoRef}
                className="live-video"
                autoPlay
                muted
                playsInline
                style={{
                  filter: `${FILTERS[selectedFilter].css}${autoRetouch ? ' brightness(1.06) saturate(1.08) contrast(1.05)' : ''}`,
                  transform: 'scaleX(-1)',
                }}
              />

              {/* Corner frame decoration */}
              <div className="viewfinder-frame" aria-hidden="true">
                <div className="corner corner-tl" />
                <div className="corner corner-tr" />
                <div className="corner corner-bl" />
                <div className="corner corner-br" />
              </div>

              {/* Virtual prop */}
              {selectedProp !== 'none' && (
                <div
                  className={`virtual-prop ${selectedProp === 'sign' ? 'sign-prop' : ''}`}
                  aria-hidden="true"
                >
                  {selectedProp === 'cat' && '😺'}
                  {selectedProp === 'bow' && '🎀'}
                  {selectedProp === 'frog' && '🐸'}
                  {selectedProp === 'sign' && 'Davao Vibes ✨'}
                </div>
              )}

              {/* Flash */}
              {flashFrame && <div className="flash-overlay" aria-hidden="true" />}

              {/* Countdown */}
              {countdown !== null && (
                <div className="countdown-display">
                  {countdown === 0
                    ? <div className="countdown-snap">Smile!</div>
                    : <div className="countdown-num">{countdown}</div>
                  }
                </div>
              )}
            </div>

            {/* Film strip */}
            <div className="film-strip" role="list" aria-label="Captured photos">
              {[0,1,2,3].map(i => {
                const photo = capturedPhotos[i]
                return (
                  <div key={i} className={`film-slot ${photo ? 'filled' : ''}`} role="listitem">
                    {photo
                      ? <img src={photo} alt={`Shot ${i+1}`} />
                      : (
                        <div className="film-slot-empty">
                          <div className="slot-icon" />
                          <div className="slot-num">0{i+1}</div>
                        </div>
                      )
                    }
                  </div>
                )
              })}
            </div>
          </div>

          {error && permissionState !== 'denied' && (
            <div className="error-bar" role="alert">{error}</div>
          )}

          <div className="mobile-controls" aria-hidden="true" />
        </main>
      </div>

      <div className="mobile-bottom-bar" role="toolbar" aria-label="Mobile camera actions">
        <button
          type="button"
          className={`mobile-bar-btn ${mobileSheet === 'filter' ? 'active' : ''}`}
          onClick={() => setMobileSheet((prev) => (prev === 'filter' ? null : 'filter'))}
          disabled={isCapturing}
        >
          Mood
        </button>
        <button
          type="button"
          className={`mobile-bar-btn ${mobileSheet === 'prop' ? 'active' : ''}`}
          onClick={() => setMobileSheet((prev) => (prev === 'prop' ? null : 'prop'))}
          disabled={isCapturing}
        >
          Accessories
        </button>
        <button
          type="button"
          className="mobile-start-btn"
          onClick={handleTakePhoto}
          disabled={isCapturing || permissionState !== 'granted'}
        >
          {isCapturing ? 'Capturing...' : 'Start Session'}
        </button>
      </div>

      {mobileSheet !== null && (
        <>
          <button
            type="button"
            className="mobile-sheet-backdrop"
            onClick={() => setMobileSheet(null)}
            aria-label="Close mobile controls"
          />
          <section className="mobile-sheet" aria-label="Mobile controls sheet">
            <div className="mobile-sheet-handle" aria-hidden="true" />
            <div className="mobile-sheet-head">
              <h2 className="mobile-sheet-title">{mobileSheet === 'filter' ? 'Mood Filters' : 'Accessories'}</h2>
              <button type="button" className="mobile-close-btn" onClick={() => setMobileSheet(null)}>
                Close
              </button>
            </div>

            {mobileSheet === 'filter' && (
              <div className="mobile-chip-grid">
                {Object.entries(FILTERS).map(([key, f]) => (
                  <button
                    key={key}
                    type="button"
                    className={`filter-btn ${selectedFilter === key ? 'active' : ''}`}
                    onClick={() => handleFilterSelect(key)}
                    disabled={isCapturing}
                  >
                    <span className="filter-icon">{f.emoji}</span>
                    <span className="filter-name">{f.label}</span>
                  </button>
                ))}
              </div>
            )}

            {mobileSheet === 'prop' && (
              <>
                <div className="mobile-chip-grid">
                  {VIRTUAL_PROPS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`prop-btn ${selectedProp === p.id ? 'active' : ''}`}
                      onClick={() => handlePropSelect(p.id)}
                    >
                      <span style={{ fontSize: 13 }}>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="mobile-advanced-btn"
                  onClick={() => setMobileAdvancedOpen((prev) => !prev)}
                >
                  {mobileAdvancedOpen ? 'Hide Advanced' : 'Advanced'}
                </button>

                {mobileAdvancedOpen && (
                  <div className="mobile-advanced-panel">
                    <div className="toggle-row">
                      <span className="toggle-name">Flash</span>
                      <button
                        type="button"
                        className={`toggle-pill ${flashEnabled ? 'on' : ''}`}
                        onClick={() => setFlashEnabled((p) => !p)}
                        aria-label="Toggle flash"
                      >
                        <span />
                      </button>
                    </div>
                    <div className="toggle-row">
                      <span className="toggle-name">Auto Retouch</span>
                      <button
                        type="button"
                        className={`toggle-pill ${autoRetouch ? 'on' : ''}`}
                        onClick={() => setAutoRetouch((p) => !p)}
                        aria-label="Toggle retouch"
                      >
                        <span />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />
      <audio ref={audioRef} src={SHUTTER_SOUND} preload="auto" />
    </>
  )
}

export default Camera