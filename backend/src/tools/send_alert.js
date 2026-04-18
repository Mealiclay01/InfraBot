import fetch from 'node-fetch';

export async function execute(serverName, { incident_details }) {
  if (!process.env.N8N_WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL is not set. Simulating alert.");
    return { success: true, tool: "send_alert", simulated: true, details: incident_details };
  }
  
  const response = await fetch(process.env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ server: serverName, details: incident_details })
  });
  
  return { success: true, tool: "send_alert", status: response.status };
}
