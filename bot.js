import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { watchFile } from 'fs';
import { pathToFileURL } from 'url';
import { ACPProtocol } from 'acpreact';

config();

const DEBOUNCE_MS = 10000;
const TOKEN = process.env.DISCORD_BOT_TOKEN;

let debounceTimer = null;
let pendingMessages = [];
let messageHandler = null;
let client = null;
let isRunning = false;

async function loadHandler() {
  try {
    const modulePath = pathToFileURL(process.cwd() + '/handler.js').href;
    const freshModule = await import(modulePath + '?t=' + Date.now());
    messageHandler = freshModule.default || freshModule.onMessages;
    console.log('Handler reloaded at ' + new Date().toISOString());
    return true;
  } catch (e) {
    console.error('Handler load failed:', e.message);
    return false;
  }
}

function formatChat(messages) {
  return messages.map(m => {
    const time = new Date(m.timestamp).toTimeString().slice(0, 5);
    return `[${time}] ${m.author}: ${m.content}`;
  }).join('\n');
}

async function processBatch() {
  if (pendingMessages.length === 0 || !messageHandler) return;
  const batch = pendingMessages.splice(0, pendingMessages.length);
  const chatContent = formatChat(batch);
  
  const acp = new ACPProtocol('You are memobot, a witty Discord bot. Always use the reply tool to respond to users.');
  
  const channelId = batch[0]?.channelId;
  
  acp.registerTool('reply',
    'Send a reply message to the Discord channel.',
    { type: 'object', properties: { message: { type: 'string', description: 'The message to send' } }, required: ['message'] },
    async (params) => {
      console.log('Reply tool called:', params.message);
      await sendMessage(channelId, params.message);
      return { success: true };
    }
  );
  
  Promise.resolve(messageHandler(batch, chatContent, acp))
    .catch(e => console.error('Handler error:', e.message));
}

function onMessage(message) {
  if (message.author.bot) return;
  pendingMessages.push({
    id: message.id,
    content: message.content,
    author: message.author.tag,
    channelId: message.channelId,
    timestamp: Date.now()
  });
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => processBatch(), DEBOUNCE_MS);
}

async function sendMessage(channelId, content) {
  if (!client) return;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send(content);
      return { success: true };
    }
  } catch (e) {
    console.error('Failed to send message:', e.message);
    return { success: false, error: e.message };
  }
}

async function start() {
  if (isRunning) return;
  await loadHandler();

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

  client.once(Events.ClientReady, () => {
    console.log('Bot logged in as ' + client.user.tag);
    isRunning = true;
  });

  client.on(Events.MessageCreate, onMessage);
  client.on(Events.Error, error => console.error('Discord error:', error.message));

  await client.login(TOKEN);
}

async function stop() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (client) {
    await client.destroy();
    client = null;
  }
  isRunning = false;
  console.log('Bot stopped');
}

watchFile('handler.js', async () => {
  if (isRunning) await loadHandler();
});

global.discordBot = { 
  start, 
  stop, 
  getPending: () => pendingMessages, 
  reload: loadHandler,
  sendMessage
};

start().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
