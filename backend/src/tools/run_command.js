import { execSSH } from '../ssh.js';

export const requiresApproval = true;

export async function execute(serverName, { command }) {
  if (!command) throw new Error("command is required");
  const stdout = await execSSH(serverName, command);
  return { success: true, tool: "run_command", stdout, command };
}
