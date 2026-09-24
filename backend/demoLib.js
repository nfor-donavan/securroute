const CPS=['Douala – Yassa','Yaoundé – Nsimalen','Bafoussam – Nord','Garoua – Sud','Kribi – Port'],W=[.3,.27,.2,.13,.1],AG=['Mbarga','Ngo','Essomba','Tabi','Fotso','Kamga','Nkoulou'];
const pick=a=>a[Math.floor(Math.random()*a.length)],L=()=>String.fromCharCode(65+Math.random()*26|0);
const plate=()=>pick(['LT','CE','NW','SW','EN','OU','NO','AD'])+(Math.floor(Math.random()*900)+100)+L()+L();
const cp=()=>{let r=Math.random(),i=0;while(r>W[i]&&i<4)r-=W[i++];return CPS[i]};
const WT={stolen:100,insurance_expired:30,inspection_expired:20,possible_clone:60,not_registered:100};
const day=n=>new Date(Date.now()+n*864e5);
function vehicles(){const v=[];for(let i=0;i<60;i++){const k=i<44?0:i<56?1:2;v.push({plate:plate(),owner:pick(['J. Tchamba','M. Nkoulou','A. Fotso','P. Essomba','S. Kamdem','R. Ndi','C. Mballa'])+' '+i,make:pick(['Toyota Corolla','Hyundai Accent','Nissan Hilux','Toyota RAV4','Kia Rio','Peugeot 206']),
 insuranceExpiry:day(k===1?-Math.random()*60-1:Math.random()*300+30),inspectionExpiry:day(k===1&&Math.random()<.5?-20:Math.random()*300+30),stolen:k===2,demo:true})}return v}
function makeCheck(vs,at=new Date()){const r=Math.random(),ok=vs.filter(v=>!v.stolen&&v.insuranceExpiry>at&&v.inspectionExpiry>at),bad=vs.filter(v=>!v.stolen&&!(v.insuranceExpiry>at&&v.inspectionExpiry>at)),st=vs.filter(v=>v.stolen);
 let pl,fl=[];if(r<.76){pl=pick(ok).plate;if(Math.random()<.03)fl.push('possible_clone')}else if(r<.9){const v=pick(bad);pl=v.plate;if(v.insuranceExpiry<at)fl.push('insurance_expired');if(v.inspectionExpiry<at)fl.push('inspection_expired')}
 else if(r<.95){pl=pick(st).plate;fl.push('stolen')}else{pl=plate();fl.push('not_registered')}
 const score=Math.min(100,fl.reduce((a,f)=>a+WT[f],0));
 return{plate:pl,checkpoint:cp(),agentName:pick(AG),flags:fl,score,status:score>=60?'fraud':score>0?'warning':'valid',at,demo:true}}
module.exports={vehicles,makeCheck};
