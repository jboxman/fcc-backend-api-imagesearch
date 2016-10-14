// Simple model with redis
// http://blog.arunaherath.com/2014/06/faking-redis-in-nodejs-with-fakeredis.html

const objectAssign = require('object-assign');

const redis_ds_RECENT = 'ds_RECENT';
const redis_ds_COUNT = 'ds_COUNT';
const redis_ds_QUERY = 'ds_QUERY';

const config = {client: null};

function emptyFn() {}

function doUpdate(logItem, fn) {
  const client = getClient();
  const serializedItem = JSON.stringify(logItem);

  client.watch(redis_ds_COUNT);
  client.get(redis_ds_COUNT, (err, count) => {
    if(err) {
      process.nextTick(doUpdate);
    }
    else {
      count = count ? count : 1;
      let key = `${redis_ds_QUERY}:${count}`;
      client.multi()
        .incr(redis_ds_COUNT)
        .lpush(redis_ds_RECENT, count)
        .set(key, serializedItem)
        .exec((err, reply) => {
          // Will return null if WATCH fails
          // http://redis.io/commands/exec
          if(typeof reply == 'null') {
            process.nextTick(doUpdate);
          }
          else {
            fn(null, reply);
          }
        });
    }
  });
}

function getClient() {
  return config.client;
}

function getRecent(next = emptyFn) {
  getClient().lrange(redis_ds_RECENT, 0, 9, (err, reply) => {
    if(err) {
      next(err);
      return;
    }

    // Each stored value is serialized to JSON
    getClient().mget(reply.map(v => `${redis_ds_QUERY}:${v}`), (err, vals) => {
      vals = vals ? vals : [];
      next(null, vals.map(v => JSON.parse(v)));
    });
  });
}

function saveRecent(query, next = emptyFn) {
  const logItem = objectAssign({}, {query, when: Date.now()});
  doUpdate(logItem, next);
}

module.exports = function({client = null} = {}) {
  objectAssign(config, {client});

  return {
    getClient,
    getRecent,
    saveRecent
  };
};
