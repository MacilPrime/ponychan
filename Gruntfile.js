module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    traceur: {
      options: {
        experimental: true,
        modules: 'inline'
      },
      main: {
        nonull: true,
        src: [
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
        ],
        dest: 'tmpbuild/main-needtb.js'
      }
    },
    concat: {
      main: {
        nonull: true,
        src: [
          'node_modules/jquery/dist/jquery.min.js',
          'node_modules/moment/moment.js',
          'node_modules/q/q.js',
          'jsextra/traceur-runtime.js',
          'tmpbuild/main-needtb.js'
        ],
        dest: 'SERVER/js/main-needtb.js'
      }
    },
    copy: {
      main: {files: [{
        nonull: true,
        expand: true,
        cwd: 'jsextra/',
        src: ['*.js'],
        dest: 'SERVER/js/',
        filter: 'isFile'
      }]}
    }
  });
  
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-traceur');

  // Default task(s).
  grunt.registerTask('default', ['traceur','concat','copy']);
};
