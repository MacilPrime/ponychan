var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var mold = require('mold-source-map');
var _ = require('underscore');
var streamify = require('gulp-streamify');
var sourcemaps = require('gulp-sourcemaps');
var stdio = require('stdio');
var uglify = require('gulp-uglify');
var envify = require('envify/custom');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var to5ify = require('6to5ify');
var execSync = require('exec-sync');

var args = stdio.getopt({
  'watch': {key: 'w', description: 'Automatic rebuild'},
  'minify': {key: 'm', description: 'Minify build'}
});

function copyTask(name, paths) {
  var setWatch = _.once(function() {
    if (args.watch) {
      gulp.watch(paths, [name]);
    }
  });
  gulp.task(name, function() {
    setWatch();
    return gulp.src(paths)
      .pipe(gulp.dest('SERVER/js/'));
  });
}

var getVersion = _.once(function() {
  var commit = execSync('git rev-parse HEAD').trim().slice(0, 16);
  var status = execSync('git status --porcelain');
  var isModified = /^\s*M/m.test(status);
  return commit + (isModified ? '-MODIFIED' : '');
});

function browserifyTask(name, entry, destname) {
  gulp.task(name, function() {
    var bundler = browserify({
      debug: true,
      entries: ['6to5/polyfill', entry],
      noparse: ['jquery', 'moment', 'baconjs', 'rsvp', 'underscore'],
      cache: {}, packageCache: {}, fullPaths: args.watch
    });
    bundler.transform(to5ify);
    bundler.transform(envify({
      VERSION: getVersion()
    }));

    if (args.watch) {
      bundler = watchify(bundler);
      bundler.on('update', buildBundle.bind(null, true));
    }

    function buildBundle(isRebuild) {
      var bundle = bundler.bundle();
      var result = bundle
        .pipe(mold.transformSourcesRelativeTo('.'))
        .pipe(source(destname))
        .pipe(streamify(sourcemaps.init({loadMaps:true})))
        .pipe(gulpif(args.minify, streamify(uglify())))
        .pipe(streamify(sourcemaps.write('./maps/'+getVersion())))
        .pipe(gulp.dest('SERVER/js/'));

      if (isRebuild) {
        var wasError = false;
        gutil.log("Rebuilding '"+gutil.colors.cyan(name)+"'");
        bundle.on('error', function(err) {
          wasError = true;
          gutil.log(gutil.colors.red("Error")+" rebuilding '"+gutil.colors.cyan(name)+"':"+err.message);
          result.end();
        });
        result.on('end', function() {
          if (!wasError) {
            gutil.log("Finished rebuild of '"+gutil.colors.cyan(name)+"'");
          }
        });
      }

      return result;
    }

    return buildBundle(false);
  });
}

gulp.task('default', ['build']);

gulp.task('build', ['client-js-extra', 'main-js']);

copyTask('client-js-extra', './src/extra/**.js');
browserifyTask('main-js', './src/main/', 'main.js');
