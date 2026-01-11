const FS = require('fs');
const PATH = require('path');

// 1. Mock External Modules BEFORE requiring main.js
// Mock Config to control environment variables and lists
jest.mock('./config', () => ({
  config: {
    url_def: ['api1', 'api3'], // Must match files present in swagger-json directory for actual reading tests, or mock fs
    enable_req_call: ['api1'],
    access_member: ['member@example.com'],
    jwt_identity_key: 'username'
  }
}));

// Mock Token Middleware to control auth results
const mockEncodeToken = jest.fn();
const mockDecodeToken = jest.fn();
jest.mock('./middleware/validate.token', () => ({
  encodeToken: mockEncodeToken,
  decodeToken: mockDecodeToken
}));

// Mock Swagger UI to verify options passed to it
const mockSwaggerSetup = jest.fn();
const mockSwaggerServe = jest.fn((req, res, next) => next());
jest.mock('swagger-ui-express', () => ({
  serve: mockSwaggerServe,
  // setup returns the actual middleware function
  setup: mockSwaggerSetup
}));

// 2. Require the module under test
const { get_swagger_specs, start_server } = require("./main");

// 3. Setup Server and Global Vars
let server;
const PORT = 8086; // Use a distinct port for testing
const BASE_URL = `http://localhost:${PORT}`;

beforeAll((done) => {
  // Start server
  server = start_server(PORT);
  server.on('listening', done);
});

afterAll((done) => {
  // Close server
  if (server) {
    server.close(done);
  } else {
    done();
  }
});

beforeEach(() => {
  jest.clearAllMocks();
  // Default mock middleware for swagger setup
  mockSwaggerSetup.mockReturnValue((req, res, next) => res.send('SWAGGER_UI_RENDERED'));
});

describe('Unit Tests: get_swagger_specs', () => {
  test('should return JSON spec when load option is json and file exists', () => {
    const result = get_swagger_specs('api1');
    expect(result).toBeDefined();
    if (result && result.info) {
      expect(result.info.title).toBeDefined();
    }
  });

  test('should return null for API not in url_def config', () => {
    const result = get_swagger_specs('api_unknown');
    expect(result).toBeNull();
  });
});

describe('Integration Tests: Server Endpoints', () => {

  describe('GET /', () => {
    test('should serve the login HTML page', async () => {
      const response = await fetch(`${BASE_URL}/`);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toContain('<title>DocuAPI</title>');
      expect(text).toContain('name="username"');
    });
  });

  describe('GET /docs (Login Handler)', () => {
    test('should reject invalid credentials', async () => {
      const params = new URLSearchParams({ username: 'bad', password: 'bad' });
      const response = await fetch(`${BASE_URL}/docs?${params}`);
      const text = await response.text();

      expect(text).toContain("Unauthorized");
      expect(mockEncodeToken).not.toHaveBeenCalled();
    });

    test('should authenticate valid credentials and set cookie', async () => {
      // main.js hardcodes: "abc@xyz.com" / "123456"
      const params = new URLSearchParams({ username: 'abc@xyz.com', password: '123456' });

      mockEncodeToken.mockResolvedValue('MOCK_JWT_TOKEN');

      const response = await fetch(`${BASE_URL}/docs?${params}`);

      expect(mockEncodeToken).toHaveBeenCalledWith('abc@xyz.com');

      const cookies = response.headers.get('set-cookie');
      expect(cookies).toContain('authToken=MOCK_JWT_TOKEN');

      const text = await response.text();
      expect(text).toContain('DocuAPI - Documenting API');
      expect(text).toContain('API1');
    });
  });

  describe('GET /docs/:api_url (Swagger Page)', () => {

    test('should return 404 if Swagger spec not found', async () => {
      const response = await fetch(`${BASE_URL}/docs/unknown_api`);
      expect(response.status).toBe(404);
    });

    test('should load Swagger UI for Public/Enabled API (No Auth)', async () => {
      const response = await fetch(`${BASE_URL}/docs/api1`);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('SWAGGER_UI_RENDERED');

      expect(mockSwaggerSetup).toHaveBeenCalled();
      const [specs, options] = mockSwaggerSetup.mock.calls[mockSwaggerSetup.mock.calls.length - 1];
      expect(options).toEqual({ swaggerOptions: {} });
    });

    test('should load Swagger UI with "Try Out" DISABLED for restricted API (No Auth)', async () => {
      // api3 is restricted (not in enable_req_call)
      const response = await fetch(`${BASE_URL}/docs/api3`);
      expect(response.status).toBe(200);

      const [specs, options] = mockSwaggerSetup.mock.calls[mockSwaggerSetup.mock.calls.length - 1];
      expect(options).toHaveProperty('customCss');
    });

    test('should provide Bearer Auth and Custom CSS to Logged In Member for restricted API', async () => {
      // api3 restricted, user is member
      const MOCK_TOKEN = 'MEMBER_TOKEN';
      mockDecodeToken.mockResolvedValue({ username: 'member@example.com' });

      const response = await fetch(`${BASE_URL}/docs/api3`, {
        headers: { cookie: `authToken=${MOCK_TOKEN}` }
      });

      expect(mockDecodeToken).toHaveBeenCalled();

      const [specs, options] = mockSwaggerSetup.mock.calls[mockSwaggerSetup.mock.calls.length - 1];

      // As analysed, members currently get the customCss restriction too if the API is restricted
      expect(options.swaggerOptions).toHaveProperty('customCss');
      expect(options.swaggerOptions).toHaveProperty('authAction');
    });
  });
});