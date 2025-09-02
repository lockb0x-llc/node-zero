const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/mcp/genres', (req, res) => {
  const genresPath = path.join(__dirname, 'content');
  if (!fs.existsSync(genresPath)) return res.json({ genres: [] });
  const genres = fs.readdirSync(genresPath).filter(f => fs.statSync(path.join(genresPath, f)).isDirectory());
  res.json({ genres });
});

app.get('/api/mcp/genre/:genre', (req, res) => {
  const genre = req.params.genre;
  const genrePath = path.join(__dirname, 'content', genre);
  if (!fs.existsSync(genrePath)) return res.status(404).json({ error: 'Genre not found' });
  const files = fs.readdirSync(genrePath).filter(f => f.endsWith('.md'));
  const samples = files.map(file => {
    const md = fs.readFileSync(path.join(genrePath, file), 'utf8');
    return {
      title: file.replace('.md', ''),
      content: marked.parse(md)
    };
  });
  res.json({ genre, samples });
});

app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
