var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');
var jade = require('gulp-jade');
var static_resources = require('./config/static_resources')(__dirname);
var useref = require('gulp-useref');
var gulpif = require('gulp-if')


gulp.task('jade', function () {
  gulp.src('./views/index.jade')
      .pipe(jade({
        locals: {static_resources: static_resources},
        pretty: true
      }))
      .pipe(useref({searchPath: '.'}))
      .pipe(gulpif('*.js', uglify({mangle: false})))
      .pipe(gulpif('*.css', cssnano()))
      .pipe(gulp.dest('./public/'))
});


gulp.task('default', ['jade'], function () {
});

