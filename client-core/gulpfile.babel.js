import gulp from 'gulp';
import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import _ from 'lodash';
import streamify from 'gulp-streamify';
import sourcemaps from 'gulp-sourcemaps';
import stdio from 'stdio';
import uglify from 'gulp-uglify';
import envify from 'envify/custom';
import gulpif from 'gulp-if';
import gutil from 'gulp-util';
import babelify from 'babelify';
import RSVP from './test/lib/rsvp';
import exec from './src/build/exec';

const args = stdio.getopt({
  'watch': {key: 'w', description: 'Automatic rebuild'},
  'hot': {key: 'h', description: 'Hot module replacement'},
  'minify': {key: 'm', description: 'Minify build'}
});

process.env.NODE_ENV = args.minify ?
  'production' :
  args.hot ? 'development-hmr' : 'development';

// TODO make getVersion return a promise instead.
let getVersion = function() {
  throw new Error('can only be called after getVersion task is run');
};

gulp.task('getVersion', function() {
  return RSVP.Promise.all([
    exec('git rev-parse HEAD'),
    exec('git status --porcelain')
  ]).then(function(parts) {
    const commit = parts[0].trim().slice(0, 16);
    const status = parts[1];
    const isModified = /^\s*M/m.test(status);
    const version = commit + (isModified ? '-MODIFIED' : '');

    getVersion = _.constant(version);
  });
});

function browserifyTask(name, entry, destname) {
  gulp.task(name, ['getVersion'], function() {
    let bundler = browserify({
      debug: true,
      entries: [
        entry
      ],
      noparse: ['jquery', 'moment', 'rsvp'],
      cache: {}, packageCache: {}
    });
    bundler.transform(babelify);
    bundler.transform(envify({
      VERSION: getVersion(),
      NODE_ENV: process.env.NODE_ENV
    }));
    if (args.hot) {
      bundler.plugin(require('browserify-hmr'));
    }

    if (args.watch) {
      bundler = watchify(bundler);
      bundler.on('update', buildBundle.bind(null, true));
    }

    function buildBundle(isRebuild) {
      const bundle = bundler.bundle();
      const result = bundle
        .pipe(source(destname))
        .pipe(streamify(sourcemaps.init({loadMaps:true})))
        .pipe(gulpif(args.minify, streamify(uglify())))
        .pipe(streamify(sourcemaps.write('./maps/'+getVersion())))
        .pipe(gulp.dest('../core/js/'));

      if (isRebuild) {
        let wasError = false;
        gutil.log("Rebuilding '"+gutil.colors.cyan(name)+"'");
        bundle.on('error', function(err) {
          wasError = true;
          gutil.log(gutil.colors.red('Error')+" rebuilding '"+gutil.colors.cyan(name)+"':"+err.message);
          result.end();
        });
        result.on('end', function() {
          if (!wasError) {
            gutil.log("Finished rebuild of '"+gutil.colors.cyan(name)+"'");
          }
        });
      }

      return new RSVP.Promise((resolve, reject) => {
        bundle.on('error', reject);
        result.on('error', reject);
        result.on('end', resolve);
        result.on('finish', resolve);
      });
    }

    return buildBundle(false);
  });
}

gulp.task('default', ['build']);

gulp.task('build', ['main-js']);

browserifyTask('main-js', './src/main/', 'main.js');
