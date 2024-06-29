const request = require('supertest');
const { app } = require('../src/app');

describe('GET /list-input-files', () => {
  it('responds with json containing a list of input files', done => {
    request(app)
      .get('/list-input-files')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200, done);
  });
});

const { server } = require('../src/app');
afterAll(() => {
  server.close();
});