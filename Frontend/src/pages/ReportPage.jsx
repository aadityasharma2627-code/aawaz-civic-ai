import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SECTORS } from '../data/sectors'
import { createComplaint } from '../api/complaints'
import { ApiError } from '../api/client'
import { savePendingComplaint, getPendingCount } from '../services/offline/queue'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { friendlyError } from '../utils/friendlyError'

const LANGUAGES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'en', label: 'English / Hinglish' },
]

export default function ReportPage() {
  const navigate = useNavigate()

  const [text, setText] = useState('')
  const [sector, setSector] = useState(SECTORS[0])
  const [language, setLanguage] = useState('hi')
  const [photo, setPhoto] = useState(null)
  const [location, setLocation] = useState(null)
  const [locMsg, setLocMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [offlineSaved, setOfflineSaved] = useState(null)

  // Keep a ref of the textarea value so the voice callback never works with stale text.
  const textRef = useRef(text)
  useEffect(() => { textRef.current = text }, [text])
  const baseRef = useRef('')

  const handleVoiceResult = useCallback((transcript, isFinal) => {
    setText(baseRef.current + transcript)
    if (isFinal) baseRef.current += transcript
  }, [])

  const voice = useSpeechRecognition({ lang: 'hi-IN', onResult: handleVoiceResult })

  const toggleVoice = () => {
    if (voice.listening) {
      voice.stop()
    } else {
      setError('')
      baseRef.current = textRef.current
      voice.start()
    }
  }

  const onPhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('That photo is too large. Please choose an image under 5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => { setPhoto(reader.result); setError('') }
    reader.onerror = () => setError('Could not read that photo. Please try another one.')
    reader.readAsDataURL(file)
  }

  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocMsg('Location is not available on this device. The selected sector will be used.')
      return
    }
    setLocMsg('Detecting your location…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocMsg('Location attached. It will be included with your complaint.')
      },
      () => {
        setLocation(null)
        setLocMsg('Could not get your location. The selected sector will be used.')
      },
      { timeout: 8000 }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      setError('Please describe the problem first.')
      return
    }
    setError('')
    setSubmitting(true)

    const payload = {
      text: text.trim(),
      language,
      sector,
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      photo,
    }

    try {
      const data = await createComplaint(payload)
      navigate('/report/success', { state: { result: data } })
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) {
        // Offline: save locally. Clearly distinct from a server submission.
        const localId = await savePendingComplaint(payload)
        setOfflineSaved({ localId, pendingCount: await getPendingCount() })
      } else {
        setError(friendlyError(err))
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (offlineSaved) {
    return (
      <div className="card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <h1 className="page-title">Saved on this device</h1>
        <div className="success-box">
          You're offline. Your complaint has been saved on this device and will be sent
          automatically when your connection returns.
        </div>
        <p className="muted">
          Pending complaints on this device: <strong>{offlineSaved.pendingCount}</strong>
        </p>
        <p className="muted" style={{ fontSize: '0.88rem' }}>
          Note: this complaint has <em>not</em> reached the server yet — it is stored safely on
          this device only.
        </p>
        <div className="stack-row">
          <button className="btn btn-outline" onClick={() => navigate('/')}>Back home</button>
          <button
            className="btn btn-outline"
            onClick={() => { setOfflineSaved(null); setText(''); setPhoto(null); setLocation(null) }}
          >
            Report another problem
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="page-title">Report a Problem</h1>
      <p className="page-sub">Speak in Hindi, Punjabi or English — or type. Awaaz will do the rest.</p>

      {error && <div className="error-box" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="description">What is the problem?</label>
          <textarea
            id="description"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Sector 22 mein road par bada gadda hai"
            required
          />
        </div>

        <div className="field">
          <span className="voice-row">
            <button
              type="button"
              className={`btn ${voice.listening ? 'btn-danger-soft' : 'btn-outline'}`}
              onClick={toggleVoice}
              aria-pressed={voice.listening}
            >
              {voice.listening ? 'Stop' : '🎙 Speak'}
            </button>
            {voice.listening && <span className="voice-status listening">Listening…</span>}
          </span>
          {!voice.supported && (
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8, marginBottom: 0 }}>
              Voice input isn't supported in this browser. You can type instead.
            </p>
          )}
          {voice.error === 'not-allowed' && (
            <p className="muted" style={{ fontSize: '0.85rem', marginTop: 8, marginBottom: 0 }}>
              Microphone permission was denied. You can type instead.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="photo">Photo <span className="hint">optional</span></label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoChange}
            aria-describedby="photo-hint"
          />
          <p id="photo-hint" className="muted" style={{ fontSize: '0.82rem', marginTop: 6, marginBottom: 0 }}>
            Add a photo of the problem to help the department.
          </p>
          {photo && (
            <div className="photo-preview">
              <img src={photo} alt="Preview of the uploaded photo" />
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setPhoto(null)}>
                Remove photo
              </button>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="sector">Sector</label>
            <select id="sector" value={sector} onChange={(e) => setSector(e.target.value)}>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="language">Language</label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <span className="voice-row">
            <button type="button" className="btn btn-outline btn-sm" onClick={detectLocation}>
              Use my location
            </button>
            {location && (
              <>
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </span>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setLocation(null)}>
                  Remove
                </button>
              </>
            )}
          </span>
          {locMsg && <p className="muted" style={{ fontSize: '0.82rem', marginTop: 8, marginBottom: 0 }}>{locMsg}</p>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Analyzing…' : 'Analyze Complaint'}
        </button>
      </form>
    </div>
  )
}
