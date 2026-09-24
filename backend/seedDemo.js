require('dotenv').config();const m=require('mongoose');const {Vehicle,Check}=require('./models');const {vehicles,makeCheck}=require('./demoLib');
(async()=>{await m.connect(process.env.MONGO_URI);await Vehicle.deleteMany({demo:true});await Check.deleteMany({demo:true});
const vs=await Vehicle.insertMany(vehicles());const cs=[];
for(let i=0;i<1600;i++)cs.push(makeCheck(vs,new Date(Date.now()-Math.pow(Math.random(),1.2)*14*864e5)));
await Check.insertMany(cs);console.log('Sample data loaded:',vs.length,'vehicles,',cs.length,'checks. Remove with: npm run clear-demo');process.exit()})();
