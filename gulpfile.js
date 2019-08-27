var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var autoprefixer = require("autoprefixer");
var replace = require("gulp-replace");
var minify = require("gulp-csso");
var rename = require("gulp-rename");
var server = require("browser-sync").create();
var imagemin = require("gulp-imagemin");
var svgssprite = require("gulp-svgstore");
var spriteSmith = require("gulp.spritesmith");
var merge = require('merge-stream');
var del = require("del");
var run = require("run-sequence");


/*---------------------------------------------------*/
/*	HELPERS
/*---------------------------------------------------*/


/* PNG SPRITES */

gulp.task('pngsprite', function () {
  var spriteData = gulp.src('source/images/icons/**/*.png').pipe(spriteSmith({
    imgName: 'sprite.png',
    imgPath: "../images/sprites/sprite.png",
    retinaImgName: 'sprite@2x.png',
    retinaSrcFilter: 'source/images/icons/**/*/*@2x.png',
    retinaImgPath: "../images/sprites/sprite@2x.png",
    cssName: 'sprite.scss',
    algorithm: 'binary-tree',
    // cssTemplate: 'handlebarsInheritance.scss.handlebars',
    padding: 8
  }));

  var cssStream = spriteData.css.pipe(gulp.dest('source/sass/mixins'));
  var imgStream = spriteData.img.pipe(gulp.dest('source/images/sprites'));

  return merge(imgStream, cssStream);
});


/* SVG SPRITES */

gulp.task("svgsprite", function () {
  return gulp.src("source/images/icons/**/*.svg")
    .pipe(svgssprite({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("source/images/sprites"));
});


/* MINIFY IMAGES */

gulp.task("imagesmin", function () {
  return gulp.src("source/images/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.svgo({
        plugins: [
            {removeViewBox: false},
            {cleanupIDs: false}
        ]
    })
    ]))
    .pipe(gulp.dest("source/img"));
});


gulp.task("images", gulp.series('pngsprite', 'svgsprite', 'imagesmin', function (done) {
  done();
}));



/*---------------------------------------------------*/
/*	START PACK
/*---------------------------------------------------*/

/* STYLES IN SOURCE */
gulp.task("styles", done => {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({
        cascade: false
      })
    ]))
    .pipe(replace('/**/', ''))
    .pipe(gulp.dest("source/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("source/css"))
    .pipe(server.stream());
  done();
});

/* SERVER IN SOURCE */
gulp.task("server", function () {
  server.init({
    server: "source",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series('styles')).on("change", server.reload);
  gulp.watch("source/*.html").on("change", server.reload);
  gulp.watch("source/js/**/*.js").on("change", server.reload);
});




/*---------------------------------------------------*/
/*	BUILD TASKS
/*---------------------------------------------------*/

/* STYLES IN BUILD */
gulp.task("style", done => {
  gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(postcss([
      autoprefixer({
        cascade: false
      })
    ]))
    .pipe(replace('/**/', ''))
    .pipe(gulp.dest("build/css"))
    .pipe(minify())
    .pipe(rename("style.min.css"))
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
  done();
});

/* SERVER IN BUILD */
gulp.task("serve", function () {
  server.init({
    server: "build/",
    notify: false,
    open: true,
    cors: true,
    ui: false
  });

  gulp.watch("./sass/**/*.{scss,sass}", gulp.series('styles')).on("change", server.reload);
  gulp.watch("./*.html").on("change", server.reload);
  gulp.watch("./js/**/*.js").on("change", server.reload);
});

/* HTML INCLUDE */
gulp.task("html", function () {
  return gulp.src("*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"));
});


/* CLEAN SVG ICONS USED IN SPRITE */
gulp.task("cleanicons", function () {
  return del("source/img/icons/*.svg");
});

/* COPY FILES FROM SOURCE */
gulp.task("copy", function () {
  return gulp.src([
      "fonts/**/*.{woff,woff2}",
      "img/**",
      "js/**",
      "css/**",
      "*.php",
      "*.ico"
    ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

/* REMOVE OLD BUILD */
gulp.task("clean", function () {
  return del("build");
});

/* MAKE BUILD */
gulp.task("build", gulp.series('clean', 'cleanicons', 'copy', 'style', 'html', 'serve', function (done) {
  done();
}));
