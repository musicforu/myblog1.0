var myServices=angular.module('myServices',[]);
//权限认证
myServices.factory('authentication',function(){
	var auth={
		isAuthenticated: false,//是否已经登录，默认不是
        isAdmin: false//是否为系统管理员，默认不是
	}
	return auth;
});
//路由拦截器
myServices.factory('tokenInterceptor',function($q,$window,$location,authentication){
	return {
		request:function(config){
			config.headers=config.headers||{};
            //如果客户端已经登录，则为其请求头中添加权限认证
			if($window.sessionStorage.token){
				config.headers.authorization='Bearer '+$window.sessionStorage.token;
			}
			return config;
		},
        requestError:function(rejection){
        	return $q.reject(rejection);
        },
        response:function(response){
            //如果用户登陆成功，客户端添加认证
        	if(response!=null && response.status==200 && $window.sessionStorage.token && !authentication.isAuthenticated){
                authentication.isAuthenticated=true;
        	}
        	return response||$q.when(response);
        },
        responseError:function(rejection){
            //登录不成功，客户端认证失败，导向登录页
        	if(rejection!=null && rejection.status==401 &&($window.sessionStorage.token && AuthenticationService.isAuthenticated)){
        		delete $window.sessionStorage.token;
        		authentication.isAuthenticated=false;
        		$location.path('/login');
        	}
        	return $q.reject(rejection);
        }
	}
})
//用户登录、登出、注册服务
myServices.factory('userService',function($http){
	return {
		login:function(name,password){
			return $http.post('/login',{name:name,password:password});
		},
		logout:function(){
            return $http.get('/logout');
		},
		register:function(name,password,passwordRepeat){
			return $http.post('/register',{name:name,password:password,passwordRepeat:passwordRepeat});
		}
	}
})
//用户发表，获取数据服务
myServices.factory('postService',function($http){
    var page=1;
	return { 
        //获取所有文章，默认显示第一页      
		findAllPublished:function(i){
            //获取下一页
            if(i!=undefined && i==1){
                page=page+1;                
            }
            //获取上一页
            if(i!=undefined && i==-1){
                page=page-1;
                //如果已经是第一页，则不再向前获取页数
                if(page==0){
                    page=1;
                    return $http.post('/post_page',{page:0});
                }
            }
			return $http.post('/post_page',{page:page});
		},
        //按照标签获取文章
		findByTag:function(tag){
			return $http.get('/tag/'+tag);
		},
        //阅读文章
        read:function(id){
        	return $http.get('/postId/'+id);
        },
        //获取所有文章
        findAll:function(){
        	return $http.get('/postAll');
        },
        //查找指定用户的所有文章
        findUser:function(user){
            return $http.get(encodeURI('/postUser/'+user));
        },
        //更改文章是否公开
        changePublishState:function(id,newPublishState){
            return $http.put('/post',{"post":{_id:id,is_published:newPublishState}});
        },
        //删除文章
        delete:function(id){
        	return $http.delete('/postDelete/'+id);
        },
        //发表文章
        create:function(post){
        	return $http.post('/post',{'post':post});
        },
        //更新文章
        update:function(post){
        	return $http.put('/post',{'post':post});
        },
        //为文章点赞
        like:function(id,user){
        	return $http.post('/post/like',{'id':id,'user':user});
        },
        //取消点赞
        unlike:function(id,user){
        	return $http.post('/post/unlike',{'id':id,'user':user});
        },
        //转载文章
        reprint:function(id,user){
            return $http.post('/post/reprint',{'id':id,'user':user})
        },
        //获取前一页
        reset:function(){
            page=page-1;
        }
	}
});
//点赞服务
myServices.factory('likeService',function($window){
    var postLiked=[];//客户端存储已经喜欢的文章id，由于用户再次登陆后，postliked清空
    //用来存储点赞文章并不准确，主要记录文章点赞信息在后台数据库中

    if($window.sessionStorage && $window.sessionStorage.postLiked){
        postLiked.concat($window.sessionStorage.postLiked);
    }

    return {
        isAleadyLiked:function(id){
            if( id!=null ){
                //遍历postliked数组，查看是否已经点过赞
                for(var i in postLiked){
                    if(postLiked[i]==id){
                        return true;
                    }
                }
                return false;
            }
            return false;
        },
        like:function(id){
            if(!this.isAleadyLiked(id)){
                postLiked.push(id);
                $window.sessionStorage.postLiked=postLiked;
            }
        },
        unlike:function(id){
            if(this.isAleadyLiked(id)){
                for(var i in postLiked){
                    if(postLiked[i]==id){
                        postLiked.splice(i,1);
                        $window.sessionStorage.postLiked=postLiked;
                        break;
                    }
                }
            }
        }
    }
})
//上传头像照片
myServices.factory('photoService',function($http){
    return {
        post:function(name){
            return $http.post('/photo',{name:name});
        }
    }
})
//上传评论
myServices.factory('commentService',function($http){
    return {
        post:function(comment){
            return $http.post('/comment',{comment:comment});
        }
    }
})
//按照文章题目进行搜索
myServices.factory('searchService',function($http){
    return {
        post:function(ele){
            return $http.post('/search',{searchEle:ele});
        }
    }
})
//按照文章标签进行搜索
myServices.factory('tagService',function($http){
    return {
        get:function(){
            return $http.get('/tagSearch');
        }
    }
})