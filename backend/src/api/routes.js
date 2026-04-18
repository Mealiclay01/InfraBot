import fetch from 'node-fetch';
import express from 'express';
import db from '../db.js';
import { executeTool } from '../agents/executor.js';
import { runReasoner } from '../agents/reasoner.js';

const router = express.Router();
let wssInstance = null;
const pendingApprovals = new Map();

export function setWss(wss) {
  wssInstance = wss;
}

// REST /api/servers
router.get('/servers', (req, res) => {
   const servers = db.prepare(`
     SELECT sm.* FROM server_metrics sm
     INNER JOIN (SELECT server_name, MAX(timestamp) as m_time FROM server_metrics GROUP BY server_name) AS latest 
     ON sm.server_name = latest.server_name AND sm.timestamp = latest.m_time
   `).all();
   res.json(servers);
});

// REST /api/incidents
router.get('/incidents', (req, res) => {
   const limit = req.query.limit || 50;
   const actions = db.prepare('SELECT * FROM actions ORDER BY timestamp DESC LIMIT ?').all(limit);
   res.json(actions);
});

// REST /api/incident/:id
router.get('/incident/:id', (req, res) => {
   const incident = db.prepare('SELECT * FROM actions WHERE id = ?').get(req.params.id);
   res.json(incident || {});
});

// POST /api/chat
router.post('/chat', async (req, res) => {
   const { message } = req.body;
   if (!message) return res.status(400).json({error: "message required"});
   
   if (wssInstance) {
       // Fetch most recent metrics dynamically for proxmox-host or fallback
       const recentMetric = db.prepare('SELECT * FROM server_metrics ORDER BY timestamp DESC LIMIT 1').get();
       
       const realMetrics = recentMetric ? {
           cpu_pct: recentMetric.cpu_pct,
           ram_pct: recentMetric.ram_pct,
           disk_pct: recentMetric.disk_pct,
           containers: JSON.parse(recentMetric.containers_json || '[]'),
           failed_services: [`User explicitly requested: ${message}`, ...JSON.parse(recentMetric.failed_services_json || '[]')]
       } : {
           cpu_pct: 0, ram_pct: 0, disk_pct: 0, containers: [], failed_services: [`User explicitly requested: ${message}`]
       };

       runReasoner(recentMetric ? recentMetric.server_name : 'proxmox-host', realMetrics, wssInstance);
   }
   res.json({ status: "processing" });
});

// POST /api/approve/:action_id
router.post('/approve/:action_id', async (req, res) => {
    const actionId = req.params.action_id;
    // For demo, we are expecting the frontend to pass the params and tool via body to avoid memory store
    const { tool, params, server_name } = req.body;
    
    if(!tool) return res.status(400).json({error: "tool missing in body"});
    
    try {
        const approvedParams = { ...params, _approved: true };
        const execRes = await executeTool(tool, server_name || 'proxmox-host', approvedParams);
        
        db.prepare(`INSERT INTO actions (id, tool, server_name, params, stdout, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
             actionId, tool, server_name || 'proxmox-host', JSON.stringify(params), JSON.stringify(execRes), 'success'
        );
        
        if (wssInstance) wssInstance.clients.forEach(c => c.send(JSON.stringify({ type: 'action_taken', actionId, stdout: execRes.stdout })));
        res.json({ success: true, result: execRes });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

// SETTINGS
router.get('/settings', (req, res) => {
   const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'model'").get();
   res.json({ model: modelRow ? modelRow.value : 'qwen2.5:0.5b' });
});

router.post('/settings', (req, res) => {
   const { model } = req.body;
   if (model) {
      db.prepare("INSERT INTO settings (key, value) VALUES ('model', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(model);
   }
   res.json({ success: true });
});

// MODELS
router.get('/models', async (req, res) => {
   try {
       const ollamaHost = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
       const raw = await fetch(`${ollamaHost}/api/tags`).then(r => r.json());
       res.json(raw.models.map(m => m.name));
   } catch(err) {
       res.json(['qwen2.5:0.5b', 'llama3.2:1b']);
   }
});

export default router;
