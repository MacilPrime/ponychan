var $ = require('jquery');
var Kefir = require('kefir');

var documentReady = Kefir.stream(emitter => {
  $(document).ready(() => {
    emitter.emit(null);
    emitter.end();
  });
  return () => {};
}).toProperty();

export default documentReady;
