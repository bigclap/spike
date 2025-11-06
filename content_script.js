// This script is injected into the hh.ru resume page.
// It listens for a message from the background script and sends back the resume text.

// The parseResume function is in a separate file so that it can be tested independently.


document.addEventListener('DOMContentLoaded', () => {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getResumeText') {
      try {
        const resumeText = parseResume(document);
        sendResponse({ resumeText });
      } catch (error) {
        sendResponse({ error: error.message });
      }
    }
    return true; // Keep the message channel open for the asynchronous response
  });
});
