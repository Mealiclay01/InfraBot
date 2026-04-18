import { execSSH } from '../ssh.js';

export async function execute(serverName, { service_name }) {
  if (!service_name) throw new Error("service_name is required");
  const stdout = await execSSH(serverName, `sudo systemctl restart ${service_name}`);
  return { success: true, tool: "restart_service", stdout, service: service_name };
}
