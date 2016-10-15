const dotenv = require('dotenv');
// Only works when loaded here
if(process.env.NODE_ENV != 'production')
  dotenv.load();

require('./server/app')();
