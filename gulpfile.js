var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var es6ify = require('es6ify');
var source = require('vinyl-source-stream');
var mold = require('mold-source-map');
var streamify = require('gulp-streamify');
var sourcemaps = require('gulp-sourcemaps');
var util = require('util');

gulp.task('default', ['build']);

gulp.task('build', ['client-js-extra', 'client-js-main']);

gulp.task('client-js-extra', function() {
  return gulp.src('jsextra/**.js')
    .pipe(gulp.dest('SERVER/js/'));
});

gulp.task('client-js-main', function() {
  var bundler = browserify({debug: true})
    .add(es6ify.runtime)
    .transform(require('es6ify').configure(/^(?!.*node_modules)+.+\.js$/))
    .require(require.resolve('./jsmain/main.js'), {entry: true});

  var bundle = bundler.bundle();
  var result = bundle
    .pipe(mold.transformSourcesRelativeTo('.'))
    .pipe(source('main.js'))
    .pipe(streamify(sourcemaps.init({loadMaps:true})))
    .pipe(streamify(sourcemaps.write('.')))
    .pipe(gulp.dest('SERVER/js/'));

  return result;
});
