import { ChromaClient } from 'chromadb';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import fetch from 'node-fetch';

const client = new ChromaClient({ path: process.env.CHROMA_URL || "http://localhost:8000" });

async function getEmbedding(text) {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  try {
     const res = await fetch(`${ollamaUrl}/api/embeddings`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
     });
     if(!res.ok) return Array(768).fill(0); // fallback for demo if Ollama missing
     const json = await res.json();
     return json.embedding;
  } catch(e) {
     return Array(768).fill(0);
  }
}

export async function initMemory() {
  try {
      await client.getOrCreateCollection({ name: "runbooks" });
      await client.getOrCreateCollection({ name: "incidents" });

      const files = await glob('../runbooks/**/*.md');
      const collection = await client.getCollection({ name: "runbooks" });
      
      let i = 0;
      for (const file of files) {
          const content = fs.readFileSync(file, 'utf-8');
          // Naive simple chunking by paragraphs roughly
          const chunks = content.split('\n\n');
          for (let j = 0; j < chunks.length; j++) {
              if (chunks[j].trim().length < 5) continue;
              const embed = await getEmbedding(chunks[j]);
              await collection.upsert({
                  ids: [`${path.basename(file)}_${j}`],
                  embeddings: [embed],
                  metadatas: [{ filename: file, chunk_index: j }],
                  documents: [chunks[j]]
              });
          }
      }
      console.log('RAG Memory Initialized');
  } catch (e) {
      console.warn("ChromaDB error during init. Is the container running?", e.message);
  }
}

export async function queryRunbooks(anomalyDescription) {
   try {
       const collection = await client.getCollection({ name: "runbooks" });
       const embed = await getEmbedding(anomalyDescription);
       const results = await collection.query({
           queryEmbeddings: [embed],
           nResults: 3
       });
       if(results.documents && results.documents[0]) {
           return results.documents[0].map((doc, idx) => ({
                document: doc,
                metadata: results.metadatas[0][idx]
           }));
       }
       return [];
   } catch(e) {
       console.warn("Chroma query runbooks failed:", e.message);
       return [];
   }
}

export async function saveIncident(incident) {
   try {
       const collection = await client.getCollection({ name: "incidents" });
       const docText = `Severity: ${incident.severity}. Diagnosis: ${incident.diagnosis}. Root cause: ${incident.root_cause}. Resolution: ${incident.resolution}`;
       const embed = await getEmbedding(docText);
       
       await collection.upsert({
           ids: [incident.id],
           embeddings: [embed],
           metadatas: [{ server: incident.server_name, status: incident.status }],
           documents: [docText]
       });
   } catch(e) {
       console.warn("Chroma save incident failed:", e.message);
   }
}
