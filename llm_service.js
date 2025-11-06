/**
 * @fileoverview Background script for the HH.ru Vacancy Scorer extension.
 * Handles API calls to the local vLLM service.
 */

/**
 * Calls the local vLLM API to evaluate a vacancy based on the user's resume.
 * @param {string} prompt - The vacancy description text.
 * @returns {Promise<string>} A promise that resolves with the content of the API response.
 * @throws {Error} If the API key, model name, or resume text is not set, or if the API call fails.
 */
async function callLlm(prompt) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['apiKey', 'resumeText', 'modelName'], async (result) => {
      try {
        const { apiKey, resumeText, modelName } = result;

        if (!apiKey) {
          throw new Error('API Key is not set.');
        }
        if (!resumeText) {
          throw new Error('Resume text is not available.');
        }
        if (!modelName) {
            throw new Error('Model name is not set.');
        }

        const endpoint = 'http://localhost/v1/chat/completions';

        const requestBody = {
            model: modelName,
            messages: [
                {
                    "role": "system",
                    "content": "You are a helpful assistant."
                },
                {
                    "role": "user",
                    "content": `Based on the following resume text, evaluate the user's suitability for the vacancy described. Provide a score out of 10 and a brief justification.\n\nResume Text:\n${resumeText}\n\nVacancy Description:\n${prompt}`
                }
            ]
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            resolve(data.choices[0].message.content);
        } else {
            throw new Error('Unexpected API response structure.');
        }
      } catch (error) {
        console.error('Error calling local vLLM API:', error);
        reject(error);
      }
    });
  });
}

/**
 * Listener for messages from other parts of the extension (e.g., content scripts).
 * Expects messages with an 'action' property.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "callLlmApi") {
        callLlm(request.prompt)
            .then(response => {
                sendResponse({success: true, data: response});
            })
            .catch(error => {
                sendResponse({success: false, error: error.message});
            });
        return true; // Indicates that the response is sent asynchronously
    }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callLlm };
}
