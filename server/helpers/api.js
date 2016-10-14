const qs = require('querystring');
const objectAssign = require('object-assign');
const R = require('ramda');
const axios = require('axios');
const {get} = axios;

const renameKeys = require('../../tools').renameKeys;

const API_ENDPOINT = 'https://www.googleapis.com/customsearch/v1';
const CX = '014304067697241665025:k9zlrt4v4bw';
// .env locally and in config on Heroku
const API_KEY = process.env.GOOGLE_API_KEY;

function transformData(data) {
  const getKeys = R.pipe(
    R.pick(['title', 'cacheId', 'snippet', 'displayLink']),
    renameKeys({
      cacheId: 'id'
    })
  );

  // TODO
  // Add default when missing?
  const getThumb = R.pipe(
    R.path(['pagemap', 'cse_thumbnail']),
    thumbs => thumbs ? thumbs[0] : {},
    R.pick(['width', 'height', 'src']),
    renameKeys({
      width: 'thumb_width',
      height: 'thumb_height',
      src: 'thumb_src'
    })
  );

  const getImage = R.pipe(
    R.path(['pagemap', 'cse_image']),
    image => image ? image[0] : {},
    R.pick(['src']),
    renameKeys({
      src: 'image_src'
    })
  );

  const r = R.reduce((acc, item) => {
    return [
      ...acc,
      objectAssign(
        {},
        getKeys(item),
        getThumb(item),
        getImage(item))
      ];
  }, [], data.items);

  return {
    length: r.length,
    items: r,
    ids: R.reduce((acc, v) => [...acc, v.id], [], r)
  };
}

module.exports = function({q, offset} = {}, cb) {
  if(!q) {
    cb(new Error('Must specify q'));
    return;
  }

  const params = qs.stringify({
    q,
    start: offset,
    cx: CX,
    key: API_KEY,
    fileType: 'jpg'
  });

  const compositeURL = `${API_ENDPOINT}?${params}`;
  console.log(compositeURL);

  get(compositeURL)
    .then(response => {
      console.log(response.data);
      cb(undefined, transformData(response.data));
    })
    .catch(error => {
      console.log(error);
      cb(error);
    });
}
