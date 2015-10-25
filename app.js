var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var jwt=require('jsonwebtoken');
var secret=require('./config/secret');
var tokenManager=require('./config/token_manager');

var post = require('./routes/post');
var users = require('./routes/users');

var app = express();


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//用户注册
app.post('/register',users.register);
//用户登录
app.post('/login',users.login);
//用户登出
app.get('/logout',users.logout);
//用户按页数获取文章（登录时首页）
app.post('/post_page',post.list);
//获取所有已发表文章
app.get('/postAll',post.listAll);
//用户获取指定文章
app.get('/postId/:id',post.read);
//获取指定用户的所有文章
app.get('/postUser/:user',post.listUser);
//为文章点赞
app.post('/post/like',post.like);
//为文章取消点赞
app.post('/post/unlike',post.unlike);
//获取具有相同标签的所有文章
app.get('/tag/:tagName',post.listByTag);
//用户发表文章
app.post('/post',post.create);
//用户更改文章
app.put('/post',post.update);
//用户删除文章
app.delete('/postDelete/:id',post.delete);
//用户上传头像照片
app.post('/postPhoto',post.postPhoto);
//用户发表评论
app.post('/comment',post.comment);
//用户按照文章标题进行搜索
app.post('/search',post.search);
//获取所有标签
app.get('/tagSearch',post.getTags);
//用户转载文章
app.post('/post/reprint',post.reprint)

//指定博客首页文件
app.use(function(req,res){
  res.sendfile('./public/index.html');
});



// 处理错误
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});


if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}


app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//博客监听在3001端口
app.listen(3001,function(){
  console.log('Server is running');
})
module.exports = app;
