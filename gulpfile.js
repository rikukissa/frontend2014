var path = require('path'),
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    jade = require('gulp-jade'),
    stylus = require('gulp-stylus'),
    CSSmin = require('gulp-minify-css'),
    watchify = require('watchify'),
    browserify = require('browserify'),
    source = require('vinyl-source-stream'),
    streamify = require('gulp-streamify'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify'),
    prefix = require('gulp-autoprefixer')
    nodeStatic = require('node-static'),
    lr = require('tiny-lr'),
    livereload = require('gulp-livereload');

var reloadServer = lr();

var production = process.env.NODE_ENV === 'production';

gulp.task('coffee', function() {
  var bundle;
  console.log(production);
  if(production) {
    bundle = browserify('./src/coffee/main.coffee');
  } else {
    bundle = watchify('./src/coffee/main.coffee');
  }

  var rebundle = function() {
    return bundle.bundle({
      debug: !production
    })
    .pipe(source('bundle.js'))
    .pipe(livereload(reloadServer))
    .pipe(gulp.dest('./public/js/'))
  };

  if (!production) {
    bundle.on('update', rebundle);
  }
  return rebundle();
});

gulp.task('jade', function() {
  return gulp.src('src/jade/*.jade')
    .pipe(jade({
      pretty: !production
    }))
    .pipe(gulp.dest('public/'))
    .pipe(livereload(reloadServer));
});

gulp.task('stylus', function() {
  var styles = gulp.src('src/stylus/style.styl')
  .pipe(stylus({
    set: ['include css']
  }))
  .pipe(prefix("last 2 versions", "Chrome 33"));

  if (production) {
    styles.pipe(CSSmin());
  }

  return styles.pipe(gulp.dest('public/css/'))
    .pipe(livereload(reloadServer));
});

gulp.task('assets', function() {
  return gulp.src('src/assets/**/*.*')
    .pipe(gulp.dest('public/'));
});

gulp.task("server", function() {
  var staticFiles = new nodeStatic.Server('./public');

  return require('http').createServer(function(req, res) {
    req.addListener('end', function() {
      return staticFiles.serve(req, res);
    });
    return req.resume();
  }).listen(9001);

});

gulp.task("watch", function() {
  return reloadServer.listen(35729, function(err) {
    if (err != null) {
      console.error(err);
    }
    gulp.watch("src/jade/*.jade", ["jade"]);
    gulp.watch("src/stylus/*.styl", ["stylus"]);

    return gulp.watch("src/assets/**/*.*", ["assets"]);
  });
});

gulp.task("build", ["coffee", "jade", "stylus", "assets"]);
gulp.task("default", ["build", "watch", "server"]);
