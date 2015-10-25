var redisClient=require('./redis_database').redisClient;
var TOKEN_EXPIRATION=60;
var TOKEN_EXPIRATION_SEC=TOKEN_EXPIRATION*60;
//鉴权用户是否有token秘钥
exports.verifyToken=function(req,res,next){
	var token=getToken(req.headers);

	redisClient.get(token,function(err,reply){
		if(err){
			console.log(err);
			return res.send(500);
		}else{
			next();
		}
	})
}
//如果用户有鉴权信息，设置鉴权有效时间
exports.expireToken=function(headers){
    var token=getToken(headers);

    if(token!=null){
    	redisClient.set(token,{is_expired:true});
    	redisClient.expire(token,TOKEN_EXPIRATION_SEC);
    }
}
//获取用户鉴权值
exports.getToken=function(headers){
	if(headers && headers.authorization){
		var authorization=headers.authorization;
		var part=authorization.split(' ');

		if(part.length==2){
			var token=part[1];
			return token;
		}else{
			return null;
		}
	}else{
		return null;
	}
}

exports.TOKEN_EXPIRATION=TOKEN_EXPIRATION;
exports.TOKEN_EXPIRATION_SEC=TOKEN_EXPIRATION_SEC;