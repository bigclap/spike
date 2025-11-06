const { callQwen } = require('./qwen_service');

describe('Qwen API Service', () => {

  beforeEach(() => {
    // Clear mocks before each test
    chrome.storage.local.get.mockClear();
    fetch.mockClear();
  });

  test('callQwen should make a fetch request with correct parameters', async () => {
    // Mock storage to return an API key and resume text
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        pdfResumeText: 'This is a resume.'
      });
    });

    await callQwen('Vacancy description');

    expect(fetch).toHaveBeenCalledTimes(1);
    const fetchCall = fetch.mock.calls[0];
    const endpoint = fetchCall[0];
    const options = fetchCall[1];
    const body = JSON.parse(options.body);

    expect(endpoint).toBe('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer test-api-key');
    expect(body.model).toBe('qwen-long-latest');
    expect(body.input.messages[1].content).toContain('This is a resume.');
    expect(body.input.messages[1].content).toContain('Vacancy description');
  });

  test('callQwen should return the content from the API response', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        pdfResumeText: 'This is a resume.'
      });
    });

    const result = await callQwen('Some vacancy');
    expect(result).toBe('Mocked API response');
  });

  test('callQwen should reject if API key is not set', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ pdfResumeText: 'Resume text' });
    });

    await expect(callQwen('A vacancy')).rejects.toThrow('API Key is not set.');
  });

  test('callQwen should reject if resume text is not available', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ apiKey: 'key' });
    });

    await expect(callQwen('A vacancy')).rejects.toThrow('PDF resume text is not available.');
  });

   test('callQwen should reject if fetch fails', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        pdfResumeText: 'This is a resume.'
      });
    });

    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    await expect(callQwen('A vacancy')).rejects.toThrow('Network error');
  });

   test('callQwen should reject if response is not ok', async () => {
     chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({
        apiKey: 'test-api-key',
        pdfResumeText: 'This is a resume.'
      });
    });

    fetch.mockImplementationOnce(() => Promise.resolve({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized")
    }));

    await expect(callQwen('A vacancy')).rejects.toThrow('API request failed with status 401: Unauthorized');
  });


});

// Modify qwen_service.js to export its function for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callQwen };
}
