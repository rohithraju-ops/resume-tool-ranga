function DownloadPanel({ result }) {
    const handleDownload = (filename) => {
        window.open(`/download/${filename}`, '_blank')
    }

    return (
        <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '8px',
            background: 'var(--bg-white)',
        }}>
            <DownloadBtn
                label="Resume PDF"
                sub={result ? 'ready' : 'not generated'}
                disabled={!result}
                onClick={() => handleDownload(result?.resume_pdf)}
            />
            <DownloadBtn
                label="Cover Letter"
                sub={result ? 'ready' : 'not generated'}
                disabled={!result}
                onClick={() => handleDownload(result?.cover_letter_pdf)}
            />
        </div>
    )
}

function DownloadBtn({ label, sub, disabled, onClick }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                flex: 1,
                background: disabled ? 'var(--bg-muted)' : 'var(--bg-muted)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 13px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: disabled ? 0.5 : 1,
                transition: 'opacity 0.15s',
            }}
        >
            <div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: 'var(--ink-secondary)', textAlign: 'left' }}>
                    {label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'var(--ink-ghost)', marginTop: '2px' }}>
                    {sub}
                </div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--ink)' }}>↓</div>
        </button>
    )
}

export default DownloadPanel