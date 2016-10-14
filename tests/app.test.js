const test = require('tape');
const request = require('supertest');
const axiosMock = require('axios-mock-adapter');
const sinon = require('sinon');
const fakeredis = require('fakeredis');
const redis = require('redis');
const axios = require('axios');

const createApp = require('../server/app');
const mock = new axiosMock(axios);

sinon.stub(redis, 'createClient', fakeredis.createClient);

test('app', t => {

  t.test('GET /api/search', t => {
    const fixture = require('./fixtures/success.json');
    mock.reset();
    mock.onGet(/.+/).reply(200, fixture);

    t.test('normal request', t => {
      const app = createApp();
      request(app)
      .get('/api/search')
      .query({q: 'cats'})
      .expect(200)
      .end((err, res) => {
        const json = res.body;
        t.equal(json.length, 2);
        app.close();
        t.end(err);
      });
    });

    t.test('invalid offset', t => {
      t.end();
    });

    t.end();
  });

  t.test('GET /api/recent', t => {
    t.end();
  });

  t.end();
});

test.onFinish(() => {
  mock.restore();
});
