const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = process.env.PORT || 3002;
app.use(express.json());

const memoryPath = path.join(__dirname, 'memory');
if (!fs.existsSync(memoryPath)) fs.mkdirSync(memoryPath);

// List all memory entries
app.get('/api/mcp/memory', (req, res) => {
  const files = fs.readdirSync(memoryPath).filter(f => f.endsWith('.json'));
  const entries = files.map(file => {
    const data = JSON.parse(fs.readFileSync(path.join(memoryPath, file), 'utf8'));
    return data;
  });
  res.json({ entries });
});

// Add a new memory entry
app.post('/api/mcp/memory', (req, res) => {
  const { prompt, response, tags } = req.body;
  if (!prompt || !response) return res.status(400).json({ error: 'Prompt and response required.' });
  const entry = {
    id: Date.now().toString(),
    prompt,
    response,
    tags: tags || [],
    created: new Date().toISOString()
  };
  fs.writeFileSync(path.join(memoryPath, `${entry.id}.json`), JSON.stringify(entry, null, 2));
  res.status(201).json(entry);
});

// Get a specific memory entry
app.get('/api/mcp/memory/:id', (req, res) => {
  const file = path.join(memoryPath, `${req.params.id}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Entry not found.' });
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`AI Memory MCP server running on port ${PORT}`);
});
