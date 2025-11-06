/**
 * @fileoverview Background script for the HH.ru Vacancy Scorer extension.
 * Handles API calls to the Qwen service.
 */

/**
 * Calls the Qwen API to evaluate a vacancy based on the user's resume.
 * @param {string} prompt - The vacancy description text.
 * @returns {Promise<string>} A promise that resolves with the content of the API response.
 * @throws {Error} If the API key or resume text is not set, or if the API call fails.
 */
async function callQwen(prompt) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['apiKey', 'pdfResumeText'], async (result) => {
      try {
        const { apiKey, pdfResumeText } = result;

        if (!apiKey) {
          throw new Error('API Key is not set.');
        }
        if (!pdfResumeText) {
          throw new Error('PDF resume text is not available.');
        }

        const endpoint = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
        const model = 'qwen-long-latest';

        const requestBody = {
            model: model,
            input: {
                messages: [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant."
                    },
                    {
                        "role": "user",
                        "content": `Based on the following resume text, evaluate the user's suitability for the vacancy described. Provide a score out of 10 and a brief justification.\n\nResume Text:\n${pdfResumeText}\n\nVacancy Description:\n${prompt}`
                    }
                ]
            },
            "parameters": {
                "result_format": "message"
            }
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

        if (data.output && data.output.choices && data.output.choices[0].message.content) {
            resolve(data.output.choices[0].message.content);
        } else {
            throw new Error('Unexpected API response structure.');
        }
      } catch (error) {
        console.error('Error calling Qwen API:', error);
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
    if (request.action === "callQwenApi") {
        callQwen(request.prompt)
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
  module.exports = { callQwen };
}
