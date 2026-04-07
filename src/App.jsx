import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import Camera from './components/Camera'
import PhotoStrip from './components/PhotoStrip'
import './App.css'

function App() {
  const stripRef = useRef(null)
  const [step, setStep] = useState('camera')
  const [photos, setPhotos] = useState([])

  const onCaptureComplete = (capturedPhotos) => {
    setPhotos(capturedPhotos)
    setStep('customize')
  }

  const handleRetake = () => {
    setPhotos([])
    setStep('camera')
  }

  const handleDownload = async () => {
    if (!stripRef.current) {
      return
    }

    const canvas = await html2canvas(stripRef.current, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
    })

    const downloadLink = document.createElement('a')
    downloadLink.href = canvas.toDataURL('image/png')
    downloadLink.download = `k-style-photobooth-${Date.now()}.png`
    downloadLink.click()
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`app-shell ${step === 'camera' ? 'camera-mode' : ''}`}>
      <div className="bg-deco deco-a" aria-hidden="true" />
      <div className="bg-deco deco-b" aria-hidden="true" />
      <div className="bg-deco deco-c" aria-hidden="true" />

      <header className="app-header">
        <p className="kicker">Mobile Self-Photo Studio</p>
        <h1>Playful Photobooth Strip Maker</h1>
        <p>
          Flow: camera + filters, auto-capture, strip customization, then print or download.
        </p>
      </header>

      <main className="stage-wrap">
        <div className="step-indicator">
          <span className={step === 'camera' ? 'active' : ''}>1. Camera Mood</span>
          <span className={step === 'customize' ? 'active' : ''}>2. Decorate + Export</span>
        </div>

        <div className="transition-panel">
          {step === 'camera' && <Camera onComplete={onCaptureComplete} />}
          {step === 'customize' && photos.length === 4 && <PhotoStrip ref={stripRef} photos={photos} />}
        </div>

        {step === 'customize' && photos.length === 4 && (
          <div className="action-row no-print">
            <button type="button" className="secondary-btn" onClick={handleRetake}>
              Retake
            </button>
            <button type="button" className="primary-btn" onClick={handleDownload}>
              Download Strip
            </button>
            <button type="button" className="secondary-btn" onClick={handlePrint}>
              Print 2 x 6 in
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
