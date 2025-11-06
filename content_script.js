chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getResumeText') {
    const resumeElement = document.querySelector('[data-qa="resume-block-main"]');
    if (resumeElement) {
      sendResponse({ resumeText: resumeElement.innerText });
    } else {
      sendResponse({ error: 'Could not find resume text on the page.' });
    }
  }
  return true; // Keep the message channel open for the asynchronous response
});
