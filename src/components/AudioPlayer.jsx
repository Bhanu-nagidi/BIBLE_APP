import React, { useState, useRef, useEffect } from 'react'

// Book ID to canonical number mapping (1 = Genesis ... 66 = Revelation)
// This matches the audio file numbering on wordpocket.org and wordproaudio.net
const BOOK_NUMBER = {
  'GEN': 1, 'EXO': 2, 'LEV': 3, 'NUM': 4, 'DEU': 5,
  'JOS': 6, 'JDG': 7, 'RUT': 8, '1SA': 9, '2SA': 10,
  '1KI': 11, '2KI': 12, '1CH': 13, '2CH': 14, 'EZR': 15,
  'NEH': 16, 'EST': 17, 'JOB': 18, 'PSA': 19, 'PRO': 20,
  'ECC': 21, 'SNG': 22, 'ISA': 23, 'JER': 24, 'LAM': 25,
  'EZK': 26, 'DAN': 27, 'HOS': 28, 'JOL': 29, 'AMO': 30,
  'OBA': 31, 'JON': 32, 'MIC': 33, 'NAM': 34, 'HAB': 35,
  'ZEP': 36, 'HAG': 37, 'ZEC': 38, 'MAL': 39,
  'MAT': 40, 'MRK': 41, 'LUK': 42, 'JHN': 43, 'ACT': 44,
  'ROM': 45, '1CO': 46, '2CO': 47, 'GAL': 48, 'EPH': 49,
  'PHP': 50, 'COL': 51, '1TH': 52, '2TH': 53, '1TI': 54,
  '2TI': 55, 'TIT': 56, 'PHM': 57, 'HEB': 58, 'JAS': 59,
  '1PE': 60, '2PE': 61, '1JN': 62, '2JN': 63, '3JN': 64,
  'JUD': 65, 'REV': 66,
}

// Language code → audio host and version number
// wordpocket.org hosts English KJV (version 1)
// wordproaudio.net hosts Indian language audio (different version numbers)
const AUDIO_CONFIG = {
  'en': { host: 'https://www.wordpocket.org', version: 1, label: 'KJV Audio' },
  'hi': { host: 'https://www.wordproaudio.net', version: 3, label: 'Hindi Audio' },
  'te': { host: 'https://www.wordproaudio.net', version: 29, label: 'Telugu Audio' },
  'ta': { host: 'https://www.wordproaudio.net', version: 30, label: 'Tamil Audio' },
  'ml': { host: 'https://www.wordproaudio.net', version: 25, label: 'Malayalam Audio' },
  'kn': { host: 'https://www.wordproaudio.net', version: 24, label: 'Kannada Audio' },
  'bn': { host: 'https://www.wordproaudio.net', version: 22, label: 'Bengali Audio' },
  'gu': { host: 'https://www.wordproaudio.net', version: 23, label: 'Gujarati Audio' },
  'pa': { host: 'https://www.wordproaudio.net', version: 27, label: 'Punjabi Audio' },
  'or': { host: 'https://www.wordproaudio.net', version: 26, label: 'Odia Audio' },
}

function getAudioUrl(bookId, chapter, langCode) {
  const bookNum = BOOK_NUMBER[bookId] || BOOK_NUMBER['JHN']
  const config = AUDIO_CONFIG[langCode] || AUDIO_CONFIG['en']
  return `${config.host}/bibles/app/audio/${config.version}/${bookNum}/${chapter}.mp3`
}

export default function AudioPlayer({ book, chapter, language }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const audioRef = useRef(null)

  const langCode = language?.code || 'en'
  const audioConfig = AUDIO_CONFIG[langCode] || AUDIO_CONFIG['en']
  const audioUrl = getAudioUrl(book?.id, chapter, langCode)

  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    setDuration(0)
    setError(false)
    setLoading(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.load()
    }
  }, [book, chapter, langCode])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      setLoading(true)
      audioRef.current.play()
        .then(() => {
          setPlaying(true)
          setLoading(false)
        })
        .catch(() => {
          setError(true)
          setPlaying(false)
          setLoading(false)
        })
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setProgress(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
    if (audioRef.current.playbackRate !== speed) {
      audioRef.current.playbackRate = speed
    }
  }

  const handleSeek = (e) => {
    const pct = e.target.value / 100
    const newTime = pct * duration
    audioRef.current.currentTime = newTime
    setProgress(newTime)
  }

  const handleEnded = () => {
    setPlaying(false)
    setProgress(0)
  }

  const handleError = () => {
    setError(true)
    setPlaying(false)
    setLoading(false)
  }

  const handleCanPlay = () => {
    setError(false)
    setLoading(false)
  }

  const changeSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2]
    const idx = speeds.indexOf(speed)
    const next = speeds[(idx + 1) % speeds.length]
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progressPct = duration ? (progress / duration * 100) : 0

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />

      {/* Play / Pause Button */}
      <button
        onClick={togglePlay}
        disabled={error}
        style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: error
            ? 'rgba(255,255,255,0.08)'
            : 'linear-gradient(135deg, var(--accent-gold), var(--accent-amber))',
          border: 'none', cursor: error ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', flexShrink: 0, transition: 'opacity 0.2s',
          opacity: error ? 0.5 : 1,
        }}
      >
        {loading ? '⏳' : playing ? '⏸' : '▶'}
      </button>

      <div style={{ flex: 1 }}>
        {/* Top row: title + speed */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {error
              ? '⚠ Audio unavailable for this chapter'
              : `${book?.name} ${chapter} • ${audioConfig.label}`}
          </span>
          <button
            onClick={changeSpeed}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-subtle)',
              borderRadius: '4px', padding: '1px 6px', color: 'var(--accent-gold)',
              fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700,
            }}
          >
            {speed}×
          </button>
        </div>

        {/* Progress bar */}
        {!error && (
          <>
            <input
              type="range"
              min="0"
              max="100"
              value={progressPct}
              onChange={handleSeek}
              style={{ width: '100%', accentColor: 'var(--accent-gold)', height: '3px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{fmt(progress)}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{duration ? fmt(duration) : '--:--'}</span>
            </div>
          </>
        )}

        {error && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Audio not available for this chapter in the selected language.
          </p>
        )}
      </div>
    </div>
  )
}
