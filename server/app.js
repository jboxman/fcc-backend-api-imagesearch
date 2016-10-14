const express = require('express');
const bodyParser = require('body-parser');
const util = require('util');
const redis = require('redis');

const api = require('./helpers/api');
const searchModel = require('./models/search');

// For testing:
// https://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/
module.exports = function() {
  const app = express();
  const port = process.env.PORT || 3100;

//  const client = redis.createClient({url: globals.REDIS_URL});
  const client = redis.createClient();
  const model = searchModel({client});

  // __dirname is '/' after babel
  app.use(express.static(`${process.cwd()}/public`));

  app.use(bodyParser.json());

// TODO
// Should this be "offset" because of specific user story? Yes.
  app.get('/api/search', (req, res, next) => {
   let {q, offset} = req.query;

   if(!q) {
     res.status(400).send('API error: Missing q');
     return;
   }
   if(!offset) {
     offset = 1;
   }
   else if(isNaN(offset)) {
     res.status(400).send('API error: Bad offset');
     return;
   }

    api({q, offset}, function(err, result) {
      if(err) {
        next(new Error(err));
        return;
      }

      model.saveRecent(q, (err, reply) => {
        res.status(200).json(result);
      });
    });

  });

  app.get('/api/recent', (req, res) => {
    model.getRecent((err, reply) => {
      res.status(200).json(reply);
    });
  });

  app.use(function(req, res, next) {
    res.status(404).send('Not Found');
  });

  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('error');
  });

  const server = app.listen(port, () => console.log(`Listening on ${port}`));
  return server;
};
