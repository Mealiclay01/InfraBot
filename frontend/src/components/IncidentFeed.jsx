import React from 'react';

export default function IncidentFeed({ incidents }) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">Active Incidents</div>
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {incidents.length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>No active incidents. Systems normal.</div> : null}
        {incidents.map((inc, i) => (
          <div key={i} style={{ 
            padding: '12px', 
            borderLeft: `3px solid ${inc.severity === 'critical' ? 'var(--danger)' : inc.severity === 'high' ? 'var(--warning)' : 'var(--accent-color)'}`,
            background: 'rgba(0,0,0,0.2)',
            marginBottom: '8px',
            borderRadius: '0 4px 4px 0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>{inc.server_name}</span>
              <span>{inc.status}</span>
            </div>
            <div style={{ fontSize: '14px' }}>{inc.diagnosis}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
