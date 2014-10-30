var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var mold = require('mold-source-map');
var streamify = require('gulp-streamify');
var sourcemaps = require('gulp-sourcemaps');
var util = require('util');
var stdio = require('stdio');

var args = stdio.getopt({
  // 'watch': {key: 'w', description: 'Automatic rebuild'},
  // 'minify': {key: 'm', description: 'Minify build'}
});

gulp.task('default', ['build']);

gulp.task('build', ['client-js-extra', 'main-js']);

gulp.task('client-js-extra', function() {
  return gulp.src('jsextra/**.js')
    .pipe(gulp.dest('SERVER/js/'));
});

gulp.task('main-js', function() {
  var bundler = browserify({
    debug: true,
    entries: ['./src/main.js/'],
    noparse: ['jquery', 'moment', 'baconjs', 'rsvp', 'underscore']
  });

  var bundle = bundler.bundle();
  var result = bundle
    .pipe(mold.transformSourcesRelativeTo('.'))
    .pipe(source('main.js'))
    .pipe(streamify(sourcemaps.init({loadMaps:true})))
    .pipe(streamify(sourcemaps.write('.')))
    .pipe(gulp.dest('SERVER/js/'));

  return result;
});
