import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { createServer } from 'http';
import apiRoutes, { setWss } from './api/routes.js';
import { initMonitor } from './agents/monitor.js';
import { initMemory } from './agents/memory.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);
setWss(wss);

wss.on('connection', (ws) => {
    console.log('Dashboard connected');
    ws.on('close', () => console.log('Dashboard disconnected'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
    console.log(`Backend listening on port ${PORT}`);
    console.log('Initializing RAG Memory...');
    await initMemory();
    console.log('Starting Monitor Agent...');
    initMonitor(wss);
});
