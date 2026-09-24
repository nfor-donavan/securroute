require('dotenv').config();const m=require('mongoose'),bcrypt=require('bcryptjs');const {User}=require('./models');
(async()=>{const{ADMIN_NAME='Administrator',ADMIN_EMAIL,ADMIN_PASSWORD}=process.env;
if(!ADMIN_EMAIL||!ADMIN_PASSWORD){console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');process.exit(1)}
await m.connect(process.env.MONGO_URI);
await User.findOneAndUpdate({email:ADMIN_EMAIL},{name:ADMIN_NAME,role:'admin',password:await bcrypt.hash(ADMIN_PASSWORD,10)},{upsert:true});
console.log('Admin ready:',ADMIN_EMAIL);process.exit()})();
