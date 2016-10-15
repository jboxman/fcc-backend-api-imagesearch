const REDIS_URL = process.env.REDIS_URL ? process.env.REDIS_URL : null;
const HEROKU_URL = (process.env.NODE_ENV == 'production') ? process.env.HEROKU_URL : 'http://localhost/';

module.exports = {
  REDIS_URL,
  HEROKU_URL
};
