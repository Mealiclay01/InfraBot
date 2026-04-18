import React from 'react';

export default function ActionLog({ actions }) {
  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">Action Terminal</div>
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
        {actions.map((act, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>[{act.timestamp || 'now'}] EXEC {act.tool}</div>
            <div style={{ background: '#000', padding: '8px', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'pre' }}>
              {act.stdout}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
