const WebSocket = require('ws');
const http = require('http');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('WS connected. Triggering chat...');
  
  const postData = JSON.stringify({ message: "test websocket" });
  const req = http.request({
    hostname: 'localhost',
    port: 3001,
    path: '/api/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': postData.length }
  }, (res) => {
    res.on('data', d => console.log('HTTP Res:', d.toString()));
  });
  req.write(postData);
  req.end();
});

ws.on('message', data => {
  console.log('WS Recv:', data.toString());
  // Don't close immediately, wait to see if agent_message comes
  setTimeout(() => ws.close(), 10000);
});
ws.on('error', console.error);
