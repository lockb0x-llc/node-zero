const express = require('express');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/api/mcp/authors', (req, res) => {
  const authorsPath = path.join(__dirname, 'content');
  if (!fs.existsSync(authorsPath)) return res.json({ authors: [] });
  const authors = fs.readdirSync(authorsPath).filter(f => fs.statSync(path.join(authorsPath, f)).isDirectory());
  res.json({ authors });
});

app.get('/api/mcp/author/:author', (req, res) => {
  const author = req.params.author;
  const authorPath = path.join(__dirname, 'content', author);
  if (!fs.existsSync(authorPath)) return res.status(404).json({ error: 'Author not found' });
  const files = fs.readdirSync(authorPath).filter(f => f.endsWith('.md'));
  const samples = files.map(file => {
    const md = fs.readFileSync(path.join(authorPath, file), 'utf8');
    return {
      title: file.replace('.md', ''),
      content: marked.parse(md)
    };
  });
  res.json({ author, samples });
});

app.listen(PORT, () => {
  console.log(`Author Voice MCP server running on port ${PORT}`);
});
