var gulp = require('gulp');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssnano = require('gulp-cssnano');


gulp.task('scripts', function () {
  return gulp.src([
    "node_modules/jquery/dist/jquery.min.js",
    "node_modules/angular/angular.min.js",
    "node_modules/angular-sanitize/angular-sanitize.min.js",
    "node_modules/socket.io-client/socket.io.js",
    "node_modules/socket.io/node_modules/socket.io-client/socket.io.js",
    "node_modules/d3/d3.min.js",
    "node_modules/c3/node_modules/d3/d3.min.js",
    "node_modules/c3/c3.min.js",
    "public/javascripts/app.js",
    "public/javascripts/app/components/components_wrapper.js",
    "public/javascripts/app/components/chart_directive.js",
    "public/javascripts/app/components/big_numbers_filter.js",
    "public/javascripts/app/controllers/controllers_wrapper.js",
    "public/javascripts/app/controllers/index_controller.js"
  ])
      .pipe(concat('all.min.js'))
      .pipe(uglify({mangle: false}))
      .pipe(gulp.dest('./public/dist'));
});


gulp.task('stylesheets', function () {

  return gulp.src([
    "node_modules/bootstrap/dist/css/bootstrap.css",
    "public/stylesheets/bootstrap.css",
    "public/stylesheets/style.css",
    "public/stylesheets/Glyphter.css",
    "node_modules/font-awesome/css/font-awesome.css",
    "node_modules/c3/c3.css"
  ])
      .pipe(concat('all.min.css'))
      .pipe(cssnano())
      .pipe(gulp.dest('./public/dist'));
});

gulp.task('default', ['scripts', 'stylesheets'], function () {
});

