function JDInput({ jdText, setJdText, analysis, result }) {
    const matched = analysis?.keywords?.matched ?? []
    const missing = analysis?.keywords?.missing ?? []
    const postMatched = result?.post_matched_keywords ?? []
    const allChips = [
        ...matched.map(k => ({ word: k, status: 'matched' })),
        ...missing.map(k => ({ word: k, status: postMatched.includes(k) ? 'added' : 'missing' })),
    ]

    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            position: 'relative', zIndex: 1,
        }}>
            <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px',
                letterSpacing: '0.14em', color: 'rgba(0,0,0,0.25)',
                textTransform: 'uppercase', padding: '14px 20px 8px',
            }}>
                job description
            </div>

            <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder={"Paste job description here — LinkedIn, Indeed, raw text, anything.. "}
                style={{
                    flex: 1, background: 'transparent', border: 'none',
                    resize: 'none', color: 'rgba(10,10,10,0.75)',
                    fontFamily: 'var(--font-body)', fontSize: '13px',
                    lineHeight: 1.8, padding: '0 20px 12px', outline: 'none',
                }}
            />

            {allChips.length > 0 && (
                <div style={{ padding: '0 20px 14px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {allChips.map(({ word, status }, i) => (
                        <span key={`${word}-${i}`} style={{
                            fontFamily: 'var(--font-mono)', fontSize: '9px',
                            padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.04em',
                            background:
                                status === 'matched' ? 'rgba(10,10,10,0.85)' :
                                    status === 'added' ? 'rgba(0,110,55,0.88)' :
                                        'rgba(255,255,255,0.3)',
                            color:
                                status === 'matched' ? 'rgba(248,247,244,0.95)' :
                                    status === 'added' ? '#fff' : 'rgba(0,0,0,0.25)',
                            border: (status === 'matched' || status === 'added') ? 'none' : '1px solid rgba(0,0,0,0.08)',
                        }}>
                            {word}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default JDInput