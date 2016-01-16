var DEST_PATH = './public/';
var PORT = '2222';
var FALLBACK = '404.html';

var gulp = require('gulp');
var plumber = require( 'gulp-plumber' );
var compass = require('gulp-compass');
var jade = require('gulp-jade');
var watch = require('gulp-watch');
var webserver = require('gulp-webserver');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var concat = require("gulp-concat");

var concatconfig = require('./concatconfig.js');


// $ gulp --develop でjsをminifyしないサーバー起動
// $ gulp --port 0000 でport指定してサーバー起動


// default task
if (gutil.env.develop) gulp.task('default',['watch', 'server', 'jade', 'js-dev', 'compass']);
else gulp.task('default',['watch', 'server', 'jade', 'js', 'compass']);

if (gutil.env.port) PORT = gutil.env.port;


gulp.task('watch',function(){
  // gulp.watch(['./src/jade/*.jade','./src/jade/**/*.jade','./src/jade/**/_*.jade'],['jade']);
  watch(['./src/jade/*.jade','./src/jade/**/*.jade','./src/jade/**/_*.jade'],function(){
    gulp.start('jade');
  });
  watch(['./src/js/*.js','./src/js/**/*.js','./src/js/**/_*.js'],function(){
    if (gutil.env.develop) gulp.start('js-dev');
    else gulp.start('js');
  });
  watch(['./src/scss/*.scss','./src/scss/**/*.scss','./src/scss/**/_*.scss'],function(){
    gulp.start('compass');
  });
});

gulp.task('server',function(){
  gulp.src('public')
    .pipe(webserver({
      // directoryListing: true,
      host: '0.0.0.0',
      port: PORT,
      fallback: FALLBACK,
    })
  );
});

gulp.task('jade',function(){
  gulp.src(['./src/jade/*.jade','./src/jade/**/*.jade','!src/jade/**/_*.jade'])
    .pipe(plumber())
    .pipe(jade({
      pretty: true
    }))
    .pipe(rename(function(path){
      if (!!path.basename.match(/^_/)) { // ex. _hoge.jade -> hoge.html
        path.basename = path.basename.replace(/^_/, '');
        return;
      }
      if (path.basename != 'index') { // ex. hoge.jade -> hoge/index.html
        path.dirname += '/' + path.basename.replace(/__/, '/'); // ex. hoge__fuga -> hoge/fuga
        path.basename = 'index';
      }
    }))
    .pipe(gulp.dest(DEST_PATH));
});

gulp.task('js-dev',function(){
  // minifyしない
  gulp.src(concatconfig.files)
    .pipe(plumber())
    .pipe(concat(concatconfig.dest))
    .pipe(gulp.dest(DEST_PATH+'js/'));
});

gulp.task('js',function(){
  // minifyする
  gulp.src(concatconfig.files)
    .pipe(plumber())
    .pipe(concat(concatconfig.dest))
    .pipe(uglify({preserveComments: 'some'}))
    .pipe(gulp.dest(DEST_PATH+'js/'));
});

gulp.task('compass', function(){
  gulp.src(['./src/scss/*.scss','./src/scss/**/*.scss','!src/scss/**/_*.scss'])
    .pipe(plumber())
    .pipe(compass({
      config_file: './config.rb',
      css: DEST_PATH+'css/',
      sass: './src/scss/'
    }))
    .pipe(gulp.dest(DEST_PATH+'css/'));
});
