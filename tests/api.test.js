const test = require('tape');
const axiosMock = require('axios-mock-adapter');
const axios = require('axios');

const api = require('../server/helpers/api');
const fixture = require('./fixtures/success.json');

const mock = new axiosMock(axios);

test('API', t => {

  t.test('should return JSON', t => {
    mock.reset();
    mock.onGet(/.+/).reply(200, fixture);

    api({q: 'any', offset: 1}, (error, data) => {
      t.equal(data.length, 2);
    });

    t.end();
  });

  t.test('must fail without q', t => {
    api({}, (error, data) => {
      t.ok(error);
    });
    t.end();
  });

  t.end();

});

test.onFinish(() => {
  mock.restore();
});
