import { useCallback, useEffect, useRef, useState } from 'react'

// Browser Speech Recognition wrapper.
// Primary language is Hindi (hi-IN); the lang option can override it.
// onResult(transcript, isFinal) - transcript is the full session transcript.

export function useSpeechRecognition({ lang = 'hi-IN', onResult } = {}) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState(null)
  const recRef = useRef(null)
  const onResultRef = useRef(onResult)
  onResultRef.current = onResult

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(Boolean(SR))
    return () => {
      recRef.current?.abort?.()
    }
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setError(null)
    const rec = new SR()
    rec.lang = lang
    rec.interimResults = true
    rec.continuous = false

    rec.onresult = (event) => {
      let transcript = ''
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript
      }
      const isFinal = event.results[event.results.length - 1].isFinal
      onResultRef.current?.(transcript, isFinal)
    }
    rec.onerror = (event) => {
      setError(event.error || 'speech-error')
      setListening(false)
    }
    rec.onend = () => setListening(false)

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [lang])

  const stop = useCallback(() => {
    try {
      recRef.current?.stop()
    } catch {
      /* already stopped */
    }
    setListening(false)
  }, [])

  return { supported, listening, start, stop, error }
}
