import { generateText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function onMessages(messages, chatContent, acp) {
  console.log('Processing ' + messages.length + ' messages');
  
  const channelId = messages[0]?.channelId;
  
  // Register the joke tool with ACP protocol
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
      
      // Send joke to Discord if send function available
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
  
  // Prepare tools for AI SDK
  const aiTools = {};
  for (const toolName of acp.toolWhitelist) {
    aiTools[toolName] = tool({
      description: 'Tell a relevant joke based on conversation context',
      parameters: {
        type: 'object',
        properties: {
          joke: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['joke']
      },
      execute: async (args) => {
        return await acp.callTool(toolName, args);
      }
    });
  }
  
  try {
    const { toolCalls } = await generateText({
      model: openai('gpt-4o-mini'),
      system: acp.instruction || 'You are a helpful Discord bot assistant. Analyze chat logs and use tools when appropriate. Be thoughtful about when humor is welcome.',
      prompt: 'Analyze this Discord chat and decide if telling a relevant joke would be appropriate:

' + chatContent,
      tools: aiTools,
      maxSteps: 1
    });
    
    if (toolCalls.length === 0) {
      console.log('AI decided not to tell a joke (not appropriate for this context)');
    } else {
      console.log('AI triggered ' + toolCalls.length + ' tool call(s)');
    }
  } catch (e) {
    console.error('AI processing error:', e.message);
  }
}
