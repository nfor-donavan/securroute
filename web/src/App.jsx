import React,{useEffect,useState} from 'react';import {T} from './i18n.js';import {Checks,Agents,Registry,MapPage,Heat,Report} from './Pages.jsx';
const API=import.meta.env.VITE_API_URL;
const Count=({v})=>{const[n,setN]=useState(0);useEffect(()=>{let s=0,id=setInterval(()=>{s+=Math.ceil(v/40)||1;if(s>=v){s=v;clearInterval(id)}setN(s)},20);return()=>clearInterval(id)},[v]);return n.toLocaleString()};
export default function App(){
 const[lang,setLang]=useState(localStorage.lang||'en'),[dark,setDark]=useState(localStorage.dark?localStorage.dark==='1':matchMedia('(prefers-color-scheme:dark)').matches);
 const[tok,setTok]=useState(localStorage.tok||''),[stats,setStats]=useState(null),[checks,setChecks]=useState([]),[err,setErr]=useState(''),[f,setF]=useState({email:'',password:''});
 const t=T[lang],[page,setPage]=useState(0),[feed,setFeed]=useState([]),[alert,setAlert]=useState(null);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.dark=dark?1:0},[dark]);
 useEffect(()=>{localStorage.lang=lang},[lang]);
 useEffect(()=>{if(!tok)return;const es=new EventSource(API+'/api/live?token='+tok);
  es.onmessage=e=>{const c=JSON.parse(e.data);setFeed(f=>[c,...f].slice(0,8));setChecks(x=>[c,...x].slice(0,100));
   if(c.status==='fraud'){setAlert(c);setTimeout(()=>setAlert(a=>a===c?null:a),9000)}
   fetch(API+'/api/stats',{headers:{Authorization:'Bearer '+tok}}).then(r=>r.json()).then(setStats).catch(()=>{})};return()=>es.close()},[tok]);
 useEffect(()=>{if(tok){const h={Authorization:'Bearer '+tok};
  fetch(API+'/api/stats',{headers:h}).then(r=>r.json()).then(setStats).catch(()=>{});fetch(API+'/api/checks',{headers:h}).then(r=>r.json()).then(setChecks).catch(()=>{})}},[tok]);
 const login=async e=>{e.preventDefault();setErr('');try{const r=await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)});
  const d=await r.json();if(!r.ok)throw Error(d.error);localStorage.tok=d.token;setTok(d.token)}catch(x){setErr(x.message||'Error')}};
 const out=()=>{localStorage.tok='';setTok('');setStats(null)};
 const Bar=<div className="top"><img src="/logo.png" className="mark" alt=""/><b>SecurRoute</b><span className="sp"/>
  <button className="pill" onClick={()=>setLang(lang==='en'?'fr':'en')}>{lang==='en'?'FR':'EN'}</button>
  <button className="pill" aria-label="theme" onClick={()=>setDark(!dark)}>{dark?'☀️':'🌙'}</button>
  {tok&&<button className="pill" onClick={out}>{t.out}</button>}</div>;
 if(!tok)return<div className="auth"><aside className="brand"><div className="bc"><div className="logobox"><img src="/logo.png" alt="SecurRoute"/></div><div><h1>SecurRoute</h1><p className="tg">{t.tag}</p></div>
  <ul>{t.pts.map(x=><li key={x}>✓ {x}</li>)}</ul></div><small>© 2026 SecurRoute</small></aside>
  <section className="fw"><div className="ctl"><button className="pill" onClick={()=>setLang(lang==='en'?'fr':'en')}>{lang==='en'?'FR':'EN'}</button><button className="pill" aria-label="theme" onClick={()=>setDark(!dark)}>{dark?'☀️':'🌙'}</button></div>
  <form onSubmit={login} className="fcard"><h2>{t.welcome}</h2><p className="sub2">{t.signsub}</p>
  <label>{t.email}<input type="email" autoComplete="username" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/></label>
  <label>{t.pw}<input type="password" autoComplete="current-password" value={f.password} onChange={e=>setF({...f,password:e.target.value})}/></label>
  {err&&<p className="err">{err}</p>}<button className="btn">{t.login}</button></form></section></div>;
 if(!stats)return<div>{Bar}</div>;
 const g=k=>stats.byStatus.find(x=>x._id===k)?.n||0,mx=Math.max(...stats.daily.map(d=>d.n)),fm=Math.max(1,...stats.flags.map(x=>x.n));
 const kp=[[t.total,stats.total,''],[t.valid,g('valid'),'ok'],[t.warn,g('warning'),'wa'],[t.fraud,g('fraud'),'fr']];
 const C=2*Math.PI*42,rate=stats.total?g('fraud')/stats.total:0;
 return<div>{Bar}<nav className="tabs">{t.nav.map((n,i)=><button key={n} className={page===i?'on':''} onClick={()=>setPage(i)}>{n}</button>)}</nav>{alert&&<div className="alert" role="alert" onClick={()=>setAlert(null)}>🚨 {t.f[alert.flags?.[0]]||t.s.fraud} · <b>{alert.plate}</b> · {alert.checkpoint}</div>}
  {page===1?<main><Checks t={t} checks={checks}/></main>:page===2?<main><Registry t={t} tok={tok}/></main>:page===3?<main><Heat t={t} cps={stats.cps}/><MapPage t={t} cps={stats.cps}/></main>:page===4?<main><Report t={t} stats={stats}/></main>:page===5?<main><Agents t={t} tok={tok}/></main>:<main>
  <section className="hero"><div><span className="live"><i/>{t.live}</span><h1>{t.hero}</h1><p>{t.sub}</p></div>
   <svg viewBox="0 0 100 100" className="ring"><circle cx="50" cy="50" r="42" className="rb"/><circle cx="50" cy="50" r="42" className="rf" strokeDasharray={`${C*rate} ${C}`} transform="rotate(-90 50 50)"/>
    <text x="50" y="52" textAnchor="middle" className="rt">{(rate*100).toFixed(1)}%</text><text x="50" y="66" textAnchor="middle" className="rs">{t.rate}</text></svg></section>
  <div className="kpis">{kp.map(([l,v,c])=><div key={l} className={'card kpi '+c}><small>{l}</small><b><Count v={v}/></b></div>)}</div>
  <div className="card"><h3><span className="ld"/>{t.liveFeed}</h3>{feed.length?feed.map(c=><div className="feed" key={c._id}><span className={'tag '+c.status}>{t.s[c.status]}</span><b>{c.plate}</b><span>{c.checkpoint}</span><em>{new Date(c.at).toLocaleTimeString()}</em></div>):<p style={{color:'var(--mu)',margin:0}}>{t.wait}</p>}</div>
  <div className="grid"><div className="card"><h3>{t.week}</h3><div className="bars">{stats.daily.map((d,i)=><div key={i} className="col" title={d.n}>
    <div className="b" style={{height:d.n/mx*100+'%'}}><div className="bf" style={{height:Math.min(100,d.fraud/d.n*400)+'%'}}/></div></div>)}</div></div>
   <div className="card"><h3>{t.flags}</h3>{stats.flags.map(x=><div key={x._id} className="row"><span>{t.f[x._id]||x._id}</span><div className="tr"><div style={{width:x.n/fm*100+'%'}}/></div><em>{x.n}</em></div>)}</div>
   <div className="card"><h3>{t.cps}</h3>{stats.cps.map(x=><div key={x._id} className="row"><span>{x._id}</span><em>{x.n.toLocaleString()}</em></div>)}</div></div>
  <div className="card"><h3>{t.checks}</h3><div className="scroll"><table><thead><tr><th>{t.plate}</th><th>{t.status}</th><th>{t.score}</th><th>{t.agent}</th><th>{t.time}</th></tr></thead>
   <tbody>{checks.map(c=><tr key={c._id}><td><b>{c.plate}</b></td><td><span className={'tag '+c.status}>{t.s[c.status]}</span></td><td>{c.score}</td><td>{c.agentName||c.agent?.name}</td><td>{new Date(c.at).toLocaleTimeString()}</td></tr>)}</tbody></table></div></div>
  </main>}</div>}
