import { useState } from 'react'
import JDInput from './components/JDInput'
import KeywordChart from './components/KeywordChart'
import ProjectScores from './components/ProjectScores'

function App() {
  const [jdText, setJdText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bullets, setBullets] = useState({ aktis: 6, pactera: 2, bosch: 3 })

  const handleAnalyze = async () => {
    if (!jdText.trim()) return
    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText })
      })
      setAnalysis(await res.json())
    } catch (err) { console.error(err) }
  }

  const handleGenerate = async () => {
    if (!jdText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          aktis_bullets: bullets.aktis,
          pactera_bullets: bullets.pactera,
          bosch_bullets: bullets.bosch,
        })
      })
      setResult(await res.json())
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleDownload = (filename) => {
    if (filename) window.open(`/download/${filename}`, '_blank')
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '14px',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.5)',
      boxShadow: '0 8px 48px rgba(0,0,0,0.12)',
    }}>

      {/* Topbar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        background: '#1a1a1a',
        borderBottom: '1px solid #1a1a1a',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: '#f8f7f4', letterSpacing: '-0.01em' }}>
          resume<em style={{ fontStyle: 'italic', color: '#951515ff' }}>.</em>tool
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#333', letterSpacing: '0.08em' }}>
            POWERED BY CLAUDE SONNET
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '10px',
            color: '#2a2a2a', letterSpacing: '0.05em',
            background: '#111', border: '1px solid #222',
            padding: '4px 10px', borderRadius: '20px',
          }}>
            ● 8000
          </div>
        </div>
      </div>

      {/* Body — two columns */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'row' }}>

        {/* Left */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.04) 60%, rgba(255,255,255,0.12) 100%)',
          }} />
          <JDInput
            jdText={jdText}
            setJdText={setJdText}
            analysis={analysis}
            result={result}
          />
        </div>

        {/* Right */}
        <div style={{
          flex: 1, minWidth: 0,
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-solid)',
        }}>
          <KeywordChart analysis={analysis} result={result} />
          <ProjectScores analysis={analysis} />
        </div>

      </div>

      {/* Unified bottom bar */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
      }}>

        {/* Left — actions */}
        <button onClick={handleAnalyze} style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(0,0,0,0.1)',
          color: 'rgba(0,0,0,0.5)',
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          letterSpacing: '0.07em',
          padding: '8px 16px',
          borderRadius: '7px',
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          → ANALYZE
        </button>

        <button onClick={handleGenerate} disabled={loading} style={{
          background: loading ? '#888' : '#0a0a0a',
          border: 'none',
          color: '#f8f7f4',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          fontWeight: 500,
          padding: '8px 20px',
          borderRadius: '7px',
          cursor: loading ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}>
          {loading ? 'Generating...' : 'Generate PDFs'}
        </button>

        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '10px',
          color: 'rgba(0,0,0,0.2)', marginLeft: '4px',
        }}>
          {jdText.length.toLocaleString()} chars
        </span>

        {/* Bullet count controls */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontFamily: 'var(--font-mono)', fontSize: '9px',
          color: 'rgba(0,0,0,0.4)', letterSpacing: '0.06em',
          marginLeft: '12px',
        }}>
          <span>BULLETS</span>
          <BulletInput label="A" value={bullets.aktis} onChange={v => setBullets({ ...bullets, aktis: v })} />
          <BulletInput label="P" value={bullets.pactera} onChange={v => setBullets({ ...bullets, pactera: v })} />
          <BulletInput label="B" value={bullets.bosch} onChange={v => setBullets({ ...bullets, bosch: v })} />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right — downloads */}
        <button
          onClick={() => handleDownload(result?.resume_pdf)}
          disabled={!result}
          style={{
            background: result ? '#0a0a0a' : 'var(--bg-muted)',
            border: '1px solid var(--border)',
            color: result ? '#f8f7f4' : 'var(--ink-ghost)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            padding: '8px 16px',
            borderRadius: '7px',
            cursor: result ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}>
          ↓ RESUME PDF
        </button>

        <button
          onClick={() => handleDownload(result?.cover_letter_pdf)}
          disabled={!result}
          style={{
            background: result ? '#0a0a0a' : 'var(--bg-muted)',
            border: '1px solid var(--border)',
            color: result ? '#f8f7f4' : 'var(--ink-ghost)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            padding: '8px 16px',
            borderRadius: '7px',
            cursor: result ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}>
          ↓ COVER LETTER
        </button>
        <button
          onClick={() => handleDownload(result?.resume_docx)}
          disabled={!result?.resume_docx}
          style={{
            background: result?.resume_docx ? '#0a0a0a' : 'var(--bg-muted)',
            border: '1px solid var(--border)',
            color: result?.resume_docx ? '#f8f7f4' : 'var(--ink-ghost)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.06em',
            padding: '8px 16px',
            borderRadius: '7px',
            cursor: result?.resume_docx ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}>
          ↓ RESUME DOCX
        </button>
      </div>

    </div>
  )
}
function BulletInput({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      <span style={{ color: 'rgba(0,0,0,0.35)' }}>{label}</span>
      <input
        type="number"
        min="1"
        max="8"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '44px',
          padding: '4px 4px 4px 8px',
          background: 'rgba(255,255,255,0.5)',
          border: '1px solid rgba(0,0,0,0.1)',
          borderRadius: '5px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: 'rgba(0,0,0,0.7)',
          textAlign: 'left',
          outline: 'none',
        }}
      />
    </div>
  )
}

export default App