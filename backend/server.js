require('dotenv').config();
const express=require('express'),mongoose=require('mongoose'),cors=require('cors'),jwt=require('jsonwebtoken'),bcrypt=require('bcryptjs');
const {User,Vehicle,Check}=require('./models');
const app=express();app.use(cors(),express.json());
const norm=p=>String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const auth=(role)=>(req,res,next)=>{try{const u=jwt.verify(((req.headers.authorization||'').slice(7)||req.query.token),process.env.JWT_SECRET);
 if(role&&u.role!==role)return res.status(403).json({error:'Forbidden'});req.user=u;next()}catch{res.status(401).json({error:'Unauthorized'})}};
// Anti-fraud engine: returns flags + risk score
async function validate(plate,{docHash,checkpoint,at=new Date()}={}){
 const v=await Vehicle.findOne({plate:norm(plate)}),flags=[];
 if(!v)return{flags:['not_registered'],score:100,status:'fraud',vehicle:null};
 if(v.stolen)flags.push('stolen');
 if(v.insuranceExpiry<at)flags.push('insurance_expired');
 if(v.inspectionExpiry<at)flags.push('inspection_expired');
 if(docHash&&v.docHash&&docHash!==v.docHash)flags.push('document_tampered');
 const dup=await Check.findOne({plate:v.plate,checkpoint:{$ne:checkpoint},at:{$gt:new Date(+at-10*60000)}});
 if(dup)flags.push('possible_clone'); // same plate, different checkpoint <10min
 const w={stolen:100,document_tampered:70,possible_clone:60,insurance_expired:30,inspection_expired:20};
 const score=Math.min(100,flags.reduce((s,f)=>s+w[f],0));
 return{flags,score,status:score>=60?'fraud':score>0?'warning':'valid',vehicle:v}};
app.post('/api/auth/login',async(req,res)=>{const u=await User.findOne({email:req.body.email});
 if(!u||!await bcrypt.compare(req.body.password||'',u.password))return res.status(401).json({error:'Invalid credentials'});
 res.json({token:jwt.sign({id:u._id,role:u.role,name:u.name},process.env.JWT_SECRET,{expiresIn:'12h'}),user:{name:u.name,role:u.role}})});
app.post('/api/users',auth('admin'),async(req,res)=>{const{name,email,password,role}=req.body;
 res.status(201).json(await User.create({name,email,role,password:await bcrypt.hash(password,10)}))});
app.post('/api/verify',auth(),async(req,res)=>{const{plate,docHash,checkpoint,at}=req.body;
 const r=await validate(plate,{docHash,checkpoint,at:at?new Date(at):new Date()});
 await Check.create({plate:norm(plate),agent:req.user.id,agentName:req.user.name,checkpoint,status:r.status,flags:r.flags,score:r.score,at:at||new Date()});
 res.json(r)});
app.post('/api/verify/sync',auth(),async(req,res)=>{const out=[];
 for(const c of req.body.checks||[]){const r=await validate(c.plate,{...c,at:new Date(c.at)});
  await Check.create({plate:norm(c.plate),agent:req.user.id,agentName:req.user.name,checkpoint:c.checkpoint,status:r.status,flags:r.flags,score:r.score,at:c.at});out.push({id:c.id,status:r.status})}
 res.json({synced:out})});
app.get('/api/vehicles/cache',auth(),async(_q,res)=>res.json(await Vehicle.find().limit(5000)));
app.get('/api/checks',auth('admin'),async(_q,res)=>res.json(await Check.find().sort('-at').limit(100).populate('agent','name')));
app.get('/api/stats',auth('admin'),async(_q,res)=>{const since=new Date(Date.now()-7*864e5);
 const [total,byStatus,daily,flags,cps]=await Promise.all([Check.countDocuments(),
  Check.aggregate([{$group:{_id:'$status',n:{$sum:1}}}]),
  Check.aggregate([{$match:{at:{$gt:since}}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$at'}},n:{$sum:1},fraud:{$sum:{$cond:[{$eq:['$status','fraud']},1,0]}}}},{$sort:{_id:1}}]),
  Check.aggregate([{$unwind:'$flags'},{$group:{_id:'$flags',n:{$sum:1}}}]),
  Check.aggregate([{$group:{_id:'$checkpoint',n:{$sum:1},fraud:{$sum:{$cond:[{$eq:['$status','fraud']},1,0]}}}},{$sort:{n:-1}},{$limit:12}])]);
 res.json({total,byStatus,daily:daily.length?daily:[{_id:'-',n:1,fraud:0}],flags:flags.length?flags:[{_id:'stolen',n:0}],cps})});
app.get('/api/users',auth('admin'),async(_q,res)=>res.json(await User.find({},'-password')));
app.delete('/api/users/:id',auth('admin'),async(req,res)=>{await User.findByIdAndDelete(req.params.id);res.json({ok:true})});
const vf=b=>({plate:norm(b.plate),owner:b.owner,make:b.make,insuranceExpiry:b.insuranceExpiry,inspectionExpiry:b.inspectionExpiry,stolen:!!b.stolen,docHash:b.docHash});
app.get('/api/vehicles',auth('admin'),async(_q,res)=>res.json(await Vehicle.find().sort('-_id').limit(500)));
app.post('/api/vehicles',auth('admin'),async(req,res)=>{try{res.status(201).json(await Vehicle.create(vf(req.body)))}catch(e){res.status(400).json({error:e.message})}});
app.put('/api/vehicles/:id',auth('admin'),async(req,res)=>res.json(await Vehicle.findByIdAndUpdate(req.params.id,req.body,{new:true})));
app.delete('/api/vehicles/:id',auth('admin'),async(req,res)=>{await Vehicle.findByIdAndDelete(req.params.id);res.json({ok:true})});
app.get('/api/live',auth('admin'),(req,res)=>{ // Server-Sent Events: pushes new checks to the portal
 res.set({'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();
 let last=mongoose.Types.ObjectId.createFromTime(Math.floor(Date.now()/1000));
 const id=setInterval(async()=>{try{const n=await Check.find({_id:{$gt:last}}).sort('_id').populate('agent','name');
  if(!n.length)return res.write(': ping\n\n');for(const c of n){last=c._id;res.write('data: '+JSON.stringify(c)+'\n\n')}}catch{}},2000);
 req.on('close',()=>clearInterval(id))});
app.get('/health',(_q,res)=>res.send('ok'));
mongoose.connect(process.env.MONGO_URI).then(()=>app.listen(process.env.PORT||5000,()=>console.log('SecurRoute API up')));
