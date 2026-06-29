import { useState, useRef, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase.js";

/* ---- Sincronización ---- */
function getDeviceId(){
  let d=localStorage.getItem("bt_device");
  if(!d){d=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("bt_device",d);}
  return d;
}
function stableStr(v){
  if(Array.isArray(v)) return "["+v.map(stableStr).join(",")+"]";
  if(v&&typeof v==="object") return "{"+Object.keys(v).sort().map(k=>JSON.stringify(k)+":"+stableStr(v[k])).join(",")+"}";
  return JSON.stringify(v===undefined?null:v);
}

const P="#6C63D4",PL="#F0EFFE",PM="#AFA9EC",PD="#3C3489";
const ACCENT={
  bottle:{bg:"#FFF4E6",icon:"#E8890C",text:"#7A4600"},
  sleep:{bg:"#EEF4FF",icon:"#4A7FD4",text:"#1A3D7A"},
  poop:{bg:"#FFF8EC",icon:"#C4820A",text:"#6B4300"},
  pill:{bg:"#FFF0F5",icon:"#D4537E",text:"#72243E"},
  appt:{bg:"#FFFBEC",icon:"#BA7517",text:"#633806"},
};

const ESTADOS=[
  {id:"jugeton",label:"Juguetón",color:"#27A871",bg:"#EDFAF4",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-6.2 5.4a1 1 0 0 1 1.4-.2 3 3 0 0 0 3.6 0 1 1 0 1 1 1.2 1.6 5 5 0 0 1-6 0 1 1 0 0 1-.2-1.4Z"/></svg>},
  {id:"tranquilo",label:"Tranquilo",color:"#4A7FD4",bg:"#EEF4FF",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 8a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-5 6h4a1 1 0 1 1 0 2h-4a1 1 0 1 1 0-2Z"/></svg>},
  {id:"inquieto",label:"Inquieto",color:"#E8890C",bg:"#FFF4E6",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM9 10a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 10Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-6 7a1 1 0 0 1 .2-1.4 5 5 0 0 1 6 0 1 1 0 1 1-1.2 1.6 3 3 0 0 0-3.6 0A1 1 0 0 1 9 17Z"/></svg>},
  {id:"lloroso",label:"Lloroso",color:"#4A7FD4",bg:"#EEF4FF",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 7a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 9Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM9.2 16.6a1 1 0 0 1 1.4.2 2 2 0 0 0 2.8 0 1 1 0 1 1 1.4 1.4 4 4 0 0 1-5.6 0 1 1 0 0 1-.2-1.4Zm1.3 2.2a1 1 0 0 1 1 1v.5a1 1 0 1 1-2 0v-.5a1 1 0 0 1 1-1Z"/></svg>},
  {id:"somnoliento",label:"Somnoliento",color:"#7F77DD",bg:"#F0EFFE",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3.5 7.5A1.5 1.5 0 1 1 10 11H8a1 1 0 0 1-.5-1.5Zm7 0A1.5 1.5 0 1 1 17 11h-2a1 1 0 0 1-.5-1.5ZM9 15h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Z"/></svg>},
  {id:"dolorido",label:"Dolorido",color:"#D4537E",bg:"#FFF0F5",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM8.3 9.3l1.4-1.4L12 10.2l2.3-2.3 1.4 1.4L13.4 12l2.3 2.3-1.4 1.4L12 13.4l-2.3 2.3-1.4-1.4L10.6 12 8.3 9.3ZM9 17h6a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2Z"/></svg>},
  {id:"sorprendido",label:"Sorprendido",color:"#C4820A",bg:"#FFF8EC",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 7a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 9Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-3 5a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"/></svg>},
  {id:"hambriento",label:"Hambriento",color:"#E8890C",bg:"#FFF4E6",
    svg:(c)=><svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 7a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 9Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-3 4a5 5 0 0 1 4.33 2.5 1 1 0 1 1-1.73 1A3 3 0 0 0 9 18.5a1 1 0 1 1-1.73-1A5 5 0 0 1 12 13Z"/></svg>},
];

const TAGS_BANO=["Pujó mucho","Lloró","Estaba dormida","Con gases","Se veía incómoda","Normal","Sin esfuerzo","Después de comer","En la madrugada","Poca cantidad","Mucha cantidad"];
const TIPOS_BANO_DEFAULT=["Normal / pastosa","Líquida / acuosa","Dura / estreñimiento","Verde","Con moco","Con sangre"];
const COLORES_BANO_DEFAULT=["Amarillo mostaza","Café","Verde","Negro / meconial","Rojo / con sangre","Blanco / grisáceo"];

const PALETA=[
  {color:"#27A871",bg:"#EDFAF4"},{color:"#4A7FD4",bg:"#EEF4FF"},{color:"#E8890C",bg:"#FFF4E6"},
  {color:"#D4537E",bg:"#FFF0F5"},{color:"#7F77DD",bg:"#F0EFFE"},{color:"#C4820A",bg:"#FFF8EC"},
  {color:"#0E9AA7",bg:"#E8F8F9"},{color:"#5F5E5A",bg:"#F1EFE8"},
];
const EMOJIS_ESTADO=["😊","😴","😭","🤒","🥱","🤢","😡","🤗","🥰","😮","🍼","💨"];
function iconoEstado(e,color){
  if(!e) return null;
  if(e.emoji) return <span style={{fontSize:16,lineHeight:1}}>{e.emoji}</span>;
  return e.svg?e.svg(color):null;
}

const IcoHome = (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill={c}><path d="M10.55 2.533a2.25 2.25 0 0 1 2.9 0l6.75 5.695c.508.427.8 1.056.8 1.72V19.75A2.25 2.25 0 0 1 18.75 22H15.5a1.5 1.5 0 0 1-1.5-1.5v-4a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5v4A1.5 1.5 0 0 1 8 22H4.75A2.25 2.25 0 0 1 2.5 19.75V9.948c0-.664.292-1.293.8-1.72l6.25-5.695Z"/></svg>;
const IcoBottle = (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill={c}><path d="M9 2a1 1 0 0 0 0 2h1v1.051A7.001 7.001 0 0 0 5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a7.001 7.001 0 0 0-5-6.949V4h1a1 1 0 1 0 0-2H9Zm3 8a1 1 0 0 1 1 1v1h1a1 1 0 1 1 0 2h-1v1a1 1 0 1 1-2 0v-1h-1a1 1 0 1 1 0-2h1v-1a1 1 0 0 1 1-1Z"/></svg>;
const IcoMoon = (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill={c}><path d="M12.293 2.763a1 1 0 0 0-1.176 1.35A7 7 0 0 1 5.284 14.33a1 1 0 0 0-.514 1.787A10 10 0 1 0 12.293 2.763Z"/></svg>;
const IcoDrop = (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill={c}><path d="M12 2C9.243 2 7 4.243 7 7v2H5a2 2 0 0 0-2 2v2c0 3.45 2.418 6.337 5.65 7.053l-.553 1.106A1 1 0 0 0 9 22.75h6a1 1 0 0 0 .894-1.447l-.553-1.106C18.582 19.481 21 16.45 21 13v-2a2 2 0 0 0-2-2h-2V7c0-2.757-2.243-5-5-5Zm0 2c1.654 0 3 1.346 3 3v2H9V7c0-1.654 1.346-3 3-3Z"/></svg>;
const IcoHeart = (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill={c}><path d="M11.645 20.91a1 1 0 0 0 .71 0C12.97 20.63 21 15.836 21 9.5a6.5 6.5 0 0 0-9-6.027A6.5 6.5 0 0 0 3 9.5c0 6.336 8.03 11.13 8.645 11.41Z"/></svg>;
const IcoSettings = (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Zm7.43-2.47a7.17 7.17 0 0 0 .07-1 7.17 7.17 0 0 0-.07-1l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.37 7.37 0 0 0-1.72-1l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65a7.37 7.37 0 0 0-1.72 1l-2.49-1a.49.49 0 0 0-.61.22l-2 3.46a.48.48 0 0 0 .12.64l2.11 1.65a7.59 7.59 0 0 0-.07 1 7.59 7.59 0 0 0 .07 1l-2.11 1.65a.48.48 0 0 0-.12.64l2 3.46a.49.49 0 0 0 .61.22l2.49-1c.53.38 1.1.7 1.72 1l.38 2.65c.06.24.28.42.49.42h4c.24 0 .44-.18.49-.42l.38-2.65a7.37 7.37 0 0 0 1.72-1l2.49 1c.22.08.48 0 .61-.22l2-3.46a.48.48 0 0 0-.12-.64l-2.11-1.65Z"/></svg>;
const IcoStar = (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill={c}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></svg>;
const IcoBell = (c) => <svg width="16" height="16" viewBox="0 0 24 24" fill={c}><path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"/></svg>;
const IcoFrown = (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm-3 8a1.5 1.5 0 1 1 0 3A1.5 1.5 0 0 1 9 10Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm-6 5.6a1 1 0 0 1 .2-1.4 5 5 0 0 1 6 0 1 1 0 1 1-1.2 1.6 3 3 0 0 0-3.6 0 1 1 0 0 1-1.4-.2Z"/></svg>;
const IcoClock = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm1 5v5.586l3.707 3.707-1.414 1.414L11 13.414V7h2Z"/></svg>;
const IcoCalendar = (c) => <svg width="18" height="18" viewBox="0 0 24 24" fill={c}><path d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm-2 6a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H6Z"/></svg>;
const IcoMic = (c) => <svg width="20" height="20" viewBox="0 0 24 24" fill={c}><path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Zm-7 9a1 1 0 0 1 2 0 5 5 0 0 0 10 0 1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V19h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.08A7 7 0 0 1 5 10Z"/></svg>;

const TABS=[
  {id:"home",label:"Inicio",ico:IcoHome},
  {id:"tomas",label:"Tomas",ico:IcoBottle},
  {id:"sueno",label:"Sueño",ico:IcoMoon},
  {id:"bano",label:"Baño",ico:IcoDrop},
  {id:"salud",label:"Salud",ico:IcoHeart},
];

function nowStr(){const d=new Date();return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;}
function today(){return new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"});}
function todayStr(){return new Date().toLocaleDateString("es-MX");}
function ts(){return new Date().toISOString();}
function fmtDate(iso){try{return new Date(iso+"T12:00:00").toLocaleDateString("es-MX");}catch{return iso;}}

const ML_POR_OZ=29.5735;
const initPrefs={unidad:"ml",f24:true};
const PrefsCtx=createContext({prefs:initPrefs,setPrefs:()=>{}});
function usePrefs(){return useContext(PrefsCtx).prefs;}

function fmtHora(t,f24){
  if(!t||f24) return t;
  const[h,m]=String(t).split(":").map(Number);
  if(isNaN(h)||isNaN(m)) return t;
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"a.m.":"p.m."}`;
}
function mlToOz(ml){return Math.round((ml/ML_POR_OZ)*10)/10;}
function ozToMl(oz){return Math.round(oz*ML_POR_OZ);}
function fmtCant(ml,unidad){return unidad==="oz"?`${mlToOz(ml)} oz`:`${ml} ml`;}

/* ---- Duración entre dos horas HH:MM ---- */
function durMin(a,b){const p=t=>{const[h,m]=t.split(":").map(Number);return h*60+m};let d=p(b)-p(a);if(d<0)d+=1440;return d;}
function durStr(a,b){const d=durMin(a,b);return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m`;}

const initBaby={nombre:"Bebé",fechaNacimiento:"",formula:"Puramino",aplv:true};

function scheduleNotif(title,body,delayMs){
  if(!("Notification" in window)) return null;
  return setTimeout(()=>{
    if(Notification.permission==="granted") new Notification(title,{body});
  },delayMs);
}

/* ===================== APP ===================== */
export default function App(){
  const [tab,setTab]=useState("home");
  const [baby,setBaby]=useState(initBaby);
  const [tomas,setTomas]=useState([]);
  const [suenos,setSuenos]=useState([]);
  const [banos,setBanos]=useState([]);
  const [vacunas,setVacunas]=useState([]);
  const [citas,setCitas]=useState([]);
  const [meds,setMeds]=useState([]);
  const [mediciones,setMediciones]=useState([]);
  const [dormido,setDormido]=useState(null);
  const [cfg,setCfg]=useState(false);
  const [prefs,setPrefs]=useState(initPrefs);
  const [estadoActual,setEstadoActual]=useState(null);
  const [historialEstados,setHistorialEstados]=useState([]);
  const [estadosCustom,setEstadosCustom]=useState([]);
  const estados=[...ESTADOS,...estadosCustom];
  const notifTimers=useRef({});

  /* ---- Persistencia y sincronización ---- */
  const [famCode,setFamCode]=useState(()=>localStorage.getItem("bt_familia")||"");
  const deviceId=useRef(getDeviceId());
  const cargado=useRef(false);
  const lastJson=useRef("");
  const saveTimer=useRef(null);

  function snapshot(){
    return {baby,prefs,tomas,suenos,banos,vacunas,citas,meds,mediciones,dormido,estadoActual,historialEstados,estadosCustom};
  }
  function aplicar(d){
    if(!d||typeof d!=="object") return;
    if(d.baby) setBaby(d.baby);
    if(d.prefs) setPrefs(d.prefs);
    setTomas(d.tomas||[]); setSuenos(d.suenos||[]); setBanos(d.banos||[]);
    setVacunas(d.vacunas||[]); setCitas(d.citas||[]); setMeds(d.meds||[]);
    setMediciones(d.mediciones||[]); setDormido(d.dormido??null);
    setEstadoActual(d.estadoActual??null); setHistorialEstados(d.historialEstados||[]);
    setEstadosCustom(d.estadosCustom||[]);
  }

  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
    try{
      const local=localStorage.getItem("bt_datos");
      if(local){const d=JSON.parse(local);lastJson.current=stableStr(d);aplicar(d);}
    }catch{}
    cargado.current=true;
  },[]);

  useEffect(()=>{
    if(!supabase||!famCode) return;
    let canal;
    (async()=>{
      const {data,error}=await supabase.from("familias").select("data").eq("id",famCode).maybeSingle();
      if(!error){
        if(data?.data){lastJson.current=stableStr(data.data);aplicar(data.data);}
        else await supabase.from("familias").insert({id:famCode,data:snapshot(),device:deviceId.current});
      }
      canal=supabase.channel("fam-"+famCode)
        .on("postgres_changes",{event:"UPDATE",schema:"public",table:"familias",filter:`id=eq.${famCode}`},(p)=>{
          if(p.new?.device===deviceId.current) return;
          lastJson.current=stableStr(p.new.data);
          aplicar(p.new.data);
        })
        .subscribe();
    })();
    return ()=>{ if(canal) supabase.removeChannel(canal); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[famCode]);

  useEffect(()=>{
    if(!cargado.current) return;
    const d=snapshot();
    const json=stableStr(d);
    if(json===lastJson.current) return;
    lastJson.current=json;
    localStorage.setItem("bt_datos",JSON.stringify(d));
    if(supabase&&famCode){
      clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(()=>{
        supabase.from("familias")
          .upsert({id:famCode,data:d,device:deviceId.current,updated_at:new Date().toISOString()})
          .then(({error})=>{ if(error) console.error("Error al sincronizar:",error.message); });
      },1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[baby,prefs,tomas,suenos,banos,vacunas,citas,meds,mediciones,dormido,estadoActual,historialEstados,estadosCustom,famCode]);

  function guardarFamilia(code){
    const limpio=code.trim().toLowerCase().replace(/\s+/g,"-");
    setFamCode(limpio);
    if(limpio) localStorage.setItem("bt_familia",limpio);
    else localStorage.removeItem("bt_familia");
  }

  const hoy=todayStr();
  const tomasHoy=tomas.filter(t=>t.fecha===hoy);
  const totalMl=tomasHoy.reduce((a,b)=>a+(b.ml||0),0);
  const reflujos=tomasHoy.filter(t=>t.reflujo).length;
  const banosHoy=banos.filter(b=>b.fecha===hoy);

  function edad(){
    if(!baby.fechaNacimiento) return today();
    const d=Math.floor((new Date()-new Date(baby.fechaNacimiento))/86400000);
    if(d<30) return `${d} días de vida`;
    return `${Math.floor(d/30)} mes${Math.floor(d/30)!==1?"es":""} de vida`;
  }

  function cambiarEstado(nuevoId){
    const ahora=nowStr();
    if(estadoActual){
      setHistorialEstados(h=>[...h,{...estadoActual,hasta:ahora,fecha:todayStr(),ts:ts()}]);
    }
    if(estadoActual?.id===nuevoId){ setEstadoActual(null); return; }
    const e=estados.find(x=>x.id===nuevoId);
    setEstadoActual({id:nuevoId,label:e?.label,color:e?.color,bg:e?.bg,emoji:e?.emoji,desde:ahora,fecha:todayStr()});
  }

  function programarAlarma(med){
    if(notifTimers.current[med.ts]) clearTimeout(notifTimers.current[med.ts]);
    const ms=med.cadaHoras*3600000;
    notifTimers.current[med.ts]=scheduleNotif(`💊 ${med.nombre}`,`Hora de dar ${med.dosis} ${med.unidad}`,ms);
  }

  /* ---- Registro por voz ---- */
  function usarVoz(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR){ alert("Tu navegador no soporta comandos de voz. Usa Chrome en Android o Safari en iPhone."); return; }
    const rec=new SR();
    rec.lang="es-MX"; rec.interimResults=false; rec.maxAlternatives=3;
    rec.start();
    rec.onresult=(ev)=>{
      const texto=ev.results[0][0].transcript.toLowerCase();
      // Detectar cantidad en onzas u oz
      const ozMatch=texto.match(/(\d+(?:[.,]\d+)?)\s*(?:onza|onzas|oz)/);
      const mlMatch=texto.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|mililitro|mililitros)/);
      const dormidoMatch=/(se durmió|ya durmió|dormida|dormido|se quedó dormida|se quedó dormido)/.test(texto);
      const despertóMatch=/(despertó|ya despertó|se despertó|se levantó)/.test(texto);
      const bañoMatch=/(hizo del baño|hizo popó|hizo popo|pañal sucio|hizo caca)/.test(texto);
      const reflujoMatch=/(reflujo|vomitó|vomito|escupió)/.test(texto);

      let confirmacion="";

      if(ozMatch||mlMatch){
        let enMl;
        if(ozMatch){ const oz=parseFloat(ozMatch[1].replace(",","."));enMl=ozToMl(oz);confirmacion=`✓ Toma de ${oz} oz (${enMl} ml) registrada`; }
        else{ enMl=Math.round(parseFloat(mlMatch[1].replace(",",".")));confirmacion=`✓ Toma de ${enMl} ml registrada`; }
        const formula=baby.formula||"Fórmula";
        setTomas(prev=>[...prev,{ml:enMl,reflujo:reflujoMatch,formula,hora:nowStr(),fecha:todayStr(),destacado:false,ts:ts()}]);
        if(tab!=="tomas") setTab("tomas");
      } else if(dormidoMatch){
        setDormido(nowStr());
        confirmacion="✓ Sueño iniciado";
        if(tab!=="sueno") setTab("sueno");
      } else if(despertóMatch){
        if(dormido){
          setSuenos(prev=>[...prev,{inicio:dormido,fin:nowStr(),fecha:todayStr(),destacado:false,ts:ts()}]);
          setDormido(null);
          confirmacion="✓ Sueño finalizado";
        } else { confirmacion="No había sueño activo"; }
        if(tab!=="sueno") setTab("sueno");
      } else if(bañoMatch){
        setBanos(prev=>[...prev,{tipo:"normal",color:"amarillo",hora:nowStr(),tags:[],foto:null,fecha:todayStr(),destacado:false,ts:ts()}]);
        confirmacion="✓ Pañal registrado";
        if(tab!=="bano") setTab("bano");
      } else {
        confirmacion=`No entendí: "${texto}". Intenta "90 ml", "3 onzas", "se durmió" o "despertó"`;
      }
      alert(confirmacion);
    };
    rec.onerror=(e)=>{ if(e.error!=="no-speech") alert("No se pudo escuchar. Revisa el permiso de micrófono."); };
  }

  const sp={tomas,setTomas,suenos,setSuenos,banos,setBanos,vacunas,setVacunas,citas,setCitas,meds,setMeds,mediciones,setMediciones,dormido,setDormido,baby,programarAlarma,estados,estadosCustom,setEstadosCustom};

  return (
    <PrefsCtx.Provider value={{prefs,setPrefs}}>
    <div style={{fontFamily:"var(--font-sans)",maxWidth:420,margin:"0 auto",minHeight:"100dvh",display:"flex",flexDirection:"column",background:"var(--color-background-primary)"}}>

      {/* Header */}
      <div style={{background:`linear-gradient(135deg, ${P} 0%, #8B83E8 100%)`,padding:"16px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:"0 0 24px 24px",boxShadow:"0 4px 16px rgba(108,99,212,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.4)"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2Zm0 12c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z"/></svg>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:600,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
              {baby.nombre}
              {baby.aplv&&<span style={{fontSize:10,background:"rgba(255,255,255,0.25)",color:"#fff",borderRadius:20,padding:"2px 8px",fontWeight:500}}>APLV</span>}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>{edad()}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {/* Botón de voz */}
          <button onClick={usarVoz} title="Registrar por voz" style={{background:"rgba(255,255,255,0.2)",border:"2px solid rgba(255,255,255,0.5)",borderRadius:12,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {IcoMic("#fff")}
          </button>
          <button onClick={()=>setCfg(!cfg)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:12,width:38,height:38,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {IcoSettings("#fff")}
          </button>
        </div>
      </div>

      {cfg&&<ConfigPanel baby={baby} setBaby={setBaby} prefs={prefs} setPrefs={setPrefs} famCode={famCode} guardarFamilia={guardarFamilia} onClose={()=>setCfg(false)}/>}

      <div style={{flex:1,padding:"14px 14px 8px",overflowY:"auto"}}>
        {tab==="home"  && <HomeTab {...sp} tomasHoy={tomasHoy} totalMl={totalMl} estadoActual={estadoActual} cambiarEstado={cambiarEstado} setTab={setTab} suenos={suenos}/>}
        {tab==="tomas" && <TomasTab {...sp}/>}
        {tab==="sueno" && <SuenoTab {...sp}/>}
        {tab==="bano"  && <BanoTab {...sp}/>}
        {tab==="salud" && <SaludTab {...sp} estadoActual={estadoActual} historialEstados={historialEstados} cambiarEstado={cambiarEstado}/>}
      </div>

      {/* Nav */}
      <nav style={{display:"flex",borderTop:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",padding:"6px 0 env(safe-area-inset-bottom, 4px)"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
              <div style={{width:38,height:38,borderRadius:12,background:active?PL:"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}>
                {t.ico(active?P:"#B0ACDC")}
              </div>
              <span style={{fontSize:10,color:active?P:"var(--color-text-tertiary)",fontWeight:active?600:400}}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </PrefsCtx.Provider>
  );
}

/* ---- ConfigPanel ---- */
function ConfigPanel({baby,setBaby,prefs,setPrefs,famCode,guardarFamilia,onClose}){
  const [f,setF]=useState(baby);
  const [p,setP]=useState(prefs);
  const [code,setCode]=useState(famCode);
  function Seg({options,value,onChange}){
    return (
      <div style={{display:"inline-flex",background:"#fff",border:`0.5px solid ${PM}`,borderRadius:10,padding:3,gap:2}}>
        {options.map(([val,label])=>(
          <button key={String(val)} onClick={()=>onChange(val)} style={{border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",fontWeight:value===val?500:400,background:value===val?P:"transparent",color:value===val?"#fff":PD}}>
            {label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{background:PL,padding:"14px 16px",borderBottom:`0.5px solid ${PM}`}}>
      <div style={{fontWeight:600,marginBottom:10,color:PD,fontSize:15}}>Perfil del bebé</div>
      <Lbl>Nombre</Lbl><input value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} style={inp}/>
      <Lbl>Fecha de nacimiento</Lbl><input type="date" value={f.fechaNacimiento} onChange={e=>setF({...f,fechaNacimiento:e.target.value})} style={inp}/>
      <Lbl>Fórmula actual</Lbl><input value={f.formula} onChange={e=>setF({...f,formula:e.target.value})} style={inp}/>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--color-text-secondary)",marginTop:10}}>
        <input type="checkbox" checked={f.aplv} onChange={e=>setF({...f,aplv:e.target.checked})}/> Diagnóstico APLV
      </label>
      <div style={{fontWeight:600,margin:"16px 0 4px",color:PD,fontSize:15,borderTop:`0.5px solid ${PM}`,paddingTop:14}}>Preferencias</div>
      <Lbl>Unidad de las tomas</Lbl>
      <Seg options={[["ml","ml"],["oz","onzas (oz)"]]} value={p.unidad} onChange={v=>setP({...p,unidad:v})}/>
      <Lbl>Formato de hora</Lbl>
      <Seg options={[[false,"12 h (a.m. / p.m.)"],[true,"24 hrs"]]} value={p.f24} onChange={v=>setP({...p,f24:v})}/>
      <div style={{fontWeight:600,margin:"16px 0 4px",color:PD,fontSize:15,borderTop:`0.5px solid ${PM}`,paddingTop:14}}>Sincronización familiar</div>
      {supabase?(
        <>
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,lineHeight:1.5}}>
            Escriban el mismo código en los dos teléfonos para compartir el historial.
          </div>
          <Lbl>Código de familia</Lbl>
          <input value={code} onChange={e=>setCode(e.target.value)} style={inp} placeholder="su-codigo-secreto"/>
          {famCode&&<div style={{fontSize:12,color:"#27A871",marginTop:4}}>✓ Sincronizando: <strong>{famCode}</strong></div>}
        </>
      ):(
        <div style={{fontSize:12,color:"var(--color-text-tertiary)",lineHeight:1.5}}>Modo solo este dispositivo (sin Supabase configurado).</div>
      )}
      <div style={{display:"flex",gap:8,marginTop:14}}>
        <Btn onClick={()=>{setBaby(f);setPrefs(p);if(supabase)guardarFamilia(code);onClose();}}>Guardar</Btn>
        <BtnOut onClick={onClose}>Cancelar</BtnOut>
      </div>
    </div>
  );
}

/* ---- HomeTab ---- */
function HomeTab({tomasHoy,totalMl,dormido,citas,meds,mediciones,estadoActual,cambiarEstado,setTab,estados,suenos}){
  const {unidad,f24}=usePrefs();
  const [diaFiltro,setDiaFiltro]=useState(todayStr());
  const proxCitas=[...citas].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).filter(c=>new Date(c.fecha)>=new Date()).slice(0,3);
  const medsActivos=meds.filter(m=>m.activo);
  const estadoObj=estados.find(e=>e.id===estadoActual?.id)||(estadoActual?{label:estadoActual.label||"Estado",color:estadoActual.color||"#888",bg:estadoActual.bg||"#F1EFE8",emoji:estadoActual.emoji}:null);

  // Horas dormidas del día filtrado
  const suenosDia=suenos.filter(s=>s.fecha===diaFiltro);
  const minDormidos=suenosDia.reduce((a,s)=>a+durMin(s.inicio,s.fin),0);
  const horasDormidas=minDormidos>0?`${Math.floor(minDormidos/60)}h ${minDormidos%60}m`:"—";

  // Último peso y talla registrados
  const ultimaMed=[...mediciones].reverse()[0];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:13,color:"var(--color-text-tertiary)",textTransform:"capitalize",flex:1}}>{today()}</div>
        <input type="date" value={diaFiltro} onChange={e=>setDiaFiltro(e.target.value)} style={{...inp,width:138,fontSize:12,padding:"4px 8px"}}/>
      </div>

      {/* Tarjeta info del bebé */}
      <div style={{background:PL,borderRadius:16,padding:"13px 14px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:600,color:PD,textTransform:"uppercase",letterSpacing:"0.3px",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
          {IcoClock(PD)} Información del bebé
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"#fff",borderRadius:10,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>Peso actual</div>
            <div style={{fontSize:18,fontWeight:700,color:PD}}>{ultimaMed?.peso?`${ultimaMed.peso} kg`:"—"}</div>
            {ultimaMed?.peso&&<div style={{fontSize:10,color:PM}}>{ultimaMed.fecha}</div>}
          </div>
          <div style={{background:"#fff",borderRadius:10,padding:"8px 10px"}}>
            <div style={{fontSize:10,color:"var(--color-text-tertiary)",marginBottom:2}}>Talla actual</div>
            <div style={{fontSize:18,fontWeight:700,color:PD}}>{ultimaMed?.talla?`${ultimaMed.talla} cm`:"—"}</div>
            {ultimaMed?.talla&&<div style={{fontSize:10,color:PM}}>{ultimaMed.fecha}</div>}
          </div>
        </div>
      </div>

      {/* Solo 2 tarjetas: Tomas y Sueño */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <SCard accent={ACCENT.bottle} ico={IcoBottle} label="Tomas hoy" value={tomasHoy.length} sub={fmtCant(totalMl,unidad)} onClick={()=>setTab("tomas")}/>
        <SCard accent={ACCENT.sleep}  ico={IcoMoon}   label="Horas dormidas" value={horasDormidas} sub={dormido?`desde ${fmtHora(dormido,f24)}`:"hoy"} onClick={()=>setTab("sueno")}/>
      </div>

      {/* Próximas citas ordenadas */}
      {proxCitas.length>0&&(
        <div style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-primary)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
            {IcoCalendar("var(--color-text-primary)")} Próximas citas
          </div>
          {proxCitas.map((c,i)=>(
            <div key={i} style={{background:ACCENT.appt.bg,borderRadius:14,padding:"10px 12px",marginBottom:8,display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:34,height:34,background:"rgba(255,255,255,0.7)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {IcoCalendar(ACCENT.appt.icon)}
              </div>
              <div>
                <div style={{fontWeight:500,fontSize:13,color:ACCENT.appt.text}}>{c.doctor}</div>
                <div style={{fontSize:11,color:ACCENT.appt.icon}}>{c.fecha}{c.hora&&` · ${fmtHora(c.hora,f24)}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado del bebé */}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:600,color:"var(--color-text-secondary)",marginBottom:8}}>Estado del bebé ahora</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:estadoObj?8:0}}>
          {estados.map(e=>{
            const active=estadoActual?.id===e.id;
            return (
              <button key={e.id} onClick={()=>cambiarEstado(e.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,border:"none",background:active?e.color:e.bg,color:active?"#fff":e.color,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>
                {iconoEstado(e,active?"#fff":e.color)}{e.label}
              </button>
            );
          })}
        </div>
        {estadoObj&&(
          <div style={{background:estadoObj.bg,borderRadius:12,padding:"8px 12px",fontSize:13,color:estadoObj.color,display:"flex",alignItems:"center",gap:8,fontWeight:500}}>
            {iconoEstado(estadoObj,estadoObj.color)}
            Bebé está <strong style={{margin:"0 3px"}}>{estadoObj.label.toLowerCase()}</strong> desde las {fmtHora(estadoActual.desde,f24)}
          </div>
        )}
      </div>

      {medsActivos.length>0&&(
        <InfoBanner accent={ACCENT.pill} icon={IcoBell(ACCENT.pill.icon)} title="Medicamentos activos" sub={`${medsActivos.length} con alarma`}>
          {medsActivos.map((m,i)=><div key={i} style={{fontSize:13,color:ACCENT.pill.text,marginTop:2}}>{m.nombre} — {m.dosis} {m.unidad} c/{m.cadaHoras}h{m.ultimaDosis&&<span style={{opacity:0.6}}> · última: {fmtHora(m.ultimaDosis,f24)}</span>}</div>)}
        </InfoBanner>
      )}
    </div>
  );
}

function SCard({accent,ico,label,value,sub,onClick}){
  return (
    <button onClick={onClick} style={{background:accent.bg,borderRadius:18,padding:"13px 14px",border:"none",cursor:"pointer",textAlign:"left",width:"100%",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{width:34,height:34,borderRadius:10,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
        {ico(accent.icon)}
      </div>
      <div style={{fontSize:11,color:accent.text,opacity:0.75,marginBottom:2,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.3px"}}>{label}</div>
      <div style={{fontSize:22,fontWeight:700,color:accent.text,lineHeight:1.1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:accent.text,opacity:0.6,marginTop:3}}>{sub}</div>}
    </button>
  );
}

/* ---- useFilters — ordena de más reciente a más antiguo dentro del filtro ---- */
function useFilters(items,getDate){
  const [dateFilter,setDateFilter]=useState("");
  const [soloDestacados,setSoloDestacados]=useState(false);
  let filtered=[...items].reverse(); // más reciente primero
  if(dateFilter) filtered=filtered.filter(i=>getDate(i)===fmtDate(dateFilter));
  if(soloDestacados) filtered=filtered.filter(i=>i.destacado);
  return{filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados};
}

function FilterBar({dateFilter,setDateFilter,soloDestacados,setSoloDestacados,total,filtered,resumen}){
  return (
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{...inp,width:145,fontSize:12,padding:"5px 8px"}}/>
        {dateFilter&&<button onClick={()=>setDateFilter("")} style={{fontSize:12,background:"none",border:`1px solid ${P}`,borderRadius:8,padding:"4px 8px",color:P,cursor:"pointer"}}>Limpiar</button>}
        <button onClick={()=>setSoloDestacados(!soloDestacados)} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",background:soloDestacados?"#FFF8E1":"#f5f5f5",color:soloDestacados?"#B8860B":"#888"}}>
          {IcoStar(soloDestacados?"#F59E0B":"#aaa")} Destacados
        </button>
      </div>
      {/* Resumen del día filtrado */}
      {dateFilter&&resumen&&(
        <div style={{marginTop:6,background:PL,borderRadius:10,padding:"6px 12px",fontSize:12,color:PD,fontWeight:500}}>
          {resumen}
        </div>
      )}
      {(dateFilter||soloDestacados)&&<span style={{fontSize:11,color:"var(--color-text-tertiary)",display:"block",marginTop:4}}>{filtered} de {total} registros</span>}
    </div>
  );
}

function StarBtn({destacado,onToggle}){
  return <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>{IcoStar(destacado?"#F59E0B":"#ccc")}</button>;
}

/* ---- TomasTab ---- */
function TomasTab({tomas,setTomas,baby}){
  const {unidad,f24}=usePrefs();
  const [cant,setCant]=useState(unidad==="oz"?"3":"90");
  const [reflujo,setReflujo]=useState(false);
  const [formula,setFormula]=useState(baby.formula);
  const [hora,setHora]=useState(nowStr());
  const hoy=todayStr();
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(tomas,t=>t.fecha);
  useEffect(()=>{
    setCant(c=>{
      const n=parseFloat(c);
      if(isNaN(n)) return c;
      return unidad==="oz"?String(mlToOz(n)):String(ozToMl(n));
    });
  },[unidad]);

  // Resumen del día: total y número de tomas
  const tomasDia=tomas.filter(t=>t.fecha===(dateFilter?fmtDate(dateFilter):hoy));
  const totalDia=tomasDia.reduce((a,b)=>a+(b.ml||0),0);
  const resumen=`${tomasDia.length} toma${tomasDia.length!==1?"s":""} · Total: ${fmtCant(totalDia,unidad)}`;

  function add(){
    if(!cant) return;
    const n=parseFloat(cant);
    if(isNaN(n)) return;
    const enMl=unidad==="oz"?ozToMl(n):Math.round(n);
    setTomas([...tomas,{ml:enMl,reflujo,formula,hora,fecha:hoy,destacado:false,ts:ts()}]);
    setReflujo(false);setHora(nowStr());
  }
  function toggle(t){setTomas(tomas.map(x=>x.ts===t.ts?{...x,destacado:!x.destacado}:x));}
  return (
    <div>
      <SecTitle>{IcoBottle(ACCENT.bottle.icon)} Registrar toma</SecTitle>
      <Lbl>Fórmula</Lbl><input value={formula} onChange={e=>setFormula(e.target.value)} style={inp}/>
      <Lbl>Cantidad ({unidad==="oz"?"oz":"ml"})</Lbl><input type="number" step={unidad==="oz"?"0.5":"5"} value={cant} onChange={e=>setCant(e.target.value)} style={{...inp,width:110}}/>
      <Lbl>Hora</Lbl><input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={{...inp,width:130}}/>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--color-text-secondary)",marginTop:10}}>
        <input type="checkbox" checked={reflujo} onChange={e=>setReflujo(e.target.checked)}/> Hubo reflujo
      </label>
      <Btn onClick={add} style={{marginTop:12}}>+ Registrar toma</Btn>
      <div style={{marginTop:20}}>
        <SecTitle>{IcoBottle(P)} Historial</SecTitle>
        <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={tomas.length} filtered={filtered.length} resumen={resumen}/>
        {filtered.length===0?<Empty/>:filtered.map((t,i)=>(
          <Row key={i}>
            <div style={{flex:1}}><div style={{fontWeight:500,fontSize:14}}>{fmtHora(t.hora,f24)} — {fmtCant(t.ml,unidad)}</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{t.formula} · {t.fecha}</div></div>
            <div style={{display:"flex",gap:4,alignItems:"center"}}>
              {t.reflujo&&<Chip color="coral">Reflujo</Chip>}
              <StarBtn destacado={t.destacado} onToggle={()=>toggle(t)}/>
              <Del onClick={()=>setTomas(tomas.filter(x=>x.ts!==t.ts))}/>
            </div>
          </Row>
        ))}
      </div>
    </div>
  );
}

/* ---- SuenoTab ---- */
function SuenoTab({suenos,setSuenos,dormido,setDormido}){
  const {f24}=usePrefs();
  const hoy=todayStr();
  const [horaManual,setHoraManual]=useState(nowStr());
  const [finManual,setFinManual]=useState(nowStr());
  const [modoManual,setModoManual]=useState(false);
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(suenos,s=>s.fecha);

  // Resumen: total dormido en el día filtrado
  const diaRef=dateFilter?fmtDate(dateFilter):hoy;
  const suenosDia=suenos.filter(s=>s.fecha===diaRef);
  const minTot=suenosDia.reduce((a,s)=>a+durMin(s.inicio,s.fin),0);
  const resumen=minTot>0?`Total dormido: ${Math.floor(minTot/60)}h ${minTot%60}m`:"Sin sueño registrado";

  function toggle(s){setSuenos(suenos.map(x=>x.ts===s.ts?{...x,destacado:!x.destacado}:x));}
  function agregarManual(){
    setSuenos([...suenos,{inicio:horaManual,fin:finManual,fecha:hoy,destacado:false,ts:ts()}]);
    setModoManual(false);
  }
  return (
    <div>
      <SecTitle>{IcoMoon(ACCENT.sleep.icon)} Registro de sueño</SecTitle>
      <div style={{display:"flex",gap:10,marginBottom:10}}>
        <button onClick={()=>setDormido(nowStr())} disabled={!!dormido} style={dormido?btnDis:btnPrim}>Se durmió</button>
        <button onClick={()=>{if(!dormido)return;setSuenos([...suenos,{inicio:dormido,fin:nowStr(),fecha:hoy,destacado:false,ts:ts()}]);setDormido(null);}} disabled={!dormido} style={!dormido?btnDis:btnOut}>Despertó</button>
      </div>
      {dormido&&<div style={{marginBottom:10}}><Chip color="blue">Dormido desde {fmtHora(dormido,f24)}</Chip></div>}

      {/* Registro manual */}
      <button onClick={()=>setModoManual(!modoManual)} style={{fontSize:12,background:"none",border:`1px solid ${PM}`,borderRadius:8,padding:"5px 12px",color:PD,cursor:"pointer",marginBottom:modoManual?10:14}}>
        {modoManual?"Cancelar":"+ Registrar manualmente"}
      </button>
      {modoManual&&(
        <div style={{background:PL,borderRadius:12,padding:"10px 12px",marginBottom:14}}>
          <div style={{display:"flex",gap:10}}>
            <div style={{flex:1}}><Lbl>Inicio</Lbl><input type="time" value={horaManual} onChange={e=>setHoraManual(e.target.value)} style={inp}/></div>
            <div style={{flex:1}}><Lbl>Fin</Lbl><input type="time" value={finManual} onChange={e=>setFinManual(e.target.value)} style={inp}/></div>
          </div>
          <Btn onClick={agregarManual} style={{marginTop:10,fontSize:13}}>Guardar</Btn>
        </div>
      )}

      <SecTitle>{IcoMoon(P)} Historial</SecTitle>
      <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={suenos.length} filtered={filtered.length} resumen={resumen}/>
      {filtered.length===0?<Empty/>:filtered.map((s,i)=>(
        <Row key={i}>
          <div><div style={{fontSize:14,fontWeight:500}}>{fmtHora(s.inicio,f24)} → {fmtHora(s.fin,f24)}</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{s.fecha}</div></div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <span style={{color:P,fontWeight:600,fontSize:13}}>{durStr(s.inicio,s.fin)}</span>
            <StarBtn destacado={s.destacado} onToggle={()=>toggle(s)}/>
            <Del onClick={()=>setSuenos(suenos.filter(x=>x.ts!==s.ts))}/>
          </div>
        </Row>
      ))}
    </div>
  );
}

/* ---- BanoTab ---- */
function BanoTab({banos,setBanos}){
  const {f24}=usePrefs();
  const [tipo,setTipo]=useState("Normal / pastosa");
  const [color,setColor]=useState("Amarillo mostaza");
  const [hora,setHora]=useState(nowStr());
  const [tags,setTags]=useState([]);
  const [foto,setFoto]=useState(null);
  const [tiposExtra,setTiposExtra]=useState([]);
  const [coloresExtra,setColoresExtra]=useState([]);
  const [nuevoTipo,setNuevoTipo]=useState("");
  const [nuevoColor,setNuevoColor]=useState("");
  const ref=useRef();
  const hoy=todayStr();
  const tipoEmoji={"Normal / pastosa":"💩","Líquida / acuosa":"💧","Dura / estreñimiento":"🪨","Verde":"🟢","Con moco":"🔴","Con sangre":"🩸"};
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(banos,b=>b.fecha);

  // Resumen
  const diaRef=dateFilter?fmtDate(dateFilter):hoy;
  const banosDia=banos.filter(b=>b.fecha===diaRef);
  const resumen=`${banosDia.length} pañal${banosDia.length!==1?"es":""} en el día`;

  const todosTipos=[...TIPOS_BANO_DEFAULT,...tiposExtra];
  const todosColores=[...COLORES_BANO_DEFAULT,...coloresExtra];

  function toggle(b){setBanos(banos.map(x=>x.ts===b.ts?{...x,destacado:!x.destacado}:x));}
  function toggleTag(t){setTags(tags.includes(t)?tags.filter(x=>x!==t):[...tags,t]);}
  function handleFoto(e){
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const max=800;let w=img.width,h=img.height;
        if(w>max||h>max){const s=max/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}
        const cv=document.createElement("canvas");cv.width=w;cv.height=h;
        cv.getContext("2d").drawImage(img,0,0,w,h);
        setFoto(cv.toDataURL("image/jpeg",0.7));
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f);
  }
  function add(){
    setBanos([...banos,{tipo,color,hora,tags:[...tags],foto,fecha:hoy,destacado:false,ts:ts()}]);
    setTags([]);setFoto(null);setHora(nowStr());if(ref.current)ref.current.value="";
  }
  return (
    <div>
      <SecTitle>{IcoDrop(ACCENT.poop.icon)} Registrar deposición</SecTitle>
      <Lbl>Tipo</Lbl>
      <select value={tipo} onChange={e=>setTipo(e.target.value)} style={inp}>
        {todosTipos.map(t=><option key={t} value={t}>{t}</option>)}
      </select>
      {/* Agregar tipo personalizado */}
      <div style={{display:"flex",gap:6,marginTop:4,marginBottom:2}}>
        <input value={nuevoTipo} onChange={e=>setNuevoTipo(e.target.value)} style={{...inp,flex:1,padding:"5px 8px",fontSize:12}} placeholder="+ Otro tipo…"/>
        <button onClick={()=>{if(nuevoTipo.trim()){setTiposExtra([...tiposExtra,nuevoTipo.trim()]);setNuevoTipo("");}}} style={{background:P,color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12}}>+</button>
      </div>

      <Lbl>Color</Lbl>
      <select value={color} onChange={e=>setColor(e.target.value)} style={inp}>
        {todosColores.map(c=><option key={c} value={c}>{c}</option>)}
      </select>
      <div style={{display:"flex",gap:6,marginTop:4,marginBottom:2}}>
        <input value={nuevoColor} onChange={e=>setNuevoColor(e.target.value)} style={{...inp,flex:1,padding:"5px 8px",fontSize:12}} placeholder="+ Otro color…"/>
        <button onClick={()=>{if(nuevoColor.trim()){setColoresExtra([...coloresExtra,nuevoColor.trim()]);setNuevoColor("");}}} style={{background:P,color:"#fff",border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",fontSize:12}}>+</button>
      </div>

      <Lbl>Hora</Lbl><input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={{...inp,width:130}}/>
      <Lbl>Estado del bebé</Lbl>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {TAGS_BANO.map(t=>(
          <button key={t} onClick={()=>toggleTag(t)} style={{padding:"5px 11px",borderRadius:20,fontSize:12,cursor:"pointer",border:"none",background:tags.includes(t)?P:PL,color:tags.includes(t)?"#fff":PD,fontWeight:tags.includes(t)?500:400}}>{t}</button>
        ))}
      </div>
      <Lbl>Foto (opcional)</Lbl>
      <input ref={ref} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{fontSize:13,marginBottom:8,color:"var(--color-text-secondary)"}}/>
      {foto&&<img src={foto} alt="" style={{width:72,height:72,objectFit:"cover",borderRadius:10,marginBottom:8}}/>}
      <Btn onClick={add}>+ Registrar</Btn>
      <div style={{marginTop:20}}>
        <SecTitle>{IcoDrop(P)} Historial</SecTitle>
        <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={banos.length} filtered={filtered.length} resumen={resumen}/>
        {filtered.length===0?<Empty/>:filtered.map((b,i)=>(
          <div key={i} style={{display:"flex",gap:8,padding:"10px 0",borderBottom:"0.5px solid var(--color-border-tertiary)",alignItems:"flex-start"}}>
            <div style={{fontSize:22,marginTop:2}}>{tipoEmoji[b.tipo]||"💩"}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:14}}>{fmtHora(b.hora,f24)} — {b.tipo}</div>
              <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginBottom:4}}>{b.color} · {b.fecha}</div>
              {b.tags&&b.tags.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{b.tags.map((t,j)=><Chip key={j} color="purple">{t}</Chip>)}</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              {b.foto&&<img src={b.foto} alt="" style={{width:44,height:44,objectFit:"cover",borderRadius:8}}/>}
              <div style={{display:"flex",gap:2}}>
                <StarBtn destacado={b.destacado} onToggle={()=>toggle(b)}/>
                <Del onClick={()=>setBanos(banos.filter(x=>x.ts!==b.ts))}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---- SaludTab — sin sección de Estados ---- */
function SaludTab({vacunas,setVacunas,citas,setCitas,meds,setMeds,mediciones,setMediciones,programarAlarma}){
  const [sec,setSec]=useState(null);
  const SECCIONES=[
    {id:"meds",   label:"Medicamentos", sub:"activos",   bg:ACCENT.pill.bg,   color:ACCENT.pill.text,   icon:(c)=><svg width="26" height="26" viewBox="0 0 24 24" fill={c}><path d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"/></svg>},
    {id:"growth", label:"Crecimiento",  sub:"peso y talla", bg:ACCENT.sleep.bg, color:ACCENT.sleep.text, icon:(c)=><svg width="26" height="26" viewBox="0 0 24 24" fill={c}><path d="M3 3a1 1 0 0 0 0 2h1v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5h1a1 1 0 1 0 0-2H3Zm3 2h10v13H6V5Zm2 3a1 1 0 0 0 0 2h2a1 1 0 1 0 0-2H8Zm0 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H8Z"/></svg>},
    {id:"vaccines",label:"Vacunas",     sub:"historial",  bg:"#EAF3DE",        color:"#27500A",          icon:(c)=><svg width="26" height="26" viewBox="0 0 24 24" fill={c}><path d="M11 3a1 1 0 1 1 2 0v1h2a1 1 0 1 1 0 2h-.586l2.293 2.293a1 1 0 0 1-1.414 1.414L13 7.414V9a1 1 0 1 1-2 0V7.414L8.707 9.707a1 1 0 0 1-1.414-1.414L9.586 6H9a1 1 0 0 1 0-2h2V3Zm-6 9a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm5 1a1 1 0 1 0-2 0v5a1 1 0 1 0 2 0v-5Zm3-1a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1Z"/></svg>},
    {id:"appts",  label:"Citas",        sub:"próximas",   bg:ACCENT.appt.bg,   color:ACCENT.appt.text,   icon:(c)=><svg width="26" height="26" viewBox="0 0 24 24" fill={c}><path d="M8 2a1 1 0 0 1 1 1v1h6V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm-2 6a1 1 0 0 0 0 2h12a1 1 0 1 0 0-2H6Z"/></svg>},
  ];
  if(!sec) return (
    <div>
      <SecTitle>{IcoHeart(ACCENT.pill.icon)} Salud</SecTitle>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {SECCIONES.map(s=>(
          <button key={s.id} onClick={()=>setSec(s.id)} style={{background:s.bg,borderRadius:18,padding:"18px 14px",border:"none",cursor:"pointer",textAlign:"left",width:"100%",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column",gap:8}}>
            <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.65)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {s.icon(s.color)}
            </div>
            <div style={{fontSize:14,fontWeight:600,color:s.color}}>{s.label}</div>
            <div style={{fontSize:11,color:s.color,opacity:0.7}}>{s.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div>
      <button onClick={()=>setSec(null)} style={{background:"none",border:"none",color:P,fontSize:13,cursor:"pointer",marginBottom:12,padding:0,display:"flex",alignItems:"center",gap:4}}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={P}><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
        Volver a Salud
      </button>
      {sec==="meds"     && <MedsPanel meds={meds} setMeds={setMeds} programarAlarma={programarAlarma}/>}
      {sec==="growth"   && <GrowthPanel mediciones={mediciones} setMediciones={setMediciones}/>}
      {sec==="vaccines" && <VaxPanel vacunas={vacunas} setVacunas={setVacunas}/>}
      {sec==="appts"    && <ApptsPanel citas={citas} setCitas={setCitas}/>}
    </div>
  );
}

/* ---- MedsPanel ---- */
function MedsPanel({meds,setMeds,programarAlarma}){
  const {f24}=usePrefs();
  const [nombre,setNombre]=useState("");
  const [dosis,setDosis]=useState("");
  const [unidad,setUnidad]=useState("ml");
  const [cada,setCada]=useState("8");
  const [nota,setNota]=useState("");
  function add(){
    if(!nombre||!dosis) return;
    const m={nombre,dosis,unidad,cadaHoras:parseFloat(cada),nota,activo:true,ultimaDosis:null,ts:ts()};
    setMeds(prev=>[...prev,m]);
    setNombre("");setDosis("");setNota("");
  }
  function registrarDosis(med){
    const hora=nowStr();
    const updated={...med,ultimaDosis:hora};
    setMeds(meds.map(x=>x.ts===med.ts?updated:x));
    programarAlarma(updated);
  }
  function toggleActivo(med){setMeds(meds.map(x=>x.ts===med.ts?{...x,activo:!x.activo}:x));}
  return (
    <div>
      <SecTitle>{IcoBell(ACCENT.pill.icon)} Agregar medicamento</SecTitle>
      <Lbl>Nombre</Lbl><input value={nombre} onChange={e=>setNombre(e.target.value)} style={inp} placeholder="Nexium, Eritromicina…"/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Lbl>Dosis</Lbl><input type="number" value={dosis} onChange={e=>setDosis(e.target.value)} style={inp}/></div>
        <div><Lbl>Unidad</Lbl>
          <select value={unidad} onChange={e=>setUnidad(e.target.value)} style={{...inp,width:90}}>
            <option value="ml">ml</option><option value="mg">mg</option><option value="gotas">gotas</option><option value="sobre">sobre</option><option value="tableta">tableta</option>
          </select>
        </div>
        <div><Lbl>Cada (h)</Lbl><input type="number" value={cada} onChange={e=>setCada(e.target.value)} style={{...inp,width:68}}/></div>
      </div>
      <Lbl>Notas</Lbl><input value={nota} onChange={e=>setNota(e.target.value)} style={inp} placeholder="antes del biberón…"/>
      <Btn onClick={add} style={{marginTop:10}}>+ Agregar</Btn>
      <div style={{marginTop:18}}>
        {meds.length===0?<Empty/>:[...meds].reverse().map((m,i)=>(
          <div key={i} style={{padding:"12px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,fontSize:14,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  {m.nombre}<Chip color={m.activo?"green":"gray"}>{m.activo?"Activo":"Pausado"}</Chip>
                </div>
                <div style={{fontSize:12,color:"var(--color-text-tertiary)",marginTop:2}}>{m.dosis} {m.unidad} · cada {m.cadaHoras}h</div>
                {m.nota&&<div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{m.nota}</div>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>toggleActivo(m)} style={{background:"transparent",color:P,border:`1px solid ${P}`,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:12}}>{m.activo?"Pausar":"Activar"}</button>
                <Del onClick={()=>setMeds(meds.filter(x=>x.ts!==m.ts))}/>
              </div>
            </div>
            <div style={{marginTop:8,display:"flex",alignItems:"center",gap:10,background:ACCENT.pill.bg,borderRadius:10,padding:"8px 10px"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:ACCENT.pill.text,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
                  {IcoBell(ACCENT.pill.icon)} Última dosis
                </div>
                <div style={{fontSize:13,color:ACCENT.pill.text}}>{m.ultimaDosis?fmtHora(m.ultimaDosis,f24):"—"}</div>
                {m.ultimaDosis&&<div style={{fontSize:11,color:ACCENT.pill.icon,marginTop:2}}>Próxima en {m.cadaHoras}h · alarma activa</div>}
              </div>
              <button onClick={()=>registrarDosis(m)} style={{background:ACCENT.pill.icon,color:"#fff",border:"none",borderRadius:9,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:500,whiteSpace:"nowrap"}}>
                ✓ Di la dosis
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{marginTop:12,background:"#FFF8E1",borderRadius:10,padding:"9px 12px",fontSize:12,color:"#7A5500"}}>
        <strong>Nota:</strong> Las alarmas funcionan mientras el navegador esté abierto.
      </div>
    </div>
  );
}

function GrowthPanel({mediciones,setMediciones}){
  const [peso,setPeso]=useState("");
  const [talla,setTalla]=useState("");
  const [fecha,setFecha]=useState(new Date().toISOString().split("T")[0]);
  function add(){if(!peso&&!talla)return;setMediciones([...mediciones,{peso,talla,fecha:fmtDate(fecha),ts:ts()}]);setPeso("");setTalla("");}
  return (
    <div>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Lbl>Peso (kg)</Lbl><input type="number" step="0.01" value={peso} onChange={e=>setPeso(e.target.value)} style={inp} placeholder="4.85"/></div>
        <div style={{flex:1}}><Lbl>Talla (cm)</Lbl><input type="number" step="0.5" value={talla} onChange={e=>setTalla(e.target.value)} style={inp} placeholder="55.0"/></div>
      </div>
      <Lbl>Fecha</Lbl><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{...inp,width:150}}/>
      <Btn onClick={add} style={{marginTop:10}}>+ Registrar</Btn>
      <div style={{marginTop:16}}>
        {mediciones.length===0?<Empty/>:[...mediciones].reverse().map((m,i)=>(
          <Row key={i}>
            <div><div style={{fontWeight:500,fontSize:14}}>{m.fecha}</div><div style={{fontSize:13,color:"var(--color-text-tertiary)"}}>{m.peso&&`${m.peso} kg`}{m.peso&&m.talla&&"  "}{m.talla&&`${m.talla} cm`}</div></div>
            <Del onClick={()=>setMediciones(mediciones.filter(x=>x.ts!==m.ts))}/>
          </Row>
        ))}
      </div>
    </div>
  );
}

function VaxPanel({vacunas,setVacunas}){
  const [nombre,setNombre]=useState("");
  const [fecha,setFecha]=useState(new Date().toISOString().split("T")[0]);
  function add(){if(!nombre)return;setVacunas([...vacunas,{nombre,fecha:fmtDate(fecha),ts:ts()}]);setNombre("");}
  return (
    <div>
      <Lbl>Vacuna</Lbl><input value={nombre} onChange={e=>setNombre(e.target.value)} style={inp} placeholder="Hexavalente, BCG…"/>
      <Lbl>Fecha</Lbl><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={{...inp,width:150}}/>
      <Btn onClick={add} style={{marginTop:10}}>+ Registrar</Btn>
      <div style={{marginTop:16}}>
        {vacunas.length===0?<Empty/>:[...vacunas].reverse().map((v,i)=>(
          <Row key={i}>
            <span style={{fontSize:14}}>💉 {v.nombre}</span>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{v.fecha}</span><Del onClick={()=>setVacunas(vacunas.filter(x=>x.ts!==v.ts))}/></div>
          </Row>
        ))}
      </div>
    </div>
  );
}

function ApptsPanel({citas,setCitas}){
  const {f24}=usePrefs();
  const [doc,setDoc]=useState("");
  const [fecha,setFecha]=useState("");
  const [hora,setHora]=useState("");
  const [nota,setNota]=useState("");
  function add(){if(!doc||!fecha)return;setCitas([...citas,{doctor:doc,fecha:fmtDate(fecha),hora,nota,ts:ts()}]);setDoc("");setFecha("");setHora("");setNota("");}
  return (
    <div>
      <Lbl>Doctor / especialista</Lbl><input value={doc} onChange={e=>setDoc(e.target.value)} style={inp} placeholder="Dra. García, Gastroenterología"/>
      <div style={{display:"flex",gap:8}}>
        <div style={{flex:1}}><Lbl>Fecha</Lbl><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={inp}/></div>
        <div><Lbl>Hora</Lbl><input type="time" value={hora} onChange={e=>setHora(e.target.value)} style={{...inp,width:110}}/></div>
      </div>
      <Lbl>Notas</Lbl><textarea value={nota} onChange={e=>setNota(e.target.value)} style={{...inp,height:54,resize:"none"}}/>
      <Btn onClick={add} style={{marginTop:8}}>+ Agendar</Btn>
      <div style={{marginTop:16}}>
        {citas.length===0?<Empty/>:[...citas].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).map((c,i)=>(
          <Row key={i} align="flex-start">
            <div><div style={{fontWeight:500,fontSize:14}}>{c.doctor}</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{c.fecha}{c.hora&&` · ${fmtHora(c.hora,f24)}`}</div>{c.nota&&<div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{c.nota}</div>}</div>
            <Del onClick={()=>setCitas(citas.filter(x=>x.ts!==c.ts))}/>
          </Row>
        ))}
      </div>
    </div>
  );
}

/* ---- Componentes compartidos ---- */
function InfoBanner({accent,icon,title,sub,children}){
  return (
    <div style={{background:accent.bg,borderRadius:14,padding:"10px 14px",marginBottom:10,display:"flex",gap:10,alignItems:"flex-start"}}>
      <div style={{marginTop:2,flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:500,fontSize:14,color:accent.text}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:accent.text,opacity:0.7}}>{sub}</div>}
        {children&&<div style={{marginTop:4}}>{children}</div>}
      </div>
    </div>
  );
}
function SecTitle({children,style}){
  return <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:600,color:"var(--color-text-primary)",fontSize:14,margin:"0 0 10px",...style}}>{children}</div>;
}
function Chip({color,children}){
  const map={coral:["#FAECE7","#993C1D"],purple:[PL,PD],green:["#EAF3DE","#3B6D11"],blue:["#E6F1FB","#0C447C"],gray:["#F1EFE8","#5F5E5A"]};
  const [bg,tx]=map[color]||map.gray;
  return <span style={{background:bg,color:tx,fontSize:11,padding:"3px 9px",borderRadius:20,fontWeight:500,whiteSpace:"nowrap",display:"inline-block"}}>{children}</span>;
}
function Row({children,align="center"}){return <div style={{display:"flex",justifyContent:"space-between",alignItems:align,padding:"9px 0",borderBottom:"0.5px solid var(--color-border-tertiary)",gap:8}}>{children}</div>;}
function Empty(){return <div style={{fontSize:13,color:"var(--color-text-tertiary)",padding:"8px 0"}}>Sin registros aún</div>;}
function Del({onClick}){return <button onClick={onClick} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",display:"flex",alignItems:"center",padding:"4px"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>;}
function Lbl({children}){return <label style={{display:"block",fontSize:12,color:"var(--color-text-secondary)",marginBottom:3,marginTop:10}}>{children}</label>;}
function Btn({onClick,children,style}){return <button onClick={onClick} style={{background:P,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:14,fontWeight:500,display:"inline-flex",alignItems:"center",gap:6,...style}}>{children}</button>;}
function BtnOut({onClick,children}){return <button onClick={onClick} style={{background:"transparent",color:P,border:`1px solid ${P}`,borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:14}}>{children}</button>;}
const btnPrim={background:P,color:"#fff",border:"none",borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:14,fontWeight:500};
const btnOut={background:"transparent",color:P,border:`1px solid ${P}`,borderRadius:10,padding:"9px 16px",cursor:"pointer",fontSize:14};
const btnDis={background:"var(--color-background-secondary)",color:"var(--color-text-tertiary)",border:"none",borderRadius:10,padding:"9px 16px",cursor:"not-allowed",fontSize:14};
const inp={display:"block",width:"100%",padding:"8px 11px",borderRadius:10,border:"0.5px solid var(--color-border-secondary)",fontSize:14,boxSizing:"border-box",background:"var(--color-background-primary)",color:"var(--color-text-primary)",outline:"none"};
