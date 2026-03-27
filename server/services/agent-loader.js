const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const AGENTS_DIR = path.join(__dirname, '../../.claude/agents');

const COACH_COLORS = {
  coach: '#94a3b8',
  james: '#3b82f6',
  andrew: '#22c55e',
  naval: '#a78bfa',
  ali: '#f59e0b',
  rory: '#ec4899',
  data: '#6366f1'
};

const MODEL_MAP = {
  opus: 'claude-opus-4-6',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001'
};

let agentsCache = null;

function loadAgents() {
  if (agentsCache) return agentsCache;

  const agents = {};
  const files = fs.readdirSync(AGENTS_DIR).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const name = frontmatter.name || path.basename(file, '.md');

    agents[name] = {
      name,
      description: frontmatter.description || '',
      model: MODEL_MAP[frontmatter.model] || MODEL_MAP.sonnet,
      color: COACH_COLORS[name] || '#94a3b8',
      systemPrompt: content.trim()
    };
  }

  agentsCache = agents;
  return agents;
}

function getAgent(name) {
  const agents = loadAgents();
  return agents[name] || null;
}

function listAgents() {
  const agents = loadAgents();
  return Object.values(agents)
    .filter(a => a.name !== 'data')
    .map(({ name, description, color }) => ({ name, description, color }));
}

function clearCache() {
  agentsCache = null;
}

module.exports = { loadAgents, getAgent, listAgents, clearCache };
