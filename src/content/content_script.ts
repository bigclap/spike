/**
 * @fileoverview Content script for parsing hh.ru pages.
 * This script is injected into pages matching the patterns in the manifest.
 * It listens for messages from the background script or popup to perform DOM parsing.
 */

import { ACTIONS } from '../common/actions';
import { Resume } from '../common/types';

function parseResume(doc: Document): string {
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
    const element = doc.querySelector<HTMLElement>(section.selector);
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

function parseResumeDetails(doc: Document): Resume {
  const id = window.location.pathname.split('/').pop()?.split('?')[0];
  const titleElement = doc.querySelector<HTMLElement>('[data-qa="resume-title"]');
  const title = titleElement ? titleElement.innerText.trim() : 'Untitled Resume';
  const text = parseResume(doc);

  if (!id) {
    throw new Error('Could not parse resume ID from URL.');
  }

  return { id, title, text };
}

function parseVacancies(doc: Document): string[] {
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a.serp-item__title'));
  const vacancyLinks = links.map(a => a.href).filter(href => href.includes('hh.ru/vacancy'));
  return vacancyLinks;
}

function parseVacancyContent(doc: Document): string {
  const vacancyContent = doc.querySelector<HTMLElement>('.vacancy-description')?.textContent;
  if (!vacancyContent) {
    throw new Error('Could not find vacancy description on the page.');
  }
  return vacancyContent;
}

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
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
    } catch (error: any) {
        console.error(error);
        sendResponse({ error: error.message });
    }
    return true; // Keep the message channel open for the asynchronous response
});
