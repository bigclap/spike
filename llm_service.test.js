const { callLlm } = require('./llm_service');

describe('LLM API Service', () => {

  beforeEach(() => {
    // Clear mocks before each test
    chrome.storage.local.get.mockClear();
    fetch.mockClear();
  });

  test('callLlm should make a fetch request with correct parameters', async () => {
    // Mock storage to return a username, password, and other settings
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        username: 'test-user',
        password: 'test-password',
        resumeText: 'This is a resume.',
        modelName: 'test-model',
        apiEndpoint: 'http://localhost:11434/api/generate'
      });
    });

    await callLlm('Vacancy description');

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchCall = fetch.mock.calls[0];
    const endpoint = fetchCall[0];
    const options = fetchCall[1];
    const body = JSON.parse(options.body);

    expect(endpoint).toBe('http://localhost:11434/api/generate');
    expect(options.method).toBe('POST');
    const expectedAuth = `Basic ${btoa('test-user:test-password')}`;
    expect(options.headers['Authorization']).toBe(expectedAuth);
    expect(body.model).toBe('test-model');
    expect(body.messages[1].content).toBe('Vacancy description');
  });

  test('callLlm should return the content from the API response', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        username: 'test-user',
        password: 'test-password',
        resumeText: 'This is a resume.',
        modelName: 'test-model',
        apiEndpoint: 'http://localhost:11434/api/generate'
      });
    });

    const result = await callLlm('Some vacancy');
    expect(result).toBe('Mocked API response');
  });

  test('callLlm should reject if settings are not configured', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    await expect(callLlm('A vacancy')).rejects.toThrow('All settings must be configured.');
  });


   test('callLlm should reject if fetch fails', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        username: 'test-user',
        password: 'test-password',
        resumeText: 'This is a resume.',
        modelName: 'test-model',
        apiEndpoint: 'http://localhost:11434/api/generate'
      });
    });

    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await expect(callLlm('A vacancy')).rejects.toThrow('Network error');
  });

   test('callLlm should reject if response is not ok', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        username: 'test-user',
        password: 'test-password',
        resumeText: 'This is a resume.',
        modelName: 'test-model',
        apiEndpoint: 'http://localhost:11434/api/generate'
      });
    });

    fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
    }));

    await expect(callLlm('A vacancy')).rejects.toThrow('API request failed with status 401: Unauthorized');
  });


});
