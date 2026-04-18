import { execSSH } from '../ssh.js';

export async function execute(serverName, { container_name }) {
  if (!container_name) throw new Error("container_name is required");
  const stdout = await execSSH(serverName, `docker restart ${container_name}`);
  return { success: true, tool: "docker_restart", stdout, container: container_name };
}
