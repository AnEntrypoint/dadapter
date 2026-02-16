export default async function onMessages(messages, chatContent, acp) {
  console.log('Processing ' + messages.length + ' messages');
  
  const channelId = messages[0]?.channelId;
  
  // Register the tellRelevantJoke tool
  acp.registerTool('tellRelevantJoke', 
    'Tell a relevant joke based on the conversation context. Only use when the conversation is light-hearted, casual, or could benefit from humor. Do not use during serious discussions, technical support, or when someone is asking for help.',
    {
      type: 'object',
      properties: {
        joke: { type: 'string', description: 'The joke to tell' },
        reason: { type: 'string', description: 'Brief explanation of why this joke fits the context' }
      },
      required: ['joke']
    },
    async (params) => {
      console.log('Telling joke:', params.joke);
      
      // Send joke to Discord
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
  
  // Create ACP request to process the chat
  const request = acp.createJsonRpcRequest('process', {
    instruction: acp.instruction,
    content: chatContent,
    tools: Array.from(acp.toolWhitelist).map(name => ({
      name,
      description: 'Tell a relevant joke based on conversation context'
    }))
  });
  
  console.log('Sending ACP request:', JSON.stringify(request, null, 2));
  
  // In a real setup with opencode/kilo CLI, this would be sent to the AI
  // For now, simulate the AI deciding whether to call the tool
  await simulateAIPProcessing(acp, chatContent);
}

async function simulateAIPProcessing(acp, chatContent) {
  // Simulate AI analysis based on instruction
  const lowerContent = chatContent.toLowerCase();
  
  // Check if context is appropriate for humor
  const funIndicators = ['lol', 'haha', 'funny', 'joke', 'laugh', '😂', '😄', 'hilarious'];
  const seriousIndicators = ['help', 'error', 'problem', 'serious', 'urgent', 'emergency'];
  
  const isFunContext = funIndicators.some(kw => lowerContent.includes(kw));
  const isSerious = seriousIndicators.some(kw => lowerContent.includes(kw));
  
  // AI decides to tell a joke
  if (isFunContext && !isSerious && acp.toolWhitelist.has('tellRelevantJoke')) {
    console.log('AI decided to call tellRelevantJoke');
    
    const jokes = [
      'Why do programmers always mix up Halloween and Christmas? Because Oct 31 == Dec 25!',
      'Why did the scarecrow win an award? He was outstanding in his field!',
      'Why don\'t scientists trust atoms? Because they make up everything!',
      'What do you call a fake noodle? An impasta!'
    ];
    
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    await acp.callTool('tellRelevantJoke', {
      joke: joke,
      reason: 'Conversation appears light-hearted and appropriate for humor'
    });
  } else {
    console.log('AI decided not to call any tools (context not appropriate)');
  }
}
