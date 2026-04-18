import React, { useEffect, useState } from 'react';
import ServerMetrics from './ServerMetrics';
import IncidentFeed from './IncidentFeed';
import AgentChat from './AgentChat';
import ActionLog from './ActionLog';
import PendingApprovals from './PendingApprovals';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [actions, setActions] = useState([]);
  const [pending, setPending] = useState([]);
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    // Basic fetch on load
    fetch(`http://${window.location.hostname}:3001/api/servers`).then(r=>r.json()).then(data => {
      const ms = {};
      data.forEach(d => ms[d.server_name] = d);
      setMetrics(ms);
    }).catch(e => console.warn("Fetch servers failed", e));
    
    fetch(`http://${window.location.hostname}:3001/api/incidents`).then(r=>r.json()).then(data => {
      setActions(data); // Using actions table for both for demo simplicity
    }).catch(e => console.warn("Fetch incidents failed", e));

    // WS Connection
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics_update') {
        setMetrics(prev => ({ ...prev, [data.server_name]: data }));
      } else if (data.type === 'incident_created') {
        setIncidents(prev => [data.incident, ...prev]);
      } else if (data.type === 'action_taken') {
        setActions(prev => [{id: data.actionId, stdout: data.stdout, timestamp: new Date().toISOString()}, ...prev]);
        setPending(prev => prev.filter(p => p.actionId !== data.actionId));
      } else if (data.type === 'pending_approval') {
        setPending(prev => [data, ...prev]);
      } else if (data.type === 'agent_thinking') {
        setThinking(data.status);
      }
    };
    return () => ws.close();
  }, []);

  return (
    <div className="dashboard-container">
      <div className="metrics-top">
        <ServerMetrics metrics={Object.values(metrics)} />
      </div>
      <div className="incidents-left">
        <IncidentFeed incidents={incidents} />
      </div>
      <div className="chat-left">
        <AgentChat thinking={thinking} />
      </div>
      <div className="actions-right">
        <PendingApprovals pending={pending} />
        <ActionLog actions={actions} />
      </div>
    </div>
  );
}
