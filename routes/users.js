var express = require('express');
var router = express.Router();
var db=require('../models/db.js');
var jwt=require('jsonwebtoken');
var secret=require('../config/secret');
var tokenManager=require('../config/token_manager');

//用户注册
exports.register=function(req,res){
	var name=req.body.name;
	var password=req.body.password;
	var passwordRepeat=req.body.passwordRepeat;

	if(name=='' || password=='' || password!=passwordRepeat){
		return res.send(400);
	}

	var user=new db.userModel();
	user.name=name;
	user.password=password;

    db.userModel.findOne({name:name},function(err,userName){
    	if(userName){
    		return res.json({message:'用户名已存在'});
    	}
    	user.save(function(err){
		if(err){
			console.log(err);
			return res.send(500);
		}

		db.userModel.count(function(err,counter){
			if(err){
				console.log(err);
				return res.send(500);
			}
			//第一个注册的用户是系统管理员
			if(counter==1){
				db.userModel.update({name:user.name},{isAdmin:true},function(err,nbRow){
					if(err){
						console.log(err);
						res.send(500);
					}
					console.log('First user is Admin');
					var token=jwt.sign({id:user._id},secret.secretToken,{expireInMinutes:tokenManager.TOKEN_EXPIRATION});
                    return res.json({token:token});
				})
			}
			else{
				//加密
				var token=jwt.sign({id:user._id},secret.secretToken,{expireInMinutes:tokenManager.TOKEN_EXPIRATION});
                return res.json({token:token});
			}
		})
	  })
    })

	
}
//登录
exports.login=function(req,res){
	var name=req.body.name || '';
	var password=req.body.password || '';

	if(name=='' || password==''){
		return res.send(401);
	}
    
    db.userModel.findOne({name:name},function(err,user){
    	if(err){
    		console.log(err);
    		return res.send(401);
    	}
    	if(user==undefined){
    		return res.send(401);
    	}
    	//比较密码
    	user.comparePassword(password,function(isMatch){
    		if(!isMatch){
    			console.log('Failed Attempt login with '+user.name);
    			return res.send(401);
    		}
            var token=jwt.sign({id:user._id},secret.secretToken,{expireInMinutes:tokenManager.TOKEN_EXPIRATION});
            if(user.isAdmin==true){
            	console.log('isAdmin');
            	return res.json({token:token,isAdmin:true});
            }
            return res.json({token:token});
    	})
    })
}
//登出
exports.logout=function(req,res){
	return res.send(200);
}
//module.exports = router;
