var gulp=require('gulp'),  //gulp基础库
    concat=require('gulp-concat'),   //合并文件
    rename=require('gulp-rename'),
    uglify=require('gulp-uglify'),   //js压缩
    notify=require('gulp-notify');

gulp.task('default',function(){
   return gulp.src(['./src/js/polyfill.js','./src/js/is.js','./src/js/style.js','./src/js/class.js','./src/js/props.js','./src/js/eventlistener.js','./src/js/dataset.js','./src/js/attributes.js','./src/js/vnode.js',
        './src/js/h.js','./src/js/htmldomapi.js','./src/js/snabbdom.js'])  //选择合并的JS
       .pipe(concat('snabbdom-bundles.js'))   //合并js
       .pipe(gulp.dest('dist/js'))         //输出
       .pipe(rename({suffix:'.min'}))     //重命名
       .pipe(uglify())                    //压缩
       .pipe(gulp.dest('dist/js'))            //输出 
       .pipe(notify({message:"js task ok"}));    //提示
});


