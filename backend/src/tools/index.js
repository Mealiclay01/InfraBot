import * as restart_service from './restart_service.js';
import * as docker_restart from './docker_restart.js';
import * as free_disk from './free_disk.js';
import * as run_command from './run_command.js';
import * as check_logs from './check_logs.js';
import * as send_alert from './send_alert.js';

export const tools = {
  restart_service,
  docker_restart,
  free_disk,
  run_command,
  check_logs,
  send_alert
};

export async function executeTool(toolName, serverName, params) {
  const tool = tools[toolName];
  if (!tool) throw new Error(`Tool ${toolName} not found`);
  
  if (tool.requiresApproval && !params._approved) {
    return { error: 'Approval required', requires_approval: true, pendingActionId: Date.now().toString() };
  }
  
  return await tool.execute(serverName, params);
}
