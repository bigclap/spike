import { setVacancyScore, getVacancyStatus } from '../src/background/db';

describe('Database Helpers', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  test('setVacancyScore should save data to chrome.storage.local', async () => {
    await setVacancyScore('12345', 8, 'analyzed');

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    const call = chrome.storage.local.set.mock.calls[0][0];
    expect(call).toHaveProperty('vacancy_12345');
    expect(call.vacancy_12345.score).toBe(8);
    expect(call.vacancy_12345.status).toBe('analyzed');
    expect(call.vacancy_12345).toHaveProperty('timestamp');
  });

  test('getVacancyStatus should retrieve data from chrome.storage.local', async () => {
    const mockData = { score: 9, status: 'applied', timestamp: '2023-01-01T00:00:00.000Z' };
    chrome.storage.local.get.mockImplementation((keys: string, callback: (items: { [key: string]: any; }) => void) => {
      callback({ 'vacancy_67890': mockData });
    });

    const result = await getVacancyStatus('67890');

    expect(chrome.storage.local.get).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.get).toHaveBeenCalledWith('vacancy_67890', expect.any(Function));
    expect(result).toEqual(mockData);
  });

  test('getVacancyStatus should return undefined if data not found', async () => {
    chrome.storage.local.get.mockImplementation((keys: string, callback: (items: { [key: string]: any; }) => void) => {
      callback({}); // Simulate not found
    });

    const result = await getVacancyStatus('00000');
    expect(result).toBeUndefined();
  });
});
