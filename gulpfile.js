let config = require('./config');
let gulp = require('gulp');
let temp = require('temp');

/* ========================================
=            添加需要的模块                 =
========================================*/

let concat = require('gulp-concat');
let csso = require('gulp-csso');
let del = require('del');
let less = require('gulp-less');
let mobilizer = require('gulp-mobilizer');
let path = require('path');
let rename = require('gulp-rename');
let seq = require('gulp-sequence');
let sourcemaps = require('gulp-sourcemaps');
let uglify = require('gulp-uglify');
let connect = require('gulp-connect');
let waitOn = require('wait-on');

/* ================================================
=            控制台报错                            =
================================================*/

gulp.on('error', function(e) {
  throw (e);
});

/* ================================================
=            添加默认任务                           =
================================================*/
gulp.task('default' , function(){
  console.log("this is joshinrai's gulp project ...") ;
}) ;

/* =========================================
=            清空编译文件                    =
=========================================*/

gulp.task('clean', function() {
  return del(['dist/**']);
});

/* ==================================
=            拷贝样式                =
==================================*/

gulp.task('fonts', function() {
  return gulp.src(config.globs.fonts)
    .pipe(gulp.dest(path.join('dist', 'fonts')));
});

/* ======================================================================
=            编译、组织、最小化less                                        =
======================================================================*/

let CSS_TEMP_DIR = temp.path({prefix: 'maui-css'});

gulp.task('css:less', function() {
  gulp.src([
    'src/less/mobile-angular-ui-base.less',
    'src/less/mobile-angular-ui-desktop.less',
    'src/less/sm-grid.less'
  ])
    .pipe(less({paths: config.globs.vendorLess}))
    .pipe(mobilizer('mobile-angular-ui-base.css', {
      'mobile-angular-ui-base.css': {hover: 'exclude', screens: ['0px']},
      'mobile-angular-ui-hover.css': {hover: 'only', screens: ['0px']}
    }))
    .pipe(gulp.dest(CSS_TEMP_DIR));
});

gulp.task('css:less:wait', waitFor([
  path.join(CSS_TEMP_DIR, 'sm-grid.css'),
  path.join(CSS_TEMP_DIR, 'mobile-angular-ui-base.css'),
  path.join(CSS_TEMP_DIR, 'mobile-angular-ui-hover.css'),
  path.join(CSS_TEMP_DIR, 'mobile-angular-ui-desktop.css')
]));

gulp.task('css:concat', function() {
  return gulp.src([
    path.join(CSS_TEMP_DIR, 'sm-grid.css'),
    path.join(CSS_TEMP_DIR, 'mobile-angular-ui-base.css')
  ])
    .pipe(concat('mobile-angular-ui-base.css'))
    .pipe(gulp.dest(path.join('dist', 'css')));
});

gulp.task('css:copy', function() {
  return gulp.src([
    path.join(CSS_TEMP_DIR, 'mobile-angular-ui-hover.css'),
    path.join(CSS_TEMP_DIR, 'mobile-angular-ui-desktop.css')
  ])
    .pipe(gulp.dest(path.join('dist', 'css')));
});

gulp.task('css:minify', function() {
  return gulp.src(path.join('dist', 'css', '*.css'))
    .pipe(csso())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(path.join('dist', 'css')));
});

gulp.task('css:rmtemp', function() {
  return del([CSS_TEMP_DIR], {force: true});
});

gulp.task('css', function(done) {
  seq(
    'css:rmtemp',
    'css:less',
    'css:less:wait',
    'css:concat',
    'css:copy',
    'css:minify',
    'css:rmtemp',
    done
  );
});

/* ====================================================================
=            编译、最小化资源模块                                        =
====================================================================*/

let compileJs = function(dest, src) {
  return gulp.src(src)
    .pipe(sourcemaps.init())
    .pipe(concat(dest))
    .pipe(gulp.dest(path.join('dist', 'js')))
    .pipe(uglify())
    .pipe(rename({suffix: '.min'}))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(path.join('dist', 'js')));
};

gulp.task('js:core', function() {
  return compileJs('mobile-angular-ui.core.js', config.globs.core);
});

gulp.task('js:gestures', function() {
  return compileJs('mobile-angular-ui.gestures.js', config.globs.gestures);
});

gulp.task('js:main', function() {
  return compileJs('mobile-angular-ui.js', config.globs.main);
});

gulp.task('js', ['js:main', 'js:gestures', 'js:core']);

/* ======================================
=            构建计数                    =
======================================*/

gulp.task('build:wait', waitFor([
  'dist/css/mobile-angular-ui-base.css',
  'dist/css/mobile-angular-ui-base.min.css',
  'dist/css/mobile-angular-ui-desktop.css',
  'dist/css/mobile-angular-ui-desktop.min.css',
  'dist/css/mobile-angular-ui-hover.css',
  'dist/css/mobile-angular-ui-hover.min.css',
  'dist/fonts/fontawesome-webfont.eot',
  'dist/fonts/fontawesome-webfont.svg',
  'dist/fonts/fontawesome-webfont.ttf',
  'dist/fonts/fontawesome-webfont.woff',
  'dist/fonts/fontawesome-webfont.woff2',
  'dist/js/mobile-angular-ui.core.js',
  'dist/js/mobile-angular-ui.core.min.js',
  'dist/js/mobile-angular-ui.core.min.js.map',
  'dist/js/mobile-angular-ui.gestures.js',
  'dist/js/mobile-angular-ui.gestures.min.js',
  'dist/js/mobile-angular-ui.gestures.min.js.map',
  'dist/js/mobile-angular-ui.js',
  'dist/js/mobile-angular-ui.min.js',
  'dist/js/mobile-angular-ui.min.js.map'
]));

gulp.task('build', function(done) {
  seq('clean', ['fonts', 'css', 'js'], 'build:wait', done);
});

/* ==========================================
=            监控和连接开发模块                =
==========================================*/

gulp.task('dev', function(done) {
  let tasks = [];

  tasks.push('connect');
  tasks.push('watch');

  seq('build', tasks, done);
});

/* ==========================================
=            缇娜家web服务                    =
==========================================*/

gulp.task('connect', function() {
  connect.server({
    root: process.cwd(),
    host: '127.0.0.1',
    port: 3000,
    livereload: true
  });
});

/* ==============================================================
=            添加实时监控文件变化任务                               =
==============================================================*/

gulp.task('livereload:demo', function() {
  return gulp.src(config.globs.livereloadDemo)
    .pipe(connect.reload());
});

/* ===================================================================
=            添加资源变化时的重编译和重新加载                             =
===================================================================*/

gulp.task('watch', function() {
  gulp.watch(config.globs.livereloadDemo.concat('dist/**/*'), ['livereload:demo']);
  gulp.watch(['./src/less/**/*'], ['css']);

  ['core', 'gestures', 'main'].forEach(function(target) {
    gulp.watch(config.globs[target], ['js:' + target]);
  });

  gulp.watch(config.globs.fonts, ['fonts']);
});

function waitFor(resources) {
  return function() {
    return new Promise(function(resolve, reject) {
      waitOn({
        resources: resources,
        timeout: 30000
      }, function(err) {
        if (err) {
          process.exit(2);
          return reject(err);
        }

        resolve();
      });
    });
  };
}
