var gulp=require('gulp'),  //gulp������
    concat=require('gulp-concat'),   //�ϲ��ļ�
    rename=require('gulp-rename'),
    uglify=require('gulp-uglify'),   //jsѹ��
    notify=require('gulp-notify');

gulp.task('default',function(){
   return gulp.src(['./src/js/polyfill.js','./src/js/is.js','./src/js/style.js','./src/js/class.js','./src/js/props.js','./src/js/eventlistener.js','./src/js/dataset.js','./src/js/attributes.js','./src/js/vnode.js',
        './src/js/h.js','./src/js/htmldomapi.js','./src/js/snabbdom.js'])  //ѡ��ϲ���JS
       .pipe(concat('snabbdom-bundles.js'))   //�ϲ�js
       .pipe(gulp.dest('dist/js'))         //���
       .pipe(rename({suffix:'.min'}))     //������
       .pipe(uglify())                    //ѹ��
       .pipe(gulp.dest('dist/js'))            //��� 
       .pipe(notify({message:"js task ok"}));    //��ʾ
});


