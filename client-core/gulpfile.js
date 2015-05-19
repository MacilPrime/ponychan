var gulp = require('gulp');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var _ = require('lodash');
var streamify = require('gulp-streamify');
var sourcemaps = require('gulp-sourcemaps');
var stdio = require('stdio');
var uglify = require('gulp-uglify');
var envify = require('envify/custom');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var babelify = require('babelify');
var RSVP = require('./test/lib/rsvp');
var exec = require('./src/build/exec');

var args = stdio.getopt({
  'watch': {key: 'w', description: 'Automatic rebuild'},
  'minify': {key: 'm', description: 'Minify build'}
});

process.env.NODE_ENV = args.minify ? 'production' : 'development';

function copyTask(name, paths) {
  var setWatch = _.once(function() {
    if (args.watch) {
      gulp.watch(paths, [name]);
    }
  });
  gulp.task(name, function() {
    setWatch();
    return gulp.src(paths)
      .pipe(gulp.dest('../core/js/'));
  });
}

// TODO make getVersion return a promise instead.
var getVersion = function() {
  throw new Error("can only be called after getVersion task is run");
};

gulp.task('getVersion', function() {
  return RSVP.Promise.all([
    exec('git rev-parse HEAD'),
    exec('git status --porcelain')
  ]).then(function(parts) {
    var commit = parts[0].trim().slice(0, 16);
    var status = parts[1];
    var isModified = /^\s*M/m.test(status);
    var version = commit + (isModified ? '-MODIFIED' : '');

    getVersion = _.constant(version);
  });
});

function browserifyTask(name, entry, destname) {
  gulp.task(name, ['getVersion'], function() {
    var bundler = browserify({
      debug: true,
      entries: [
        'node_modules/console-polyfill',
        'node_modules/babel/polyfill',
        'node_modules/webstorage-polyfill',
        entry
      ],
      noparse: ['jquery', 'moment', 'rsvp'],
      cache: {}, packageCache: {}, fullPaths: args.watch
    });
    bundler.transform(babelify);
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
        .pipe(source(destname))
        .pipe(streamify(sourcemaps.init({loadMaps:true})))
        .pipe(gulpif(args.minify, streamify(uglify())))
        .pipe(streamify(sourcemaps.write('./maps/'+getVersion())))
        .pipe(gulp.dest('../core/js/'));

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
