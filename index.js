import 'dotenv/config';
import { ACPProtocol, createAdapter } from 'acpreact';

const DEBOUNCE_MS = Number(process.env.DEBOUNCE_MS) || 10_000;
const INSTRUCTION = process.env.BOT_INSTRUCTION || 'You are a helpful Discord bot. Use the reply tool to send a message.';

const adapter = await createAdapter('discord', { token: process.env.DISCORD_BOT_TOKEN });
const acp = new ACPProtocol(INSTRUCTION);

acp.registerTool(
  'reply',
  'Send a reply to the Discord channel.',
  { type: 'object', properties: { message: { type: 'string', description: 'Message to send' } }, required: ['message'] },
  (p) => adapter.send(p.channelId, p.message)
);

let timer = null, pending = [], channelId = null;

adapter.onMessage((msg) => {
  pending.push(msg);
  channelId = msg.channelId;
  clearTimeout(timer);
  timer = setTimeout(flush, DEBOUNCE_MS);
});

async function flush() {
  const batch = pending.splice(0);
  const chat = batch.map(m => `${m.author}: ${m.content}`).join('\n');
  const r = await acp.process(chat).catch(e => ({ error: e.message }));
  if (r.error) console.error('acp error:', r.error);
}

adapter.start().catch(e => { console.error('fatal:', e.message); process.exit(1); });
