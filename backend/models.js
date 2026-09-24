const m=require('mongoose'),S=m.Schema;
module.exports={
User:m.model('User',new S({name:String,email:{type:String,unique:true},password:String,role:{type:String,enum:['agent','admin'],default:'agent'}})),
Vehicle:m.model('Vehicle',new S({plate:{type:String,unique:true},owner:String,make:String,insuranceExpiry:Date,inspectionExpiry:Date,stolen:{type:Boolean,default:false},demo:Boolean,docHash:String})),
Check:m.model('Check',new S({plate:String,agent:{type:S.Types.ObjectId,ref:'User'},agentName:String,demo:Boolean,checkpoint:String,status:String,flags:[String],score:Number,at:{type:Date,default:Date.now}}))};
