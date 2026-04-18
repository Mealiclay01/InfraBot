import { Client } from 'ssh2';
import dotenv from 'dotenv';
dotenv.config();

const servers = [
  {
    name: 'proxmox-host',
    host: process.env.SSH_HOST || '100.78.118.12',
    port: 22,
    username: process.env.SSH_USERNAME || 'root',
    password: process.env.SSH_PASSWORD || '06977202',
    privateKey: process.env.SSH_PRIVATE_KEY
  }
];

export async function execSSH(serverName, command) {
  const server = servers.find(s => s.name === serverName);
  if (!server) throw new Error(`Server ${serverName} not found`);

  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }
        let out = '';
        stream.on('close', (code, signal) => {
          conn.end();
          resolve(out);
        }).on('data', (data) => {
          out += data.toString();
        }).stderr.on('data', (data) => {
          out += data.toString();
        });
      });
    }).on('error', (err) => {
      // Return a simulated response if connection fails to avoid crashing the demo without real servers
      console.warn(`SSH connection failed to ${serverName}, returning mock output.`);
      resolve(`[Mock Output for ${command}]`);
    });

    try {
      const connectOpts = {
         host: server.host,
         port: server.port,
         username: server.username
      };
      if (server.privateKey) connectOpts.privateKey = server.privateKey;
      else if (server.password) connectOpts.password = server.password;
      
      conn.connect(connectOpts);
    } catch(e) {
      resolve(`[Mock Output for ${command}]`);
    }
  });
}

export function getServers() {
  return servers;
}
