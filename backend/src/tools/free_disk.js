import { execSSH } from '../ssh.js';

export async function execute(serverName) {
  const stdout = await execSSH(serverName, `find /tmp /var/log -type f -mtime +7 -delete && docker system prune -f`);
  return { success: true, tool: "free_disk", stdout };
}
