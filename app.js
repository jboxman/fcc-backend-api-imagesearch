const dotenv = require('dotenv');
// Only works when loaded here
dotenv.load();
require('./server/app')();
