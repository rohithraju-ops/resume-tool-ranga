import { useState } from 'react'

function ProjectScores({ analysis }) {
    const projects = analysis?.projects ?? []
    const sorted = [...projects].sort((a, b) => b.score - a.score)
    const top5 = sorted.slice(0, 5)
    const rest = sorted.slice(5)
    const maxScore = sorted[0]?.score || 1

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{
                flexShrink: 0,
                fontFamily: 'var(--font-mono)', fontSize: '9px',
                letterSpacing: '0.14em', color: 'var(--ink-ghost)',
                textTransform: 'uppercase', padding: '12px 20px 8px',
            }}>
                03 — project ranking
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {sorted.length === 0 ? (
                    [...Array(8)].map((_, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 20px', borderBottom: '1px solid var(--border-light)',
                        }}>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', width: '16px' }}>
                                {String(i + 1).padStart(2, '0')}
                            </div>
                            <div style={{ flex: 1, height: '8px', background: 'var(--border-light)', borderRadius: '2px' }} />
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', width: '24px', textAlign: 'right' }}>—</div>
                        </div>
                    ))
                ) : (
                    <>
                        {top5.map((p, i) => <Row key={p.name} rank={i + 1} project={p} maxScore={maxScore} active />)}
                        {rest.map((p, i) => <Row key={p.name} rank={i + 6} project={p} maxScore={maxScore} active={false} />)}
                    </>
                )}
            </div>
        </div>
    )
}

function Row({ rank, project, maxScore, active }) {
    const [hovered, setHovered] = useState(false)
    const barWidth = Math.round((project.score / maxScore) * 100)

    return (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 20px', borderBottom: '1px solid var(--border-light)',
                opacity: active ? 1 : 0.3, position: 'relative',
            }}
        >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', width: '16px', flexShrink: 0 }}>
                {String(rank).padStart(2, '0')}
            </div>
            <div style={{
                fontFamily: 'var(--font-body)', fontSize: '12px',
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--ink)' : 'var(--ink-ghost)',
                flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
                {project.name}
            </div>
            <div style={{ width: '56px', height: '3px', background: 'var(--border)', borderRadius: '2px', flexShrink: 0 }}>
                <div style={{ width: `${barWidth}%`, height: '3px', borderRadius: '2px', background: active ? 'var(--ink)' : 'var(--border)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: active ? 'var(--ink)' : 'var(--ink-ghost)', width: '24px', textAlign: 'right', flexShrink: 0 }}>
                {project.score}
            </div>

            {hovered && active && project.tech_matches?.length > 0 && (
                <div style={{
                    position: 'absolute', right: '20px', bottom: '100%',
                    background: 'var(--ink)', color: 'var(--bg-solid)',
                    fontFamily: 'var(--font-mono)', fontSize: '9px',
                    padding: '6px 10px', borderRadius: '6px',
                    whiteSpace: 'nowrap', zIndex: 10, letterSpacing: '0.04em',
                    pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                    matched: {project.tech_matches.join(', ')}
                </div>
            )}
        </div>
    )
}

export default ProjectScores