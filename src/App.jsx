import { useState, useRef, useEffect, createContext, useContext } from "react";
import { supabase } from "./supabase.js";

/* ---- Sincronización ---- */
// Identificador de este teléfono, para ignorar los cambios que él mismo envió
function getDeviceId(){
  let d=localStorage.getItem("bt_device");
  if(!d){d=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem("bt_device",d);}
  return d;
}
// JSON con llaves ordenadas: permite comparar datos sin importar el orden en que regresen de la base
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

/* ---- Estados personalizados ---- */
const PALETA=[
  {color:"#27A871",bg:"#EDFAF4"},{color:"#4A7FD4",bg:"#EEF4FF"},{color:"#E8890C",bg:"#FFF4E6"},
  {color:"#D4537E",bg:"#FFF0F5"},{color:"#7F77DD",bg:"#F0EFFE"},{color:"#C4820A",bg:"#FFF8EC"},
  {color:"#0E9AA7",bg:"#E8F8F9"},{color:"#5F5E5A",bg:"#F1EFE8"},
];
const EMOJIS_ESTADO=["😊","😴","😭","🤒","🥱","🤢","😡","🤗","🥰","😮","🍼","💨"];
// Los estados integrados usan SVG; los personalizados usan emoji.
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

/* ---- Preferencias (unidades y formato de hora) ---- */
const ML_POR_OZ=29.5735;
const initPrefs={unidad:"ml",f24:true}; // unidad: "ml" | "oz" · f24: true = 24 hrs, false = a.m./p.m.
const PrefsCtx=createContext({prefs:initPrefs,setPrefs:()=>{}});
function usePrefs(){return useContext(PrefsCtx).prefs;}

// Las horas siempre se guardan en formato 24h "HH:MM"; esto solo cambia cómo se MUESTRAN.
function fmtHora(t,f24){
  if(!t||f24) return t;
  const[h,m]=String(t).split(":").map(Number);
  if(isNaN(h)||isNaN(m)) return t;
  return `${h%12||12}:${String(m).padStart(2,"0")} ${h<12?"a.m.":"p.m."}`;
}
// Las cantidades siempre se guardan en ml; esto solo cambia cómo se MUESTRAN.
function mlToOz(ml){return Math.round((ml/ML_POR_OZ)*10)/10;}
function ozToMl(oz){return Math.round(oz*ML_POR_OZ);}
function fmtCant(ml,unidad){return unidad==="oz"?`${mlToOz(ml)} oz`:`${ml} ml`;}

const initBaby={nombre:"Bebé",fechaNacimiento:"",formula:"Puramino",aplv:true};

function scheduleNotif(title,body,delayMs){
  if(!("Notification" in window)) return null;
  return setTimeout(()=>{
    if(Notification.permission==="granted") new Notification(title,{body});
  },delayMs);
}

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
  const cargado=useRef(false);     // no guardar antes de terminar la carga inicial
  const lastJson=useRef("");       // último estado guardado/recibido, para no reenviar lo mismo
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

  // 1) Al abrir, cargar lo guardado en este teléfono
  useEffect(()=>{
    try{
      const local=localStorage.getItem("bt_datos");
      if(local){const d=JSON.parse(local);lastJson.current=stableStr(d);aplicar(d);}
    }catch{/* datos corruptos: empezar limpio */}
    cargado.current=true;
  },[]);

  // 2) Si hay Supabase y código de familia: traer datos compartidos y escuchar cambios en vivo
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
          if(p.new?.device===deviceId.current) return; // cambio enviado por este mismo teléfono
          lastJson.current=stableStr(p.new.data);
          aplicar(p.new.data);
        })
        .subscribe();
    })();
    return ()=>{ if(canal) supabase.removeChannel(canal); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[famCode]);

  // 3) Cada cambio se guarda en el teléfono al instante y en la nube tras una pausa breve
  useEffect(()=>{
    if(!cargado.current) return;
    const d=snapshot();
    const json=stableStr(d);
    if(json===lastJson.current) return; // nada nuevo que guardar
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

  useEffect(()=>{
    if("Notification" in window && Notification.permission==="default") Notification.requestPermission();
  },[]);

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
    // Se guarda una copia de label/color/emoji para que el historial siga viéndose bien aunque el estado se elimine después
    setEstadoActual({id:nuevoId,label:e?.label,color:e?.color,bg:e?.bg,emoji:e?.emoji,desde:ahora,fecha:todayStr()});
  }

  function programarAlarma(med){
    if(notifTimers.current[med.ts]) clearTimeout(notifTimers.current[med.ts]);
    const ms=med.cadaHoras*3600000;
    notifTimers.current[med.ts]=scheduleNotif(`💊 ${med.nombre}`,`Hora de dar ${med.dosis} ${med.unidad}`,ms);
  }

  const sp={tomas,setTomas,suenos,setSuenos,banos,setBanos,vacunas,setVacunas,citas,setCitas,meds,setMeds,mediciones,setMediciones,dormido,setDormido,baby,programarAlarma,estados,estadosCustom,setEstadosCustom};

  return (
    <PrefsCtx.Provider value={{prefs,setPrefs}}>
    <div style={{fontFamily:"var(--font-sans)",maxWidth:420,margin:"0 auto",minHeight:620,display:"flex",flexDirection:"column",background:"var(--color-background-primary)"}}>
      {/* Header */}
      <div style={{background:P,padding:"16px 16px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:"0 0 20px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2Zm0 12c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z"/></svg>
          </div>
          <div>
            <div style={{fontSize:17,fontWeight:500,color:"#fff",display:"flex",alignItems:"center",gap:8}}>
              {baby.nombre}
              {baby.aplv&&<span style={{fontSize:10,background:"rgba(255,255,255,0.25)",color:"#fff",borderRadius:20,padding:"2px 8px",fontWeight:500}}>APLV</span>}
            </div>
            <div style={{fontSize:12,color:"rgba(255,255,255,0.8)"}}>{edad()}</div>
          </div>
        </div>
        <button onClick={()=>setCfg(!cfg)} style={{background:"rgba(255,255,255,0.15)",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {IcoSettings("#fff")}
        </button>
      </div>

      {cfg&&<ConfigPanel baby={baby} setBaby={setBaby} prefs={prefs} setPrefs={setPrefs} famCode={famCode} guardarFamilia={guardarFamilia} onClose={()=>setCfg(false)}/>}

      <div style={{flex:1,padding:"14px 14px 8px",overflowY:"auto"}}>
        {tab==="home"  && <HomeTab {...sp} tomasHoy={tomasHoy} totalMl={totalMl} reflujos={reflujos} banosHoy={banosHoy} estadoActual={estadoActual} cambiarEstado={cambiarEstado} setTab={setTab}/>}
        {tab==="tomas" && <TomasTab {...sp}/>}
        {tab==="sueno" && <SuenoTab {...sp}/>}
        {tab==="bano"  && <BanoTab {...sp}/>}
        {tab==="salud" && <SaludTab {...sp} estadoActual={estadoActual} historialEstados={historialEstados} cambiarEstado={cambiarEstado}/>}
      </div>

      <nav style={{display:"flex",borderTop:"0.5px solid var(--color-border-tertiary)",background:"var(--color-background-primary)",padding:"6px 0 4px"}}>
        {TABS.map(t=>{
          const active=tab===t.id;
          return (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
              <div style={{width:36,height:36,borderRadius:10,background:active?PL:"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>
                {t.ico(active?P:"#B0ACDC")}
              </div>
              <span style={{fontSize:10,color:active?P:"var(--color-text-tertiary)",fontWeight:active?500:400}}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
    </PrefsCtx.Provider>
  );
}

function ConfigPanel({baby,setBaby,prefs,setPrefs,famCode,guardarFamilia,onClose}){
  const [f,setF]=useState(baby);
  const [p,setP]=useState(prefs);
  const [code,setCode]=useState(famCode);
  function Seg({options,value,onChange}){
    return (
      <div style={{display:"inline-flex",background:"#fff",border:`0.5px solid ${PM}`,borderRadius:10,padding:3,gap:2}}>
        {options.map(([val,label])=>(
          <button key={val} onClick={()=>onChange(val)} style={{border:"none",borderRadius:8,padding:"6px 14px",fontSize:13,cursor:"pointer",fontWeight:value===val?500:400,background:value===val?P:"transparent",color:value===val?"#fff":PD}}>
            {label}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div style={{background:PL,padding:"14px 16px",borderBottom:`0.5px solid ${PM}`}}>
      <div style={{fontWeight:500,marginBottom:10,color:PD,fontSize:15}}>Perfil del bebé</div>
      <Lbl>Nombre</Lbl><input value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} style={inp}/>
      <Lbl>Fecha de nacimiento</Lbl><input type="date" value={f.fechaNacimiento} onChange={e=>setF({...f,fechaNacimiento:e.target.value})} style={inp}/>
      <Lbl>Fórmula actual</Lbl><input value={f.formula} onChange={e=>setF({...f,formula:e.target.value})} style={inp}/>
      <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"var(--color-text-secondary)",marginTop:10}}>
        <input type="checkbox" checked={f.aplv} onChange={e=>setF({...f,aplv:e.target.checked})}/> Diagnóstico APLV
      </label>

      <div style={{fontWeight:500,margin:"16px 0 4px",color:PD,fontSize:15,borderTop:`0.5px solid ${PM}`,paddingTop:14}}>Preferencias</div>
      <Lbl>Unidad de las tomas</Lbl>
      <Seg options={[["ml","ml"],["oz","onzas (oz)"]]} value={p.unidad} onChange={v=>setP({...p,unidad:v})}/>
      <Lbl>Formato de hora</Lbl>
      <Seg options={[[false,"12 h (a.m. / p.m.)"],[true,"24 hrs"]]} value={p.f24} onChange={v=>setP({...p,f24:v})}/>

      <div style={{fontWeight:500,margin:"16px 0 4px",color:PD,fontSize:15,borderTop:`0.5px solid ${PM}`,paddingTop:14}}>Sincronización familiar</div>
      {supabase?(
        <>
          <div style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:4,lineHeight:1.5}}>
            Escriban el mismo código en los dos teléfonos para compartir el historial. Inventa uno largo y difícil de adivinar (ej. <em>luna-roja-besos-042</em>).
          </div>
          <Lbl>Código de familia</Lbl>
          <input value={code} onChange={e=>setCode(e.target.value)} style={inp} placeholder="su-codigo-secreto"/>
          {famCode&&<div style={{fontSize:12,color:"#27A871",marginTop:4}}>✓ Sincronizando con el código: <strong>{famCode}</strong></div>}
        </>
      ):(
        <div style={{fontSize:12,color:"var(--color-text-tertiary)",lineHeight:1.5}}>
          Modo solo este dispositivo. Los datos se guardan en este teléfono; para compartir entre los dos, falta conectar Supabase (paso 5 de la guía).
        </div>
      )}

      <div style={{display:"flex",gap:8,marginTop:14}}>
        <Btn onClick={()=>{setBaby(f);setPrefs(p);if(supabase)guardarFamilia(code);onClose();}}>Guardar</Btn>
        <BtnOut onClick={onClose}>Cancelar</BtnOut>
      </div>
    </div>
  );
}

function HomeTab({tomasHoy,totalMl,reflujos,banosHoy,dormido,citas,meds,estadoActual,cambiarEstado,setTab,estados}){
  const {unidad,f24}=usePrefs();
  const proxCita=[...citas].sort((a,b)=>new Date(a.fecha)-new Date(b.fecha)).find(c=>new Date(c.fecha)>=new Date());
  const medsActivos=meds.filter(m=>m.activo);
  const estadoObj=estados.find(e=>e.id===estadoActual?.id)||(estadoActual?{label:estadoActual.label||"Estado",color:estadoActual.color||"#888",bg:estadoActual.bg||"#F1EFE8",emoji:estadoActual.emoji}:null);
  return (
    <div>
      <div style={{fontSize:13,color:"var(--color-text-tertiary)",marginBottom:10,textTransform:"capitalize"}}>{today()}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        <SCard accent={ACCENT.bottle} ico={IcoBottle} label="Tomas hoy" value={tomasHoy.length} sub={fmtCant(totalMl,unidad)} onClick={()=>setTab("tomas")}/>
        <SCard accent={ACCENT.pill}   ico={IcoFrown}  label="Reflujos"  value={reflujos}         sub="hoy"           onClick={()=>setTab("tomas")}/>
        <SCard accent={ACCENT.poop}   ico={IcoDrop}   label="Pañales"   value={banosHoy.length}  sub="hoy"           onClick={()=>setTab("bano")}/>
        <SCard accent={dormido?ACCENT.sleep:{bg:"#F5F5F5",icon:"#999",text:"#555"}} ico={IcoMoon} label="Sueño" value={dormido?"Dormido":"Despierto"} sub={dormido?`desde ${fmtHora(dormido,f24)}`:""} onClick={()=>setTab("sueno")}/>
      </div>

      <div style={{marginBottom:14}}>
        <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Estado del bebé ahora</div>
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
          <div style={{background:estadoObj.bg,borderRadius:10,padding:"8px 12px",fontSize:13,color:estadoObj.color,display:"flex",alignItems:"center",gap:8,fontWeight:500}}>
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
      {proxCita&&(
        <InfoBanner accent={ACCENT.appt} icon={IcoCalendar(ACCENT.appt.icon)} title={proxCita.doctor} sub={`${proxCita.fecha}${proxCita.hora?` · ${fmtHora(proxCita.hora,f24)}`:""}`}/>
      )}
    </div>
  );
}

function SCard({accent,ico,label,value,sub,onClick}){
  return (
    <button onClick={onClick} style={{background:accent.bg,borderRadius:16,padding:"12px 14px",border:"none",cursor:"pointer",textAlign:"left",width:"100%"}}>
      <div style={{width:32,height:32,borderRadius:8,background:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:8}}>
        {ico(accent.icon)}
      </div>
      <div style={{fontSize:12,color:accent.text,opacity:0.75,marginBottom:2}}>{label}</div>
      <div style={{fontSize:20,fontWeight:500,color:accent.text,lineHeight:1.2}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:accent.text,opacity:0.6,marginTop:2}}>{sub}</div>}
    </button>
  );
}

function useFilters(items,getDate){
  const [dateFilter,setDateFilter]=useState("");
  const [soloDestacados,setSoloDestacados]=useState(false);
  let filtered=[...items];
  if(dateFilter) filtered=filtered.filter(i=>getDate(i)===fmtDate(dateFilter));
  if(soloDestacados) filtered=filtered.filter(i=>i.destacado);
  return{filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados};
}

function FilterBar({dateFilter,setDateFilter,soloDestacados,setSoloDestacados,total,filtered}){
  return (
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
      <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{...inp,width:145,fontSize:12,padding:"5px 8px"}}/>
      {dateFilter&&<button onClick={()=>setDateFilter("")} style={{fontSize:12,background:"none",border:`1px solid ${P}`,borderRadius:8,padding:"4px 8px",color:P,cursor:"pointer"}}>Limpiar</button>}
      <button onClick={()=>setSoloDestacados(!soloDestacados)} style={{display:"flex",alignItems:"center",gap:4,fontSize:12,border:"none",borderRadius:8,padding:"5px 10px",cursor:"pointer",background:soloDestacados?"#FFF8E1":"#f5f5f5",color:soloDestacados?"#B8860B":"#888"}}>
        {IcoStar(soloDestacados?"#F59E0B":"#aaa")} Destacados
      </button>
      {(dateFilter||soloDestacados)&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>{filtered} de {total}</span>}
    </div>
  );
}

function StarBtn({destacado,onToggle}){
  return <button onClick={onToggle} style={{background:"none",border:"none",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>{IcoStar(destacado?"#F59E0B":"#ccc")}</button>;
}

function TomasTab({tomas,setTomas,baby}){
  const {unidad,f24}=usePrefs();
  const [cant,setCant]=useState(unidad==="oz"?"3":"90");
  const [reflujo,setReflujo]=useState(false);
  const [formula,setFormula]=useState(baby.formula);
  const [hora,setHora]=useState(nowStr());
  const hoy=todayStr();
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(tomas,t=>t.fecha);
  // Si cambia la unidad en configuración, convertir el valor que está en el campo
  useEffect(()=>{
    setCant(c=>{
      const n=parseFloat(c);
      if(isNaN(n)) return c;
      return unidad==="oz"?String(mlToOz(n)):String(ozToMl(n));
    });
  },[unidad]);
  function add(){
    if(!cant) return;
    const n=parseFloat(cant);
    if(isNaN(n)) return;
    const enMl=unidad==="oz"?ozToMl(n):Math.round(n); // siempre se guarda en ml
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
        <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={tomas.length} filtered={filtered.length}/>
        {filtered.length===0?<Empty/>:[...filtered].reverse().map((t,i)=>(
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

function SuenoTab({suenos,setSuenos,dormido,setDormido}){
  const {f24}=usePrefs();
  const hoy=todayStr();
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(suenos,s=>s.fecha);
  function dur(a,b){const p=t=>{const[h,m]=t.split(":").map(Number);return h*60+m};let d=p(b)-p(a);if(d<0)d+=1440;return`${Math.floor(d/60)}h ${d%60}m`;}
  function toggle(s){setSuenos(suenos.map(x=>x.ts===s.ts?{...x,destacado:!x.destacado}:x));}
  return (
    <div>
      <SecTitle>{IcoMoon(ACCENT.sleep.icon)} Registro de sueño</SecTitle>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <button onClick={()=>setDormido(nowStr())} disabled={!!dormido} style={dormido?btnDis:btnPrim}>Se durmió</button>
        <button onClick={()=>{if(!dormido)return;setSuenos([...suenos,{inicio:dormido,fin:nowStr(),fecha:hoy,destacado:false,ts:ts()}]);setDormido(null);}} disabled={!dormido} style={!dormido?btnDis:btnOut}>Despertó</button>
      </div>
      {dormido&&<div style={{marginBottom:12}}><Chip color="blue">Dormido desde {fmtHora(dormido,f24)}</Chip></div>}
      <SecTitle>{IcoMoon(P)} Historial</SecTitle>
      <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={suenos.length} filtered={filtered.length}/>
      {filtered.length===0?<Empty/>:[...filtered].reverse().map((s,i)=>(
        <Row key={i}>
          <div><div style={{fontSize:14,fontWeight:500}}>{fmtHora(s.inicio,f24)} → {fmtHora(s.fin,f24)}</div><div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{s.fecha}</div></div>
          <div style={{display:"flex",gap:4,alignItems:"center"}}>
            <span style={{color:P,fontWeight:500,fontSize:13}}>{dur(s.inicio,s.fin)}</span>
            <StarBtn destacado={s.destacado} onToggle={()=>toggle(s)}/>
            <Del onClick={()=>setSuenos(suenos.filter(x=>x.ts!==s.ts))}/>
          </div>
        </Row>
      ))}
    </div>
  );
}

function BanoTab({banos,setBanos}){
  const {f24}=usePrefs();
  const [tipo,setTipo]=useState("normal");
  const [color,setColor]=useState("amarillo");
  const [hora,setHora]=useState(nowStr());
  const [tags,setTags]=useState([]);
  const [foto,setFoto]=useState(null);
  const ref=useRef();
  const hoy=todayStr();
  const tipoEmoji={normal:"💩",liquida:"💧",dura:"🪨",verde:"🟢",mucosa:"🔴",sangre:"🩸"};
  const {filtered,dateFilter,setDateFilter,soloDestacados,setSoloDestacados}=useFilters(banos,b=>b.fecha);
  function toggle(b){setBanos(banos.map(x=>x.ts===b.ts?{...x,destacado:!x.destacado}:x));}
  function toggleTag(t){setTags(tags.includes(t)?tags.filter(x=>x!==t):[...tags,t]);}
  function handleFoto(e){
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        // Reducir a máx. 800px y comprimir: una foto de cámara pesa varios MB y haría lenta la sincronización
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
        <option value="normal">Normal / pastosa</option><option value="liquida">Líquida / acuosa</option>
        <option value="dura">Dura / estreñimiento</option><option value="verde">Verde</option>
        <option value="mucosa">Con moco</option><option value="sangre">Con sangre</option>
      </select>
      <Lbl>Color</Lbl>
      <select value={color} onChange={e=>setColor(e.target.value)} style={inp}>
        <option value="amarillo">Amarillo mostaza</option><option value="cafe">Café</option>
        <option value="verde">Verde</option><option value="negro">Negro / meconial</option>
        <option value="rojo">Rojo / con sangre</option><option value="blanco">Blanco / grisáceo</option>
      </select>
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
        <FilterBar dateFilter={dateFilter} setDateFilter={setDateFilter} soloDestacados={soloDestacados} setSoloDestacados={setSoloDestacados} total={banos.length} filtered={filtered.length}/>
        {filtered.length===0?<Empty/>:[...filtered].reverse().map((b,i)=>(
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

function SaludTab({vacunas,setVacunas,citas,setCitas,meds,setMeds,mediciones,setMediciones,estadoActual,historialEstados,cambiarEstado,programarAlarma,estados,estadosCustom,setEstadosCustom}){
  const [sec,setSec]=useState("meds");
  const sections=[["meds","Medicamentos"],["estados","Estados"],["growth","Crecimiento"],["vaccines","Vacunas"],["appts","Citas"]];
  return (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        {sections.map(([id,label])=>(
          <button key={id} onClick={()=>setSec(id)} style={{padding:"7px 13px",borderRadius:20,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",border:"none",background:sec===id?P:PL,color:sec===id?"#fff":PD,fontWeight:sec===id?500:400}}>{label}</button>
        ))}
      </div>
      {sec==="meds"     && <MedsPanel meds={meds} setMeds={setMeds} programarAlarma={programarAlarma}/>}
      {sec==="estados"  && <EstadosPanel estadoActual={estadoActual} historialEstados={historialEstados} cambiarEstado={cambiarEstado} estados={estados} estadosCustom={estadosCustom} setEstadosCustom={setEstadosCustom}/>}
      {sec==="growth"   && <GrowthPanel mediciones={mediciones} setMediciones={setMediciones}/>}
      {sec==="vaccines" && <VaxPanel vacunas={vacunas} setVacunas={setVacunas}/>}
      {sec==="appts"    && <ApptsPanel citas={citas} setCitas={setCitas}/>}
    </div>
  );
}

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
  function toggleActivo(med){
    setMeds(meds.map(x=>x.ts===med.ts?{...x,activo:!x.activo}:x));
  }

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
        {meds.length===0?<Empty/>:meds.map((m,i)=>(
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
        <strong>Nota:</strong> Las alarmas funcionan mientras el navegador esté abierto. Acepta el permiso de notificaciones cuando se solicite.
      </div>
    </div>
  );
}

function EstadosPanel({estadoActual,historialEstados,cambiarEstado,estados,estadosCustom,setEstadosCustom}){
  const {f24}=usePrefs();
  const [dateFilter,setDateFilter]=useState("");
  const [editando,setEditando]=useState(false);
  const [nuevoNombre,setNuevoNombre]=useState("");
  const [nuevoEmoji,setNuevoEmoji]=useState("😊");
  const [nuevoColor,setNuevoColor]=useState(0);
  const estadoObj=estados.find(e=>e.id===estadoActual?.id)||(estadoActual?{label:estadoActual.label||"Estado",color:estadoActual.color||"#888",bg:estadoActual.bg||"#F1EFE8",emoji:estadoActual.emoji}:null);
  function dur(desde,hasta){
    const p=t=>{const[h,m]=t.split(":").map(Number);return h*60+m};
    let d=p(hasta)-p(desde);if(d<0)d+=1440;
    return d<60?`${d}m`:`${Math.floor(d/60)}h ${d%60}m`;
  }
  function agregarEstado(){
    const label=nuevoNombre.trim();
    if(!label) return;
    const pal=PALETA[nuevoColor];
    setEstadosCustom([...estadosCustom,{id:"c_"+Date.now(),label,emoji:nuevoEmoji,color:pal.color,bg:pal.bg}]);
    setNuevoNombre("");setNuevoEmoji("😊");setNuevoColor(0);setEditando(false);
  }
  function eliminarEstado(id){
    if(estadoActual?.id===id) cambiarEstado(id); // si está activo, se cierra y pasa al historial
    setEstadosCustom(estadosCustom.filter(e=>e.id!==id));
  }
  const filtered=dateFilter?historialEstados.filter(e=>e.fecha===fmtDate(dateFilter)):historialEstados;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:500,color:"var(--color-text-secondary)"}}>Estado actual</div>
        <button onClick={()=>setEditando(!editando)} style={{fontSize:12,background:editando?P:"none",border:`1px solid ${P}`,borderRadius:8,padding:"4px 10px",color:editando?"#fff":P,cursor:"pointer",fontWeight:500}}>
          {editando?"Listo":"+ Nuevo estado"}
        </button>
      </div>

      {editando&&(
        <div style={{background:PL,borderRadius:12,padding:"10px 12px",marginBottom:12}}>
          <Lbl>Nombre del estado</Lbl>
          <input value={nuevoNombre} onChange={e=>setNuevoNombre(e.target.value)} style={inp} placeholder="Con cólico, Risueño…"/>
          <Lbl>Emoji</Lbl>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:4}}>
            {EMOJIS_ESTADO.map(em=>(
              <button key={em} onClick={()=>setNuevoEmoji(em)} style={{fontSize:18,padding:"4px 7px",borderRadius:8,cursor:"pointer",border:nuevoEmoji===em?`2px solid ${P}`:"2px solid transparent",background:nuevoEmoji===em?"#fff":"transparent"}}>{em}</button>
            ))}
            <input value={nuevoEmoji} onChange={e=>setNuevoEmoji(e.target.value)} maxLength={4} style={{...inp,width:52,textAlign:"center",display:"inline-block",padding:"6px 4px"}} title="O escribe otro emoji"/>
          </div>
          <Lbl>Color</Lbl>
          <div style={{display:"flex",gap:6,marginBottom:10}}>
            {PALETA.map((pal,i)=>(
              <button key={i} onClick={()=>setNuevoColor(i)} style={{width:26,height:26,borderRadius:"50%",background:pal.color,cursor:"pointer",border:nuevoColor===i?"3px solid #fff":"3px solid transparent",boxShadow:nuevoColor===i?`0 0 0 2px ${pal.color}`:"none"}}/>
            ))}
          </div>
          {nuevoNombre.trim()&&(
            <div style={{marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Vista previa:</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:20,background:PALETA[nuevoColor].bg,color:PALETA[nuevoColor].color,fontSize:12}}>{nuevoEmoji} {nuevoNombre.trim()}</span>
            </div>
          )}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Btn onClick={agregarEstado} style={{padding:"7px 14px",fontSize:13}}>Agregar</Btn>
            {estadosCustom.length>0&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>Toca la ✕ de un estado tuyo para eliminarlo</span>}
          </div>
        </div>
      )}

      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
        {estados.map(e=>{
          const active=estadoActual?.id===e.id;
          const esCustom=e.id.startsWith("c_");
          return (
            <span key={e.id} style={{display:"inline-flex",alignItems:"center"}}>
              <button onClick={()=>cambiarEstado(e.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:editando&&esCustom?"20px 0 0 20px":20,border:"none",background:active?e.color:e.bg,color:active?"#fff":e.color,cursor:"pointer",fontSize:12,fontWeight:active?500:400}}>
                {iconoEstado(e,active?"#fff":e.color)}{e.label}
              </button>
              {editando&&esCustom&&(
                <button onClick={()=>eliminarEstado(e.id)} title="Eliminar estado" style={{border:"none",background:active?e.color:e.bg,color:active?"#fff":e.color,borderRadius:"0 20px 20px 0",padding:"5px 8px 5px 2px",cursor:"pointer",fontSize:12,fontWeight:700}}>✕</button>
              )}
            </span>
          );
        })}
      </div>
      {estadoObj&&(
        <div style={{background:estadoObj.bg,borderRadius:10,padding:"8px 12px",fontSize:13,color:estadoObj.color,display:"flex",alignItems:"center",gap:8,fontWeight:500,marginBottom:14}}>
          {iconoEstado(estadoObj,estadoObj.color)}
          {estadoObj.label} desde <strong style={{marginLeft:3}}>{fmtHora(estadoActual.desde,f24)}</strong>
          <span style={{marginLeft:"auto",fontSize:11,opacity:0.7,fontWeight:400}}>Toca otro para cerrar</span>
        </div>
      )}
      <SecTitle>{IcoClock(P)} Historial de estados</SecTitle>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{...inp,width:145,fontSize:12,padding:"5px 8px"}}/>
        {dateFilter&&<button onClick={()=>setDateFilter("")} style={{fontSize:12,background:"none",border:`1px solid ${P}`,borderRadius:8,padding:"4px 8px",color:P,cursor:"pointer"}}>Limpiar</button>}
      </div>
      {filtered.length===0?<Empty/>:[...filtered].reverse().map((e,i)=>{
        // Primero se busca el estado vivo; si fue eliminado, se usa la copia guardada en el registro
        const est=estados.find(x=>x.id===e.id)||{label:e.label||"Estado",color:e.color||"#888",bg:e.bg||"#F1EFE8",emoji:e.emoji};
        return (
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
            <div style={{width:34,height:34,borderRadius:10,background:est.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {iconoEstado(est,est.color)}
            </div>
            <div style={{flex:1}}>
              <div style={{fontWeight:500,fontSize:14,color:est.color}}>{est.label}</div>
              <div style={{fontSize:12,color:"var(--color-text-tertiary)"}}>{fmtHora(e.desde,f24)} → {fmtHora(e.hasta,f24)} · {e.fecha}</div>
            </div>
            <span style={{background:est.bg,color:est.color,fontSize:12,fontWeight:500,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}}>{dur(e.desde,e.hasta)}</span>
          </div>
        );
      })}
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
        {vacunas.length===0?<Empty/>:vacunas.map((v,i)=>(
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
  return <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:500,color:"var(--color-text-primary)",fontSize:14,margin:"0 0 10px",...style}}>{children}</div>;
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
