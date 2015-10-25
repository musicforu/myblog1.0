# myblog1.0
基于MEAN框架的博客
MEAN框架下的博客

1、使用Angularjs作为前端MVC框架，将路由跳转功能放在前端Angularjs中，降低服务器压力，根据后台服务器传来的数据，
判断各项内容的显示与隐藏，并通过路由拦截器判断用户登录状态，进而控制路由。

2、Express作为nodejs框架，主要提供和前端页面的数据处理API接口。

3、采用mongoose驱动数据在mongodb数据库中的存储。

4、头像图片上传功能采用的模块是multiparty

启动：node ./bin/www
