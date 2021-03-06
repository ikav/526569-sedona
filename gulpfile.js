"use strict";

var gulp = require("gulp");
var minifycss = require("gulp-csso");
var minifyhtml = require("gulp-htmlmin");
var uglify = require("gulp-uglify");
var less = require("gulp-less");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var autoprefixer = require("autoprefixer");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var del = require("del");
var run = require("run-sequence");
var server = require("browser-sync").create();

// Препроцессор, автопрефиксер, минификация CSS
gulp.task("style", function() {
  gulp.src("source/less/style.less")
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(gulp.dest("build/css"))
    .pipe(minifycss())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});

// Минификация изображений
gulp.task("images", function() {
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

// Добавляем изображения в формате webp
gulp.task("webp", function() {
  return gulp.src(["source/img/**/main-*.{png,jpg}", "source/img/**/photo-*.{png,jpg}", "source/img/**/video-*.{png,jpg}"])
    .pipe(webp({quality: 90}))
    .pipe(gulp.dest("build/img"));
});

// Собираем изображения в спрайт
gulp.task("sprite", function() {
  return gulp.src(["source/img/**/icon-*.svg", "source/img/**/logo-htmlacademy.svg"])
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

// posthtml для вставки спрайта в разметку html-страниц, а также минификация кода html-страницы
gulp.task("html", function() {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(minifyhtml({collapseWhitespace: true}))
    .pipe(gulp.dest("build"));
});

// Минификация JS-кода
// Пока тупо два раза функцию вызываю
gulp.task("jsmin1", function() {
  gulp.src("source/js/script.js")
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename("script.min.js"))
    .pipe(gulp.dest("build/js"));
});

gulp.task("jsmin2", function() {
  gulp.src("source/js/picturefill.js")
    .pipe(plumber())
    .pipe(uglify())
    .pipe(rename("picturefill.min.js"))
    .pipe(gulp.dest("build/js"));
});

// Удаление файлов в папке build
gulp.task("clean", function() {
  return del("build");
});

// Копирование файлов в build
gulp.task("copy", function() {
  return gulp.src([
    "source/fonts/**/*.{woff,woff2}",
    "source/js/**/*.js"
  ], {
    base: "source"
  })
  .pipe(gulp.dest("build"));
});

// Сервер разработки
gulp.task("serve", function() {
  server.init({
    server: "build/"
  });

  /**************************/
  /* СЛЕДИМ ЗА ИЗМЕНЕНИЯМИ  */
  /**************************/
  // Следим за изменениями less-файлов
  gulp.watch("source/less/**/*.less", ["style"]);
  // Следим за изменениями иконок и логотипов в спрайте
  gulp.watch(["source/img/**/icon-*.svg", "source/img/**/logo-htmlacademy.svg"], ["changeSprite"]).on("change", server.reload);
  // Следим за изменениями html-страничек
  gulp.watch("source/*.html", ["html"]).on("change", server.reload);
  gulp.watch("build/*.html").on("change", server.reload);
});

// Частично пересобираем, если меняем спрайт
gulp.task("changeSprite", function(done) {
  run(
    "sprite",
    "style",
    "html",
    done
  );
});

// Запуск сборки. Последовательно каждую команду (run-sequence)
gulp.task("build", function(done){
  run(
    "clean",
    "copy",
    "style",
    "images",
    "webp",
    "sprite",
    "html",
    "jsmin1",
    "jsmin2",
    done
  );
});
