require('dotenv').config();const m=require('mongoose');const {Vehicle,Check}=require('./models');const {makeCheck}=require('./demoLib');
(async()=>{await m.connect(process.env.MONGO_URI);const vs=await Vehicle.find({demo:true});if(!vs.length){console.log('Run npm run seed-demo first');process.exit(1)}
console.log('Simulating live checkpoint scans… Ctrl+C to stop');setInterval(async()=>{const c=makeCheck(vs);await Check.create(c);console.log(c.status,c.plate,c.checkpoint)},3500)})();
