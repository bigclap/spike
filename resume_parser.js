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
