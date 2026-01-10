const { get_swagger_specs, APP_STARTER, start_server } = require("./main");
const FS = require('fs');
const PATH = require('path');
const DOTNEV = require('dotenv');
const PICK_ENV = '.env.test';
DOTNEV.config({path: PICK_ENV});


let server;
beforeAll((done) => {
    server = start_server(8085);
    server.on('listening', done);
});

afterAll(() => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) reject(new Error('Network timeout'));
        resolve();
      });
    } else {
      resolve();
    }
  });
});

describe('get_swagger_specs', () => {
    test('validity of the correct api available', () => {
        let val = 'api1';
        const RESULT = get_swagger_specs(val);
        const READ_JSON = JSON.parse(FS.readFileSync(PATH.join(__dirname, `swagger-json`, `${val}-swagger.json`)))
        expect(RESULT).toEqual(READ_JSON);
    });

    test('invalidate of the api available', () => {
        const RESULT = get_swagger_specs('blabla');
        expect(RESULT).toBeNull()
    });
});