const gulp = require('gulp');
const mergeStream = require('merge-stream');
const concatCss = require('gulp-concat-css');
const cleanCss = require('gulp-clean-css');

const copy = () => (
    mergeStream(
        gulp.src('./client/img/*').pipe(gulp.dest('./.tmp/public/img')),
        gulp.src('./client/*.html').pipe(gulp.dest('./.tmp/public/')),
        gulp.src('./client/**/*.json').pipe(gulp.dest('./.tmp/public/')),
        gulp.src('./client/**/*.ico').pipe(gulp.dest('./.tmp/public/')),
    )
)

const css = () => {
    return gulp.src('./client/css/*.css')
        .pipe(cleanCss())
        .pipe(concatCss('style.min.css'))
        .pipe(gulp.dest('./.tmp/public/css/'));
}

const watch = () => {
    gulp.watch(['client/**/*.js', 'client/**/*.css', 'client/**/*.html'], ['min-concat-css', 'copy']);
}

gulp.task('copy', copy);
gulp.task('default', ['copy', 'min-concat-css'], watch);
gulp.task('min-concat-css', css);