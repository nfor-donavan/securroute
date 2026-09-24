require('dotenv').config();const m=require('mongoose');const {Vehicle,Check}=require('./models');
(async()=>{await m.connect(process.env.MONGO_URI);await Vehicle.deleteMany({demo:true});await Check.deleteMany({demo:true});console.log('Sample data removed');process.exit()})();
