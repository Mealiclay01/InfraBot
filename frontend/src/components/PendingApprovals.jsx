import React from 'react';

export default function PendingApprovals({ pending }) {
  if (pending.length === 0) return null;

  const approve = (p) => {
    fetch(`http://${window.location.hostname}:3001/api/approve/${p.actionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: p.tool, params: p.params, server_name: 'proxmox-host' })
    });
  };

  return (
    <div className="panel" style={{ marginBottom: '16px', border: '1px solid var(--warning)' }}>
      <div className="panel-header" style={{ color: 'var(--warning)', borderBottomColor: 'var(--warning)' }}>Pending Approvals (HITL)</div>
      {pending.map((p, i) => (
        <div key={i} style={{ background: 'rgba(210,153,34,0.1)', padding: '12px', borderRadius: '4px' }}>
          <div style={{ fontWeight: 'bold' }}>{p.tool}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{p.explanation}</div>
          <div style={{ fontSize: '12px', background: '#000', padding: '4px', marginBottom: '12px' }}>
            {JSON.stringify(p.params)}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => approve(p)} style={{ background: 'var(--warning)', color: '#000', border: 'none', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
            <button style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
