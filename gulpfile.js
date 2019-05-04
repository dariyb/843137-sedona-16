"use strict";

var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var rename = require("gulp-rename");
var less = require("gulp-less");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var csso = require("gulp-csso");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var htmlmin = require("gulp-htmlmin");
var uglify = require("gulp-uglify");
var pipeline = require("readable-stream").pipeline;
var include = require("posthtml-include");
var server = require("browser-sync").create();
var del = require("del");

gulp.task("css", function () {
  return gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(csso())
    .pipe(rename("style.min.css"))
    .pipe(sourcemap.write("."))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});
gulp.task('images', function () {
  const jpegoptim = require('imagemin-jpegoptim');
  return gulp.src("source/img/**/*.{jpg,png,svg}")
    .pipe(imagemin([
      imagemin.optipng(),
      imagemin.svgo({
        plugins: [
          {removeViewBox: false},
          {removeTitle: true},
          {cleanupNumericValues:
            {floatPrecision: 0}
          }
        ]
      }),
      jpegoptim({
        max: 80,
        progressive: true
      })
    ]))
    .pipe(gulp.dest("build/img"));
});
gulp.task("webp", function() {
  return gulp.src("source/img/**/*.{png,jpg}")
  .pipe(webp({quality: 90}))
  .pipe(gulp.dest("build/img"));
});
gulp.task("sprite", function() {
  return gulp.src("source/img/s-*.svg")
  .pipe(svgstore({
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
});
gulp.task("html", function () {
  return gulp.src("source/*.html")
  .pipe(posthtml([
    include()
  ]))
  .pipe(gulp.dest("build"));
});
gulp.task("minify", function () {
  return gulp.src("build/*.html")
  .pipe(htmlmin({
    collapseWhitespace: true
  }))
  .pipe(gulp.dest("build"));
});
gulp.task("compress", function () {
  return pipeline(
    gulp.src("source/**/*.js"),
    uglify(),
    gulp.dest("build")
  );
});
gulp.task("server", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/less/**/*.less", gulp.series("css"));
  gulp.watch("source/img/s-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});
gulp.task("refresh", function(done) {
  server.reload();
  done();
});
gulp.task("copy", function () {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/js/**",
    "source/*.ico"
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
});
gulp.task("clean", function() {
  return del("build");
});
gulp.task("clean-svg", function() {
  return del("build/img/**/s-*.svg");
});

gulp.task("build", gulp.series(
  "clean",
  "copy",
  "css",
  "images",
  "webp",
  "sprite",
  "clean-svg",
  "html",
  "minify",
  "compress"
));
gulp.task("start", gulp.series("build", "server"));
