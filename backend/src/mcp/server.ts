import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import db from '../db.js';
import { getServers } from '../ssh.js';
import { executeTool } from '../tools/index.js';
import { queryRunbooks } from '../agents/memory.js';

const server = new McpServer({
    name: "InfraBot-MCP",
    version: "1.0.0"
});

server.resource("infra-servers", "infra://servers", async (uri) => {
    const servers = getServers();
    return {
        contents: [{ uri: uri.href, text: JSON.stringify(servers) }]
    };
});

server.resource("infra-incidents", "infra://incidents", async (uri) => {
    const actions = db.prepare('SELECT * FROM actions ORDER BY timestamp DESC LIMIT 10').all();
    return {
        contents: [{ uri: uri.href, text: JSON.stringify(actions) }]
    };
});

server.tool("get_server_metrics", "returns current metrics for a server", {
    server_name: z.string()
}, async ({ server_name }) => {
    const metrics = db.prepare('SELECT * FROM server_metrics WHERE server_name = ? ORDER BY timestamp DESC LIMIT 1').get(server_name);
    return { content: [{ type: "text", text: JSON.stringify(metrics) }] };
});

server.tool("execute_remediation", "runs a tool", {
    server_name: z.string(),
    tool: z.string(),
    params: z.any() // simplified
}, async ({ server_name, tool, params }) => {
   try {
       const res = await executeTool(tool, server_name, params);
       return { content: [{ type: "text", text: JSON.stringify(res) }] };
   } catch(e) {
       return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
   }
});

server.tool("query_runbooks", "searches runbook RAG", {
    query: z.string()
}, async ({ query }) => {
    const chunks = await queryRunbooks(query);
    return { content: [{ type: "text", text: JSON.stringify(chunks) }] };
});

export async function runMcp() {
   const transport = new StdioServerTransport();
   await server.connect(transport);
   console.log("MCP Server running on Stdio");
}

// If run directly
if (process.argv[1] && process.argv[1].endsWith('server.ts')) {
   runMcp();
}
