// JavaScript to use the Gemini API with web interface

// API key - directly in code (less secure, better to use environment variables in production)
const API_KEY = 'AIzaSyByAMqDFfc7HR9iviGNqgY0NJvaGraOHlE';

// Gemini API base URL with correct model name
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Function to generate text using Gemini API
 * @param {string} prompt - The user prompt to send to Gemini
 * @param {number} maxTokens - Maximum tokens to generate (optional)
 * @returns {Promise} - Response from the API
 */
async function generateWithGemini(prompt, maxTokens = 1024) {
  try {
    // Check if API key exists
    if (!API_KEY || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      throw new Error('Please set your Gemini API key in the code');
    }

    // Prepare the request data
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
        topP: 0.95,
        topK: 40
      }
    };

    console.log("Sending request to Gemini API...");

    // Make the API call
    const response = await fetch(
      `${GEMINI_API_URL}?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      }
    );

    // Check if response is OK
    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error Response:", errorData);
      throw new Error(`API responded with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log("API Response:", data);
    
    // Safely extract the generated text with better error handling
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response generated from the API");
    }
    
    const candidate = data.candidates[0];
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new Error("Malformed response from the API");
    }
    
    return candidate.content.parts[0].text || "No text was generated";
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return `Error: ${error.message}`;
  }
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  const chatMessages = document.getElementById('chat-messages');
  const userInput = document.getElementById('user-input');
  const sendButton = document.getElementById('send-button');
  const themeToggle = document.getElementById('theme-toggle');

  // Check if DOM elements were found
  if (!chatMessages || !userInput || !sendButton) {
    console.error("Could not find required DOM elements. Check your HTML IDs.");
    return;
  }

  // Function to add a user message to the chat
  function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Function to add a bot message to the chat with advanced formatting
  function addBotMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message bot-message';

    // Check if the message contains code blocks
    if (message.includes('```')) {
      // Process with markdown parser
      messageElement.innerHTML = marked.parse(message);
      
      // Find all code blocks and apply syntax highlighting
      const codeBlocks = messageElement.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        hljs.highlightElement(block);
      });
    } else {
      // Process normal text with paragraph breaks
      const formattedText = message
        .replace(/\n\n/g, '<br><br>')  // Double line breaks
        .replace(/\n/g, '<br>')        // Single line breaks
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
        .replace(/\*(.*?)\*/g, '<em>$1</em>');            // Italic text
      
      messageElement.innerHTML = formattedText;
    }

    // Add the message to chat
    chatMessages.appendChild(messageElement);
    
    // Auto-scroll to the latest message
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Add a welcome message
  addBotMessage("Hello! I'm CodeMate. How can I help you today?");

  // Function to handle sending messages
  async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    // Add user message to chat
    addUserMessage(message);
    userInput.value = '';

    // Show loading indicator
    const loadingMessage = document.createElement('div');
    loadingMessage.className = 'message bot-message';
    loadingMessage.textContent = 'Thinking...';
    chatMessages.appendChild(loadingMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Get response from Gemini
    try {
      console.log("Sending user message to Gemini:", message);
      const response = await generateWithGemini(message);
      
      // Remove loading message and add response
      chatMessages.removeChild(loadingMessage);
      addBotMessage(response);
    } catch (error) {
      // Remove loading message and show error
      chatMessages.removeChild(loadingMessage);
      addBotMessage(`Sorry, I encountered an error: ${error.message}`);
      console.error("Error in sendMessage:", error);
    }
  }

  // Event listeners for sending messages
  sendButton.addEventListener('click', sendMessage);
  
  userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });

  // Theme toggle functionality
  if (themeToggle) {
    const htmlElement = document.documentElement;

    themeToggle.addEventListener('click', () => {
      const toggleIcon = themeToggle.querySelector('i');
      if (htmlElement.classList.contains('dark-theme')) {
        htmlElement.classList.remove('dark-theme');
        htmlElement.classList.add('light-theme');
        toggleIcon.className = 'fas fa-moon';
      } else {
        htmlElement.classList.remove('light-theme');
        htmlElement.classList.add('dark-theme');
        toggleIcon.className = 'fas fa-sun';
      }
    });
  }

  // Focus the input field on page load
  userInput.focus();
});

// Optional: Function to list available models (for debugging)
async function listAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    const data = await response.json();
    console.log("Available models:", data);
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

// Uncomment to debug available models
// listAvailableModels();