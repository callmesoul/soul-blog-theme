// Script elements are parsed as raw HTML even when their type is application/json.
hexo.extend.helper.register('soul_json', function (value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
});
