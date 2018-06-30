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

const mainCss = () => {
    return gulp.src(['./client/css/styles.css', './client/css/queries.css'])
        .pipe(cleanCss())
        .pipe(concatCss('mainStyles.min.css'))
        .pipe(gulp.dest('./.tmp/public/css/'));
}

const restaurantCss = () => {
    return gulp.src(['./client/css/styles.css', './client/css/restaurantQueries.css'])
        .pipe(cleanCss())
        .pipe(concatCss('restaurantStyles.min.css'))
        .pipe(gulp.dest('./.tmp/public/css/'));
}

const watch = () => {
    gulp.watch(['client/**/*.js', 'client/**/*.css', 'client/**/*.html'], ['min-concat-css', 'copy']);
}

gulp.task('copy', copy);
gulp.task('default', ['copy', 'main-concat-css','restaurant-concat-css'], watch);
gulp.task('main-concat-css', mainCss);
gulp.task('restaurant-concat-css', restaurantCss);