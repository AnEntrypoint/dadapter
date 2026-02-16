export default async function onMessages(messages, chatContent, { processChat, acp, createSimulativeRetriever }) {
  console.log('Processing ' + messages.length + ' messages with acpreact:');
  
  const result = await processChat(chatContent, {
    onToolCall: (toolName, args) => {
      console.log('  Tool called: ' + toolName, args);
    }
  });
  
  console.log('  Analysis: ' + result.answer);
  console.log('  Tool calls: ' + result.toolCalls.length);
}
