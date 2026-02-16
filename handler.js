export default async function onMessages(messages, chatContent, acp) {
  console.log('Processing ' + messages.length + ' messages');
  
  const channelId = messages[0]?.channelId;
  
  acp.registerTool('tellRelevantJoke', 
    'Tell a relevant joke based on the conversation context. Only use when the conversation is light-hearted, casual, or could benefit from humor. Do not use during serious discussions, technical support, or when someone is asking for help.',
    {
      type: 'object',
      properties: {
        joke: { type: 'string', description: 'The joke text to tell in the chat' }
      },
      required: ['joke']
    },
    async (params) => {
      console.log('Tool called with joke:', params.joke);
      
      if (global.discordBot?.sendMessage) {
        await global.discordBot.sendMessage(channelId, params.joke);
      }
      
      return { 
        success: true, 
        joke: params.joke,
        timestamp: new Date().toISOString()
      };
    }
  );
  
  console.log('Tool registered, calling acp.process...');
  
  try {
    const result = await acp.process(chatContent, {
      cli: 'kilo',
      instruction: acp.instruction
    });
    console.log('Process result:', result);
  } catch (e) {
    console.error('Process error:', e.message);
  }
}
