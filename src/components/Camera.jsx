import { useEffect, useRef, useState } from 'react'

const FILTERS = {
  none: { label: 'Original', emoji: '🫧', css: 'none' },
  warm: {
    label: 'Warm',
    emoji: '🍑',
    css: 'saturate(1.15) contrast(1.08) brightness(1.04)',
  },
  vintage: {
    label: 'Vintage',
    emoji: '📼',
    css: 'sepia(0.45) contrast(1.2) saturate(0.85)',
  },
  bw: { label: 'B&W', emoji: '🖤', css: 'grayscale(1) contrast(1.15)' },
}

const COUNTDOWN_MASCOT = {
  3: '🐻 3',
  2: '🐻 2',
  1: '🐻 1',
  0: '🐻 SNAP!',
}

const VIRTUAL_PROPS = [
  { id: 'none', label: 'None', icon: '🫧' },
  { id: 'cat', label: 'Cat Ears', icon: '🐱' },
  { id: 'bow', label: 'Bow', icon: '🎀' },
  { id: 'frog', label: 'Frog Hat', icon: '🐸' },
  { id: 'sign', label: 'Cute Sign', icon: '💬' },
]

const SHUTTER_SOUND =
  'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQ4AAAAAABQAKABQAHgAoADIAOgA8AD4A'

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

  useEffect(() => {
    let isMounted = true

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setPermissionState('granted')
      } catch (cameraError) {
        setPermissionState('denied')
        setError(
          'Camera access was blocked. Please allow camera permissions and refresh.',
        )
      }
    }

    startCamera()

    return () => {
      isMounted = false
      timersRef.current.forEach((timerId) => clearTimeout(timerId))
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const queueTimeout = (callback, delay) => {
    const timerId = window.setTimeout(callback, delay)
    timersRef.current.push(timerId)
  }

  const playShutter = () => {
    if (!audioRef.current) {
      return
    }

    audioRef.current.currentTime = 0
    void audioRef.current.play().catch(() => {
      // Audio play can fail when browser blocks autoplay.
    })
  }

  const snapFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      return null
    }

    const width = video.videoWidth
    const height = video.videoHeight
    if (!width || !height) {
      return null
    }

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return null
    }

    ctx.filter = FILTERS[selectedFilter].css
    if (autoRetouch) {
      ctx.filter = `${ctx.filter} brightness(1.07) saturate(1.08) contrast(1.05)`
    }
    ctx.save()
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, width, height)
    ctx.restore()

    return canvas.toDataURL('image/jpeg', 0.94)
  }

  const runCaptureSequence = (shotIndex, collected) => {
    if (shotIndex >= 4) {
      setCountdown(null)
      setIsCapturing(false)
      onComplete(collected)
      return
    }

    const runCountdown = (seconds) => {
      setCountdown(seconds)
      if (seconds === 0) {
        if (flashEnabled) {
          setFlashFrame(true)
          queueTimeout(() => setFlashFrame(false), 160)
        }
        playShutter()
        const nextPhoto = snapFrame()
        if (nextPhoto) {
          const nextSet = [...collected, nextPhoto]
          setCapturedPhotos(nextSet)
          queueTimeout(() => runCaptureSequence(shotIndex + 1, nextSet), 450)
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
    if (isCapturing || permissionState !== 'granted') {
      return
    }

    setError('')
    setCapturedPhotos([])
    setIsCapturing(true)
    runCaptureSequence(0, [])
  }

  return (
    <section className="step-panel booth-panel camera-dashboard">
      <aside className="control-tower booth-shell">
        <div className="tower-head">
          <p className="tower-logo">K-BOOTH</p>
          <h2>Studio Controls</h2>
          <p>Everything stays above the fold for a real dashboard feel.</p>
        </div>

        <div className="phase-rail" aria-hidden="true">
          <span className="active">1. Mood</span>
          <span className={isCapturing ? 'active' : ''}>2. Capture</span>
          <span className={capturedPhotos.length === 4 ? 'active' : ''}>3. Strip</span>
        </div>

        <p className="camera-tip">Tap start and pose. The booth auto-snaps 4 shots.</p>

        <div className="dashboard-panel">
          <div className="switch-module">
            <p>Flash</p>
            <button
              type="button"
              className={`toggle-switch ${flashEnabled ? 'on' : ''}`}
              onClick={() => setFlashEnabled((prev) => !prev)}
            >
              <span />
            </button>
          </div>

          <button
            type="button"
            className="start-btn"
            onClick={handleTakePhoto}
            disabled={isCapturing || permissionState !== 'granted'}
          >
            {isCapturing ? 'CAPTURING' : 'START'}
          </button>

          <div className="switch-module">
            <p>Retouch</p>
            <button
              type="button"
              className={`toggle-switch ${autoRetouch ? 'on' : ''}`}
              onClick={() => setAutoRetouch((prev) => !prev)}
            >
              <span />
            </button>
          </div>
        </div>

        <div className="control-cards">
          <div className="mini-card">
            <h3>Filters</h3>
            <div className="filter-picker dense-grid">
              {Object.entries(FILTERS).map(([key, filterDef]) => (
                <button
                  key={key}
                  type="button"
                  className={`filter-chip ${selectedFilter === key ? 'active' : ''}`}
                  onClick={() => setSelectedFilter(key)}
                  disabled={isCapturing}
                >
                  <span aria-hidden="true">{filterDef.emoji}</span>
                  <span>{filterDef.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mini-card">
            <h3>Accessories</h3>
            <div className="prop-picker dense-grid" aria-label="Virtual props">
              {VIRTUAL_PROPS.map((prop) => (
                <button
                  key={prop.id}
                  type="button"
                  className={`prop-chip ${selectedProp === prop.id ? 'active' : ''}`}
                  onClick={() => setSelectedProp(prop.id)}
                >
                  <span aria-hidden="true">{prop.icon}</span>
                  <span>{prop.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="coin-slot" aria-hidden="true">
          <span />
        </div>
      </aside>

      <div className="studio-view booth-shell">
        <div className="heart-particles" aria-hidden="true">
          <span>❤</span>
          <span>♡</span>
          <span>❤</span>
          <span>♡</span>
          <span>❤</span>
        </div>

        <div className="neon-sign" aria-hidden="true">
          SMILE!
        </div>

        <div className={`viewfinder-wrap ${isCapturing ? 'session-live' : ''}`}>
          <div className="curtain curtain-left" aria-hidden="true" />
          <div className="curtain curtain-right" aria-hidden="true" />

          <div className="video-stage">
            {permissionState === 'pending' && (
              <p className="status-note">Requesting camera permission...</p>
            )}
            {permissionState === 'denied' && <p className="status-note error">{error}</p>}

            <video
              ref={videoRef}
              className="live-video"
              autoPlay
              muted
              playsInline
              style={{
                filter: `${FILTERS[selectedFilter].css} ${
                  autoRetouch ? 'brightness(1.06) saturate(1.08) contrast(1.05)' : ''
                }`,
              }}
            />

            {selectedProp !== 'none' && (
              <div className={`virtual-prop prop-${selectedProp}`} aria-hidden="true">
                {selectedProp === 'cat' && '😺'}
                {selectedProp === 'bow' && '🎀'}
                {selectedProp === 'frog' && '🐸'}
                {selectedProp === 'sign' && 'Davao Vibes'}
              </div>
            )}

            <div className="beauty-glow" aria-hidden="true" />
            {flashFrame && <div className="flash-overlay" aria-hidden="true" />}

            {countdown !== null && (
              <div className="countdown-badge mascot-countdown">
                {COUNTDOWN_MASCOT[countdown]}
              </div>
            )}
          </div>

          <aside className="shot-rail" aria-label="Shots taken">
            {[0, 1, 2, 3].map((slotIndex) => {
              const photo = capturedPhotos[slotIndex]
              return (
                <div key={slotIndex} className={`shot-pill ${photo ? 'filled' : ''}`}>
                  {photo ? <img src={photo} alt={`Shot ${slotIndex + 1}`} /> : <span>#{slotIndex + 1}</span>}
                </div>
              )
            })}
          </aside>
        </div>

        <div className={`film-slot ${capturedPhotos.length > 0 ? 'loaded' : ''}`} aria-live="polite">
          {capturedPhotos.length === 0 && <p>Film strip will emerge here...</p>}
          {capturedPhotos.length > 0 && (
            <div className="preview-row">
              {capturedPhotos.map((photo, index) => (
                <img key={photo} src={photo} alt={`Capture ${index + 1}`} />
              ))}
            </div>
          )}
        </div>

        {error && permissionState !== 'denied' && <p className="status-note error">{error}</p>}
      </div>

      <canvas ref={canvasRef} className="hidden-canvas" aria-hidden="true" />

      <audio ref={audioRef} src={SHUTTER_SOUND} preload="auto" />
    </section>
  )
}

export default Camera
