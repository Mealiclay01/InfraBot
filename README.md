# InfraBot 🤖🔧

**Autonomous Infrastructure AI Agent for DevOps**

InfraBot is a fully autonomous infrastructure monitoring and remediation agent. Powered by a local LLM (Ollama), it actively monitors Linux servers via SSH, detects anomalies, and autonomously executes self-healing remediation actions using a tool-calling architecture.

## 🚀 Key Features

- **Zero Cloud Dependency:** Runs entirely on-premise using local LLMs (`llama3.2` / `qwen2.5:0.5b`) for absolute security and guaranteed uptime.
- **RAG Pipeline:** Utilizes **ChromaDB** to securely retrieve infrastructure context and SRE runbooks for context-aware problem diagnosis.
- **MCP Server Protocol:** Natively integrates via the Model Context Protocol (TypeScript SDK), exposing infrastructure tools for direct interaction with IDE integrations like Cursor and Claude Desktop.
- **Human In The Loop:** Automatically detects dangerous payload execution (e.g., stopping core database systems) and routes it to a `Pending Approvals` tier before automated execution.
- **Agentic Chat UI:** A React-built dynamic interface featuring an intelligent AI Reasoner overlay for natural language interaction with your bare-metal machines.

## 🏗️ Architecture Stack

- **AI Agents & Tool Calling:** Node.js (ES Modules)
- **Vector Database:** ChromaDB
- **LLM Engine:** Ollama API 
- **Web UI:** React (Vite) / CSS Glassmorphism 
- **Networking:** SSH Polling / Native OS Tunnels

```ascii
+---------------+      +-------------------+      +-------------+
| HomeLab Node  | <--> | Monitor Agent (1) | ---> | React Panel |
+---------------+  SSH +-------------------+      +-------------+
        ^                       |                        ^
        |              +-------------------+             | Action Log
        +------------- | Reasoner LLM  (2) | <-----------+
      Tools (3)        +-------------------+
                                | RAG embedded context
                       +-------------------+
                       | ChromaDB Runbooks |
                       +-------------------+
```

## ⚙️ Setup & Deployment

1. `cp .env.example .env` and populate your SSH credentials.
2. Install dependencies: `cd backend && npm install`, `cd frontend && npm install`
3. Ensure Ollama is running locally: `ollama run qwen2.5:0.5b` and `ollama run nomic-embed-text`
4. Start via Docker Compose: `docker-compose up -d --build`

### Running the MCP Backend (Cursor Integration)
Use the included TypeScript MCP SDK runtime to expose InfraBot's tool endpoints seamlessly to `Claude Desktop` or `Cursor`:
```bash
cd backend
npm run mcp
```

## 💡 Demo Walkthrough
Run `./demo-scenario.sh` to synthetically trigger a 95% CPU and 95% RAM resource starvation spike on the monitored server. 

InfraBot's monitoring loop will detect the system degradation immediately and seamlessly:
1. Query the Runbook vector database to pull contextual SRE guidelines.
2. Formulate a multi-step remediation path using local inference.
3. Automatically kill the bloated container and free disk space.
4. Notify you on the interactive dashboard panel regarding exactly what occurred.
