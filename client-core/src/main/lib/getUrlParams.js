export default function getUrlParams(url, includeHash) {
  function decode (s) {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  }

  if (!includeHash)
    url = url.replace(/#.*/, '');
  const params = {};
  const match_params = /[?#](.*)$/.exec(url);
  if (match_params) {
    const params_part = match_params[1];
    const search = /([^&#=]+)=?([^&#]*)/g;
    let match;
    while ((match = search.exec(params_part))) {
      params[decode(match[1])] = decode(match[2]);
    }
  }
  return params;
}
