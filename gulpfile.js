var gulp = require('gulp');

var concat = require('gulp-concat');
var rename = require('gulp-rename');
var traceur = require('gulp-traceur');
var streamqueue = require('streamqueue');

var SOURCES = {
  CLIENT_JS_EXTRA: [
    'jsextra/**.js'
  ],
  CLIENT_JS_MAIN: {
    HEADER: [
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/moment/moment.js',
      'node_modules/q/q.js',
      traceur.RUNTIME_PATH
    ],
    ES6: [
      'jsmain/visibility.min.js',
      'jsmain/logger.js',
      'jsmain/default.js',
      'jsmain/thumbnailer.js',
      'jsmain/notice.js',
      'jsmain/settings.js',
      'jsmain/state.js',
      'jsmain/styles.js',
      'jsmain/spoiler-toggle.js',
      'jsmain/local-time.js',
      'jsmain/reloader.js',
      'jsmain/post-hover.js',
      'jsmain/postlinkinfo.js',
      'jsmain/watcher.js',
      'jsmain/notifier.js',
      'jsmain/show-filenames.js',
      'jsmain/inline-expanding.js',
      'jsmain/image-hover.js',
      'jsmain/smartphone-spoiler.js',
      'jsmain/show-backlinks.js',
      'jsmain/navbar.js',
      'jsmain/permalink.js',
      'jsmain/qr.js',
      'jsmain/tags.js',
      'jsmain/misc.js',
      'jsmain/titlebar.js',
      'jsmain/hide-toggle.js',
      'jsmain/post-hiding.js',
      'jsmain/ips.js',
      'jsmain/fancy.js',
      'jsmain/mc.js',
      'jsmain/embed.js',
      'jsmain/search.js',
      'jsmain/hide-trip.js'
    ]
  }
};

gulp.task('client-js-extra', function() {
  return gulp.src(SOURCES.CLIENT_JS_EXTRA)
    .pipe(gulp.dest('SERVER/js/'));
});

gulp.task('client-js-main', function() {
  var sq = streamqueue({objectMode: true});
  
  sq.queue(gulp.src(SOURCES.CLIENT_JS_MAIN.HEADER));
  sq.queue(gulp.src(SOURCES.CLIENT_JS_MAIN.ES6)
           .pipe(traceur({modules: 'inline', experimental: true})));
  
  return sq.done()
    .pipe(concat('main-needtb.js'))
    .pipe(gulp.dest('SERVER/js/'));
});

gulp.task('default', ['client-js-extra', 'client-js-main']);
