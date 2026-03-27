const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { getAgent } = require('../services/agent-loader');

const router = express.Router();

const client = new Anthropic();

// Load CLAUDE.md coaching philosophy as meta-context
const fs = require('fs');
const path = require('path');
let coachingContext = '';
try {
  const claudeMd = fs.readFileSync(path.join(__dirname, '../../CLAUDE.md'), 'utf-8');
  // Extract just the coaching philosophy and rules sections
  const sections = claudeMd.split('\n## ');
  const relevant = sections.filter(s =>
    s.startsWith('Coaching Philosophy') ||
    s.startsWith('Touchpoint Rules') ||
    s.startsWith('Conflict Resolution') ||
    s.startsWith('About Dan')
  );
  coachingContext = relevant.map(s => '## ' + s).join('\n\n');
} catch (e) {
  console.warn('Could not load CLAUDE.md for coaching context');
}

router.post('/', async (req, res) => {
  const { coach, messages } = req.body;

  if (!coach || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Missing coach or messages' });
  }

  const agent = getAgent(coach);
  if (!agent) {
    return res.status(404).json({ error: `Unknown coach: ${coach}` });
  }

  // Build system prompt: agent personality + coaching meta-context
  const systemPrompt = [
    agent.systemPrompt,
    '\n\n---\n\n# Coaching System Context\n\n',
    coachingContext,
    '\n\n# Important Rules\n',
    '- Keep responses concise (2-4 paragraphs max unless asked for more)',
    '- Lead with insight or action, not preamble',
    '- You are chatting live with Dan — be conversational, not formal',
    '- Reference his data and patterns when relevant',
    '- Max 2-3 recommendations per response'
  ].join('\n');

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  try {
    const stream = await client.messages.stream({
      model: agent.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      }))
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.text) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat stream error:', err.message);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

module.exports = router;
