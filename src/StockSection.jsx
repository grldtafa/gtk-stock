import { useState, useEffect, useRef } from "react";

// ─── Constantes GTK ───
const O   = "#FC7701";
const OD  = "#d96600";
const OL  = "#FFF4EA";
const C1  = "#ffffff";
const C2  = "#e8edf3";
const C3  = "#f4f7fa";
const T1  = "#0f172a";
const T2  = "#1e293b";
const T3  = "#475569";
const T4  = "#64748b";
const T5  = "#94a3b8";
const GR  = "#16a34a";
const GRL = "#f0fdf4";
const RD  = "#dc2626";
const RDL = "#fef2f2";
const BL  = "#2563eb";
const BLL = "#eff6ff";
const PU  = "#7c3aed";
const PUL = "#f5f3ff";
const FF  = "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const FM  = "'SF Mono',SFMono-Regular,Menlo,Consolas,monospace";
const SH  = "0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)";

// ─── Types matériel ───
const TYPES = ["Consommable", "Outillage"];
const TYPE_STYLE = {
  Consommable: { bg: BLL, c: BL },
  Outillage:   { bg: PUL, c: PU },
};

const f       = v => Number(v||0).toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const fmtDate = d => { if(!d) return ""; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };

const exportCSV = (rows,cols,filename) => {
  const header=cols.map(c=>c.label).join(";");
  const body=rows.map(r=>cols.map(c=>String(r[c.key]??'').replace(/;/g,',')).join(";")).join("\n");
  const blob=new Blob(["﻿"+header+"\n"+body],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename+".csv";a.click();URL.revokeObjectURL(url);
};

// ─── Icônes ───
const IcoSvg = (d,w=20) => <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const Ico = {
  list:    IcoSvg(<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>),
  in:      IcoSvg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>),
  out:     IcoSvg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  book:    IcoSvg(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>),
  users:   IcoSvg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  plus:    IcoSvg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,16),
  check:   IcoSvg(<><polyline points="20 6 9 17 4 12"/></>,14),
  trash:   IcoSvg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></>,14),
  edit:    IcoSvg(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,14),
  search:  IcoSvg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,15),
  alert:   IcoSvg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,16),
  phone:   IcoSvg(<><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.64a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></>,13),
  back:    IcoSvg(<><polyline points="15 18 9 12 15 6"/></>,16),
  csv:     IcoSvg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,14),
  print:   IcoSvg(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,14),
  copy:    IcoSvg(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,14),
  globe:   IcoSvg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>,15),
  box:     IcoSvg(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,18),
  tool:    IcoSvg(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,18),
  close:   IcoSvg(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,14),
  pencil:  IcoSvg(<><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>,12),
  file:    IcoSvg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,28),
  boxLg:   IcoSvg(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,28),
  bookLg:  IcoSvg(<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,28),
  usersLg: IcoSvg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,28),
  noResult:IcoSvg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,28),
  stats:   IcoSvg(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,18),
  img:     IcoSvg(<><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,16),
};

const TABS = [
  {id:"inventaire", label:"Inventaire", ico:Ico.list},
  {id:"entrees",    label:"Entrées",    ico:Ico.in},
  {id:"sorties",    label:"Sorties",    ico:Ico.out},
  {id:"catalogue",  label:"Catalogue",  ico:Ico.book},
  {id:"stats",      label:"Stats",      ico:Ico.stats},
  {id:"techs",      label:"Équipe",     ico:Ico.users},
];

// ─── Composants ───
const Badge = ({c,bg,children,style={}}) => (
  <span style={{background:bg,color:c,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3,...style}}>{children}</span>
);
const Card = ({children,style={}}) => (
  <div style={{background:C1,borderRadius:12,border:`1px solid ${C2}`,boxShadow:SH,padding:"16px",...style}}>{children}</div>
);
const Btn = ({children,color=O,textColor="#fff",outline=false,small=false,full=false,disabled=false,onClick,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{background:outline?"transparent":disabled?"#cbd5e1":color,color:outline?color:textColor,border:outline?`1.5px solid ${color}`:"none",borderRadius:8,padding:small?"6px 12px":"10px 18px",fontSize:small?11:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",fontFamily:FF,display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:full?"100%":"auto",opacity:disabled?0.55:1,transition:"all .15s",...style}}>{children}</button>
);
const Input = ({label,style={},...props}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:T3}}>{label}</label>}
    <input style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box",...style}}
      onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2} {...props}/>
  </div>
);
const Divider = () => <div style={{height:1,background:C2,margin:"12px 0"}}/>;

export default function StockSection({
  stk=[], setStk,
  stkOut=[], setStkOut,
  stkInLog=[], setStkInLog,
  bls=[], setBls,
  catalogue=[], setCatalogue,
  fournisseurs=[], setFournisseurs,
  techs=[], setTechs,
  onSaveMeta, onSaveStock, onSaveStkOut, onSaveTechs,
  onToast, isAdmin=false
}) {
  const [tab, setTab] = useState("inventaire");
  const [isMob, setIsMob] = useState(typeof window!=="undefined"&&window.innerWidth<768);
  useEffect(()=>{const h=()=>setIsMob(window.innerWidth<768);window.addEventListener("resize",h);return()=>window.removeEventListener("resize",h);},[]);

  const scrollRef = useRef(null);
  const scrollTop = () => setTimeout(()=>scrollRef.current?.scrollTo({top:0,behavior:"smooth"}),50);

  const goTab = t => { setTab(t); setShowForm(false); setBlMode("liste"); setCatForm(null); setTechForm(null); };

  // ════════════════════════════════════════════════════════
  // INVENTAIRE
  // ════════════════════════════════════════════════════════
  const [invSearch,  setInvSearch]  = useState("");
  const [typeFilter, setTypeFilter] = useState("Tous");
  const [editQty,    setEditQty]    = useState(null);  // {id, val}

  const alertItems  = stk.filter(a => (a.seuil||0) > 0 && (a.qty||0) <= (a.seuil||0));
  const totalValeur = stk.reduce((s,a)=>s+(a.qty||0)*(a.prix||0),0);
  const nConso      = stk.filter(a=>a.type==="Consommable").length;
  const nOutillage  = stk.filter(a=>a.type==="Outillage").length;
  const nRupture    = stk.filter(a=>(a.qty||0)===0).length;
  const ymNow       = new Date().toISOString().slice(0,7);
  const sortiesMois = stkOut.filter(s=>(s.ym||s.date?.slice(0,7))===ymNow);
  const valSortiesMois = sortiesMois.reduce((s,x)=>s+(x.qty||0)*(x.prix||0),0);

  const filtStk = stk.filter(a => {
    const matchSearch = !invSearch || a.nom?.toLowerCase().includes(invSearch.toLowerCase()) || a.cat?.toLowerCase().includes(invSearch.toLowerCase());
    const matchType   = typeFilter==="Tous" || a.type===typeFilter;
    return matchSearch && matchType;
  });

  const saveQty = (id, val) => {
    const q=parseInt(val); if(isNaN(q)||q<0) return;
    const ns=stk.map(a=>a.id===id?{...a,qty:q}:a);
    setStk(ns); onSaveStock(ns); setEditQty(null); onToast("Quantité mise à jour");
  };

  const TYPE_TABS = ["Tous", "Consommable", "Outillage"];

  const renderInventaire = () => (
    <div>
      {/* Bannette alerte */}
      {alertItems.length > 0 && (
        <div style={{background:RDL,border:`1.5px solid ${RD}30`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{color:RD}}>{Ico.alert}</span>
            <span style={{fontSize:13,fontWeight:800,color:RD}}>
              {alertItems.length} article{alertItems.length>1?"s":""} en alerte de stock
            </span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {alertItems.map(a => (
              <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                background:"#fff",borderRadius:8,padding:"8px 12px",border:`1px solid ${RD}20`}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  {a.type && <Badge bg={TYPE_STYLE[a.type]?.bg||C3} c={TYPE_STYLE[a.type]?.c||T3}>{a.type}</Badge>}
                  <span style={{fontSize:12,fontWeight:600,color:T1}}>{a.nom}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontFamily:FM,fontWeight:800,color:RD,fontSize:13}}>{a.qty||0}</span>
                  <span style={{color:T5,fontSize:11}}>/ seuil {a.seuil}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
        {[
          {label:"Valeur stock",   val:f(totalValeur),            unit:"en stock",      color:O},
          {label:"Alertes",        val:String(alertItems.length), unit:"sous seuil",    color:alertItems.length>0?RD:GR,  bg:alertItems.length>0?RDL:GRL},
          {label:"Sorties ce mois",val:String(sortiesMois.length),unit:valSortiesMois>0?f(valSortiesMois):"sorties",color:PU},
          {label:"Ruptures",       val:String(nRupture),          unit:"à zéro",        color:nRupture>0?RD:T4, bg:nRupture>0?RDL:undefined},
        ].map((s,i)=>(
          <Card key={i} style={{padding:"12px 10px",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,background:s.bg||C1}}>
            <div style={{fontSize:14,fontWeight:900,color:s.color,lineHeight:1.2,wordBreak:"break-all"}}>{s.val}</div>
            <div style={{fontSize:9,color:T5,fontWeight:500}}>{s.unit}</div>
            <div style={{fontSize:9,color:T4,textTransform:"uppercase",letterSpacing:.5,fontWeight:700}}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Barre recherche + filtre type + export */}
      <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:160,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
          <input value={invSearch} onChange={e=>setInvSearch(e.target.value)} placeholder="Rechercher…"
            style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"9px 12px 9px 34px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:4}}>
          {TYPE_TABS.map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} style={{
              padding:"7px 12px",borderRadius:8,border:`1.5px solid ${typeFilter===t?O:C2}`,
              background:typeFilter===t?OL:C1,color:typeFilter===t?OD:T3,
              fontSize:11,fontWeight:typeFilter===t?700:500,cursor:"pointer",fontFamily:FF,whiteSpace:"nowrap"
            }}>{t}</button>
          ))}
        </div>
        {isAdmin && (
          <Btn small outline color={T3} onClick={()=>exportCSV(stk,[
            {key:"nom",label:"Article"},{key:"cat",label:"Catégorie"},{key:"type",label:"Type"},
            {key:"qty",label:"Quantité"},{key:"seuil",label:"Seuil"},{key:"prix",label:"Prix unit."}
          ],"inventaire")}>
            {Ico.csv}{!isMob&&"CSV"}
          </Btn>
        )}
      </div>

      {filtStk.length===0 ? (
        <Card style={{textAlign:"center",padding:"52px 20px"}}>
          <div style={{width:60,height:60,borderRadius:18,background:invSearch||typeFilter!=="Tous"?C3:OL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:invSearch||typeFilter!=="Tous"?T4:O}}>
            {invSearch||typeFilter!=="Tous" ? Ico.noResult : Ico.boxLg}
          </div>
          <div style={{color:T1,fontSize:14,fontWeight:700,marginBottom:4}}>Aucun article</div>
          <div style={{color:T5,fontSize:12}}>
            {invSearch||typeFilter!=="Tous" ? "Aucun résultat pour ce filtre" : "Ajoutez des articles via Entrées"}
          </div>
        </Card>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtStk.map(a=>{
            const ts = a.type ? TYPE_STYLE[a.type] : null;
            const isAlerte = (a.seuil||0)>0 && (a.qty||0)<=(a.seuil||0);
            return (
              <Card key={a.id} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:10,
                border:`1px solid ${isAlerte?RD+"40":C2}`,background:isAlerte?RDL:C1}}>
                {/* Barre couleur type */}
                <div style={{width:4,height:44,borderRadius:2,flexShrink:0,
                  background:a.type==="Consommable"?BL:a.type==="Outillage"?PU:C2}}/>
                {/* Infos */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.nom}</div>
                  <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap",alignItems:"center"}}>
                    {a.cat&&<Badge bg={OL} c={O}>{a.cat}</Badge>}
                    {ts&&<Badge bg={ts.bg} c={ts.c}>{a.type}</Badge>}
                  </div>
                </div>
                {/* Seuil */}
                {(a.seuil||0)>0&&(
                  <div style={{flexShrink:0,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                    <span style={{fontSize:9,color:T5,fontWeight:500}}>seuil</span>
                    <span style={{fontSize:12,fontFamily:FM,fontWeight:700,color:isAlerte?RD:T5}}>{a.seuil}</span>
                  </div>
                )}
                {/* Prix */}
                {!isMob&&a.prix>0&&(
                  <div style={{flexShrink:0,textAlign:"right"}}>
                    <div style={{fontSize:10,color:T5}}>unit.</div>
                    <div style={{fontSize:12,fontFamily:FM,color:T3}}>{f(a.prix)}</div>
                  </div>
                )}
                {/* Quantité */}
                <div style={{flexShrink:0}}>
                  {isAdmin&&editQty?.id===a.id ? (
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <input type="number" value={editQty.val} autoFocus
                        onChange={e=>setEditQty({...editQty,val:e.target.value})}
                        onKeyDown={e=>{if(e.key==="Enter")saveQty(a.id,editQty.val);if(e.key==="Escape")setEditQty(null);}}
                        style={{width:60,border:`1.5px solid ${O}`,borderRadius:6,padding:"5px 6px",textAlign:"center",fontFamily:FM,fontWeight:700,fontSize:14,outline:"none"}}/>
                      <button onClick={()=>saveQty(a.id,editQty.val)} style={{background:GR,border:"none",borderRadius:6,color:"#fff",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{Ico.check}</button>
                    </div>
                  ) : (
                    <button onClick={()=>isAdmin&&setEditQty({id:a.id,val:a.qty||0})}
                      style={{background:isAlerte?RD+"18":a.qty<=0?RDL:a.qty<=5?OL:GRL,border:"none",borderRadius:8,padding:"6px 12px",cursor:isAdmin?"pointer":"default",fontFamily:FM,fontWeight:900,fontSize:18,color:isAlerte?RD:a.qty<=0?RD:a.qty<=5?OD:GR,display:"flex",alignItems:"center",gap:3}}>
                      {a.qty||0}
                      {isAdmin&&<span style={{opacity:.4,display:"flex"}}>{Ico.pencil}</span>}
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ENTRÉES
  // ════════════════════════════════════════════════════════
  const [blMode,      setBlMode]      = useState("liste");
  const [blDate,      setBlDate]      = useState(()=>new Date().toISOString().slice(0,10));
  const [blLignes,    setBlLignes]    = useState([]);
  const [blCatSearch, setBlCatSearch] = useState("");
  const [blViewId,    setBlViewId]    = useState(null);

  const addToCart = (c) => {
    setBlLignes(prev => {
      const existing=prev.find(l=>l.nom===c.nom);
      if(existing) return prev.map(l=>l.nom===c.nom?{...l,qty:l.qty+1}:l);
      return [...prev,{id:Date.now()+Math.random(),nom:c.nom,cat:c.cat||"",type:c.type||"",qty:1,prix:c.prix||0}];
    });
  };
  const cartDelta = (id, delta) => {
    setBlLignes(prev=>prev.map(l=>l.id===id?{...l,qty:Math.max(0,l.qty+delta)}:l).filter(l=>l.qty>0));
  };
  const cartSetQty = (id, val) => {
    const q=parseInt(val); if(isNaN(q)) return;
    setBlLignes(prev=>q<=0?prev.filter(l=>l.id!==id):prev.map(l=>l.id===id?{...l,qty:q}:l));
  };
  const validerBL = () => {
    if(!blLignes.length) return;
    const d=blDate||new Date().toISOString().slice(0,10);
    const seq=String(bls.length+1).padStart(4,"0");
    const num=`BR-${d.replace(/-/g,"")}-${seq}`;
    const newBl={id:Date.now(),num,date:d,dateLabel:fmtDate(d),ym:d.slice(0,7),statut:"validé",lignes:[...blLignes]};
    const ns=[...stk];
    blLignes.forEach(l=>{
      const catItem=catalogue.find(c=>c.nom===l.nom);
      const idx=ns.findIndex(s=>s.nom===l.nom);
      if(idx>=0){
        ns[idx]={...ns[idx],qty:(ns[idx].qty||0)+l.qty,type:ns[idx].type||l.type||"",seuil:ns[idx].seuil||catItem?.seuil||0};
      } else {
        ns.push({id:Date.now()+Math.random(),nom:l.nom,cat:l.cat,type:l.type||catItem?.type||"",qty:l.qty,prix:l.prix,seuil:catItem?.seuil||0});
      }
    });
    setStk(ns); onSaveStock(ns);
    setStkInLog(prev=>[...blLignes.map(l=>({id:Math.floor(Math.random()*2e9),nom:l.nom,cat:l.cat,qty:l.qty,prix:l.prix,dateLabel:fmtDate(d).slice(0,5),ym:d.slice(0,7),bl:num})),...prev]);
    setBls(prev=>[newBl,...prev]);
    setTimeout(()=>onSaveMeta&&onSaveMeta(),300);
    setBlMode("liste"); setBlLignes([]); setBlDate(new Date().toISOString().slice(0,10));
    onToast(`Bon ${num} validé · Stock mis à jour ✓`);
  };
  const totalBl=blLignes.reduce((s,l)=>s+(l.qty||0)*(l.prix||0),0);

  // ── Édition / suppression ligne BL ──
  const [blEditLine,    setBlEditLine]    = useState(null); // {blId, lineIdx}
  const [blEditLineQty, setBlEditLineQty] = useState(1);

  const openBlEditLine = (bl, idx) => { setBlEditLine({blId:bl.id,lineIdx:idx}); setBlEditLineQty(bl.lignes[idx].qty); };
  const cancelBlEditLine = () => { setBlEditLine(null); setBlEditLineQty(1); };

  const saveBlLine = (bl, idx) => {
    const newQty = Math.max(1, parseInt(blEditLineQty)||1);
    const oldQty = bl.lignes[idx].qty;
    const delta  = newQty - oldQty;
    const nom    = bl.lignes[idx].nom;
    if(delta > 0) {
      const art = stk.find(a=>a.nom===nom);
      if(!art||(art.qty||0)<delta){ onToast(`Stock insuffisant pour ${nom}`,"warn"); return; }
    }
    const ns = stk.map(a=>a.nom===nom?{...a,qty:Math.max(0,(a.qty||0)-delta)}:a);
    setStk(ns); onSaveStock(ns);
    const newBls = bls.map(b=>b.id===bl.id?{...b,lignes:b.lignes.map((l,i)=>i===idx?{...l,qty:newQty}:l)}:b);
    setBls(newBls);
    setTimeout(()=>onSaveMeta&&onSaveMeta(),300);
    cancelBlEditLine();
    onToast("Ligne mise à jour ✓");
  };

  const deleteBlLine = (bl, idx) => {
    if(!window.confirm(`Retirer "${bl.lignes[idx].nom}" de ce bon ?`)) return;
    const l = bl.lignes[idx];
    const ns = stk.map(a=>a.nom===l.nom?{...a,qty:Math.max(0,(a.qty||0)-l.qty)}:a);
    setStk(ns); onSaveStock(ns);
    const newLignes = bl.lignes.filter((_,i)=>i!==idx);
    const newBls = bls.map(b=>b.id===bl.id?{...b,lignes:newLignes}:b);
    setBls(newBls);
    setTimeout(()=>onSaveMeta&&onSaveMeta(),300);
    onToast(`${l.nom} retiré · stock restauré`);
  };

  const printBl = (bl) => {
    const rows=(bl.lignes||[]).map(l=>`<tr><td>${l.nom}</td><td>${l.type||'—'}</td><td style="text-align:center">${l.qty}</td><td style="text-align:right">${l.prix>0?Number(l.prix).toFixed(2).replace('.',',')+' €':'—'}</td><td style="text-align:right">${l.prix>0?((l.qty||0)*(l.prix||0)).toFixed(2).replace('.',',')+' €':'—'}</td></tr>`).join('');
    const total=(bl.lignes||[]).reduce((s,l)=>s+(l.qty||0)*(l.prix||0),0);
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>BL ${bl.num}</title><style>body{font-family:-apple-system,sans-serif;padding:40px;color:#0f172a;max-width:820px;margin:0 auto}h1{font-size:22px;font-weight:900;margin:0 0 4px}.sub{color:#64748b;font-size:13px;margin-bottom:28px}table{width:100%;border-collapse:collapse;margin-top:12px}th{background:#f4f7fa;padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:#475569;font-weight:700}td{padding:10px 12px;border-bottom:1px solid #e8edf3;font-size:13px}.tot{margin-top:16px;text-align:right;font-size:15px;font-weight:900;color:#FC7701}.hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}.brand{font-size:20px;font-weight:900;color:#FC7701}@media print{body{padding:20px}}</style></head><body><div class="hd"><div><h1>Bon de réception</h1><div class="sub">${bl.num} · ${bl.dateLabel||fmtDate(bl.date)||'—'}</div></div><div class="brand">GTK STOCK</div></div><table><thead><tr><th>Désignation</th><th>Type</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>${total>0?`<div class="tot">Total : ${total.toFixed(2).replace('.',',')} €</div>`:''}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  const renderEntrees = () => (
    <div>
      {blMode==="liste" ? (<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:12,color:T4}}>{bls.length} bon{bls.length!==1?"s":""} de réception</div>
          {isAdmin&&<Btn onClick={()=>{setBlMode("nouveau");setBlLignes([]);setBlDate(new Date().toISOString().slice(0,10));}}>{Ico.plus} Nouveau BR</Btn>}
        </div>
        {bls.length===0 ? (
          <Card style={{textAlign:"center",padding:"52px 20px"}}>
            <div style={{width:60,height:60,borderRadius:18,background:GRL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:GR}}>{Ico.file}</div>
            <div style={{color:T1,fontSize:14,fontWeight:700,marginBottom:4}}>Aucun bon de réception</div>
            <div style={{color:T5,fontSize:12}}>Créez votre premier bon via le bouton ci-dessus</div>
          </Card>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {bls.map(bl=>(
              <Card key={bl.id} style={{padding:0,overflow:"hidden"}}>
                <div onClick={()=>setBlViewId(blViewId===bl.id?null:bl.id)}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}}>
                  <div style={{width:36,height:36,borderRadius:8,background:GRL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <span style={{color:GR}}>{Ico.in}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:700,color:T1,fontFamily:FM}}>{bl.num}</div>
                    <div style={{fontSize:11,color:T4,marginTop:1}}>{bl.dateLabel||fmtDate(bl.date)}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <Badge bg={GRL} c={GR}>{bl.lignes?.length||0} art.</Badge>
                    <div style={{color:T5,fontSize:11,marginTop:4}}>{blViewId===bl.id?"▲":"▼"}</div>
                  </div>
                </div>
                {blViewId===bl.id&&bl.lignes&&(
                  <div style={{borderTop:`1px solid ${C2}`,padding:"12px 16px"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:5}}>
                      {bl.lignes.map((l,i)=>{
                        const isEditingLine = blEditLine?.blId===bl.id && blEditLine?.lineIdx===i;
                        return (
                          <div key={i} style={{borderBottom:i<bl.lignes.length-1?`1px solid ${C2}40`:"none",paddingBottom:i<bl.lignes.length-1?8:0}}>
                            {isEditingLine ? (
                              <div style={{background:OL,borderRadius:8,padding:"8px 10px"}}>
                                <div style={{fontSize:12,fontWeight:600,color:T1,marginBottom:8}}>{l.nom}</div>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                                  <button onClick={()=>setBlEditLineQty(q=>Math.max(1,q-1))} style={{width:28,height:28,borderRadius:6,background:C2,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,color:T2}}>−</button>
                                  <input type="number" value={blEditLineQty} min="1" onChange={e=>setBlEditLineQty(Math.max(1,parseInt(e.target.value)||1))}
                                    style={{flex:1,textAlign:"center",fontSize:16,fontWeight:900,fontFamily:FM,border:`1.5px solid ${O}`,borderRadius:6,padding:"4px",color:T1,background:C1,outline:"none"}}/>
                                  <button onClick={()=>setBlEditLineQty(q=>q+1)} style={{width:28,height:28,borderRadius:6,background:O,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,color:"#fff"}}>+</button>
                                </div>
                                <div style={{display:"flex",gap:6}}>
                                  <Btn small full outline color={T3} onClick={cancelBlEditLine}>Annuler</Btn>
                                  <Btn small full color={GR} onClick={()=>saveBlLine(bl,i)}>{Ico.check} OK</Btn>
                                </div>
                              </div>
                            ) : (
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0"}}>
                                <div style={{flex:1,minWidth:0}}>
                                  <span style={{fontSize:12,fontWeight:600,color:T1}}>{l.nom}</span>
                                  {l.type&&<span style={{marginLeft:6}}><Badge bg={TYPE_STYLE[l.type]?.bg||C3} c={TYPE_STYLE[l.type]?.c||T3}>{l.type}</Badge></span>}
                                </div>
                                <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
                                  {l.prix>0&&<span style={{fontSize:11,color:T4,fontFamily:FM}}>{f(l.prix)}</span>}
                                  <span style={{fontFamily:FM,fontWeight:800,color:O,fontSize:14}}>×{l.qty}</span>
                                  {isAdmin&&<>
                                    <button onClick={()=>openBlEditLine(bl,i)} title="Modifier"
                                      style={{width:24,height:24,borderRadius:5,background:OL,border:`1px solid ${O}30`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:O,padding:0}}>{Ico.edit}</button>
                                    <button onClick={()=>deleteBlLine(bl,i)} title="Retirer"
                                      style={{width:24,height:24,borderRadius:5,background:RDL,border:`1px solid ${RD}20`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:RD,padding:0}}>{Ico.trash}</button>
                                  </>}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <Btn small outline color={T3} onClick={()=>printBl(bl)}>{Ico.print} Imprimer</Btn>
                    {isAdmin&&(
                        <Btn small outline color={RD} onClick={()=>{
                          if(!window.confirm(`Supprimer le bon ${bl.num} ?\nLe stock sera restauré.`)) return;
                          const ns=[...stk];
                          (bl.lignes||[]).forEach(l=>{
                            const idx=ns.findIndex(s=>s.nom===l.nom);
                            if(idx>=0) ns[idx]={...ns[idx],qty:Math.max(0,(ns[idx].qty||0)-l.qty)};
                          });
                          setStk(ns); onSaveStock(ns);
                          setBls(p=>p.filter(b=>b.id!==bl.id));
                          setBlViewId(null);
                          setTimeout(()=>onSaveMeta&&onSaveMeta(),300);
                          onToast(`Bon ${bl.num} supprimé · stock restauré`);
                        }}>
                          {Ico.trash} Supprimer le bon
                        </Btn>
                    )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </>) : (<>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <button onClick={()=>setBlMode("liste")} style={{background:C3,border:`1px solid ${C2}`,borderRadius:8,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3}}>{Ico.back}</button>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:T1}}>Nouveau bon de réception</div>
            <div style={{fontSize:11,color:T4,marginTop:1,fontFamily:FM}}>
              N° <b style={{color:O}}>{`BR-${blDate.replace(/-/g,"")}-${String(bls.length+1).padStart(4,"0")}`}</b> · généré automatiquement
            </div>
          </div>
          <Input label="" type="date" value={blDate} onChange={e=>setBlDate(e.target.value)} style={{width:150}}/>
        </div>
        {/* ── Catalogue sélectionnable ── */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
            Catalogue · {catalogue.length} référence{catalogue.length!==1?"s":""}
          </div>
          {/* Recherche */}
          <div style={{position:"relative",marginBottom:10}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
            <input value={blCatSearch} onChange={e=>setBlCatSearch(e.target.value)} placeholder="Filtrer les articles…"
              style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"9px 12px 9px 34px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"}}/>
          </div>
          {/* Grille */}
          {catalogue.length===0
            ? <Card style={{textAlign:"center",padding:"32px",color:T4,fontSize:13}}>Ajoutez des articles dans le Catalogue d'abord</Card>
            : (()=>{
                const ORDER=["Fibre D3","Fibre D2","ADSL"];
                const CAT_COLOR={"Fibre D3":"#0ea5e9","Fibre D2":"#8b5cf6","ADSL":"#16a34a"};
                const filtered=catalogue.filter(c=>!blCatSearch||c.nom.toLowerCase().includes(blCatSearch.toLowerCase())||c.cat?.toLowerCase().includes(blCatSearch.toLowerCase()));
                const groups={};
                filtered.forEach(c=>{const k=c.cat||"Autre";if(!groups[k])groups[k]=[];groups[k].push(c);});
                Object.keys(groups).forEach(k=>{ groups[k].sort((a,b)=>{const pa=a.prix>0?0:1,pb=b.prix>0?0:1;if(pa!==pb)return pa-pb;if(pa===0)return(b.prix||0)-(a.prix||0);return(a.nom||"").localeCompare(b.nom||"","fr");}); });
                const keys=[...ORDER.filter(k=>groups[k]),...Object.keys(groups).filter(k=>!ORDER.includes(k)&&groups[k])];
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:14}}>
                    {keys.map(cat=>(
                      <div key={cat}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div style={{width:3,height:14,borderRadius:2,background:CAT_COLOR[cat]||T4,flexShrink:0}}/>
                          <span style={{fontSize:11,fontWeight:800,color:CAT_COLOR[cat]||T4,textTransform:"uppercase",letterSpacing:1}}>{cat}</span>
                          <span style={{fontSize:10,color:T5}}>· {groups[cat].length} article{groups[cat].length>1?"s":""}</span>
                          <div style={{flex:1,height:1,background:CAT_COLOR[cat]||C2,opacity:.2}}/>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:isMob?"1fr 1fr":"repeat(3,1fr)",gap:8}}>
                          {groups[cat].map(c=>{
                            const inCart=blLignes.find(l=>l.nom===c.nom);
                            const ts=c.type?TYPE_STYLE[c.type]:null;
                            return (
                              <button key={c.id} onClick={()=>addToCart(c)} style={{
                                background:inCart?OL:C1,border:`1.5px solid ${inCart?O:C2}`,borderRadius:10,
                                padding:"10px 12px",textAlign:"left",cursor:"pointer",fontFamily:FF,
                                display:"flex",flexDirection:"column",gap:5,position:"relative",
                                transition:"all .12s",boxShadow:inCart?`0 0 0 1px ${O}30`:SH
                              }}>
                                {inCart&&<span style={{position:"absolute",top:-6,right:-6,background:O,color:"#fff",borderRadius:10,fontSize:10,fontWeight:900,padding:"2px 6px",minWidth:20,textAlign:"center"}}>{inCart.qty}</span>}
                                <div style={{display:"flex",alignItems:"center",gap:7}}>
                                  {c.photo&&<img src={c.photo} alt={c.nom} style={{width:32,height:32,objectFit:"cover",borderRadius:6,flexShrink:0,border:`1px solid ${C2}`}}/>}
                                  <div style={{fontSize:12,fontWeight:700,color:inCart?OD:T1,lineHeight:1.3,flex:1,minWidth:0}}>{c.nom}</div>
                                </div>
                                <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                                  {ts&&<Badge bg={ts.bg} c={ts.c}>{c.type}</Badge>}
                                </div>
                                {c.prix>0&&<div style={{fontSize:11,fontFamily:FM,color:T4,marginTop:1}}>{f(c.prix)}</div>}
                                <div style={{position:"absolute",bottom:8,right:8,width:22,height:22,borderRadius:6,background:inCart?O:C3,display:"flex",alignItems:"center",justifyContent:"center",color:inCart?"#fff":T4,transition:"all .12s"}}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
          }
        </div>

        {/* ── Panier ── */}
        {blLignes.length>0&&(
          <Card style={{position:"sticky",bottom:isMob?70:16,boxShadow:"0 -2px 16px rgba(0,0,0,.08)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:800,color:T1,display:"flex",alignItems:"center",gap:6}}>
                <span style={{background:O,color:"#fff",borderRadius:8,fontSize:10,fontWeight:900,padding:"2px 7px"}}>{blLignes.length}</span>
                article{blLignes.length!==1?"s":""} sélectionné{blLignes.length!==1?"s":""}
              </div>
              <button onClick={()=>setBlLignes([])} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:T5,textDecoration:"underline"}}>Vider</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
              {blLignes.map(l=>(
                <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:C3,borderRadius:8}}>
                  {/* Couleur type */}
                  <div style={{width:3,height:32,borderRadius:2,flexShrink:0,background:l.type==="Consommable"?BL:l.type==="Outillage"?PU:C2}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.nom}</div>
                    {l.prix>0&&<div style={{fontSize:10,color:T4,fontFamily:FM}}>{f(l.prix)}</div>}
                  </div>
                  {/* Compteur +/- */}
                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                    <button onClick={()=>cartDelta(l.id,-1)} style={{width:24,height:24,borderRadius:6,background:C2,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",color:T2}}>−</button>
                    <input type="number" value={l.qty} onChange={e=>cartSetQty(l.id,e.target.value)} min="1"
                      style={{width:36,textAlign:"center",fontFamily:FM,fontWeight:800,fontSize:13,border:`1.5px solid ${C2}`,borderRadius:6,padding:"3px 4px",color:T1,background:C1,outline:"none"}}/>
                    <button onClick={()=>cartDelta(l.id,1)} style={{width:24,height:24,borderRadius:6,background:O,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>+</button>
                  </div>
                  <button onClick={()=>setBlLignes(blLignes.filter(x=>x.id!==l.id))} style={{background:RDL,border:`1px solid ${RD}20`,borderRadius:6,cursor:"pointer",color:RD,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>{Ico.close}</button>
                </div>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
              {totalBl>0&&<span style={{fontFamily:FM,fontWeight:800,color:O,fontSize:14}}>{f(totalBl)}</span>}
              <Btn onClick={validerBL} color={GR} style={{flex:1}}>{Ico.check} Valider la réception</Btn>
            </div>
          </Card>
        )}
      </>)}
    </div>
  );

  // ════════════════════════════════════════════════════════
  // SORTIES
  // ════════════════════════════════════════════════════════
  const [sortTech,      setSortTech]      = useState("");
  const [sortTechOpen,  setSortTechOpen]  = useState(false);
  const [sortCart,      setSortCart]      = useState([]);
  const [sortStkSearch, setSortStkSearch] = useState("");
  const [sortSearch,    setSortSearch]    = useState("");
  const [sortHistTech,  setSortHistTech]  = useState("");
  const [sortHistMonth, setSortHistMonth] = useState("");
  const [showForm,      setShowForm]      = useState(false);

  const addToSortCart = (art) => {
    const inCart = sortCart.find(l=>l.nom===art.nom);
    const dispo = (art.qty||0) - (inCart?.qty||0);
    if(dispo<=0){ onToast(`Stock épuisé pour ${art.nom}`,"warn"); return; }
    setSortCart(prev=>{
      const ex=prev.find(l=>l.nom===art.nom);
      if(ex) return prev.map(l=>l.nom===art.nom?{...l,qty:Math.min(l.qty+1,art.qty||0)}:l);
      return [...prev,{id:Date.now()+Math.random(),nom:art.nom,cat:art.cat||"",type:art.type||"",qty:1,prix:art.prix||0,stock:art.qty||0}];
    });
  };
  const sortCartDelta = (id, delta) => {
    setSortCart(prev=>{
      const item=prev.find(l=>l.id===id);
      const max=item?.stock||99;
      return prev.map(l=>l.id===id?{...l,qty:Math.min(Math.max(0,l.qty+delta),max)}:l).filter(l=>l.qty>0);
    });
  };
  const sortCartSetQty = (id, val) => {
    const q=parseInt(val); if(isNaN(q)) return;
    setSortCart(prev=>{
      const item=prev.find(l=>l.id===id);
      const max=item?.stock||99;
      return q<=0?prev.filter(l=>l.id!==id):prev.map(l=>l.id===id?{...l,qty:Math.min(q,max)}:l);
    });
  };

  const doSortie = () => {
    if(!sortTech||sortCart.length===0) return;
    // ── Vérif stock bas ──
    const lowItems=sortCart.filter(item=>{
      const art=stk.find(a=>a.nom===item.nom);
      if(!art) return false;
      const newQty=(art.qty||0)-item.qty;
      return (art.seuil||0)>0 && newQty<=(art.seuil||0);
    });
    if(lowItems.length>0){
      const names=lowItems.map(i=>i.nom).join('\n• ');
      if(!window.confirm(`⚠️ Alerte stock bas !\nCes articles passeront sous ou au seuil d'alerte :\n• ${names}\n\nContinuer quand même ?`)) return;
    }
    const tech=techs.find(t=>t.id===sortTech);
    const tn=tech?techFullName(tech):sortTech;
    const date=new Date().toISOString().slice(0,10);
    const ym=new Date().toISOString().slice(0,7);
    let ns=[...stk];
    const newOuts=[];
    for(const item of sortCart){
      const art=ns.find(a=>a.nom===item.nom);
      if(!art||(art.qty||0)<item.qty){onToast(`Stock insuffisant pour ${item.nom}`,"warn");return;}
      ns=ns.map(a=>a.nom===item.nom?{...a,qty:(a.qty||0)-item.qty}:a);
      newOuts.push({id:Date.now()+Math.random(),techId:sortTech,techNom:tn,nom:item.nom,cat:item.cat||"",type:item.type||"",qty:item.qty,prix:item.prix||0,date,ym});
    }
    setStk(ns); onSaveStock(ns);
    const ns2=[...newOuts,...stkOut];
    setStkOut(ns2); onSaveStkOut(ns2);
    setSortCart([]); setSortTech(""); setShowForm(false);
    onToast(`${newOuts.length} article${newOuts.length>1?"s":""} sorti${newOuts.length>1?"s":""} → ${tn} ✓`);
  };

  const sortTotal=sortCart.reduce((s,l)=>s+(l.qty||0)*(l.prix||0),0);

  // ── Édition / suppression d'une sortie ──
  const [editSortId,   setEditSortId]   = useState(null);
  const [editSortQty,  setEditSortQty]  = useState(1);
  const [editSortTech, setEditSortTech] = useState("");

  const openEditSortie = (s) => { setEditSortId(s.id); setEditSortQty(s.qty); setEditSortTech(s.techId||""); };
  const cancelEditSortie = () => { setEditSortId(null); setEditSortQty(1); setEditSortTech(""); };

  const saveEditSortie = (s) => {
    const newQty = Math.max(1, parseInt(editSortQty)||1);
    const newTechId = editSortTech || s.techId;
    const tech = techs.find(t=>t.id===newTechId);
    const newTechNom = tech ? techFullName(tech) : s.techNom;
    const delta = newQty - s.qty; // positif = on prend plus du stock
    if(delta > 0) {
      const art = stk.find(a=>a.nom===s.nom);
      if(!art||(art.qty||0)<delta){ onToast(`Stock insuffisant pour ${s.nom}`,"warn"); return; }
    }
    const ns = stk.map(a=>a.nom===s.nom?{...a,qty:(a.qty||0)-delta}:a);
    setStk(ns); onSaveStock(ns);
    const ns2 = stkOut.map(x=>x.id===s.id?{...x,qty:newQty,techId:newTechId,techNom:newTechNom}:x);
    setStkOut(ns2); onSaveStkOut(ns2);
    cancelEditSortie();
    onToast("Sortie mise à jour ✓");
  };

  const deleteSortie = (s) => {
    if(!window.confirm(`Supprimer la sortie de "${s.nom}" (×${s.qty}) pour ${s.techNom} ?\nLe stock sera restauré.`)) return;
    const ns = stk.map(a=>a.nom===s.nom?{...a,qty:(a.qty||0)+s.qty}:a);
    setStk(ns); onSaveStock(ns);
    const ns2 = stkOut.filter(x=>x.id!==s.id);
    setStkOut(ns2); onSaveStkOut(ns2);
    onToast(`Sortie supprimée · ${s.qty}× ${s.nom} restauré au stock`);
  };

  const availableMonths=[...new Set(stkOut.map(s=>s.ym||s.date?.slice(0,7)).filter(Boolean))].sort((a,b)=>b.localeCompare(a));

  const filtOut = stkOut.filter(s=>{
    const matchSearch=!sortSearch||s.nom?.toLowerCase().includes(sortSearch.toLowerCase())||s.techNom?.toLowerCase().includes(sortSearch.toLowerCase());
    const matchTech=!sortHistTech||s.techId===sortHistTech;
    const matchMonth=!sortHistMonth||(s.ym||s.date?.slice(0,7))===sortHistMonth;
    return matchSearch&&matchTech&&matchMonth;
  });

  // Grouper par mois
  const outByMonth = filtOut.reduce((acc,s)=>{
    const key=s.ym||s.date?.slice(0,7)||"?";
    if(!acc[key]) acc[key]=[];
    acc[key].push(s);
    return acc;
  },{});
  const monthKeys=Object.keys(outByMonth).sort((a,b)=>b.localeCompare(a));
  const MOIS_FR=["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  const fmtYM=ym=>{ if(!ym||ym==="?") return "Date inconnue"; const [y,m]=ym.split("-"); return `${MOIS_FR[parseInt(m)]||m} ${y}`; };

  const sBtn={background:C3,border:`1px solid ${C2}`,borderRadius:10,cursor:"pointer",fontFamily:FM,fontWeight:800,fontSize:22,color:T2,width:48,height:48,display:"flex",alignItems:"center",justifyContent:"center"};

  const renderSorties = () => (
    <div>
      {isAdmin&&!showForm&&<Btn full onClick={()=>setShowForm(true)} style={{marginBottom:16,padding:"14px",fontSize:14,borderRadius:10}}>{Ico.out} Nouvelle sortie</Btn>}
      {isAdmin&&showForm&&(
        <div style={{marginBottom:16}}>
          {/* ── Header ── */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>{setShowForm(false);setSortCart([]);setSortTech("");setSortStkSearch("");}}
              style={{background:C3,border:`1px solid ${C2}`,borderRadius:8,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3,flexShrink:0}}>{Ico.back}</button>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:800,color:T1}}>Nouvelle sortie</div>
              {sortCart.length>0&&<div style={{fontSize:11,color:T4,marginTop:1}}>{sortCart.length} article{sortCart.length!==1?"s":""} dans le panier</div>}
            </div>
          </div>
          {/* ── Technicien ── */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:T3,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Technicien</label>
            {techs.length===0
              ? <div style={{background:OL,borderRadius:8,padding:"10px 14px",fontSize:12,color:OD,display:"flex",alignItems:"center",gap:7}}><span style={{flexShrink:0}}>{Ico.alert}</span><span>Aucun technicien — ajoutez-en dans l'onglet <b>Équipe</b></span></div>
              : <div style={{position:"relative"}}>
                  {/* Trigger */}
                  <button onClick={()=>setSortTechOpen(o=>!o)} style={{
                    display:"flex",alignItems:"center",gap:10,padding:"9px 12px",width:"100%",
                    borderRadius:10,border:`1.5px solid ${sortTech?O:C2}`,
                    background:sortTech?OL:C1,cursor:"pointer",fontFamily:FF,textAlign:"left",transition:"all .12s"
                  }}>
                    {sortTech
                      ? <><TechAvatar t={techs.find(t=>t.id===sortTech)} size={30}/>
                          <span style={{fontSize:13,fontWeight:700,color:OD,flex:1}}>{techFullName(techs.find(t=>t.id===sortTech))}</span></>
                      : <><div style={{width:30,height:30,borderRadius:15,background:C3,flexShrink:0}}/>
                          <span style={{fontSize:13,color:T5,flex:1}}>— Choisir un technicien —</span></>
                    }
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T4} strokeWidth="2.5" style={{flexShrink:0,transform:sortTechOpen?"rotate(180deg)":"none",transition:"transform .15s"}}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {/* Dropdown */}
                  {sortTechOpen&&(
                    <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:C1,border:`1.5px solid ${C2}`,borderRadius:10,boxShadow:"0 6px 20px rgba(0,0,0,.10)",zIndex:200,overflow:"hidden"}}>
                      {[...techs].sort((a,b)=>techFullName(a).localeCompare(techFullName(b),"fr")).map(t=>{
                        const selected=sortTech===t.id;
                        return (
                          <button key={t.id} onClick={()=>{setSortTech(t.id);setSortTechOpen(false);}} style={{
                            display:"flex",alignItems:"center",gap:10,padding:"10px 12px",width:"100%",
                            border:"none",borderBottom:`1px solid ${C2}`,
                            background:selected?OL:C1,cursor:"pointer",fontFamily:FF,textAlign:"left"
                          }}>
                            <TechAvatar t={t} size={32}/>
                            <span style={{fontSize:13,fontWeight:selected?700:500,color:selected?OD:T1,flex:1}}>{techFullName(t)}</span>
                            {selected&&<span style={{color:O,display:"flex"}}>{Ico.check}</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
            }
          </div>
          {/* ── Stock sélectionnable ── */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
              Stock disponible · {stk.filter(a=>(a.qty||0)>0).length} article{stk.filter(a=>(a.qty||0)>0).length!==1?"s":""}
            </div>
            <div style={{position:"relative",marginBottom:10}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
              <input value={sortStkSearch} onChange={e=>setSortStkSearch(e.target.value)} placeholder="Filtrer le stock…"
                style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"9px 12px 9px 34px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"}}/>
            </div>
            {stk.filter(a=>(a.qty||0)>0).length===0
              ? <Card style={{textAlign:"center",padding:"32px",color:T4,fontSize:13}}>Aucun article disponible en stock</Card>
              : <div style={{display:"grid",gridTemplateColumns:isMob?"1fr 1fr":"repeat(3,1fr)",gap:8}}>
                  {stk
                    .filter(a=>(a.qty||0)>0)
                    .filter(a=>!sortStkSearch||a.nom.toLowerCase().includes(sortStkSearch.toLowerCase())||a.cat?.toLowerCase().includes(sortStkSearch.toLowerCase()))
                    .map(a=>{
                      const inCart=sortCart.find(l=>l.nom===a.nom);
                      const ts=a.type?TYPE_STYLE[a.type]:null;
                      const remaining=(a.qty||0)-(inCart?.qty||0);
                      const photo=catalogue.find(c=>c.nom===a.nom)?.photo||"";
                      return (
                        <button key={a.id||a.nom} onClick={()=>addToSortCart(a)} style={{
                          background:inCart?OL:C1,border:`1.5px solid ${inCart?O:C2}`,borderRadius:10,
                          padding:"10px 12px",textAlign:"left",cursor:"pointer",fontFamily:FF,
                          display:"flex",flexDirection:"column",gap:5,position:"relative",
                          transition:"all .12s",boxShadow:inCart?`0 0 0 1px ${O}30`:SH,
                          opacity:remaining<=0?0.45:1
                        }}>
                          {inCart&&<span style={{position:"absolute",top:-6,right:-6,background:O,color:"#fff",borderRadius:10,fontSize:10,fontWeight:900,padding:"2px 6px",minWidth:20,textAlign:"center"}}>{inCart.qty}</span>}
                          <div style={{display:"flex",alignItems:"center",gap:7}}>
                            {photo&&<img src={photo} alt={a.nom} style={{width:32,height:32,objectFit:"cover",borderRadius:6,flexShrink:0,border:`1px solid ${C2}`}}/>}
                            <div style={{fontSize:12,fontWeight:700,color:inCart?OD:T1,lineHeight:1.3,flex:1,minWidth:0,paddingRight:12}}>{a.nom}</div>
                          </div>
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}}>
                            {a.cat&&<Badge bg={inCart?O+"20":OL} c={inCart?OD:O}>{a.cat}</Badge>}
                            {ts&&<Badge bg={ts.bg} c={ts.c}>{a.type}</Badge>}
                          </div>
                          <div style={{fontSize:10,fontFamily:FM,fontWeight:700,marginTop:1,color:remaining>5?GR:remaining>2?OD:RD}}>{remaining} dispo</div>
                          <div style={{position:"absolute",bottom:8,right:8,width:22,height:22,borderRadius:6,background:inCart?O:C3,display:"flex",alignItems:"center",justifyContent:"center",color:inCart?"#fff":T4,transition:"all .12s"}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          </div>
                        </button>
                      );
                    })}
                </div>
            }
          </div>
          {/* ── Panier sorties ── */}
          {sortCart.length>0&&(
            <Card style={{position:"sticky",bottom:isMob?70:16,boxShadow:"0 -2px 16px rgba(0,0,0,.08)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:800,color:T1,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{background:O,color:"#fff",borderRadius:8,fontSize:10,fontWeight:900,padding:"2px 7px"}}>{sortCart.length}</span>
                  article{sortCart.length!==1?"s":""} sélectionné{sortCart.length!==1?"s":""}
                </div>
                <button onClick={()=>setSortCart([])} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:T5,textDecoration:"underline"}}>Vider</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {sortCart.map(l=>(
                  <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:C3,borderRadius:8}}>
                    <div style={{width:3,height:32,borderRadius:2,flexShrink:0,background:l.type==="Consommable"?BL:l.type==="Outillage"?PU:C2}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:600,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.nom}</div>
                      <div style={{fontSize:10,color:T5,fontFamily:FM}}>max {l.stock} en stock</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <button onClick={()=>sortCartDelta(l.id,-1)} style={{width:24,height:24,borderRadius:6,background:C2,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",color:T2}}>−</button>
                      <input type="number" value={l.qty} onChange={e=>sortCartSetQty(l.id,e.target.value)} min="1" max={l.stock}
                        style={{width:36,textAlign:"center",fontFamily:FM,fontWeight:800,fontSize:13,border:`1.5px solid ${C2}`,borderRadius:6,padding:"3px 4px",color:T1,background:C1,outline:"none"}}/>
                      <button onClick={()=>sortCartDelta(l.id,1)} style={{width:24,height:24,borderRadius:6,background:O,border:"none",cursor:"pointer",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>+</button>
                    </div>
                    <button onClick={()=>setSortCart(sortCart.filter(x=>x.id!==l.id))} style={{background:RDL,border:`1px solid ${RD}20`,borderRadius:6,cursor:"pointer",color:RD,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0}}>{Ico.close}</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                {sortTotal>0&&<span style={{fontFamily:FM,fontWeight:800,color:O,fontSize:14}}>{f(sortTotal)}</span>}
                <Btn onClick={doSortie} disabled={!sortTech||techs.length===0} color={GR} style={{flex:1}}>{Ico.check} Valider la sortie</Btn>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Historique */}
      <div style={{marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{fontSize:12,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:.8}}>
          Historique · {stkOut.length} sortie{stkOut.length!==1?"s":""}
        </div>
        {stkOut.length>0&&<Btn small outline color={T3} onClick={()=>exportCSV(stkOut,[
          {key:"date",label:"Date"},{key:"techNom",label:"Technicien"},{key:"nom",label:"Article"},
          {key:"type",label:"Type"},{key:"qty",label:"Qté"},{key:"prix",label:"Prix unit."}
        ],"historique-sorties")}>{Ico.csv}{!isMob&&" Export CSV"}</Btn>}
      </div>

      {/* Filtres */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:140,position:"relative"}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
          <input value={sortSearch} onChange={e=>setSortSearch(e.target.value)} placeholder="Rechercher un article…"
            style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"9px 12px 9px 34px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"}}/>
        </div>
        {techs.length>0&&(
          <select value={sortHistTech} onChange={e=>setSortHistTech(e.target.value)}
            style={{background:C1,border:`1.5px solid ${sortHistTech?O:C2}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:sortHistTech?T1:T5,fontFamily:FF,outline:"none",cursor:"pointer",minWidth:130}}>
            <option value="">Tous les techs</option>
            {[...techs].sort((a,b)=>techFullName(a).localeCompare(techFullName(b),"fr")).map(t=><option key={t.id} value={t.id}>{techFullName(t)}</option>)}
          </select>
        )}
        {availableMonths.length>0&&(
          <select value={sortHistMonth} onChange={e=>setSortHistMonth(e.target.value)}
            style={{background:C1,border:`1.5px solid ${sortHistMonth?O:C2}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:sortHistMonth?T1:T5,fontFamily:FF,outline:"none",cursor:"pointer",minWidth:120}}>
            <option value="">Tous les mois</option>
            {availableMonths.map(ym=><option key={ym} value={ym}>{fmtYM(ym)}</option>)}
          </select>
        )}
      </div>

      {filtOut.length===0
        ? <Card style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{width:48,height:48,borderRadius:14,background:C3,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:T4}}>{Ico.out}</div>
            <div style={{color:T2,fontSize:13,fontWeight:600,marginBottom:2}}>Aucune sortie</div>
            <div style={{color:T5,fontSize:12}}>{sortSearch||sortHistTech?"Aucun résultat pour ce filtre":"Enregistrez vos premières sorties"}</div>
          </Card>
        : <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {monthKeys.map(ym=>{
              const entries=outByMonth[ym];
              const totalQty=entries.reduce((s,e)=>s+e.qty,0);
              const totalVal=entries.reduce((s,e)=>s+e.qty*(e.prix||0),0);
              const tech=sortHistTech?techs.find(t=>t.id===sortHistTech):null;
              return (
                <div key={ym}>
                  {/* En-tête mois */}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,padding:"0 4px"}}>
                    <div style={{fontSize:11,fontWeight:800,color:T2,textTransform:"uppercase",letterSpacing:.8}}>{fmtYM(ym)}</div>
                    <div style={{display:"flex",gap:10,fontSize:11,color:T4}}>
                      <span style={{fontFamily:FM,fontWeight:700}}>{totalQty} article{totalQty!==1?"s":""}</span>
                      {totalVal>0&&<span style={{color:O,fontFamily:FM,fontWeight:700}}>{f(totalVal)}</span>}
                    </div>
                  </div>
                  {/* Lignes */}
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    {entries.map(s=>{
                      const t=techs.find(x=>x.id===s.techId);
                      const isEditing=editSortId===s.id;
                      return (
                        <Card key={s.id} style={{padding:"10px 14px"}}>
                          {isEditing ? (
                            /* ── Mode édition ── */
                            <div>
                              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                                <div style={{flex:1,fontSize:13,fontWeight:700,color:T1}}>{s.nom}</div>
                                <button onClick={cancelEditSortie} style={{background:C3,border:`1px solid ${C2}`,borderRadius:6,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T4,padding:0}}>{Ico.close}</button>
                              </div>
                              {/* Tech */}
                              {techs.length>0&&(
                                <div style={{marginBottom:10}}>
                                  <label style={{fontSize:10,fontWeight:700,color:T4,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4}}>Technicien</label>
                                  <select value={editSortTech} onChange={e=>setEditSortTech(e.target.value)}
                                    style={{width:"100%",background:C1,border:`1.5px solid ${editSortTech?O:C2}`,borderRadius:8,padding:"8px 10px",fontSize:13,color:T1,fontFamily:FF,outline:"none",cursor:"pointer"}}>
                                    {[...techs].sort((a,b)=>techFullName(a).localeCompare(techFullName(b),"fr")).map(t=><option key={t.id} value={t.id}>{techFullName(t)}</option>)}
                                  </select>
                                </div>
                              )}
                              {/* Quantité */}
                              <div style={{marginBottom:12}}>
                                <label style={{fontSize:10,fontWeight:700,color:T4,textTransform:"uppercase",letterSpacing:.8,display:"block",marginBottom:4}}>Quantité</label>
                                <div style={{display:"flex",alignItems:"center",gap:8}}>
                                  <button onClick={()=>setEditSortQty(q=>Math.max(1,q-1))} style={{width:32,height:32,borderRadius:8,background:C3,border:`1px solid ${C2}`,cursor:"pointer",fontWeight:900,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:T2}}>−</button>
                                  <input type="number" value={editSortQty} min="1"
                                    onChange={e=>setEditSortQty(Math.max(1,parseInt(e.target.value)||1))}
                                    style={{flex:1,textAlign:"center",fontSize:20,fontWeight:900,fontFamily:FM,border:`1.5px solid ${C2}`,borderRadius:8,padding:"6px",color:T1,background:C1,outline:"none"}}/>
                                  <button onClick={()=>setEditSortQty(q=>q+1)} style={{width:32,height:32,borderRadius:8,background:O,border:"none",cursor:"pointer",fontWeight:900,fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}>+</button>
                                </div>
                              </div>
                              {/* Actions */}
                              <div style={{display:"flex",gap:8}}>
                                <Btn full outline color={T3} onClick={cancelEditSortie}>Annuler</Btn>
                                <Btn full color={GR} onClick={()=>saveEditSortie(s)}>{Ico.check} Enregistrer</Btn>
                              </div>
                            </div>
                          ) : (
                            /* ── Mode normal ── */
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              {t?<TechAvatar t={t} size={34}/>
                                :<div style={{width:34,height:34,borderRadius:17,background:C3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:T4}}>?</div>}
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:13,fontWeight:700,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.nom}</div>
                                <div style={{display:"flex",gap:6,marginTop:2,alignItems:"center",flexWrap:"wrap"}}>
                                  <span style={{fontSize:11,color:T4}}>{s.techNom}</span>
                                  <span style={{fontSize:10,color:T5}}>·</span>
                                  <span style={{fontSize:11,color:T5}}>{s.date?fmtDate(s.date):s.ym||"—"}</span>
                                  {s.type&&<Badge bg={TYPE_STYLE[s.type]?.bg||C3} c={TYPE_STYLE[s.type]?.c||T4}>{s.type}</Badge>}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0,marginRight:4}}>
                                <div style={{fontFamily:FM,fontWeight:900,color:O,fontSize:15}}>×{s.qty}</div>
                                {s.prix>0&&<div style={{fontSize:10,color:T5,fontFamily:FM}}>{f(s.qty*s.prix)}</div>}
                              </div>
                              {isAdmin&&(
                                <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                                  <button onClick={()=>openEditSortie(s)} title="Modifier"
                                    style={{width:28,height:28,borderRadius:6,background:OL,border:`1px solid ${O}30`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:O,padding:0}}>
                                    {Ico.edit}
                                  </button>
                                  <button onClick={()=>deleteSortie(s)} title="Supprimer"
                                    style={{width:28,height:28,borderRadius:6,background:RDL,border:`1px solid ${RD}20`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:RD,padding:0}}>
                                    {Ico.trash}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );

  // ════════════════════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════════════════════
  const renderStats = () => {
    // Par mois (6 derniers)
    const byMonth = stkOut.reduce((acc,s)=>{
      const k=s.ym||s.date?.slice(0,7)||"?";
      if(!acc[k]) acc[k]={qty:0,val:0};
      acc[k].qty+=(s.qty||0);
      acc[k].val+=(s.qty||0)*(s.prix||0);
      return acc;
    },{});
    const mKeys=Object.keys(byMonth).sort((a,b)=>a.localeCompare(b)).slice(-6);
    const maxQty=Math.max(...mKeys.map(k=>byMonth[k].qty),1);

    // Top articles
    const byArt=stkOut.reduce((acc,s)=>{
      if(!acc[s.nom]) acc[s.nom]={qty:0,val:0,nom:s.nom};
      acc[s.nom].qty+=(s.qty||0);
      acc[s.nom].val+=(s.qty||0)*(s.prix||0);
      return acc;
    },{});
    const topArts=Object.values(byArt).sort((a,b)=>b.qty-a.qty).slice(0,6);
    const maxArt=Math.max(...topArts.map(a=>a.qty),1);

    // Par tech
    const byTech=stkOut.reduce((acc,s)=>{
      const k=s.techId||s.techNom||"?";
      if(!acc[k]) acc[k]={qty:0,val:0,techId:s.techId,techNom:s.techNom};
      acc[k].qty+=(s.qty||0);
      acc[k].val+=(s.qty||0)*(s.prix||0);
      return acc;
    },{});
    const topTechs=Object.values(byTech).sort((a,b)=>b.qty-a.qty);
    const maxTech=Math.max(...topTechs.map(t=>t.qty),1);

    const barColors=[O,BL,PU,GR,"#f59e0b","#06b6d4"];

    return (
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {/* Consommation par mois */}
        <Card>
          <div style={{fontSize:12,fontWeight:800,color:T1,marginBottom:16,display:"flex",alignItems:"center",gap:6}}>
            {Ico.stats} Consommation mensuelle
          </div>
          {stkOut.length===0
            ? <div style={{textAlign:"center",color:T5,fontSize:12,padding:"20px 0"}}>Aucune sortie enregistrée</div>
            : <div style={{display:"flex",alignItems:"flex-end",gap:isMob?6:10,height:110}}>
                {mKeys.map(ym=>{
                  const d=byMonth[ym];
                  const pct=d.qty/maxQty;
                  return (
                    <div key={ym} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <div style={{fontSize:10,fontFamily:FM,fontWeight:800,color:O}}>{d.qty}</div>
                      <div style={{width:"100%",background:O,borderRadius:"4px 4px 0 0",minHeight:4,height:Math.max(4,pct*72),transition:"height .3s"}}/>
                      {d.val>0&&<div style={{fontSize:8,color:T5,fontFamily:FM}}>{f(d.val)}</div>}
                      <div style={{fontSize:9,color:T4,textAlign:"center",fontWeight:600}}>{fmtYM(ym).split(" ")[0]}</div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>

        {/* Top articles */}
        <Card>
          <div style={{fontSize:12,fontWeight:800,color:T1,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            {Ico.box} Articles les plus consommés
          </div>
          {topArts.length===0
            ? <div style={{textAlign:"center",color:T5,fontSize:12,padding:"20px 0"}}>Aucune donnée</div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {topArts.map((a,i)=>{
                  const catItem=catalogue.find(c=>c.nom===a.nom);
                  return (
                    <div key={a.nom}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,gap:8}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                          {catItem?.photo
                            ? <img src={catItem.photo} alt={a.nom} style={{width:24,height:24,borderRadius:4,objectFit:"cover",flexShrink:0}}/>
                            : <div style={{width:8,height:8,borderRadius:2,flexShrink:0,background:barColors[i%barColors.length]}}/>
                          }
                          <span style={{fontSize:12,fontWeight:600,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.nom}</span>
                        </div>
                        <span style={{fontSize:11,fontFamily:FM,fontWeight:800,color:barColors[i%barColors.length],flexShrink:0}}>{a.qty} pcs</span>
                      </div>
                      <div style={{height:6,background:C2,borderRadius:3}}>
                        <div style={{height:"100%",background:barColors[i%barColors.length],borderRadius:3,width:`${(a.qty/maxArt)*100}%`,transition:"width .4s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>

        {/* Par technicien */}
        <Card>
          <div style={{fontSize:12,fontWeight:800,color:T1,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>
            {Ico.users} Consommation par technicien
          </div>
          {topTechs.length===0
            ? <div style={{textAlign:"center",color:T5,fontSize:12,padding:"20px 0"}}>Aucune donnée</div>
            : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                {topTechs.map((t,i)=>{
                  const tech=techs.find(x=>x.id===t.techId);
                  return (
                    <div key={t.techId||i} style={{display:"flex",alignItems:"center",gap:10}}>
                      {tech
                        ? <TechAvatar t={tech} size={34}/>
                        : <div style={{width:34,height:34,borderRadius:17,background:C3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,fontWeight:700,color:T4}}>?</div>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                          <span style={{fontSize:12,fontWeight:600,color:T1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.techNom||"Inconnu"}</span>
                          <span style={{fontSize:11,fontFamily:FM,fontWeight:800,color:PU,flexShrink:0,marginLeft:8}}>{t.qty} pcs</span>
                        </div>
                        <div style={{height:6,background:C2,borderRadius:3}}>
                          <div style={{height:"100%",background:PU,borderRadius:3,width:`${(t.qty/maxTech)*100}%`,transition:"width .4s"}}/>
                        </div>
                        {t.val>0&&<div style={{fontSize:9,color:T5,fontFamily:FM,marginTop:2}}>{f(t.val)} consommés</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════
  // CATALOGUE
  // ════════════════════════════════════════════════════════
  const [catSearch, setCatSearch] = useState("");
  const [catForm,   setCatForm]   = useState(null);
  const [catNom,    setCatNom]    = useState("");
  const [catCat,    setCatCat]    = useState("");
  const [catType,   setCatType]   = useState("");
  const [catPrix,   setCatPrix]   = useState("");
  const [catSeuil,  setCatSeuil]  = useState("");
  const [catPhoto,  setCatPhoto]  = useState("");

  const openCatForm = (item=null) => {
    setCatForm(item||{}); setCatNom(item?.nom||""); setCatCat(item?.cat||"");
    setCatType(item?.type||""); setCatPrix(item?.prix||""); setCatSeuil(item?.seuil||"");
    setCatPhoto(item?.photo||"");
    scrollTop();
  };

  const handleCatPhotoChange = e => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=300;
        const ratio=Math.min(MAX/img.width,MAX/img.height,1);
        const w=Math.round(img.width*ratio);
        const h=Math.round(img.height*ratio);
        const canvas=document.createElement("canvas");
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL("image/jpeg",0.80);
        setCatPhoto(compressed);
        onToast(`Photo compressée · ${Math.round(compressed.length*0.75/1024)} Ko`);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const saveCat = () => {
    if(!catNom.trim()) return;
    const prix=parseFloat(String(catPrix).replace(",","."))||0;
    const seuil=parseInt(catSeuil)||0;
    const entry={nom:catNom.trim(),cat:catCat.trim(),type:catType,prix,seuil,photo:catPhoto||""};
    const nc=catForm?.id?catalogue.map(c=>c.id===catForm.id?{...c,...entry}:c):[...catalogue,{id:Date.now(),...entry}];
    setCatalogue(nc);setTimeout(()=>onSaveMeta&&onSaveMeta(),300);setCatForm(null);onToast("Catalogue mis à jour");
  };
  const deleteCat = id => {
    if(!window.confirm("Supprimer cet article du catalogue ?")) return;
    const nc=catalogue.filter(c=>c.id!==id);setCatalogue(nc);setTimeout(()=>onSaveMeta&&onSaveMeta(),300);onToast("Article supprimé");
  };
  const filtCat=catalogue.filter(c=>!catSearch||c.nom?.toLowerCase().includes(catSearch.toLowerCase())||c.cat?.toLowerCase().includes(catSearch.toLowerCase()));
  const catGroups=[...new Set(catalogue.map(c=>c.cat||""))].filter(Boolean).sort();

  const renderCatalogue = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:T4}}>{catalogue.length} référence{catalogue.length!==1?"s":""}</div>
        {isAdmin&&!catForm&&<Btn small onClick={()=>openCatForm()}>{Ico.plus} Ajouter</Btn>}
        {catForm&&<Btn small outline color={T3} onClick={()=>setCatForm(null)}>Annuler</Btn>}
      </div>
      {catForm&&(
        <Card style={{marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:O,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>{catForm.id?<>{Ico.edit}Modifier</>:<>{Ico.plus}Nouvel article</>}</div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"2fr 1fr",gap:10,marginBottom:10}}>
            <Input label="Désignation *" value={catNom} onChange={e=>setCatNom(e.target.value)} placeholder="Nom de l'article"/>
            <div>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                <label style={{fontSize:11,fontWeight:600,color:T3}}>Catégorie</label>
                <select value={catCat} onChange={e=>setCatCat(e.target.value)}
                  style={{background:C1,border:`1.5px solid ${catCat?O:C2}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:catCat?T1:T5,fontFamily:FF,outline:"none",cursor:"pointer"}}
                  onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=catCat?O:C2}>
                  <option value="">— Choisir —</option>
                  <option value="Fibre D3">Fibre D3</option>
                  <option value="Fibre D2">Fibre D2</option>
                  <option value="ADSL">ADSL</option>
                </select>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:isMob?"1fr":"1fr 130px 130px",gap:10,marginBottom:14}}>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              <label style={{fontSize:11,fontWeight:600,color:T3}}>Type de matériel</label>
              <select value={catType} onChange={e=>setCatType(e.target.value)}
                style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"10px 12px",fontSize:13,color:catType?T1:T5,fontFamily:FF,outline:"none",cursor:"pointer"}}
                onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}>
                <option value="">— Non défini —</option>
                {TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Prix unitaire (€)" type="number" value={catPrix} onChange={e=>setCatPrix(e.target.value)} placeholder="0.00" style={{textAlign:"right"}}/>
            <Input label="Seuil alerte (qté min)" type="number" value={catSeuil} onChange={e=>setCatSeuil(e.target.value)} placeholder="0" style={{textAlign:"center"}}/>
          </div>
          {catSeuil>0&&<div style={{background:RDL,borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:RD,display:"flex",alignItems:"center",gap:7}}>
            <span style={{flexShrink:0}}>{Ico.alert}</span><span>Alerte déclenchée quand la quantité en stock ≤ <b>{catSeuil}</b></span>
          </div>}
          {/* Photo article */}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:6}}>Photo de l'article <span style={{color:T5,fontWeight:400}}>(optionnel)</span></label>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              {catPhoto
                ? <img src={catPhoto} alt="article" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0,border:`1.5px solid ${C2}`}}/>
                : <div style={{width:56,height:56,borderRadius:8,background:C3,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,border:`1.5px dashed ${C2}`,color:T5}}>{Ico.img}</div>
              }
              <div>
                <label style={{display:"inline-flex",alignItems:"center",gap:6,background:C3,border:`1px solid ${C2}`,borderRadius:7,padding:"7px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:T2}}>
                  {Ico.img} {catPhoto?"Changer la photo":"Ajouter une photo"}
                  <input type="file" accept="image/*" onChange={handleCatPhotoChange} style={{display:"none"}}/>
                </label>
                {catPhoto&&<button onClick={()=>setCatPhoto("")} style={{marginLeft:8,background:"none",border:"none",fontSize:11,color:RD,cursor:"pointer",textDecoration:"underline"}}>Supprimer</button>}
                <div style={{fontSize:10,color:T5,marginTop:4}}>JPG, PNG — compressée automatiquement</div>
              </div>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={saveCat} disabled={!catNom.trim()} color={GR}>{Ico.check} {catForm.id?"Mettre à jour":"Ajouter"}</Btn>
          </div>
        </Card>
      )}
      <div style={{position:"relative",marginBottom:12}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
        <input value={catSearch} onChange={e=>setCatSearch(e.target.value)} placeholder="Rechercher…"
          style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"10px 12px 10px 34px",fontSize:13,color:T1,fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"}}/>
      </div>
      {filtCat.length===0
        ? <Card style={{textAlign:"center",padding:"52px 20px"}}>
            <div style={{width:60,height:60,borderRadius:18,background:catSearch?C3:OL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:catSearch?T4:O}}>{catSearch?Ico.noResult:Ico.bookLg}</div>
            <div style={{color:T1,fontSize:14,fontWeight:700,marginBottom:4}}>{catSearch?"Aucun résultat":"Catalogue vide"}</div>
            <div style={{color:T5,fontSize:12}}>Ajoutez vos premières références</div>
          </Card>
        : <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {(()=>{
              const ORDER=["Fibre D3","Fibre D2","ADSL"];
              const CAT_COLOR={"Fibre D3":"#0ea5e9","Fibre D2":"#8b5cf6","ADSL":"#16a34a"};
              const groups={};
              filtCat.forEach(c=>{
                const k=c.cat||"Autre";
                if(!groups[k]) groups[k]=[];
                groups[k].push(c);
              });
              const keys=[...ORDER.filter(k=>groups[k]),...Object.keys(groups).filter(k=>!ORDER.includes(k)&&groups[k])];
              return keys.map(cat=>(
                <div key={cat}>
                  {/* Header catégorie */}
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                    <div style={{width:3,height:16,borderRadius:2,background:CAT_COLOR[cat]||T4,flexShrink:0}}/>
                    <span style={{fontSize:11,fontWeight:800,color:CAT_COLOR[cat]||T4,textTransform:"uppercase",letterSpacing:1}}>{cat}</span>
                    <span style={{fontSize:10,color:T5,fontWeight:500}}>· {groups[cat].length} article{groups[cat].length>1?"s":""}</span>
                    <div style={{flex:1,height:1,background:CAT_COLOR[cat]||C2,opacity:.2}}/>
                  </div>
                  {/* Articles */}
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {[...groups[cat]].sort((a,b)=>{
                      const pa=a.prix>0?0:1, pb=b.prix>0?0:1;
                      if(pa!==pb) return pa-pb;
                      if(pa===0) return (b.prix||0)-(a.prix||0);
                      return (a.nom||"").localeCompare(b.nom||"","fr");
                    }).map(c=>{
                      const ts=c.type?TYPE_STYLE[c.type]:null;
                      return (
                        <Card key={c.id} style={{padding:"12px 16px",display:"flex",alignItems:"center",gap:12,borderLeft:`3px solid ${CAT_COLOR[cat]||C2}`}}>
                          {c.photo
                            ? <img src={c.photo} alt={c.nom} style={{width:44,height:44,borderRadius:8,objectFit:"cover",flexShrink:0,border:`1.5px solid ${C2}`}}/>
                            : c.type
                              ? <div style={{width:4,height:40,borderRadius:2,flexShrink:0,background:ts?.c||C2}}/>
                              : null
                          }
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:700,color:T1}}>{c.nom}</div>
                            <div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}>
                              {ts&&<Badge bg={ts.bg} c={ts.c}>{c.type}</Badge>}
                              {c.seuil>0&&<Badge bg={RDL} c={RD} style={{display:"inline-flex",alignItems:"center",gap:4}}><span style={{display:"flex"}}>{Ico.alert}</span>seuil {c.seuil}</Badge>}
                            </div>
                          </div>
                          {c.prix>0&&<div style={{textAlign:"right",flexShrink:0}}><div style={{fontFamily:FM,fontWeight:700,color:T2,fontSize:13}}>{f(c.prix)}</div></div>}
                          {isAdmin&&(
                            <div style={{display:"flex",gap:4,flexShrink:0}}>
                              <button onClick={()=>openCatForm(c)} title="Modifier" style={{background:C3,border:`1px solid ${C2}`,borderRadius:6,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3}}>{Ico.edit}</button>
                              <button onClick={()=>deleteCat(c.id)} title="Supprimer" style={{background:RDL,border:`1px solid ${RD}30`,borderRadius:6,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:RD}}>{Ico.trash}</button>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>
      }
    </div>
  );

  // ════════════════════════════════════════════════════════
  // TECHNICIENS
  // ════════════════════════════════════════════════════════
  const [techForm,   setTechForm]   = useState(null);
  const [techPrenom, setTechPrenom] = useState("");
  const [techNom,    setTechNom]    = useState("");
  const [techPhoto,  setTechPhoto]  = useState("");

  // Compatibilité ancien format {n} → {prenom, nom}
  const techFullName = t => t.prenom||t.nom ? `${t.prenom||""} ${t.nom||""}`.trim() : (t.n||"");
  const techInitials = t => { const fn=techFullName(t); return fn.split(" ").map(w=>w[0]).filter(Boolean).slice(0,2).join("").toUpperCase()||"?"; };

  const openTechForm = (t=null) => {
    setTechForm(t||{});
    setTechPrenom(t?.prenom||(t?.n?.split(" ")[0]||""));
    setTechNom(t?.nom||(t?.n?.split(" ").slice(1).join(" ")||""));
    setTechPhoto(t?.photo||"");
  };
  const handlePhotoChange = e => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const img=new Image();
      img.onload=()=>{
        const MAX=200;
        const ratio=Math.min(MAX/img.width, MAX/img.height, 1);
        const w=Math.round(img.width*ratio);
        const h=Math.round(img.height*ratio);
        const canvas=document.createElement("canvas");
        canvas.width=w; canvas.height=h;
        const ctx=canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL("image/jpeg",0.75);
        setTechPhoto(compressed);
        const kb=Math.round(compressed.length*0.75/1024);
        onToast(`Photo compressée · ${kb} Ko`);
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  };
  const saveTech = () => {
    if(!techPrenom.trim()&&!techNom.trim()) return;
    const entry={prenom:techPrenom.trim(),nom:techNom.trim(),photo:techPhoto,n:`${techPrenom.trim()} ${techNom.trim()}`.trim()};
    const nt=techForm?.id?techs.map(t=>t.id===techForm.id?{...t,...entry}:t):[...techs,{id:"tech_"+Date.now(),...entry}];
    setTechs(nt);setTimeout(()=>onSaveTechs&&onSaveTechs(nt),200);
    setTechForm(null);onToast(techForm?.id?"Technicien mis à jour":"Technicien ajouté ✓");
  };
  const deleteTech = id => {
    if(!window.confirm("Supprimer ce technicien ?")) return;
    const nt=techs.filter(t=>t.id!==id);setTechs(nt);setTimeout(()=>onSaveTechs&&onSaveTechs(nt),200);onToast("Technicien supprimé");
  };

  const TechAvatar = ({t, size=44}) => (
    t.photo
      ? <img src={t.photo} alt={techFullName(t)} style={{width:size,height:size,borderRadius:size/2,objectFit:"cover",flexShrink:0,border:`2px solid ${C2}`}}/>
      : <div style={{width:size,height:size,borderRadius:size/2,background:OL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:size*0.33,fontWeight:900,color:O}}>
          {techInitials(t)}
        </div>
  );

  const renderTechs = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:12,color:T4}}>{techs.length} technicien{techs.length!==1?"s":""}</div>
        {isAdmin&&!techForm&&<Btn small onClick={()=>openTechForm()}>{Ico.plus} Ajouter</Btn>}
        {techForm&&<Btn small outline color={T3} onClick={()=>setTechForm(null)}>Annuler</Btn>}
      </div>
      {techForm&&(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:O,marginBottom:14,display:"flex",alignItems:"center",gap:6}}>{techForm.id?<>{Ico.edit}Modifier</>:<>{Ico.plus}Nouveau technicien</>}</div>
          {/* Photo */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <div style={{position:"relative",flexShrink:0}}>
              {techPhoto
                ? <img src={techPhoto} alt="photo" style={{width:72,height:72,borderRadius:36,objectFit:"cover",border:`2px solid ${C2}`}}/>
                : <div style={{width:72,height:72,borderRadius:36,background:C3,border:`2px dashed ${C2}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,color:T5}}>
                    {Ico.usersLg}
                  </div>
              }
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:6}}>Photo d'identité</label>
              <label style={{display:"inline-flex",alignItems:"center",gap:6,background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:600,color:T3,cursor:"pointer"}}>
                {Ico.plus} {techPhoto?"Changer":"Choisir une photo"}
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{display:"none"}}/>
              </label>
              {techPhoto&&<button onClick={()=>setTechPhoto("")} style={{marginLeft:8,background:"none",border:"none",fontSize:11,color:RD,cursor:"pointer",textDecoration:"underline"}}>Supprimer</button>}
              <div style={{fontSize:10,color:T5,marginTop:4}}>JPG, PNG — compressée automatiquement</div>
            </div>
          </div>
          {/* Nom / Prénom */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <Input label="Prénom *" value={techPrenom} onChange={e=>setTechPrenom(e.target.value)} placeholder="Jean" onKeyDown={e=>e.key==="Enter"&&saveTech()}/>
            <Input label="Nom *" value={techNom} onChange={e=>setTechNom(e.target.value)} placeholder="Dupont" onKeyDown={e=>e.key==="Enter"&&saveTech()}/>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <Btn onClick={saveTech} disabled={!techPrenom.trim()&&!techNom.trim()} color={GR}>{Ico.check} {techForm.id?"Mettre à jour":"Ajouter"}</Btn>
          </div>
        </Card>
      )}
      {techs.length===0
        ? <Card style={{textAlign:"center",padding:"52px 20px"}}>
            <div style={{width:60,height:60,borderRadius:18,background:OL,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",color:O}}>{Ico.usersLg}</div>
            <div style={{color:T1,fontSize:14,fontWeight:700,marginBottom:4}}>Aucun technicien</div>
            <div style={{color:T5,fontSize:12}}>Ajoutez votre équipe pour gérer les sorties</div>
            {isAdmin&&<div style={{marginTop:16}}><Btn onClick={()=>openTechForm()}>{Ico.plus} Ajouter</Btn></div>}
          </Card>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[...techs].sort((a,b)=>techFullName(a).localeCompare(techFullName(b),"fr")).map(t=>{
              const sorties=stkOut.filter(s=>s.techId===t.id);
              const totalVal=sorties.reduce((s,x)=>s+(x.qty||0)*(x.prix||0),0);
              const totalQty=sorties.reduce((s,x)=>s+(x.qty||0),0);
              // Top 3 articles consommés
              const byArt=sorties.reduce((acc,s)=>{
                if(!acc[s.nom]) acc[s.nom]={nom:s.nom,qty:0};
                acc[s.nom].qty+=s.qty||0; return acc;
              },{});
              const topArts=Object.values(byArt).sort((a,b)=>b.qty-a.qty).slice(0,3);
              return (
              <Card key={t.id} style={{padding:"14px 16px"}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <TechAvatar t={t} size={52}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:T1}}>{techFullName(t)}</div>
                    <div style={{display:"flex",gap:10,marginTop:3,flexWrap:"wrap"}}>
                      <span style={{fontSize:11,color:T4}}>{sorties.length} sortie{sorties.length!==1?"s":""}</span>
                      {totalQty>0&&<span style={{fontSize:11,color:T4}}>· {totalQty} article{totalQty!==1?"s":""}</span>}
                      {totalVal>0&&<span style={{fontSize:11,fontWeight:700,color:O}}>· {f(totalVal)}</span>}
                    </div>
                  </div>
                  {isAdmin&&(
                    <div style={{display:"flex",gap:4,flexShrink:0}}>
                      <button onClick={()=>openTechForm(t)} style={{background:C3,border:`1px solid ${C2}`,borderRadius:6,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3}}>{Ico.edit}</button>
                      <button onClick={()=>deleteTech(t.id)} style={{background:RDL,border:`1px solid ${RD}30`,borderRadius:6,width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:RD}}>{Ico.trash}</button>
                    </div>
                  )}
                </div>
                {topArts.length>0&&(
                  <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C2}`,display:"flex",flexDirection:"column",gap:4}}>
                    <div style={{fontSize:9,fontWeight:700,color:T5,textTransform:"uppercase",letterSpacing:.8,marginBottom:2}}>Articles consommés</div>
                    {topArts.map(a=>{
                      const maxQ=topArts[0].qty||1;
                      return (
                        <div key={a.nom} style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{fontSize:11,color:T2,fontWeight:500,minWidth:0,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.nom}</div>
                          <div style={{width:80,height:5,borderRadius:3,background:C3,flexShrink:0}}>
                            <div style={{height:"100%",borderRadius:3,background:PU,width:`${Math.round((a.qty/maxQ)*100)}%`}}/>
                          </div>
                          <div style={{fontSize:11,fontFamily:FM,fontWeight:700,color:PU,flexShrink:0,minWidth:24,textAlign:"right"}}>×{a.qty}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
              );
            })}
          </div>
      }
    </div>
  );

  // ════════════════════════════════════════════════════════
  // RENDER PRINCIPAL
  // ════════════════════════════════════════════════════════
  const LABELS = {inventaire:"Inventaire",entrees:"Entrées",sorties:"Sorties",catalogue:"Catalogue",stats:"Statistiques",techs:"Équipe"};
  const SUBTITLES = {
    inventaire: `${stk.length} article${stk.length!==1?"s":""} · ${f(totalValeur)}${alertItems.length>0?` · ${alertItems.length} alerte${alertItems.length>1?"s":""}` : ""}`,
    entrees:    `${bls.length} bon${bls.length!==1?"s":""} de réception`,
    sorties:    `${stkOut.length} sortie${stkOut.length!==1?"s":""}`,
    catalogue:  `${catalogue.length} référence${catalogue.length!==1?"s":""}`,
    stats:      `Consommation · ${stkOut.length} sortie${stkOut.length!==1?"s":""}`,
    techs:      `${techs.length} technicien${techs.length!==1?"s":""}`,
  };

  return (
    <div style={{display:"flex",fontFamily:FF,height:"100%"}}>
      {/* Sidebar desktop */}
      {!isMob&&(
        <div style={{width:200,flexShrink:0,background:C1,borderRight:`1px solid ${C2}`,paddingTop:8,borderRadius:"12px 0 0 12px"}}>
          <div style={{padding:"16px 16px 8px",fontSize:9,fontWeight:700,color:T5,textTransform:"uppercase",letterSpacing:1.5}}>Navigation</div>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>goTab(t.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"11px 16px",background:tab===t.id?OL:"transparent",borderLeft:`3px solid ${tab===t.id?O:"transparent"}`,border:"none",cursor:"pointer",fontFamily:FF,fontSize:13,fontWeight:tab===t.id?700:400,color:tab===t.id?O:T3,textAlign:"left",transition:"all .12s"}}>
              <span style={{opacity:tab===t.id?1:.5,color:tab===t.id?O:"currentColor"}}>{t.ico}</span>
              {t.label}
              {t.id==="inventaire"&&alertItems.length>0&&<span style={{marginLeft:"auto",background:RD,color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"1px 6px"}}>{alertItems.length}</span>}
              {t.id==="sorties"&&stkOut.length>0&&<span style={{marginLeft:"auto",background:O,color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"1px 6px"}}>{stkOut.length}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Zone contenu */}
      <div style={{flex:1,display:"flex",flexDirection:"column",background:C3,borderRadius:isMob?0:"0 12px 12px 0",minWidth:0}}>
        {/* Header section */}
        <div style={{background:C1,padding:"14px 20px",borderBottom:`1px solid ${C2}`,flexShrink:0}}>
          <div style={{fontSize:17,fontWeight:800,color:T1}}>{LABELS[tab]}</div>
          <div style={{fontSize:11,color:tab==="inventaire"&&alertItems.length>0?RD:T4,marginTop:1,fontWeight:tab==="inventaire"&&alertItems.length>0?600:400}}>{SUBTITLES[tab]}</div>
        </div>

        {/* Contenu */}
        <div ref={scrollRef} style={{flex:1,overflowY:"auto",padding:"16px",paddingBottom:isMob?80:16}}>
          {tab==="inventaire"&&renderInventaire()}
          {tab==="entrees"   &&renderEntrees()}
          {tab==="sorties"   &&renderSorties()}
          {tab==="catalogue" &&renderCatalogue()}
          {tab==="stats"     &&renderStats()}
          {tab==="techs"     &&renderTechs()}
        </div>
      </div>

      {/* Nav mobile bottom bar */}
      {isMob&&(
        <div style={{position:"fixed",bottom:0,left:0,right:0,height:64,background:C1,borderTop:`1px solid ${C2}`,display:"flex",zIndex:200,boxShadow:"0 -2px 12px rgba(0,0,0,.06)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>goTab(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,background:"none",border:"none",cursor:"pointer",color:tab===t.id?O:T5,padding:"8px 2px",position:"relative"}}>
              {t.id==="inventaire"&&alertItems.length>0&&<span style={{position:"absolute",top:6,right:"calc(50% - 14px)",background:RD,color:"#fff",borderRadius:8,fontSize:8,fontWeight:800,padding:"0 4px",minWidth:14,textAlign:"center"}}>{alertItems.length}</span>}
              {t.id==="sorties"&&stkOut.length>0&&<span style={{position:"absolute",top:6,right:"calc(50% - 14px)",background:O,color:"#fff",borderRadius:8,fontSize:8,fontWeight:800,padding:"0 4px",minWidth:14,textAlign:"center"}}>{stkOut.length}</span>}
              <span style={{transform:tab===t.id?"scale(1.1)":"scale(1)",transition:"transform .15s"}}>{t.ico}</span>
              <span style={{fontSize:9,fontWeight:tab===t.id?700:400,letterSpacing:.2}}>{t.label}</span>
              {tab===t.id&&<span style={{position:"absolute",bottom:0,left:"50%",transform:"translateX(-50%)",width:24,height:3,background:O,borderRadius:"2px 2px 0 0"}}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
