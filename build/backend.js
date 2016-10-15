require("source-map-support").install();
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmory imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmory exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		Object.defineProperty(exports, name, {
/******/ 			configurable: false,
/******/ 			enumerable: true,
/******/ 			get: getter
/******/ 		});
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 14);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports) {

module.exports = require("object-assign");

/***/ },
/* 1 */
/***/ function(module, exports) {

module.exports = require("ramda");

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

const express = __webpack_require__(10);
const bodyParser = __webpack_require__(9);
const util = __webpack_require__(13);
const redis = __webpack_require__(12);

const globals = __webpack_require__(4);
const api = __webpack_require__(5);
const searchModel = __webpack_require__(6);

// For testing:
// https://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/
module.exports = function () {
  const app = express();
  const port = process.env.PORT || 3100;

  //  const client = redis.createClient({url: globals.REDIS_URL});
  const client = redis.createClient({
    url: globals.REDIS_URL
  });
  const model = searchModel({ client: client });

  // __dirname is '/' after babel
  app.use(express.static(`${ process.cwd() }/public`));

  app.use(bodyParser.json());

  // TODO
  // Should this be "offset" because of specific user story? Yes.
  app.get('/api/search', (req, res, next) => {
    var _req$query = req.query;
    let q = _req$query.q;
    let offset = _req$query.offset;


    if (!q) {
      res.status(400).send('API error: Missing q');
      return;
    }
    if (!offset) {
      offset = 1;
    } else if (isNaN(offset)) {
      res.status(400).send('API error: Bad offset');
      return;
    }

    api({ q: q, offset: offset }, function (err, result) {
      if (err) {
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

  app.use(function (req, res, next) {
    res.status(404).send('Not Found');
  });

  app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('error');
  });

  const server = app.listen(port, () => console.log(`Listening on ${ port }`));
  return server;
};

/***/ },
/* 3 */
/***/ function(module, exports) {

module.exports = require("dotenv");

/***/ },
/* 4 */
/***/ function(module, exports) {

"use strict";
'use strict';

const REDIS_URL = process.env.REDIS_URL ? process.env.REDIS_URL : null;
const HEROKU_URL = process.env.NODE_ENV == 'production' ? process.env.HEROKU_URL : 'http://localhost/';

module.exports = {
  REDIS_URL: REDIS_URL,
  HEROKU_URL: HEROKU_URL
};

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

const qs = __webpack_require__(11);
const objectAssign = __webpack_require__(0);
const R = __webpack_require__(1);
const axios = __webpack_require__(8);
const get = axios.get;


const renameKeys = __webpack_require__(7).renameKeys;

const API_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';
const CX = '014304067697241665025:k9zlrt4v4bw';
// .env locally and in config on Heroku
const API_KEY = process.env.GOOGLE_API_KEY;

function transformData(data) {
  const getKeys = R.pipe(R.pick(['title', 'cacheId', 'snippet', 'displayLink']), renameKeys({
    cacheId: 'id'
  }));

  // TODO
  // Add default when missing?
  const getThumb = R.pipe(R.path(['pagemap', 'cse_thumbnail']), thumbs => thumbs ? thumbs[0] : {}, R.pick(['width', 'height', 'src']), renameKeys({
    width: 'thumb_width',
    height: 'thumb_height',
    src: 'thumb_src'
  }));

  const getImage = R.pipe(R.path(['pagemap', 'cse_image']), image => image ? image[0] : {}, R.pick(['src']), renameKeys({
    src: 'image_src'
  }));

  const r = R.reduce((acc, item) => {
    return [...acc, objectAssign({}, getKeys(item), getThumb(item), getImage(item))];
  }, [], data.items);

  return {
    length: r.length,
    items: r,
    ids: R.reduce((acc, v) => [...acc, v.id], [], r)
  };
}

module.exports = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  let q = _ref.q;
  let offset = _ref.offset;
  let cb = arguments[1];

  if (!q) {
    cb(new Error('Must specify q'));
    return;
  }

  const params = qs.stringify({
    q: q,
    start: offset,
    cx: CX,
    key: API_KEY,
    fileType: 'jpg'
  });

  const compositeURL = `${ API_ENDPOINT }?${ params }`;

  get(compositeURL).then(response => {
    cb(null, transformData(response.data));
  }).catch(error => {
    console.log(error);
    cb(error);
  });
};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

// Simple model with redis
// http://blog.arunaherath.com/2014/06/faking-redis-in-nodejs-with-fakeredis.html

const objectAssign = __webpack_require__(0);

const redis_ds_RECENT = 'ds_RECENT';
const redis_ds_COUNT = 'ds_COUNT';
const redis_ds_QUERY = 'ds_QUERY';

const config = { client: null };

function emptyFn() {}

function doUpdate(logItem, fn) {
  const client = getClient();
  const serializedItem = JSON.stringify(logItem);

  client.watch(redis_ds_COUNT);
  client.get(redis_ds_COUNT, (err, count) => {
    if (err) {
      process.nextTick(doUpdate);
    } else {
      count = count ? count : 1;
      let key = `${ redis_ds_QUERY }:${ count }`;
      client.multi().incr(redis_ds_COUNT).lpush(redis_ds_RECENT, count).set(key, serializedItem).exec((err, reply) => {
        // Will return null if WATCH fails
        // http://redis.io/commands/exec
        if (typeof reply == 'null') {
          process.nextTick(doUpdate);
        } else {
          fn(null, reply);
        }
      });
    }
  });
}

function getClient() {
  return config.client;
}

function getRecent() {
  let next = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : emptyFn;

  getClient().lrange(redis_ds_RECENT, 0, 9, (err, reply) => {
    if (err) {
      next(err);
      return;
    }

    // Each stored value is serialized to JSON
    getClient().mget(reply.map(v => `${ redis_ds_QUERY }:${ v }`), (err, vals) => {
      vals = vals ? vals : [];
      next(null, vals.map(v => JSON.parse(v)));
    });
  });
}

function saveRecent(query) {
  let next = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : emptyFn;

  const logItem = objectAssign({}, { query: query, when: Date.now() });
  doUpdate(logItem, next);
}

module.exports = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref$client = _ref.client;
  let client = _ref$client === undefined ? null : _ref$client;

  objectAssign(config, { client: client });

  return {
    getClient: getClient,
    getRecent: getRecent,
    saveRecent: saveRecent
  };
};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

const R = __webpack_require__(1);

// https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object
const renameKeys = R.curry((keysMap, obj) => {
  return R.reduce((acc, key) => {
    acc[keysMap[key] || key] = obj[key];
    return acc;
  }, {}, R.keys(obj));
});

module.exports = { renameKeys: renameKeys };

/***/ },
/* 8 */
/***/ function(module, exports) {

module.exports = require("axios");

/***/ },
/* 9 */
/***/ function(module, exports) {

module.exports = require("body-parser");

/***/ },
/* 10 */
/***/ function(module, exports) {

module.exports = require("express");

/***/ },
/* 11 */
/***/ function(module, exports) {

module.exports = require("querystring");

/***/ },
/* 12 */
/***/ function(module, exports) {

module.exports = require("redis");

/***/ },
/* 13 */
/***/ function(module, exports) {

module.exports = require("util");

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

"use strict";
'use strict';

const dotenv = __webpack_require__(3);
// Only works when loaded here
if (process.env.NODE_ENV != 'production') dotenv.load();

__webpack_require__(2)();

/***/ }
/******/ ]);
//# sourceMappingURL=backend.js.map