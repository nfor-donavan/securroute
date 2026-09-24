import React,{useEffect,useRef,useState} from 'react';
import {View,Text,TextInput,TouchableOpacity,Image,ScrollView,useColorScheme,StyleSheet,ActivityIndicator,Alert,Platform,StatusBar} from 'react-native';
import {CameraView,useCameraPermissions} from 'expo-camera';import AsyncStorage from '@react-native-async-storage/async-storage';import NetInfo from '@react-native-community/netinfo';
import TextRecognition from '@react-native-ml-kit/text-recognition';import {API,CHECKPOINTS} from './config';
const T={en:{scan:'Scan',hist:'History',go:'Verify',tag:'Verify • Inspect • Keep Roads Safe',bad:'Sign-in failed. Check your details or connection.',owner:'Owner',make:'Vehicle',ins:'Insurance',insp:'Inspection',seen:'Previous checks',qr:'Scan QR code',off:'Offline – using cache',on:'Online',pend:'pending sync',login:'Sign in',email:'Email',pw:'Password',
 s:{valid:'Valid',warning:'Warning',fraud:'Fraud'},f:{stolen:'Stolen vehicle',insurance_expired:'Insurance expired',inspection_expired:'Inspection expired',document_tampered:'Tampered document',possible_clone:'Possible cloned plate',not_registered:'Not registered'},ocr:'Or type the plate',cap:'Capture',mode:'Scan plate / document (OCR)',none:'No plate found. Retake the photo.'},
fr:{scan:'Scanner',hist:'Historique',go:'Vérifier',tag:'Vérifier • Inspecter • Sécuriser les routes',bad:'Échec de connexion. Vérifiez vos informations ou la connexion.',owner:'Propriétaire',make:'Véhicule',ins:'Assurance',insp:'Visite technique',seen:'Contrôles précédents',qr:'Scanner le QR code',off:'Hors ligne – cache utilisé',on:'En ligne',pend:'en attente de synchro',login:'Connexion',email:'E-mail',pw:'Mot de passe',
 s:{valid:'Valide',warning:'Alerte',fraud:'Fraude'},f:{stolen:'Véhicule volé',insurance_expired:'Assurance expirée',inspection_expired:'Visite technique expirée',document_tampered:'Document falsifié',possible_clone:'Plaque clonée possible',not_registered:'Non immatriculé'},ocr:'Ou saisir la plaque',cap:'Capturer',mode:'Scanner plaque / document (OCR)',none:'Aucune plaque trouvée. Reprenez la photo.'}};
const norm=p=>String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const dd=d=>d?new Date(d).toLocaleDateString():'—';
const COL={valid:'#16a34a',warning:'#f59e0b',fraud:'#dc2626'};
function localValidate(cache,plate){const v=cache.find(x=>x.plate===norm(plate));if(!v)return{flags:['not_registered'],score:100,status:'fraud'};
 const f=[],n=Date.now();if(v.stolen)f.push('stolen');if(new Date(v.insuranceExpiry)<n)f.push('insurance_expired');if(new Date(v.inspectionExpiry)<n)f.push('inspection_expired');
 const w={stolen:100,insurance_expired:30,inspection_expired:20},s=Math.min(100,f.reduce((a,x)=>a+w[x],0));return{flags:f,score:s,status:s>=60?'fraud':s>0?'warning':'valid',vehicle:v}}
export default function App(){
 const dark=useColorScheme()==='dark',[manual,setManual]=useState(null),[lang,setLang]=useState('fr');const isDark=manual??dark;
 const c=isDark?{bg:'#060d1f',card:'#0d1a38',tx:'#eaf0ff',mu:'#93a4c8',bd:'#1b2a52',pr:'#5b8cff'}:{bg:'#f3f6fb',card:'#fff',tx:'#0b1f4d',mu:'#5b6b8c',bd:'#e2e8f3',pr:'#0b2a6f'};
 const ref=useRef(null),lock=useRef(false),[err,setErr]=useState(''),[mode,setMode]=useState('qr'),[cp,setCp]=useState(CHECKPOINTS[0]),t=T[lang],[tab,setTab]=useState('scan'),[tok,setTok]=useState(null),[f,setF]=useState({email:'',password:''}),[plate,setPlate]=useState(''),[res,setRes]=useState(null),
 [cache,setCache]=useState([]),[queue,setQueue]=useState([]),[hist,setHist]=useState([]),[online,setOnline]=useState(true),[cam,setCam]=useState(false),[busy,setBusy]=useState(false),[perm,ask]=useCameraPermissions();
 const H=()=>({'Content-Type':'application/json',Authorization:'Bearer '+tok});
 useEffect(()=>{(async()=>{setCache(JSON.parse(await AsyncStorage.getItem('cache')||'[]'));setQueue(JSON.parse(await AsyncStorage.getItem('queue')||'[]'));setHist(JSON.parse(await AsyncStorage.getItem('hist')||'[]'));setTok(await AsyncStorage.getItem('tok'))})();
  return NetInfo.addEventListener(s=>setOnline(!!s.isConnected))},[]);
 useEffect(()=>{if(tok&&online){fetch(API+'/api/vehicles/cache',{headers:H()}).then(r=>r.json()).then(d=>{if(Array.isArray(d)){setCache(d);AsyncStorage.setItem('cache',JSON.stringify(d))}}).catch(()=>{});sync()}},[online,tok]);
 const save=(k,v,set)=>{set(v);AsyncStorage.setItem(k,JSON.stringify(v))};
 async function sync(q=queue){if(!q.length)return;try{const r=await fetch(API+'/api/verify/sync',{method:'POST',headers:H(),body:JSON.stringify({checks:q})});if(r.ok)save('queue',[],setQueue)}catch{}}
 async function login(){const r=await fetch(API+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}).catch(()=>null);const d=r&&await r.json();if(d?.token){await AsyncStorage.setItem('tok',d.token);setTok(d.token);setErr('')}else setErr(t.bad)}
 async function verify(p){if(!norm(p)||lock.current)return;lock.current=true;setBusy(true);const at=new Date().toISOString();let r;
  try{if(!online)throw 0;const x=await fetch(API+'/api/verify',{method:'POST',headers:H(),body:JSON.stringify({plate:p,checkpoint:cp,at})});r=await x.json();if(!x.ok)throw 0}
  catch{r=localValidate(cache,p);save('queue',[...queue,{id:Date.now(),plate:p,checkpoint:cp,at}],setQueue)}
  const e={plate:norm(p),status:r.status,flags:r.flags,at,vehicle:r.vehicle,seen:hist.filter(h=>h.plate===norm(p)).length};setRes(e);save('hist',[e,...hist].slice(0,50),setHist);setBusy(false);setCam(false);lock.current=false}
 async function ocr(){setBusy(true);try{const ph=await ref.current.takePictureAsync({quality:.7});const r=await TextRecognition.recognize(ph.uri);
  const m=r.text.toUpperCase().match(/[A-Z]{2}[\s-]?\d{3}[\s-]?[A-Z]{2}/);if(m){setPlate(m[0]);await verify(m[0])}else Alert.alert(t.none)}catch{Alert.alert(t.none)}setBusy(false)}
 const st=StyleSheet.create({card:{backgroundColor:c.card,borderColor:c.bd,borderWidth:1,borderRadius:18,padding:16,marginBottom:14},tx:{color:c.tx},btn:{backgroundColor:c.pr,padding:15,borderRadius:14,alignItems:'center'},in:{backgroundColor:c.bg,color:c.tx,borderColor:c.bd,borderWidth:1,borderRadius:12,padding:13,fontSize:16,marginBottom:10}});
 const Top=<View style={{flexDirection:'row',alignItems:'center',padding:14,paddingTop:Platform.OS==='ios'?54:14,backgroundColor:c.card,gap:10}}><StatusBar barStyle={isDark?'light-content':'dark-content'} backgroundColor={c.card} translucent={false}/><Image source={require('./assets/logo.png')} style={{width:36,height:36}} resizeMode="contain"/>
  <Text style={[st.tx,{fontWeight:'800',fontSize:18,flex:1}]}>SecurRoute</Text>
  <TouchableOpacity onPress={()=>setLang(lang==='en'?'fr':'en')}><Text style={{color:c.pr,fontWeight:'700'}}>{lang==='en'?'FR':'EN'}</Text></TouchableOpacity>
  <TouchableOpacity onPress={()=>setManual(!isDark)}><Text style={{fontSize:18}}>{isDark?'☀️':'🌙'}</Text></TouchableOpacity>{tok&&<TouchableOpacity onPress={async()=>{await AsyncStorage.removeItem('tok');setTok(null)}}><Text style={{fontSize:18}}>⏻</Text></TouchableOpacity>}</View>;
 if(!tok)return<ScrollView style={{flex:1,backgroundColor:c.bg}} keyboardShouldPersistTaps="handled"><StatusBar barStyle="light-content" backgroundColor="#0b2a6f" translucent={false}/>
  <View style={{backgroundColor:'#0b2a6f',paddingTop:Platform.OS==='ios'?60:26,paddingBottom:74,alignItems:'center',borderBottomLeftRadius:36,borderBottomRightRadius:36}}>
   <View style={{alignSelf:'flex-end',flexDirection:'row',gap:16,paddingRight:18,marginBottom:6}}><TouchableOpacity onPress={()=>setLang(lang==='en'?'fr':'en')}><Text style={{color:'#fff',fontWeight:'700'}}>{lang==='en'?'FR':'EN'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>setManual(!isDark)}><Text style={{fontSize:18}}>{isDark?'☀️':'🌙'}</Text></TouchableOpacity></View>
   <View style={{width:92,height:92,borderRadius:26,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'}}><Image source={require('./assets/logo.png')} style={{width:68,height:68}} resizeMode="contain"/></View>
   <Text style={{color:'#fff',fontSize:26,fontWeight:'800',marginTop:14}}>SecurRoute</Text><Text style={{color:'#ffab00',marginTop:4,fontWeight:'600',fontSize:13}}>{t.tag}</Text></View>
  <View style={[st.card,{marginHorizontal:20,marginTop:-44,padding:20,elevation:6}]}><Text style={[st.tx,{fontSize:20,fontWeight:'800',marginBottom:14}]}>{t.login}</Text>
   <TextInput style={st.in} placeholder={t.email} placeholderTextColor={c.mu} autoCapitalize="none" keyboardType="email-address" onChangeText={v=>setF({...f,email:v})}/>
   <TextInput style={st.in} placeholder={t.pw} placeholderTextColor={c.mu} secureTextEntry onChangeText={v=>setF({...f,password:v})}/>
   {!!err&&<Text style={{color:'#dc2626',marginBottom:10}}>{err}</Text>}
   <TouchableOpacity style={st.btn} onPress={login}><Text style={{color:'#fff',fontWeight:'700',fontSize:16}}>{t.login}</Text></TouchableOpacity></View></ScrollView>;
 return<View style={{flex:1,backgroundColor:c.bg}}>{Top}
  <View style={{padding:8,backgroundColor:online?'#16a34a':'#f59e0b'}}><Text style={{color:'#fff',textAlign:'center',fontWeight:'600'}}>{online?t.on:t.off}{queue.length?` · ${queue.length} ${t.pend}`:''}</Text></View>
  <ScrollView contentContainerStyle={{padding:16}}>
  {tab==='scan'&&<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14,flexGrow:0}}>{CHECKPOINTS.map(k=><TouchableOpacity key={k} onPress={()=>setCp(k)} style={{paddingVertical:8,paddingHorizontal:14,borderRadius:99,marginRight:8,backgroundColor:cp===k?c.pr:c.card,borderWidth:1,borderColor:c.bd}}><Text style={{color:cp===k?'#fff':c.tx,fontWeight:'600'}}>📍 {k}</Text></TouchableOpacity>)}</ScrollView>}
  {tab==='scan'?<>
   {cam?<View style={{height:320,borderRadius:18,overflow:'hidden',marginBottom:14}}><CameraView ref={ref} style={{flex:1}} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={mode==='qr'?({data})=>{setPlate(data);verify(data)}:undefined}/>
    {mode==='ocr'&&<TouchableOpacity style={[st.btn,{position:'absolute',bottom:12,left:12,right:12}]} onPress={ocr}>{busy?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontWeight:'700'}}>{t.cap}</Text>}</TouchableOpacity>}</View>
   :<View style={{flexDirection:'row',gap:10,marginBottom:14}}>{[['qr','📷 '+t.qr],['ocr','🔍 '+t.mode]].map(([m,l])=><TouchableOpacity key={m} style={[st.btn,{flex:1}]} onPress={async()=>{if(!perm?.granted)await ask();setRes(null);setPlate('');setMode(m);setCam(true)}}><Text style={{color:'#fff',fontWeight:'700',textAlign:'center'}}>{l}</Text></TouchableOpacity>)}</View>}
   <View style={st.card}><Text style={{color:c.mu,marginBottom:8}}>{t.ocr}</Text><TextInput style={st.in} placeholder="LT 123 AB" placeholderTextColor={c.mu} autoCapitalize="characters" value={plate} onChangeText={setPlate}/>
    <TouchableOpacity style={st.btn} onPress={()=>verify(plate)}>{busy?<ActivityIndicator color="#fff"/>:<Text style={{color:'#fff',fontWeight:'700'}}>{t.go}</Text>}</TouchableOpacity></View>
   {res&&<View style={[st.card,{borderColor:COL[res.status],borderWidth:2}]}><TouchableOpacity onPress={()=>setRes(null)} style={{position:'absolute',right:10,top:6,padding:8,zIndex:2}}><Text style={{color:c.mu,fontSize:18}}>✕</Text></TouchableOpacity><Text style={{fontSize:44,textAlign:'center'}}>{res.status==='valid'?'✅':res.status==='warning'?'⚠️':'⛔'}</Text>
    <Text style={{color:COL[res.status],fontSize:26,fontWeight:'800',textAlign:'center'}}>{t.s[res.status]}</Text><Text style={[st.tx,{textAlign:'center',fontSize:18,marginVertical:6}]}>{res.plate}</Text>
    {res.flags.map(x=><Text key={x} style={{color:c.mu,textAlign:'center'}}>• {t.f[x]}</Text>)}
    {res.vehicle&&<View style={{marginTop:10,borderTopWidth:1,borderTopColor:c.bd,paddingTop:10}}>{[[t.owner,res.vehicle.owner],[t.make,res.vehicle.make],[t.ins,dd(res.vehicle.insuranceExpiry)],[t.insp,dd(res.vehicle.inspectionExpiry)],[t.seen,String(res.seen)]].map(([k,v])=><View key={k} style={{flexDirection:'row',justifyContent:'space-between',marginVertical:2}}><Text style={{color:c.mu}}>{k}</Text><Text style={st.tx}>{v}</Text></View>)}</View>}</View>}
  </>:hist.map((h,i)=><View key={i} style={[st.card,{flexDirection:'row',justifyContent:'space-between'}]}><Text style={[st.tx,{fontWeight:'700'}]}>{h.plate}</Text><Text style={{color:COL[h.status],fontWeight:'700'}}>{t.s[h.status]}</Text></View>)}
  </ScrollView>
  <View style={{flexDirection:'row',backgroundColor:c.card,paddingBottom:24}}>{['scan','hist'].map(k=><TouchableOpacity key={k} style={{flex:1,padding:14,alignItems:'center'}} onPress={()=>{setTab(k);setRes(null)}}><Text style={{color:tab===k?c.pr:c.mu,fontWeight:'700'}}>{t[k]}</Text></TouchableOpacity>)}</View></View>}
