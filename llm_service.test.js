const { callLlm } = require('./llm_service');

describe('LLM API Service', () => {

  beforeEach(() => {
    // Clear mocks before each test
    chrome.storage.local.get.mockClear();
    fetch.mockClear();
  });

  test('callLlm should make a fetch request with correct parameters', async () => {
    // Mock storage to return an API key and resume text
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        resumeText: 'This is a resume.',
        modelName: 'test-model'
      });
    });

    await callLlm('Vacancy description');

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchCall = fetch.mock.calls[0];
    const endpoint = fetchCall[0];
    const options = fetchCall[1];
    const body = JSON.parse(options.body);

    expect(endpoint).toBe('http://localhost/v1/chat/completions');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer test-api-key');
    expect(body.model).toBe('test-model');
    expect(body.messages[1].content).toContain('This is a resume.');
    expect(body.messages[1].content).toContain('Vacancy description');
  });

  test('callLlm should return the content from the API response', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        resumeText: 'This is a resume.',
        modelName: 'test-model'
      });
    });

    const result = await callLlm('Some vacancy');
    expect(result).toBe('Mocked API response');
  });

  test('callLlm should reject if API key is not set', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ resumeText: 'Resume text', modelName: 'test-model' });
    });

    await expect(callLlm('A vacancy')).rejects.toThrow('API Key is not set.');
  });

  test('callLlm should reject if resume text is not available', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ apiKey: 'key', modelName: 'test-model' });
    });

    await expect(callLlm('A vacancy')).rejects.toThrow('Resume text is not available.');
  });

  test('callLlm should reject if model name is not set', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
        callback({ apiKey: 'key', resumeText: 'resume' });
    });

    await expect(callLlm('A vacancy')).rejects.toThrow('Model name is not set.');
  });

   test('callLlm should reject if fetch fails', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        resumeText: 'This is a resume.',
        modelName: 'test-model'
      });
    });

    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await expect(callLlm('A vacancy')).rejects.toThrow('Network error');
  });

   test('callLlm should reject if response is not ok', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        resumeText: 'This is a resume.',
        modelName: 'test-model'
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
