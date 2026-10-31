const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const submitBtn = chatForm.querySelector('button[type="submit"]');

// Store multi-turn conversation history according to Gemini role format ('user' | 'model')
const conversation = [];

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const message = userInput.value.trim();
  if (!message) return;

  // 1. Add user message to UI and history
  appendMessage('user', message);
  conversation.push({ role: 'user', text: message });
  userInput.value = '';

  // Disable input & button while awaiting response to avoid duplicate requests
  userInput.disabled = true;
  if (submitBtn) submitBtn.disabled = true;

  // 2. Show temporary "Thinking..." bot message
  const thinkingMessage = appendMessage('bot', 'Thinking...');

  try {
    // 3. Send POST request with conversation payload to /api/chat
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();

    // 4. Replace "Thinking..." with AI response or fallback message
    if (data && data.result) {
      thinkingMessage.textContent = data.result;
      conversation.push({ role: 'model', text: data.result });
    } else {
      thinkingMessage.textContent = 'Sorry, no response received.';
      conversation.pop(); // Remove unanswered prompt from history
    }
  } catch (error) {
    console.error('Chat error:', error);
    thinkingMessage.textContent = 'Failed to get response from server.';
    conversation.pop(); // Remove failed prompt from history
  } finally {
    // Re-enable form controls and refocus input
    userInput.disabled = false;
    if (submitBtn) submitBtn.disabled = false;
    userInput.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
