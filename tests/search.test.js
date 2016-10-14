const test = require('tape');
const redis = require('redis');
const fakeredis = require('fakeredis');

const searchModel = require('../server/models/search');

function setup() {
  return searchModel({client: fakeredis.createClient()});
}

test('search model', t => {

  t.test('#getClient', t => {
    const model = setup();
    t.ok(model.getClient());
    t.end();
  });

  t.test('#getRecent', t => {
    const model = setup();
    model.getRecent(function(err, res) {
      t.ok(res)
      t.end();
    });
  });

  t.test('#saveRecent', t => {
    const model = setup();
    const expected = {
      query: 'test'
    };

    // Not really err, blown args
    model.saveRecent(expected.query, function(err) {
      model.getRecent(fn);
    });

    function fn(err, res) {
      //const val = JSON.parse(res);
      t.equal(res[0].query, expected.query);
      t.ok(res[0].when);
      t.end();
    }
  });

  t.end();
});

