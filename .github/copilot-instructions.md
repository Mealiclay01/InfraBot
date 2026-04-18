# Project Context: InfraBot

This project is an autonomous infrastructure AI agent designed for homelab/Proxmox management.

- Stack: Node.js (Backend), React + Vite (Frontend), Ollama (Local LLM via llama3.2), ChromaDB (Vector store).
- We use MCP (Model Context Protocol) to expose tools to Claude if needed.
- Frontend uses a dark terminal aesthetic.
- Never use synchronous file operations in agent code.
- Always assume AI interactions are handled asynchronously.
