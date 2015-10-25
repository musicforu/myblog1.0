var mongoose=require('mongoose');
var mongodbURL='mongodb://localhost/blog';
var SALT_WORK_FACTOR = 10;
var bcrypt=require('bcrypt-nodejs');
//用mongoose连接mongodb数据库
mongoose.connect(mongodbURL,{},function(err,res){
    if(err){
    	console.log('Connection refused to '+mongodbURL);
    	console.log(err);
    }else{
    	console.log('Connection successfully to '+mongodbURL);
    }
});
//存储模型
var Schema=mongoose.Schema;
//用户信息存储模型
var User=new Schema({
	name:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    isAdmin:{type:Boolean,default:false},
    created:{type:Date,default:Date.now},
    header:{type:String}
})
//文章信息存储模型
var Post=new Schema({
    name:{type:String,required:true},
    title:{type:String,required:true},
    tags:{type:Array},
    is_published:{type:Boolean,default:true},
    content:{type:String,required:true},
    created:{type:Date,default:Date.now},
    updated:{type:Date,default:Date.now},
    read:{type:Number,default:0},
    likes:{type:Number,default:0},
    userLikes:{type:Array},
    comments:{type:Array},
    reprint_info:{type:Schema.Types.Mixed},
    reprint_to:{type:Array}
})
//存储之前进行加密
User.pre('save',function(next){
	var user=this;

	if(!user.isModified('password')) return next();
	bcrypt.genSalt(SALT_WORK_FACTOR,function(err,salt){
		if(err) return next(err);
		bcrypt.hash(user.password,salt,null,function(err,hash){
			if(err) return next(err);
			user.password=hash;
			next();
		})
	})    
});
//比较用户密码是否正确
User.methods.comparePassword=function(password,cb){
    bcrypt.compare(password,this.password,function(err,isMatch){
    	if(err) return cb(err);
    	cb(isMatch);
    })
}

var userModel=mongoose.model('User',User);
var postModel=mongoose.model('Post',Post);

exports.userModel=userModel;
exports.postModel=postModel;