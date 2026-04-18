import React, { useState, useEffect, useRef } from 'react';

export default function AgentChat({ thinking }) {
  const [msg, setMsg] = useState('');
  const [history, setHistory] = useState([]);
  const [model, setModel] = useState('qwen2.5:0.5b');
  const [modelsList, setModelsList] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`http://${window.location.hostname}:3001/api/settings`)
      .then(r => r.json())
      .then(d => setModel(d.model))
      .catch(e => console.warn(e));
      
    fetch(`http://${window.location.hostname}:3001/api/models`)
      .then(r => r.json())
      .then(d => setModelsList(d))
      .catch(e => console.warn(e));
      
    const ws = new WebSocket(`ws://${window.location.hostname}:3001`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'agent_message') {
         setHistory(prev => [...prev, { role: 'agent', text: data.text }]);
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, thinking]);

  const saveModel = (e) => {
    const newModel = e.target.value;
    setModel(newModel);
    fetch(`http://${window.location.hostname}:3001/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: newModel })
    });
  };

  const send = (e, customMsg) => {
    if (e) e.preventDefault();
    const text = customMsg || msg;
    if (!text.trim()) return;
    
    setHistory(prev => [...prev, { role: 'user', text }]);
    
    fetch(`http://${window.location.hostname}:3001/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    setMsg('');
  };

  return (
    <div className="panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Agent Terminal</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             <select 
               value={model} 
               onChange={saveModel}
               style={{ background: '#000', color: 'var(--accent-color)', border: '1px solid var(--border)', fontSize: '11px', outline: 'none', padding: '2px 4px', borderRadius: '4px' }}
             >
               {modelsList.map(m => <option key={m} value={m}>{m}</option>)}
               {!modelsList.includes(model) && <option value={model}>{model}</option>}
             </select>
           <span style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--danger)' }} onClick={() => setHistory([])}>[Clear]</span>
        </span>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '16px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>System ready. Send commands or wait for autonomous actions.</div>
        {history.map((h, i) => (
          <div key={i} style={{ color: h.role === 'user' ? 'var(--text-primary)' : 'var(--accent-color)' }}>
            {h.role === 'user' ? '> ' : ''}{h.text}
          </div>
        ))}
        {thinking && <div style={{ color: 'var(--warning)', animation: 'pulse 1.5s infinite' }}>[Processing request through {model}...]</div>}
        <div ref={bottomRef} />
      </div>
      
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', marginTop: 'auto' }}>
        {["Diagnose high CPU", "Check system logs", "Restart docker service"].map(cmd => (
          <button 
             key={cmd} 
             onClick={() => send(null, cmd)}
             style={{ 
               background: 'var(--bg-card)', border: '1px solid var(--border)', 
               color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', 
               cursor: 'pointer', fontSize: '11px', transition: 'all 0.2s' 
             }}>
            {cmd}
          </button>
        ))}
      </div>

      <form onSubmit={send} style={{ display: 'flex', gap: '8px' }}>
        <span style={{ color: 'var(--accent-color)', alignSelf: 'center' }}>$</span>
        <input 
          value={msg} 
          onChange={e => setMsg(e.target.value)}
          placeholder="e.g. check logs for proxy container..."
          style={{ 
            flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', 
            fontFamily: 'inherit', outline: 'none', borderBottom: '1px solid var(--border)', padding: '4px 0' 
          }}
        />
      </form>
    </div>
  );
}
