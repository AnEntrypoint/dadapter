export default async function onMessages(messages, chatContent, acp) {
  console.log('Processing ' + messages.length + ' messages:');
  
  for (const msg of messages) {
    console.log('  [' + msg.author + ']: ' + msg.content);
  }
  
  console.log('\nChat log format:');
  console.log(chatContent);
  
  console.log('\nAvailable tools: ' + Array.from(acp.toolWhitelist).join(', '));
}
