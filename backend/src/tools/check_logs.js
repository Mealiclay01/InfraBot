import { execSSH } from '../ssh.js';

export async function execute(serverName, { service }) {
  if (!service) throw new Error("service is required");
  const stdout = await execSSH(serverName, `journalctl -u ${service} --since "1 hour ago" --no-pager -n 100`);
  return { success: true, tool: "check_logs", stdout, service };
}
