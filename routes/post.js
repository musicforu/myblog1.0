var db=require('../models/db.js');
//数据库查找内容
var publicFields='_id name title url tags content created likes comments userLikes read reprint_to';
//提供上传图片功能
var multiparty=require('multiparty');
var fs=require('fs');
//存储文章信息
exports.create=function(req,res){
	var post=req.body.post;
    if(post==null || post.title==null || post.tags==null || post.content==null){
        return res.send(401);
    }
    var postEntry=new db.postModel();
    postEntry.name=post.name;
    postEntry.title=post.title;
    postEntry.tags=post.tags;
    postEntry.is_published=post.is_published;
    postEntry.content=post.content;
    postEntry.save(function(err){
    	if(err){
    		console.log(err);
    		return res.send(400);
    	}else{
    		return res.send(200);
    	}
    })
}
//获取6篇文章，
exports.list=function(req,res){
	var query=db.postModel.find({is_published:true});
    var query_length=db.postModel.find({is_published:true});
    query.select(publicFields);
    query_length.select(publicFields);
    query.sort('-created');
    var page=req.body.page;//获取客户端需求页数
    console.log('server page',page);
    //已经是第一页
    if(page==0){        
        return res.send(200,{message:'left_end'});
    }
    //获取6篇文章
    query_length.exec(function(err,results_new){
        var posts_length=results_new.length;//文章总数    
        query.skip((page-1)*6);
        query.limit(6);
        query.exec(function(err,results){ 
    	    if(err){
    		    console.log(err);
    		    return res.send(400);
    	    }
            //console.log(posts_length);
            var page_length=page*6;
            //console.log(page_length);
            //文章总页数
            var pages_most=Math.ceil(posts_length/6);
            //console.log(pages_most);
            //如果客户端需求页数大于数据库中文章总页数，显示已经是最后一页
            if(page>pages_most){
                console.log('server right');
                return res.json(200,{message:'right_end'});
            }
    	    for(var postKey in results){
                //只显示文章内容的前400字
    		    results[postKey].content=results[postKey].content.substr(0,400);
    	    }
    	    return res.json(200,results);
        })
    })
}
//获取所有文章
exports.listAll=function(req,res){
	var query=db.postModel.find();
	query.select(publicFields);
	query.sort('-created');
	query.exec(function(err,results){
		if(err){
			console.log(err);
			return res.send(400);
		}
		for(var postKey in results){
			results[postKey].content=results[postKey].content.substr(0,400);
		}
        console.log(results);
		return res.json(200,results);
	})
}
//按文章作者查找该作者的所有文章
exports.listUser=function(req,res){
    var name=req.params.user;
    console.log(name);
    var query=db.postModel.find({name:name});

    query.select(publicFields);
    query.sort('-created');
    query.exec(function(err,results){
        if(err){
            console.log(err);
            return res.send(400);
        }
        for(var postKey in results){
            results[postKey].content=results[postKey].content.substr(0,400);
        }
        return res.json(200,results);
    })
}
//更新文章
exports.update=function(req,res){
	var post=req.body.post;
	if(post==null || post._id==null){
		res.send(400);
	}
	var updatePost={};
	if(post.title!=null && post.title!=''){
		updatePost.title=post.title;
	}
	if(post.tags!=null){
        if(Object.prototype.toString.call(post.tags)==='[object Array]'){
        	updatePost.tags=post.tags;
        }else{
        	updatePost.tags=post.tags.split(',');
        }
	}
	if(post.is_published!=null){
        updatePost.is_published=post.is_published;
	}
	if(post.content!=null && post.content!=''){
		updatePost.content=post.content;
	}
	updatePost.updated=new Date();
	db.postModel.update({_id:post._id},updatePost,function(err,nbRows,raw){
		return res.send(200);
	})
}
//搜索该标签的所有文章
exports.listByTag=function(req,res){
	var tagName=req.params.tagName||'';
    if(tagName==''){
    	return res.send(400);
    }
    var query=db.postModel.find({tags:tagName,is_published:true});
    query.select(publicFields);
    query.sort('-created');
    query.exec(function(err,results){
    	if(err){
    		console.log(err);
    		return res.send(400);
    	}
    	for(var postKey in results){
    		results[postKey].content=results[postKey].content.substr(0,400);
    	}
    	return res.json(200,results);
    })
}
//阅读一篇文章
exports.read=function(req,res){
    var id=req.params.id || '';
    if(id==''){
        return res.send(400);
    }

    var query=db.postModel.findOne({_id:id});
    query.select(publicFields);
    query.exec(function(err,result){
        if(err){
            console.log(err);
            return res.send(400);
        }
        //该文章阅读数加1
        if(result!=null){
            result.update({$inc:{read:1}},function(err,nbRows,raw){
                return res.json(200,result);
            })
        }else{
            return res.send(400);
        }
    })
}
//为文章点赞
exports.like=function(req,res){
    var id=req.body.id;
    var user=req.body.user;    
    db.postModel.findOne({_id:id},function(err,post){
        if(err){
            console.log(err);
            return res.send(400);
        }
        var item=post.userLikes;
        console.log('1',post);
        //如果此文章还没有被点过赞
        if(item.length==0){
            //记录为此文章点赞的用户
            item.push(user);
            //此文章点赞数加1，并添加为此文章点赞的用户数组
            db.postModel.update({_id:id},{$inc:{likes:1},$set:{userLikes:item}},function(err,result){
                if(err){
                    console.log(err);
                    return res.send(400);
                }                               
                console.log(post);
                return res.send(200,{like:1});
            })
        }else{
            //如果此文章已经被点过赞，遍历点赞的用户，如果此用户已经点过赞，则返回0，
            //告诉客户端，此用户已经点过赞，否则此文章点赞数加1，并更新为此文章点赞的用户数组
            for (var i in item) {
                if(item[i]==user){
                    console.log('2',item);
                    return res.send(200,{like:0});
                }            
            };
            db.postModel.update({_id:id},{$inc:{likes:1},$set:{userLikes:item}},function(err,result){
                if(err){
                    console.log(err);
                    return res.send(400);
                }                               
                console.log(post);
                return res.send(200,{like:1});
            })
        }
        
    })    
}        

//取消点赞
exports.unlike=function(req,res){
    var id=req.body.id;
    var user=req.body.user;

    db.postModel.findOne({_id:id},function(err,post){
        if(err){
            console.log(err);
            return res.send(400);
        }
        var item=post.userLikes;
        //如果点赞数组中的为0，则显示已经取消点赞
        if(item.length==0){
            return res.send(200,{unlike:0});
        }
        //遍历点赞数组中的用户
        for (var i in item) {
            //如果点赞用户数组中有此用户，则删除此文章点赞数组中的这个用户，
            //并且此文章点赞数减1，更新点赞用户数组
            if(item[i]==user){
                console.log(item[i]);
                item.splice(i,1);
                    return  db.postModel.update({_id:id},{$inc:{likes:-1},$set:{userLikes:item}},function(err,result){
                    if(err){
                        console.log(err)
                        return res.send(400);
                    }
                    return res.send(200,{unlike:1});
                })                
            }
            //如果没有此用户，则返回unlike为0，表示已经取消过点赞
            return res.send(200,{unlike:0});
        };
    })
}

  

//删除文章
exports.delete=function(req,res){
    var id=req.params.id;
    console.log('delete id' ,id);
    if(id==null||id==''){
        return res.send(400);
    }

    var query=db.postModel.findOne({_id:id});
    query.exec(function(err,result){
        if(err){
            console.log(err);
            res.send(400);
        }
        if(result!=null){
            result.remove();
            console.log('Delete Success');
            return res.send(200);
        }else{
            return res.send(400);
        }
    })
}
//上传头像照片
exports.postPhoto=function(req,res){
    //设置上传路径
    var form=new multiparty.Form({uploadDir:'./public/images/'});   
    //解析上传文件 
    form.parse(req,function(err,fields,files){
        var file=files.file;
        for(var fileKey in file){
            //获取上传文件类型
            var type=file[fileKey].headers['content-type'].slice(6);
            //获取上传文件名称
            var name=file[fileKey].originalFilename;
            var uploadPath=file[fileKey].path;            
            var dstPath='./public/images/'+name+'.'+type;
            console.log(file[fileKey]);
            //更新数据库中关于用户头像的信息
            db.userModel.update({name:name},{header:dstPath},
                function(err){
                    if(err){
                        return console.log(err)
                    }
                    //设置头像照片存储路径
                    fs.rename(uploadPath,dstPath,function(err){
                        if(err){
                            console.log(err);
                        }
                        return res.send(200);
                    }) 
                })            
        }        
    })
}    
    /*
    var name=req.body.name;
    var form=new multiparty.Form({uploadDir:'../public/images/'});
    console.log(files);
    form.parse(req,function(err,fields,files){
        var uploadPath=files.photo[0].path;
        var type=files.photo[0].headers['content-type'].slice(6);
        var dstPath='../public/images/'+name+'.'+type;
        fs.rename(uploadPath,dstPath,function(err){
            if(err){
                console.log(err);
            }
            return res.send(200);
        })
    })
    */

//添加文章评论
exports.comment=function(req,res){
    var comment=req.body.comment;
    var title=comment.title;
    var name=comment.name;
    db.userModel.findOne({name:name},function(err,user){
        comment.head=user.header;    
        db.postModel.update({title:title},{$push:{'comments':comment}},
            function(err,result){
                if(err){
                    return console.log(err)
                }
                console.log(result);
                return res.send(200);
            })
    })
}
//根据文章题目进行搜索
exports.search=function(req,res){
    var searchEle=req.body.searchEle;
    var pattern=new RegExp('^.*'+searchEle+'.*$','i');
    console.log('searchEle',searchEle);
    var query=db.postModel.find({title:pattern});
    query.sort('-created');
    query.exec(function(err,results){
        if(err){
            return res.send(400);
        }
        console.log(results);
        res.json(200,results);
    })
}
//获取所有文章标签
exports.getTags=function(req,res){ 
    db.postModel.distinct('tags',function(err,results){
        res.send(200,results);
    })
}
//转载文章
exports.reprint=function(req,res){
    var id=req.body.id;
    var user=req.body.user;
    db.postModel.findOne({_id:id},function(err,result){
            if(err){
                console.log(err);
                return res.send(401,'Server Error');
            }
            //设置转载文章的实例
            var postEntry=new db.postModel();
            //设置转载文章的原来对象信息
            var reprint_from={};
            postEntry.name=user;
            //设置转载文章的原作者
            reprint_from.name=result.name;
            //转载文章的原题目
            reprint_from.title=result.title;
            //转载后的题目，标签，内容，时间，最后存储
            postEntry.title=(result.title.search(/[转载]/)>-1)?result.title:'[转载]'+result.title;
            postEntry.tags=reprint_from.tags=result.tags;
            postEntry.content=result.content;
            postEntry.created=Date.now();
            postEntry.save(function(err,reprint_result){
                if(err){
                    console.log(err);
                    return res.send(401,'Server Error')
                }
                //在文章原作者的信息中添加转载其文章的用户，以及转载信息
                db.postModel.update({_id:id},{$push:{'reprint_to':user,'reprint_info':reprint_from}},function(err){
                    if(err){
                    console.log(err);
                    return res.send(401,'Server Error')
                    }
                    //为转载后的文章，添加转载信息
                    db.postModel.update({_id:reprint_result.id},{$push:{'reprint_info':reprint_from}},function(err){
                        if(err){
                            console.log(err)
                            return res.send(401);
                        }
                        return res.send(200,{message:'转载成功'});
                      })
                        
                    })                    
                })                
            })
            
        

}