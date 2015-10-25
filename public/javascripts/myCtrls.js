var myCtrls=angular.module('myCtrls',[]);
myCtrls.controller('homeCtrl',function(){
	
});
//用户控制器
myCtrls.controller('userCtrl',['$scope','$location','$window','authentication','userService',
	function userCtrl($scope,$location,$window,authentication,userService){
        //注册
		$scope.register=function(userName,password,passwordRepeat){
            //如果angularjs中authentication服务中显示已经注册，则在会话存储中添加此用户
            //并将页面导向主页，发射‘login’事件，用于在主页显示已经登录成功
			if(authentication.isAuthenticated){
                $window.sessionStorage.user=userName;
				$location.path('/');
				$scope.$emit('login');
			}else{
                //如果authentication服务中没有注册则进行注册，在会话存储中添加token鉴权和user
				userService.register(userName,password,passwordRepeat).success(function(data){
					console.log(data);
					if(data.message){
						$scope.information=data.message;
					}else{
						$scope.$emit('login');
						authentication.isAuthenticated=true;
					    $window.sessionStorage.token=data.token;
                        $window.sessionStorage.user=userName;
					    $location.path('/');
					}					
				}).error(function(status,data){
					console.log(status);
					console.log(data);
				})
			}
		}
        //登录
		$scope.login=function(userName,password){
            if(userName!=null && password != null){
            	userService.login(userName,password).success(function(data){
            		$scope.$emit('login');
            		authentication.isAuthenticated=true;
            		$window.sessionStorage.token=data.token;
                    $window.sessionStorage.user=userName;
                    //如果此用户是系统管理员，则在会话存储中添加isAdmin为true，将页面导向
                    //系统管理员页面否则导向主页
                    if(data.isAdmin==true){
                        console.log('isAdmin');
                        $window.sessionStorage.isAdmin=true;
                        $scope.$emit('isAdmin');
                        return $location.path('/adminEdit');
                    }
            		$location.path('/');
            	}).error(function(status,data){
            		$scope.message='信息不正确';
            		console.log(status);
            		console.log(data);
            	})
            }
		}
        //登出
		$scope.logout=function(){
            //如果已经登陆则authentication设为false，删除会话存储中的内容，导向主页
			if(authentication.isAuthenticated){
				userService.logout().success(function(data){
					$scope.$emit('isLogouted');
                    authentication.isAuthenticated=false;
                    delete $window.sessionStorage.token;
                    delete $window.sessionStorage.user;
                    $location.path('/');
				}).error(function(status,data){
					console.log(status);
					console.log(data);
				})
			}else{
				$location.path('/');
			}
		}
	}]);
//发布文章控制器
myCtrls.controller('postCreateCtrl',['$scope','$location','$window','postService',
    function($scope,$location,$window,postService){
	 $scope.save=function(post,shouldPublish){
		if(post!=null &&post.title!=null && (post.tags0!=null 
            || post.tags1!=null || post.tags2!=null) && post.content!=null){			
                var content=$('#textAreaContent').val();	    
                post.name=$window.sessionStorage.user;
                console.log(post.name);
				post.content=content;
                post.tags=[];
                post.tags.push(post.tags0,post.tags1,post.tags2);
                post={
                    name:post.name,
                    title:post.title,
                    content:post.content,
                    tags:post.tags
                };
                console.log(post);
				if(shouldPublish!= undefined && shouldPublish==true){
					post.is_published=true;
				}else{
					post.is_published=true;
				}
				postService.create(post).success(function(data){
					$scope.$emit('postSuccess');
					$location.path('/');
				}).error(function(status,data){
					console.log(status);
					console.log(data);
				})			
		}else{
			$scope.information='请填写完整';
		}
	}
}])
//查看已经发布文章的控制器
myCtrls.controller('postListCtrl',['$scope','$sce','postService',function($scope,$sce,postService){
    $scope.posts=[];   
    postService.findAllPublished().success(function(data){
        //为每一个文章内容添加html信任
        for(var postKey in data){
          data[postKey].content=$sce.trustAsHtml(data[postKey].content);
        }
        $scope.posts=data;
        //console.log($scope.posts[0].tags); 	
    }).error(function(data,status){
    	console.log(data);
    	console.log(status);
    })	
    //向前翻一页，根据服务器传来的数据判断是否是第一页
    $scope.left_page=function(){
        console.log('left_page is running');
        postService.findAllPublished(-1).success(function(data){
          if(data.message=='left_end'){
            console.log('left_end');
            $scope.right_end=null;
            return $scope.left_end='已经是第一页了';
          }
          for(var postKey in data){
            data[postKey].content=$sce.trustAsHtml(data[postKey].content);
          }
          $scope.left_end=$scope.right_end=null;
          $scope.posts=data;
        //console.log($scope.posts[0].tags);    
        }).error(function(data,status){
          console.log(data);
          console.log(status);
        })
    }
    //向后翻一页
    $scope.right_page=function(){
        postService.findAllPublished(1).success(function(data){
          if(data.message=='right_end'){
            console.log('right_end');
            $scope.left_end=null;
            postService.reset();
            return $scope.right_end='已经是最后一夜了';
          }
          for(var postKey in data){
            data[postKey].content=$sce.trustAsHtml(data[postKey].content);
          }
          $scope.left_end=$scope.right_end=null;
          $scope.posts=data;
        //console.log($scope.posts[0].tags);    
        }).error(function(data,status){
          console.log(data);
          console.log(status);
        })
    }
}])
//显示此文章作者所有文章的控制器
myCtrls.controller('postListUserCtrl',['$scope','$sce','$routeParams','postService',
    function($scope,$sce,$routeParams,postService){
        var name=$routeParams.name;
        postService.findUser(name).success(function(data){
            for(var postKey in data){
                data[postKey].content=$sce.trustAsHtml(data[postKey].content);
            };
            $scope.posts=data;
            $scope.name=name;
        }).error(function(data,status){
            console.log(data);
            console.log(status);
        })
    }])
//阅读一篇文章的控制器
myCtrls.controller('postViewCtrl',['$scope','$location','$sce','$routeParams','$window','postService','likeService','commentService',
	function($scope,$location,$sce,$routeParams,$window,postService,likeService,commentService){
        $scope.post={};
        var id=$routeParams.id;
        var user=$window.sessionStorage.user;
        $scope.reprint_able=true;
        //$scope.isAleadyLiked=likeService.isAleadyLiked(id);        
        postService.read(id).success(function(data){
        	data.content=$sce.trustAsHtml(data.content);
            title=data.title;
        	$scope.post=data;
            $scope.reprint_times=data.reprint_to.length;
            $scope.comment_times=data.comments.length;
            if(data.name==user){
                $scope.edit=true;
                $scope.reprint_able=false;
            }
            $scope.commentUser=user;
            var item=data.comments;
            for(var i in item){
                item[i].head=item[i].head.slice(8);
            }
            $scope.comments=data.comments;
            //$scope.data=data;
            //console.log(data);
        }).error(function(data,status){
        	console.log(data);
        	console.log(status);
        })
        
        //点赞，如果服务器返回数据为1则点赞数加1，否则显示已经赞过
        $scope.likePost=function(){                        	
                postService.like(id,user).success(function(data){
                    if(data.like==1){
                       $scope.post.likes++;
                       //likeService.like(id); 
                    }else{
                       $scope.messageLike='您已经赞过了';;
                    }                	
                	//likeService.isAleadyLiked(id)=true;
                }).error(function(data,status){
                	console.log(data);
                	console.log(status);
                })
        	}
        
        //取消点赞
        $scope.unlikePost=function(){        	
        		postService.unlike(id,user).success(function(data){
                    if(data.unlike==1){
                        $scope.post.likes--;
                        //likeService.unlike(id);
                    }else{
                        console.log('应该取消点赞')
                        $scope.messageUnlike='您已经取消过点赞了'
                    }   			
                    //likeService.isAleadyLiked(id)=false;
        		}).error(function(data,status){
        			console.log(data);
        			console.log(status);
        		})
        	}
        //添加用户评论
        $scope.commentPost=function(comment){
            var date=new Date();
            var time=date.getFullYear()+'-'+(date.getMonth()+1)
                    +'-'+date.getDate()+date.getHours()+':'
                    +(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes());
            var comment={
                        title:title,
                        name:user,
                        time:time,
                        content:comment  
                    };
                    console.log(comment);
            commentService.post(comment).success(function(data){
                $location.path('/list');
            });

            
        }
        //转载文章
        $scope.reprint=function(){
                postService.reprint(id,user).success(function(data){
                    $scope.$emit('reprint');
                    $location.path('/');

                }).error(function(status,data){
                    console.log(stauts);
                    console.log(data);
                })
        }
	}])
//显示转载，登入登出，发表文章是否成功
myCtrls.controller('mainCtrl',function($scope){
	$scope.$on('reprint',function(){
        console.log('receive reprint');
        $scope.reprint='转载成功';
        $scope.isLogged=null;
        $scope.postSuccess=null;
        $scope.isLogouted=null;        
    })
    $scope.$on('login',function(){
        console.log('receive login');
        $scope.isLogged='已登入成功';
        $scope.isLogouted=null;
        $scope.postSuccess=null;
        $scope.reprint=null;
    });
    $scope.$on('postSuccess',function(){
        $scope.postSuccess='已发表成功';
        $scope.isLogouted=null;
        $scope.reprint=null;
        $scope.isLogged=null;
    });
    $scope.$on('isLogouted',function(){
        $scope.isLogouted='登出成功';
        $scope.isLogged=null;
        $scope.postSuccess=null;
        $scope.reprint=null;
    })
})
//获取同标签的所有文章
myCtrls.controller('postTagCtrl',['$scope','$routeParams','$sce','postService',
	function($scope,$routeParams,$sce,postService){
		$scope.posts=[];
        var tagName=$routeParams.tagName;
        postService.findByTag(tagName).success(function(data){
        	for(var postKey in data){
                data[postKey].content=$sce.trustAsHtml(data[postKey].content);
        	}
        	$scope.posts=data;
            $scope.tagName=tagName;
        }).error(function(data,status){
        	console.log(data);
        	console.log(status);
        })
	}])
//系统管理员控制器
myCtrls.controller('adminPostListCtrl',['$scope','postService',
	function($scope,postService){
        $scope.posts=[];

        postService.findAll().success(function(data){
        	$scope.posts=data;
            console.log(data);
        })

        $scope.updatePublishState=function(post,shouldPublish){
        	if(post!=undefined && shouldPublish!=undefined){
        		postService.changePublishState(post._id,shouldPublish).success(function(data){
        			var posts=$scope.posts;
        			for(var postKey in posts){
        				if(posts[postKey]._id==post._id){
        					$scope.posts[postKey].is_published=shouldPublish;
        				    break;
        				}        				
        			}
        		}).error(function(data,status){
        			console.log(data);
        			console.log(status);
        		})
        	}
        }

        $scope.deletePost=function(id){
        	if(id!=undefined){
        		postService.delete(id).success(function(data){
        			var posts=$scope.posts;
        			for(var postKey in posts){
        				if(posts[postKey]._id==id){
        					$scope.posts.splice(postKey,1);
        					break;
        				}
        			}
        		}).error(function(data,status){
        			console.log(status);
        			console.log(data);
        		})
        	}
        }
	}])
//文章编辑控制器
myCtrls.controller('postEditCtrl',['$scope','$routeParams','$sce','$location','postService',
    function($scope,$routeParams,$sce,$location,postService){
        $scope.post={};
        var id=$routeParams.id;

        postService.read(id).success(function(data){
            $scope.post=data;
            //$scope.post.tags0=data.tags[0];
            //$scope.post.tags1=data.tags[1];
            //$scope.post.tags2=data.tags[2];
            $('#textAreaContent').val($sce.trustAsHtml(data.content));
        }).error(function(status,data){
            console.log(data);
            console.log(status);
            $location.path('/');
        })
        //更新文章
        $scope.save=function(post,shouldPublish){
            if(post!=null && post.title!=null && (post.tags[0]!=null 
                || post.tags[1]!=null || post.tags[2]!=null) &&post.content!=null){
                var content=$('#textAreaContent').val();
                if(shouldPublish!=undefined && shouldPublish==true){
                    post.is_published=true;
                }else{
                    post.is_published=false;
                }
                
            /*    if(Object.prototype.toString.call(post.tags)!='[object Array]'){
                    post.tags=post.tags.split(',');
                }  */
                
                postService.update(post).success(function(data){
                    $location.path('/');
                }).error(function(status,data){
                    console.log(status);
                    console.log(data);
                })
            }
        }
    }]
);
/* 
myCtrls.controller('photoCtrl',['$scope','$window','$location','photoService',    
   function($scope,$window,$location,photoService){
        $('#photo').fileupload({
            url:'/photo'
        })
    
        $scope.photoPost=function(){
          photoService.post($window.sessionStorage.user).success(function(data){
                $location.path('/')
            }).error(function(status,data){
                console.log(status);
                console.log(data);
            })  
        }   
        
}])
*/
//头像照片上传控制器
myCtrls.controller('photoCtrl', ['$scope','$window','$location','Upload',
 function ($scope,$window,$location,Upload) {
    $scope.$watch('file', function (file) {
      $scope.upload($scope.file);
      
    });

    /* optional: set default directive values */
    //Upload.setDefaults( {ngf-keep:false ngf-accept:'image/*', ...} );

    $scope.upload = function (file) {
        console.log(file);
        var name=$window.sessionStorage.user;
        Upload.upload({
            url: '/postPhoto',
            method:'POST',
            fileName:name,
            fields: {'username': 'girl'},
            file: file,
            data:'peng'
        }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ');
        }).success(function (data, status, headers, config) {
            console.log('file ' + config.file.name + 'uploaded. Response: ' + data);
            $scope.message='上传成功';
        }).error(function (data, status, headers, config) {
            console.log('error status: ' + status);
        })
    };
}]);
//根据文章标题搜索文章
myCtrls.controller('searchCtrl',['$scope','$location','$sce','searchService',
    function($scope,$location,$sce,searchService){
        $scope.search=function(ele){
            searchService.post(ele).success(function(data){
                for(var i in data){
                    data[i].content=$sce.trustAsHtml(data.content);
                }
                $scope.posts=data;
                console.log(data);
            }).error(function(status,data){
                console.log(status);
                console.log(data);
            });
        }
        
    }])
//获取所有文章标签
myCtrls.controller('tagCtrl',['$scope','tagService',
    function($scope,tagService){
        tagService.get().success(function(data){
            $scope.tags=data;
            console.log(data);
        }).error(function(status,data){
            console.log(status);
            console.log(data);
        })
    }])
//用户自身页面文章控制器
myCtrls.controller('mineCtrl',['$scope','$window','$sce','$location','postService',
    function($scope,$window,$sce,$location,postService){
        var name=$window.sessionStorage.user;
        $scope.mine={};
        $scope.mine.name=name;
        $scope.edit=true;
        postService.findUser(name).success(function(data){
            $scope.posts=data;
            for(var i in data){
                data[i].content=$sce.trustAsHtml(data[i].content);
            }
        }).error(function(status,data){
            console.log(status);
            console.log(data);
        })

        $scope.deletePost=function(id){
            postService.delete(id).success(function(data){                
                postService.findUser(name).success(function(data){
                 $scope.posts=data;
                 for(var i in data){
                   data[i].content=$sce.trustAsHtml(data[i].content);
                   }
                 }).error(function(status,data){
                     console.log(status);
                     console.log(data);
                 })               
            }).error(function(status,data){
                console.log(status);
                console.log(data);
            })
        }
    }])