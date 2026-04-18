import db from '../db.js';
import { execSSH, getServers } from '../ssh.js';
import { runReasoner } from './reasoner.js';

export function initMonitor(wss) {
  setInterval(async () => {
    const servers = getServers();
    for (const server of servers) {
      try {
        const metrics = await collectMetrics(server.name);
        
        // Save to DB
        const stmt = db.prepare(`
          INSERT INTO server_metrics (server_name, cpu_pct, ram_pct, disk_pct, containers_json, failed_services_json)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          server.name, 
          metrics.cpu_pct, 
          metrics.ram_pct, 
          metrics.disk_pct, 
          JSON.stringify(metrics.containers), 
          JSON.stringify(metrics.failed_services)
        );

        // Emit WS
        broadcastMetrics(wss, server.name, metrics);

        // Check Anomaly Trigger for Reasoner
        const overLimit = metrics.cpu_pct > 85 || metrics.ram_pct > 90 || metrics.disk_pct > 85 || metrics.failed_services.length > 0;
        if (overLimit) {
          // Send to Reasoner
          runReasoner(server.name, metrics, wss);
        }
      } catch (err) {
        console.error(`Error monitoring ${server.name}:`, err);
      }
    }
  }, 30000); // 30 sec
}

async function collectMetrics(serverName) {
  // If SSH is mock, generate random data for demo
  const mockCpu = Math.floor(Math.random() * 100);
  const mockRam = Math.floor(Math.random() * 100);
  const mockDisk = Math.floor(Math.random() * 100);
  
  let cpu = mockCpu, ram = mockRam, disk = mockDisk, containers = [], failed_services = [];
  
  try {
    const out_cpu = await execSSH(serverName, `grep 'cpu ' /proc/stat | awk '{usage=($2+$4)*100/($2+$4+$5)} END {print usage}'`);
    if(!out_cpu.includes('Mock')) cpu = parseFloat(out_cpu);

    const out_ram = await execSSH(serverName, `free -m | awk 'NR==2{printf "%.2f", $3*100/$2 }'`);
    if(!out_ram.includes('Mock')) ram = parseFloat(out_ram);

    const out_disk = await execSSH(serverName, `df -h / | awk 'NR==2 {print $5}' | sed 's/%//'`);
    if(!out_disk.includes('Mock')) disk = parseFloat(out_disk);

    const out_containers = await execSSH(serverName, `docker ps --format '{"name":"{{.Names}}","status":"{{.Status}}"}'`);
    if(!out_containers.includes('Mock')) {
        containers = out_containers.trim().split('\n').filter(Boolean).map(c => JSON.parse(c));
    } else {
        containers = [{name: 'nginx', status: 'Up 2 hours'}];
    }

    const out_services = await execSSH(serverName, `systemctl --failed --no-legend | awk '{print $1}'`);
    if(!out_services.includes('Mock')) {
        failed_services = out_services.trim().split('\n').filter(Boolean);
    }
    
    // DEMO override via bash script testing
    const demoOverride = await execSSH(serverName, `cat /tmp/infrabot_demo_cpu 2>/dev/null || echo ""`);
    if (demoOverride.trim() === "high") {
       cpu = 95;
    }
    
  } catch(e) {
    // defaults to mock
  }
  
  return { cpu_pct: cpu, ram_pct: ram, disk_pct: disk, containers, failed_services };
}

function broadcastMetrics(wss, serverName, metrics) {
  const msg = JSON.stringify({
    type: 'metrics_update',
    server_name: serverName,
    ...metrics
  });
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  });
}
