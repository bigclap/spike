chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getResumeText') {
      console.info('getResumeText');

      try {
        const resumeText = parseResume(document);
        sendResponse({ resumeText });
      } catch (error) {
        console.error(error);
        sendResponse({ error: error.message });
      }
    }
    return true; // Keep the message channel open for the asynchronous response
});
