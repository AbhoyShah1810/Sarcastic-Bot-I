document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');

    const sendMessage = async () => {
        const userText = userInput.value.trim();
        if (userText === '') return;

        // Add user's message
        const userMessageDiv = document.createElement('div');
        userMessageDiv.classList.add('message', 'user-message');
        userMessageDiv.textContent = userText;
        chatMessages.appendChild(userMessageDiv);
        userInput.value = '';

        // Add a temporary "typing..." message
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'bot-message');
        typingIndicator.textContent = '...is thinking';
        chatMessages.appendChild(typingIndicator);
        // Scroll to the typing indicator
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            // LOCAL DEVELOPMENT: Pointing to local server
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText }),
            });

            const data = await response.json();
            
            // Remove the typing indicator
            chatMessages.removeChild(typingIndicator);

            // Add the actual AI response
            const botMessageDiv = document.createElement('div');
            botMessageDiv.classList.add('message', 'bot-message');
            botMessageDiv.textContent = data.message;
            chatMessages.appendChild(botMessageDiv);

            // Scroll to the bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;

        } catch (error) {
            console.error('Error communicating with the server:', error);
            chatMessages.removeChild(typingIndicator);
            const errorMessageDiv = document.createElement('div');
            errorMessageDiv.classList.add('message', 'bot-message');
            errorMessageDiv.textContent = "Apologies, my circuits are overheating from your simple questions. Try again later.";
            chatMessages.appendChild(errorMessageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };

    // Event listeners to handle sending the message
    sendButton.addEventListener('click', sendMessage);
    
    // This handles the "Enter" keypress in the input field
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});