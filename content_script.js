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
    } else if (request.action === 'getVacancies') {
        console.info('getVacancies');
        try {
            const vacancies = parseVacancies(document);
            sendResponse({ vacancies });
        } catch (error) {
            console.error(error);
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'getVacancyContent') {
        console.info('getVacancyContent');
        try {
            const vacancyText = parseVacancyContent(document);
            sendResponse({ vacancyText });
        } catch (error) {
            console.error(error);
            sendResponse({ error: error.message });
        }
    }
    return true; // Keep the message channel open for the asynchronous response
});
