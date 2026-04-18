import React from 'react';

const getColor = (pct) => {
  if (pct < 70) return 'var(--accent-color)';
  if (pct < 85) return 'var(--warning)';
  return 'var(--danger)';
};

const Bar = ({ label, pct }) => (
  <div style={{ marginBottom: '8px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
      <span>{label}</span>
      <span>{pct}%</span>
    </div>
    <div style={{ background: 'var(--border)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: getColor(pct), height: '100%' }}></div>
    </div>
  </div>
);

export default function ServerMetrics({ metrics }) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">Server Fleet Metrics</div>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
        {metrics.map(m => (
          <div key={m.server_name} style={{ minWidth: '250px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '12px' }}>{m.server_name}</div>
            <Bar label="CPU" pct={m.cpu_pct || 0} />
            <Bar label="RAM" pct={m.ram_pct || 0} />
            <Bar label="DISK" pct={m.disk_pct || 0} />
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Containers: {m.containers ? m.containers.length : 0} | Failed Svcs: {m.failed_services ? m.failed_services.length : 0}
            </div>
          </div>
        ))}
        {metrics.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>Awaiting telemetry...</div>}
      </div>
    </div>
  );
}
