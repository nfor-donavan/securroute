import React,{useEffect,useState} from 'react';
const API=import.meta.env.VITE_API_URL;
export function Checks({t,checks}){
 const[q,setQ]=useState(''),[st,setSt]=useState('');
 const rows=checks.filter(c=>c.plate.replace(/\s/g,'').includes(q.toUpperCase().replace(/\s/g,''))&&(!st||c.status===st));
 const csv=()=>{const l=['plate,status,score,agent,time',...rows.map(c=>[c.plate,c.status,c.score,c.agentName||c.agent?.name||'',new Date(c.at).toISOString()].join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([l],{type:'text/csv'}));a.download='securroute-checks.csv';a.click()};
 return<div className="card"><div className="bar2"><input placeholder={t.search} value={q} onChange={e=>setQ(e.target.value)}/>
  <select value={st} onChange={e=>setSt(e.target.value)}><option value="">{t.all}</option>{['valid','warning','fraud'].map(k=><option key={k} value={k}>{t.s[k]}</option>)}</select>
  <button className="btn" onClick={csv}>{t.csv}</button></div>
  <div className="scroll"><table><thead><tr><th>{t.plate}</th><th>{t.status}</th><th>{t.score}</th><th>{t.agent}</th><th>{t.time}</th></tr></thead><tbody>
  {rows.map(c=><tr key={c._id}><td><b>{c.plate}</b></td><td><span className={'tag '+c.status}>{t.s[c.status]}</span></td><td>{c.score}</td><td>{c.agentName||c.agent?.name}</td><td>{new Date(c.at).toLocaleString()}</td></tr>)}</tbody></table></div>
  {!rows.length&&<p style={{color:'var(--mu)'}}>{t.empty}</p>}</div>}
export function Agents({t,tok}){
 const[us,setUs]=useState([]),[f,setF]=useState({name:'',email:'',password:'',role:'agent'});
 const H={'Content-Type':'application/json',Authorization:'Bearer '+tok};
 const load=()=>fetch(API+'/api/users',{headers:H}).then(r=>r.json()).then(setUs).catch(()=>{});
 useEffect(()=>{load()},[]);
 const add=async e=>{e.preventDefault();{await fetch(API+'/api/users',{method:'POST',headers:H,body:JSON.stringify(f)});load()}setF({name:'',email:'',password:'',role:'agent'})};
 const rm=async id=>{{await fetch(API+'/api/users/'+id,{method:'DELETE',headers:H});load()}};
 return<div className="grid2"><div className="card"><div className="scroll"><table><thead><tr><th>{t.name}</th><th>{t.email}</th><th>{t.role}</th><th/></tr></thead><tbody>
  {us.map(u=><tr key={u._id}><td><b>{u.name}</b></td><td>{u.email}</td><td>{u.role}</td><td><button className="pill" onClick={()=>rm(u._id)}>{t.del}</button></td></tr>)}</tbody></table></div></div>
  <form className="card fm" onSubmit={add}><h3>{t.add}</h3><input required placeholder={t.name} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
  <input required type="email" placeholder={t.email} value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><input required type="password" placeholder={t.pass} value={f.password} onChange={e=>setF({...f,password:e.target.value})}/>
  <select value={f.role} onChange={e=>setF({...f,role:e.target.value})}><option value="agent">agent</option><option value="admin">admin</option></select><button className="btn">{t.add}</button></form></div>}

const D=d=>d?new Date(d).toLocaleDateString():'—',late=d=>d&&new Date(d)<new Date();
export function Registry({t,tok}){
 const E={plate:'',owner:'',make:'',insuranceExpiry:'',inspectionExpiry:''},[vs,setVs]=useState([]),[f,setF]=useState(E);
 const H={'Content-Type':'application/json',Authorization:'Bearer '+tok},load=()=>fetch(API+'/api/vehicles',{headers:H}).then(r=>r.json()).then(setVs).catch(()=>{});
 useEffect(()=>{load()},[]);
 const add=async e=>{e.preventDefault();await fetch(API+'/api/vehicles',{method:'POST',headers:H,body:JSON.stringify(f)});setF(E);load()};
 const flip=async v=>{await fetch(API+'/api/vehicles/'+v._id,{method:'PUT',headers:H,body:JSON.stringify({stolen:!v.stolen})});load()};
 const rm=async v=>{await fetch(API+'/api/vehicles/'+v._id,{method:'DELETE',headers:H});load()};
 const I=(k,p,ty='text')=><input required type={ty} placeholder={p} title={p} value={f[k]} onChange={e=>setF({...f,[k]:e.target.value})}/>;
 return<div className="grid2"><div className="card"><div className="scroll"><table><thead><tr><th>{t.plate}</th><th>{t.owner}</th><th>{t.make}</th><th>{t.ins}</th><th>{t.insp}</th><th/></tr></thead><tbody>
  {vs.map(v=><tr key={v._id}><td><b>{v.plate}</b>{v.stolen&&<span className="tag fraud" style={{marginLeft:6}}>{t.stl}</span>}</td><td>{v.owner}</td><td>{v.make}</td>
  <td style={{color:late(v.insuranceExpiry)?'var(--fr)':''}}>{D(v.insuranceExpiry)}</td><td style={{color:late(v.inspectionExpiry)?'var(--fr)':''}}>{D(v.inspectionExpiry)}</td>
  <td style={{whiteSpace:'nowrap'}}><button className="pill" onClick={()=>flip(v)}>{v.stolen?t.clear:t.mark}</button> <button className="pill" onClick={()=>rm(v)}>{t.del}</button></td></tr>)}</tbody></table></div></div>
  <form className="card fm" onSubmit={add}><h3>{t.reg}</h3>{I('plate',t.plate)}{I('owner',t.owner)}{I('make',t.make)}{I('insuranceExpiry',t.ins,'date')}{I('inspectionExpiry',t.insp,'date')}<button className="btn">{t.reg}</button></form></div>}
const CP={'Douala – Yassa':[4.05,9.70],'Yaoundé – Nsimalen':[3.72,11.55],'Bafoussam – Nord':[5.48,10.42],'Garoua – Sud':[9.30,13.39],'Kribi – Port':[2.94,9.91]};
export function MapPage({t,cps}){
 const[k,setK]=useState(Object.keys(CP)[0]),[la,lo]=CP[k],n=Object.fromEntries((cps||[]).map(x=>[x._id,x.n]));
 return<div className="grid2"><div className="card"><h3>{t.pick}</h3>{Object.keys(CP).map(x=><button key={x} className={'cpb'+(x===k?' on':'')} onClick={()=>setK(x)}><span>📍 {x}</span><em>{n[x]||0} {t.cnt}</em></button>)}</div>
  <div className="card" style={{padding:0,overflow:'hidden',minHeight:380}}><iframe title={k} style={{border:0,width:'100%',height:'100%',minHeight:380}} src={`https://www.openstreetmap.org/export/embed.html?bbox=${lo-.2},${la-.15},${lo+.2},${la+.15}&layer=mapnik&marker=${la},${lo}`}/></div></div>}
export function Report({t,stats}){
 const g=k=>stats.byStatus.find(x=>x._id===k)?.n||0;
 return<div className="card rep"><div className="bar2 noprint"><button className="btn" onClick={()=>window.print()}>{t.print}</button></div>
  <div style={{display:'flex',gap:12,alignItems:'center'}}><img src="/logo.png" width="56" alt=""/><div><h2 style={{margin:0}}>{t.rep}</h2><small>{t.gen}: {new Date().toLocaleString()}</small></div></div>
  <table><tbody>{[[t.total,stats.total],[t.valid,g('valid')],[t.warn,g('warning')],[t.fraud,g('fraud')]].map(([a,b])=><tr key={a}><td>{a}</td><td><b>{b}</b></td></tr>)}</tbody></table>
  <h3>{t.flags}</h3><table><tbody>{stats.flags.map(x=><tr key={x._id}><td>{t.f[x._id]||x._id}</td><td>{x.n}</td></tr>)}</tbody></table>
  <h3>{t.cps}</h3><table><tbody>{stats.cps.map(x=><tr key={x._id}><td>{x._id}</td><td>{x.n}</td></tr>)}</tbody></table></div>}

const OUT=[[8.5,4.6],[9.3,4.0],[9.7,3.3],[9.9,2.5],[11.3,2.2],[13.2,2.2],[16.0,2.2],[16.2,3.5],[15.0,4.3],[14.5,5.5],[15.2,7.5],[14.5,8.8],[15.5,9.8],[15.0,11.0],[14.2,12.7],[13.7,13.1],[13.2,12.0],[13.9,11.2],[13.4,10.0],[12.6,8.7],[12.2,7.5],[11.4,6.5],[10.5,6.9],[9.8,6.4],[9.1,6.1],[8.9,5.5]];
const X=lo=>(lo-8)*33,Y=la=>(13.5-la)*33;
export function Heat({t,cps}){const mx=Math.max(1,...(cps||[]).map(c=>c.n));
 return<div className="card"><h3>{t.heat}</h3><svg viewBox="0 0 300 420" style={{width:'100%',maxHeight:460}}>
  <polygon points={OUT.map(([o,a])=>X(o)+','+Y(a)).join(' ')} fill="var(--bg)" stroke="var(--nv)" strokeWidth="2" strokeLinejoin="round"/>
  {(cps||[]).filter(c=>CP[c._id]).map(c=>{const[la,lo]=CP[c._id],r=(c.fraud||0)/c.n,col=r>.12?'var(--fr)':r>.06?'var(--wa)':'var(--ok)';
   return<g key={c._id}><circle cx={X(lo)} cy={Y(la)} r={10+26*Math.sqrt(c.n/mx)} fill={col} opacity=".28"><animate attributeName="opacity" values=".15;.4;.15" dur="2.4s" repeatCount="indefinite"/></circle>
   <circle cx={X(lo)} cy={Y(la)} r="5" fill={col}/><text x={X(lo)+(lo>12?-8:14)} y={Y(la)+4} textAnchor={lo>12?'end':'start'} fontSize="10" fill="var(--tx)">{c._id.split(' – ')[0]} · {(r*100).toFixed(0)}%</text></g>})}</svg>
  <small style={{color:'var(--mu)'}}>{t.heatNote}</small></div>}
