/**
 * @fileoverview Content script for parsing hh.ru pages.
 * This script is injected into pages matching the patterns in the manifest.
 * It listens for messages from the background script or popup to perform DOM parsing.
 */

/**
 * Actions for runtime messaging.
 * @enum {string}
 */
const ACTIONS = {
  GET_RESUME_DETAILS: 'getResumeDetails',
  GET_VACANCIES: 'getVacancies',
  GET_VACANCY_CONTENT: 'getVacancyContent',
};

/**
 * Parses the main text content from a resume page.
 * @param {Document} document - The document object of the page.
 * @returns {string} The formatted text content of the resume.
 * @throws {Error} If the resume text cannot be found.
 */
function parseResume(document) {
  const sections = [
    { selector: '[data-qa="resume-block-title-position"]', title: 'Должность' },
    { selector: '[data-qa="title-description"]', title: 'Зарплата' },
    { selector: '[data-qa="resume-contacts-phone"]', title: 'Контакты' },
    { selector: '[data-qa="resume-contact-email"]', title: 'Почта' },
    { selector: '[data-qa="resume-list-card-experience"]', title: 'Опыт работы' },
    { selector: '[data-qa="skills-card"]', title: 'Навыки' },
    { selector: '[data-qa="resume-list-card-education"]', title: 'Образование' },
    { selector: '[data-qa="resume-about-card"]', title: 'Обо мне' },
    { selector: '[data-qa="resume-list-card-recommendation"]', title: 'Рекомендации' }
  ];

  let resumeText = '';

  sections.forEach(section => {
    const element = document.querySelector(section.selector);
    if (element && element.textContent) {
      const text = element.textContent.replace(/\s+/g, ' ').trim();
      resumeText += `### ${section.title}\n${text}\n\n`;
    }
  });

  if (resumeText.trim() === '') {
    throw new Error('Could not find resume text on the page.');
  }

  return resumeText;
}

/**
 * Parses detailed information from a resume page, including ID, title, and text.
 * @param {Document} document - The document object of the page.
 * @returns {{id: string, title: string, text: string}} An object containing the resume details.
 * @throws {Error} If the resume ID cannot be parsed from the URL.
 */
function parseResumeDetails(document) {
  const id = window.location.pathname.split('/').pop().split('?')[0];
  const titleElement = document.querySelector('[data-qa="resume-title"]');
  const title = titleElement ? titleElement.innerText.trim() : 'Untitled Resume';
  const text = parseResume(document);

  if (!id) {
    throw new Error('Could not parse resume ID from URL.');
  }

  return { id, title, text };
}

/**
 * Parses vacancy links from a vacancy search page.
 * @param {Document} document - The document object of the page.
 * @returns {string[]} An array of vacancy URLs.
 */
function parseVacancies(document) {
  const links = Array.from(document.querySelectorAll('a.serp-item__title'));
  const vacancyLinks = links.map(a => a.href).filter(href => href.includes('hh.ru/vacancy'));
  return vacancyLinks;
}

/**
 * Parses the main description text from a single vacancy page.
 * @param {Document} document - The document object of the page.
 * @returns {string} The text content of the vacancy description.
 */
function parseVacancyContent(document) {
  const vacancyContent = document.querySelector('.vacancy-description').textContent;
  return vacancyContent;
}

/**
 * Listens for messages from other parts of the extension and routes them to the appropriate parser.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case ACTIONS.GET_RESUME_DETAILS:
                console.info(ACTIONS.GET_RESUME_DETAILS);
                const details = parseResumeDetails(document);
                sendResponse({ details });
                break;
            case ACTIONS.GET_VACANCIES:
                console.info(ACTIONS.GET_VACANCIES);
                const vacancies = parseVacancies(document);
                sendResponse({ vacancies });
                break;
            case ACTIONS.GET_VACANCY_CONTENT:
                console.info(ACTIONS.GET_VACANCY_CONTENT);
                const vacancyText = parseVacancyContent(document);
                sendResponse({ vacancyText });
                break;
        }
    } catch (error) {
        console.error(error);
        sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for the asynchronous response
});