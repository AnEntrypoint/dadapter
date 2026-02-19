export default async function onMessages(messages, chatContent, acp) {
  console.log('Processing ' + messages.length + ' messages');

  try {
    const result = await acp.process(chatContent);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('Process error:', e.message);
  }
}
