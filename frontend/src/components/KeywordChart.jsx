function KeywordChart({ analysis, result }) {
    const matchedCount = analysis?.keywords?.matched?.length ?? 0
    const total = analysis?.keywords?.total ?? 0
    const percent = total > 0 ? Math.round((matchedCount / total) * 100) : 0

    const preScore = result?.pre_score?.matched ?? null
    const postScore = result?.post_score?.matched ?? null
    const delta = preScore !== null && postScore !== null ? postScore - preScore : null

    // half donut math
    const radius = 46
    const circumference = Math.PI * radius
    const offset = total > 0 ? circumference * (1 - matchedCount / total) : circumference

    return (
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-white)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.14em', color: 'var(--ink-ghost)', textTransform: 'uppercase', marginBottom: '10px' }}>
                keyword match
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <svg viewBox="0 0 110 64" width="110" height="64">
                    <path d="M10,60 A46,46 0 0,1 100,60" fill="none" stroke="#f0eee9" strokeWidth="9" strokeLinecap="round" />
                    <path
                        d="M10,60 A46,46 0 0,1 100,60"
                        fill="none"
                        stroke="#0a0a0a"
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                    <text x="55" y="56" textAnchor="middle" fill="#0a0a0a" fontFamily="Cormorant Garamond" fontSize="18" fontWeight="600">
                        {total > 0 ? `${matchedCount} / ${total}` : '— / —'}
                    </text>
                </svg>

                <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                        {total > 0 ? `${percent}%` : '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: 'var(--ink-ghost)', marginTop: '4px', lineHeight: 1.5 }}>
                        keywords matched<br />after tailoring
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px', marginTop: '12px' }}>
                <div style={{ background: '#f4f3f0', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--ink-ghost)', lineHeight: 1 }}>
                        {preScore ?? '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-ghost)', marginTop: '4px' }}>
                        pre score
                    </div>
                </div>

                <div style={{ background: 'var(--ink)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--bg-solid)', lineHeight: 1 }}>
                        {postScore ?? '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#555', marginTop: '4px' }}>
                        post score
                    </div>
                </div>

                <div style={{ background: '#f4f3f0', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>
                        {delta !== null ? `+${delta}` : '—'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: '4px' }}>
                        delta
                    </div>
                </div>
            </div>
        </div>
    )
}

export default KeywordChart