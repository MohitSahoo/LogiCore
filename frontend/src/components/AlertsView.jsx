export default function AlertsView({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="panel">
        <section>
          <h2>Alerts</h2>
          <div className="empty-state">
            <p>No alerts right now.</p>
            <p className="text-muted">Healthy inventory levels.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="panel">
      <section>
        <h2>Alerts</h2>
        <ul className="alerts-list">
          {alerts.map((a) => (
            <li key={a.id}>
              <div>{a.alert_message || a.message}</div>
              <span className="ts">{new Date(a.created_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

