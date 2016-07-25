var gulp = require('gulp');
var mocha = require('gulp-mocha');
var exit = require('gulp-exit');

gulp.task('default', ['test']);

gulp.task('test', function() {
    return gulp.src('test/**/*.js')
        .pipe(mocha({ timeout: 10000 }))
	.pipe(exit());
});

