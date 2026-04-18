import fetch from 'node-fetch';
import { queryRunbooks, saveIncident } from './memory.js';
import db from '../db.js';
import { executeTool } from './executor.js';
import { randomUUID } from 'crypto';

let isReasoning = false;

export async function runReasoner(serverName, currentMetrics, wss) {
  console.log(`runReasoner called for ${serverName}. isReasoning: ${isReasoning}`);
  if (isReasoning) {
     console.log("Aborted early because isReasoning is true!");
     return; 
  }
  isReasoning = true;
  
  try {
    console.log("Starting reasoner try block...");
    wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_thinking', status: true })));
    
    // Get last 5 metrics
    const pastMetrics = db.prepare(`SELECT * FROM server_metrics WHERE server_name = ? ORDER BY timestamp DESC LIMIT 5`).all(serverName);
    
    const anomalyDesc = `High resource usage detected on ${serverName}: CPU ${currentMetrics.cpu_pct}%, RAM ${currentMetrics.ram_pct}%, Disk ${currentMetrics.disk_pct}%. Failed services: ${currentMetrics.failed_services.join(', ')}`;
    
    const runbookChunks = await queryRunbooks(anomalyDesc);
    const runbookContext = runbookChunks.map(c => c.document).join('\n---\n');
    
    const prompt = `
    You are an expert Linux SRE. Analyze the infrastructure anomaly and respond ONLY in this JSON format:
    { "severity": "critical|high|medium", "diagnosis": "string", "root_cause": "string", "action": { "tool": "string", "params": {} }, "explanation": "string", "requires_approval": boolean }
    
    CRITICAL: For the "action.tool" field, you MUST ONLY CHOOSE from the following available tools. If you need to run an arbitrary bash command like 'top' or 'df', you MUST USE the 'run_command' tool!
    AVAILABLE TOOLS:
    1. "run_command" (params: { "command": "top -b -n 1" }) - Run any bash command
    2. "restart_service" (params: { "service": "nginx" }) - Restart a systemd service
    3. "free_disk" (params: { "path": "/var/log" }) - Clean up disk space
    4. "check_logs" (params: { "service": "docker" }) - Tail logs
    5. "docker_restart" (params: { "container": "nginx" }) - Restart docker container
    
    Context:
    ${anomalyDesc}
    
    Past Metrics: ${JSON.stringify(pastMetrics)}
    Containers: ${JSON.stringify(currentMetrics.containers)}
    
    Runbook Procedures:
    ${runbookContext}
    `;

    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    
    const modelRow = db.prepare("SELECT value FROM settings WHERE key = 'model'").get();
    const activeModel = modelRow ? modelRow.value : 'qwen2.5:0.5b';

    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        prompt,
        stream: false,
        format: 'json'
      })
    });
    
    if (!res.ok) {
       const errText = await res.text();
       throw new Error(`Ollama LLM fetch failed. Status: ${res.status}. Body: ${errText}`);
    }
    let rawText = '';
    const jsonRes = await res.json();
    rawText = jsonRes.response;
    const result = JSON.parse(rawText);
    
    // Process Action
    const actionId = randomUUID();
    
    const incidentData = {
        id: actionId,
        server_name: serverName,
        severity: result.severity,
        diagnosis: result.diagnosis,
        status: 'investigating'
    };
    wss.clients.forEach(c => c.send(JSON.stringify({ type: 'incident_created', incident: incidentData })));
    
    // Always emit the diagnosis as chat message first so the user gets a reply immediately!
    wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_message', text: result.diagnosis })));

    if (result.action && result.action.tool) {
        if (result.requires_approval) {
             wss.clients.forEach(c => c.send(JSON.stringify({ 
                 type: 'pending_approval', 
                 actionId,
                 tool: result.action.tool,
                 params: result.action.params,
                 explanation: result.explanation
             })));
        } else {
             let execRes;
             try {
                execRes = await executeTool(result.action.tool, serverName, result.action.params);
             } catch(toolErr) {
                execRes = { error: toolErr.message, stdout: `Failed to run tool: ${toolErr.message}` };
             }
             
             // Log Action
             db.prepare(`INSERT INTO actions (id, tool, server_name, params, stdout, status) VALUES (?, ?, ?, ?, ?, ?)`).run(
                 actionId, result.action.tool, serverName, JSON.stringify(result.action.params), JSON.stringify(execRes), execRes.error ? 'failed' : 'success'
             );
             wss.clients.forEach(c => c.send(JSON.stringify({ type: 'action_taken', actionId, stdout: execRes.stdout })));
             
             wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_message', text: `Action Taken: ${result.action.tool}\nOutcome: ${execRes.stdout}` })));

             // Memory
             await saveIncident({ ...incidentData, root_cause: result.root_cause, resolution: execRes ? execRes.stdout : 'no tool executed' });
        }
    } else {
        // No action, just a chat reply
        wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_message', text: result.explanation || "I've reviewed the system." })));
    }
  } catch (err) {
    if (err.message.includes('Unexpected token')) {
        // They spoke plain text instead of JSON
        wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_message', text: rawText })));
    } else {
        console.error("Reasoner err:", err);
        wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_message', text: `System processing error: ${err.message}` })));
    }
  } finally {
    isReasoning = false;
    wss.clients.forEach(c => c.send(JSON.stringify({ type: 'agent_thinking', status: false })));
  }
}
