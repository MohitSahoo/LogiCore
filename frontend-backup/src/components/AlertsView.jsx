export default function AlertsView({ alerts }) {
  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Alerts</h1>
          <p>{alerts?.length || 0} active alerts</p>
        </div>
      </div>

      {/* Content */}
      <div className="card card-padded">
        {!alerts || alerts.length === 0 ? (
          <div className="empty-state">
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(34, 197, 94, 0.12)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ fontWeight: 500, color: '#e5e7eb', marginBottom: 4 }}>All clear</p>
            <p>No alerts right now</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.map(a => (
              <div key={a.id} className="alert-card">
                <div className="alert-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="alert-card-content">
                  <div className="alert-card-message">{a.alert_message || a.message}</div>
                  <div className="alert-card-time">{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
