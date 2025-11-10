function parseVacancies(document) {
  const links = Array.from(document.querySelectorAll('a.serp-item__title'));
  const vacancyLinks = links.map(a => a.href).filter(href => href.includes('hh.ru/vacancy'));
  return vacancyLinks;
}
