import { useState, useEffect } from "react";
import { saveAppState } from "./db.js";
import { supabase } from "./supabase.js";

// ─── Design (cohérent avec StockSection) ───
const O   = "#FC7701";
const OL  = "#FFF4EA";
const C1  = "#ffffff";
const C2  = "#e8edf3";
const C3  = "#f4f7fa";
const T1  = "#0f172a";
const T3  = "#475569";
const T4  = "#64748b";
const T5  = "#94a3b8";
const GR  = "#16a34a";
const GRL = "#f0fdf4";
const RD  = "#dc2626";
const RDL = "#fef2f2";
const OR  = "#d97706";
const ORL = "#fffbeb";
const FF  = "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const FM  = "'SF Mono',SFMono-Regular,Menlo,Consolas,monospace";
const SH  = "0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04)";

// ─── Checklists ───
const CHECKLIST_VEHICULE = [
  { section:"Équipements de sécurité obligatoires", items:[
    "Casque avec jugulaire","Lunettes de protection (fibre optique)",
    "Gants de protection","Vêtements haute visibilité","Chaussures de sécurité",
    "Harnais de sécurité","Trousse de secours","Kit d'absorption (bac plastique)",
    "VAT","Détecteur de gaz",
  ]},
  { section:"Signalisation et sécurisation chantier", items:[
    "2 jeux de panneaux AK5 + panneaux rétrécissement de chaussée",
    "10 cônes de signalisation","1 garde-fou","Gyrophare","Tri-flash",
    "Bandes réfléchissantes sur chaque côté du véhicule","Flocage société",
  ]},
  { section:"Vérification matériel", items:[
    "Échelles avec patins et arceaux en bon état",
    "Marteau à plaques avec semelle en bon état","2 crochets",
  ]},
  { section:"Outillage Fibre Optique", items:[
    "Perforateur","Stylo laser","Cliveuse","Pince à dénuder fibre",
    "Ciseaux Kevlar","Soudeuse fibre optique","Photomètre","Réflectomètre",
    "Jeu de frappe","Étiqueteuse","Tournevis","3 aiguilles : 30m / 60m / 100m",
    "Clé PMZ","Foret de 100 cm","Échelle télescopique ou escabeau",
  ]},
];

const CHECKLIST_EPI = [
  { section:"Protection de la tête", items:[
    "Casque avec jugulaire","Lunettes de protection","Bouchons d'oreilles / casque anti-bruit",
  ]},
  { section:"Protection du corps", items:[
    "Vêtements haute visibilité","Combinaison de travail","Gilet réfléchissant",
  ]},
  { section:"Protection des mains et pieds", items:[
    "Gants de protection","Gants anti-coupure","Chaussures de sécurité",
  ]},
  { section:"Antichute", items:[
    "Harnais de sécurité","Longe de sécurité","Absorbeur d'énergie",
  ]},
];

const CHECKLIST_OUTILLAGE = [
  { section:"Outillage fibre optique", items:[
    "Cliveuse","Soudeuse fibre optique","Photomètre","Réflectomètre",
    "Pince à dénuder fibre","Ciseaux Kevlar","Stylo laser",
  ]},
  { section:"Outillage général", items:[
    "Perforateur","Tournevis","Marteau","Clé PMZ","Jeu de frappe","Étiqueteuse",
  ]},
  { section:"Test et mesure", items:[
    "Multimètre","Testeur de réseau",
  ]},
];

const CHECKLIST_MATERIEL = [
  { section:"Sécurité véhicule", items:[
    "Triangles de présignalisation","Gilet jaune dans l'habitacle","Extincteur","Trousse de secours",
  ]},
  { section:"Matériel de tirage", items:[
    "3 aiguilles : 30m / 60m / 100m","Foret de 100 cm","Clé PMZ",
  ]},
  { section:"Matériel d'accès", items:[
    "Échelle télescopique","Escabeau","Échelles avec patins et arceaux","Marteau à plaques avec semelle",
  ]},
];

const CTRL_TYPES = [
  { id:"vehicule",  label:"Contrôle Véhicule",  desc:"Vérification complète du véhicule et équipement", color:"#2563eb", bg:"#eff6ff",  checklist:CHECKLIST_VEHICULE  },
  { id:"epi",       label:"Contrôle EPI",        desc:"Équipements de Protection Individuelle",           color:"#16a34a", bg:"#f0fdf4",  checklist:CHECKLIST_EPI       },
  { id:"outillage", label:"Contrôle Outillage",  desc:"Vérification de l'outillage fibre et général",    color:"#d97706", bg:"#fffbeb",  checklist:CHECKLIST_OUTILLAGE },
  { id:"materiel",  label:"Contrôle Matériel",   desc:"Matériel de chantier et accessoires",             color:"#7c3aed", bg:"#f5f3ff",  checklist:CHECKLIST_MATERIEL  },
];

const NC_STATUTS = [
  { id:"a_traiter", label:"À traiter", color:RD, bg:RDL },
  { id:"en_cours",  label:"En cours",  color:OR, bg:ORL },
  { id:"resolu",    label:"Résolu",    color:GR, bg:GRL },
];

const fmtDate = d => { if(!d) return ""; const p=d.split("-"); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d; };
const todayStr = () => new Date().toISOString().slice(0,10);
const genId = () => `ctr_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;

// ─── Icônes ───
const IcoSvg = (paths,size=18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Ico = {
  car:     IcoSvg(<><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>),
  shield:  IcoSvg(<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>),
  tool:    IcoSvg(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  box:     IcoSvg(<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></>),
  check:   IcoSvg(<><polyline points="20 6 9 17 4 12"/></>,14),
  back:    IcoSvg(<><polyline points="15 18 9 12 15 6"/></>,16),
  trash:   IcoSvg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>,14),
  alert:   IcoSvg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,14),
  plus:    IcoSvg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,16),
  comment: IcoSvg(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,14),
  history: IcoSvg(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/></>),
  nc:      IcoSvg(<><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>),
  stats:   IcoSvg(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  search:  IcoSvg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,15),
};

// ─── Mini-composants ───
const Badge = ({children,bg,color,style={}}) => (
  <span style={{background:bg,color,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,display:"inline-flex",alignItems:"center",gap:3,...style}}>{children}</span>
);
const Card = ({children,style={}}) => (
  <div style={{background:C1,borderRadius:12,border:`1px solid ${C2}`,boxShadow:SH,padding:"16px",...style}}>{children}</div>
);
const Btn = ({children,color=O,outline=false,small=false,disabled=false,onClick,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:outline?"transparent":disabled?"#cbd5e1":color,
    color:outline?color:"#fff",
    border:outline?`1.5px solid ${color}`:"none",
    borderRadius:8,padding:small?"6px 12px":"10px 18px",
    fontSize:small?11:13,fontWeight:700,cursor:disabled?"not-allowed":"pointer",
    fontFamily:FF,display:"flex",alignItems:"center",justifyContent:"center",gap:6,
    opacity:disabled?.55:1,transition:"all .15s",...style
  }}>{children}</button>
);

// ─── Icône par type ───
const TypeIco = ({id}) => id==="vehicule"?Ico.car:id==="epi"?Ico.shield:id==="outillage"?Ico.tool:Ico.box;

export default function ControlesSection({ techs=[], currentUser=null, onToast, isAdmin=false }) {
  const [ctrlSub,      setCtrlSub]      = useState("accueil");
  const [controles,    setControles]    = useState([]);
  const [nonConformites,setNonConformites]=useState([]);
  const [dataLoaded,   setDataLoaded]   = useState(false);

  // Form
  const [ctrlType,       setCtrlType]       = useState(null);
  const [ctrlDate,       setCtrlDate]       = useState(todayStr());
  const [ctrlControleur, setCtrlControleur] = useState(currentUser?.name||"");
  const [ctrlTech,       setCtrlTech]       = useState("");
  const [ctrlVehicule,   setCtrlVehicule]   = useState("");
  const [ctrlItems,      setCtrlItems]      = useState({});
  const [openComments,   setOpenComments]   = useState({});
  const [saving,         setSaving]         = useState(false);

  // Historique
  const [histSearch, setHistSearch] = useState("");
  const [histType,   setHistType]   = useState("");
  const [histTech,   setHistTech]   = useState("");
  const [viewCtrl,   setViewCtrl]   = useState(null);

  // NC
  const [ncStatutFilter, setNcStatutFilter] = useState("");

  // Confirmation
  const [confirmDlg, setConfirmDlg] = useState(null);
  const askConfirm = (title,body,onConfirm,confirmLabel="Supprimer",confirmColor=RD) =>
    setConfirmDlg({title,body,onConfirm,confirmLabel,confirmColor});

  // ── Load ──
  useEffect(()=>{
    if(dataLoaded) return;
    (async()=>{
      try {
        const {data} = await supabase.from("app_state").select("data").eq("key","gtk-controles").single();
        if(data?.data?.controles) setControles(data.data.controles);
        if(data?.data?.nonConformites) setNonConformites(data.data.nonConformites);
      } catch(e){ console.error("Erreur chargement contrôles:",e); }
      setDataLoaded(true);
    })();
  },[dataLoaded]);

  const save = async(newC,newN) => {
    try { await saveAppState("gtk-controles",{controles:newC??controles,nonConformites:newN??nonConformites}); }
    catch(e){ onToast("Erreur sauvegarde contrôles","err"); }
  };

  // ── Init form ──
  const initForm = (type) => {
    const checklist = CTRL_TYPES.find(t=>t.id===type)?.checklist||[];
    const items={};
    checklist.forEach(s=>s.items.forEach(label=>{ items[label]={statut:"non_verifie",commentaire:""}; }));
    setCtrlItems(items); setCtrlType(type); setCtrlDate(todayStr());
    setCtrlControleur(currentUser?.name||""); setCtrlTech(""); setCtrlVehicule("");
    setOpenComments({}); setCtrlSub("form");
  };

  const setItemStatut  = (label,statut)      => setCtrlItems(p=>({...p,[label]:{...p[label],statut}}));
  const setItemComment = (label,commentaire) => setCtrlItems(p=>({...p,[label]:{...p[label],commentaire}}));
  const toggleComment  = (label)             => setOpenComments(p=>({...p,[label]:!p[label]}));

  // ── Submit ──
  const submitControle = async(statut="valide") => {
    if(!ctrlTech){ onToast("Sélectionne un technicien","warn"); return; }
    setSaving(true);
    const id=genId();
    const typeInfo=CTRL_TYPES.find(t=>t.id===ctrlType);
    const ncItems=Object.entries(ctrlItems).filter(([,v])=>v.statut==="non_conforme").map(([l])=>l);
    const newCtrl={
      id,type:ctrlType,typeLabel:typeInfo?.label,date:ctrlDate,
      controleur:ctrlControleur,techNom:ctrlTech,vehicule:ctrlVehicule,statut,
      items:Object.entries(ctrlItems).map(([label,v])=>({label,...v})),
      createdAt:new Date().toISOString(),ncCount:ncItems.length,
    };
    const newNCs=ncItems.map(label=>({
      id:genId(),controleId:id,type:ctrlType,typeLabel:typeInfo?.label,
      label,techNom:ctrlTech,vehicule:ctrlVehicule,date:ctrlDate,
      description:ctrlItems[label]?.commentaire||"",statut:"a_traiter",
      createdAt:new Date().toISOString(),resolvedAt:null,
    }));
    const updC=[newCtrl,...controles];
    const updN=[...newNCs,...nonConformites];
    setControles(updC); setNonConformites(updN);
    await save(updC,updN); setSaving(false);
    onToast(`Contrôle enregistré${newNCs.length>0?` · ${newNCs.length} NC créée${newNCs.length>1?"s":""}`:""}`);
    if(newNCs.length>0) onToast(`${newNCs.length} non-conformité${newNCs.length>1?"s":""} à traiter`,"warn");
    setCtrlSub("historique");
  };

  const updateNCStatut = async(ncId,statut) => {
    const upd=nonConformites.map(n=>n.id===ncId?{...n,statut,resolvedAt:statut==="resolu"?new Date().toISOString():null}:n);
    setNonConformites(upd); await save(null,upd); onToast("Statut mis à jour");
  };

  const deleteControle = async(id) => {
    const updC=controles.filter(c=>c.id!==id);
    const updN=nonConformites.filter(n=>n.controleId!==id);
    setControles(updC); setNonConformites(updN); await save(updC,updN);
    onToast("Contrôle supprimé"); if(viewCtrl?.id===id) setViewCtrl(null);
  };

  // ── Calculs ──
  const ncOuvertes = nonConformites.filter(n=>n.statut!=="resolu").length;
  const filtHistorique = controles.filter(c=>{
    const ms=!histSearch||c.typeLabel?.toLowerCase().includes(histSearch.toLowerCase())||c.techNom?.toLowerCase().includes(histSearch.toLowerCase())||c.vehicule?.toLowerCase().includes(histSearch.toLowerCase());
    return ms&&(!histType||c.type===histType)&&(!histTech||c.techNom===histTech);
  });
  const filtNC = nonConformites.filter(n=>!ncStatutFilter||n.statut===ncStatutFilter);

  // ── Input style helper ──
  const sInp = {background:C1,border:`1.5px solid ${C2}`,borderRadius:8,padding:"9px 12px",fontSize:13,color:"#0f172a",fontFamily:FF,outline:"none",width:"100%",boxSizing:"border-box"};

  // ════════════════════════════════════════
  // ACCUEIL
  // ════════════════════════════════════════
  const renderAccueil = () => (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:700,color:T1,marginBottom:4}}>Nouveau contrôle</div>
        <div style={{fontSize:12,color:T4}}>Sélectionne le type de contrôle à réaliser</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12,marginBottom:28}}>
        {CTRL_TYPES.map(t=>(
          <div key={t.id} onClick={()=>initForm(t.id)}
            style={{background:C1,border:`1.5px solid ${C2}`,borderRadius:14,padding:"20px 18px",cursor:"pointer",transition:"all .15s",fontFamily:FF}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=t.color;e.currentTarget.style.boxShadow=`0 4px 16px ${t.color}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C2;e.currentTarget.style.boxShadow="none";}}>
            <div style={{width:44,height:44,borderRadius:12,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,color:t.color}}>
              <TypeIco id={t.id}/>
            </div>
            <div style={{fontSize:14,fontWeight:800,color:T1,marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:11,color:T4,lineHeight:1.5,marginBottom:10}}>{t.desc}</div>
            <div style={{fontSize:10,color:T5,fontFamily:FM}}>{t.checklist.reduce((a,s)=>a+s.items.length,0)} points à vérifier</div>
          </div>
        ))}
      </div>

      {controles.length>0&&(
        <>
          <div style={{fontSize:11,fontWeight:700,color:T5,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Derniers contrôles</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {controles.slice(0,3).map(c=>{
              const t=CTRL_TYPES.find(x=>x.id===c.type);
              const ncP=nonConformites.filter(n=>n.controleId===c.id&&n.statut!=="resolu").length;
              return (
                <div key={c.id} onClick={()=>{setViewCtrl(c);setCtrlSub("historique");}}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:C1,border:`1px solid ${C2}`,borderRadius:10,cursor:"pointer",transition:"background .1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C3}
                  onMouseLeave={e=>e.currentTarget.style.background=C1}>
                  <div style={{width:32,height:32,borderRadius:8,background:t?.bg,display:"flex",alignItems:"center",justifyContent:"center",color:t?.color,flexShrink:0}}>
                    <TypeIco id={c.type}/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:T1}}>{c.typeLabel} · {c.techNom||"—"}</div>
                    <div style={{fontSize:10,color:T5}}>{fmtDate(c.date)} · {c.controleur}</div>
                  </div>
                  {ncP>0&&<Badge bg={RDL} color={RD}>{ncP} NC</Badge>}
                  <Badge bg={c.statut==="valide"?GRL:ORL} color={c.statut==="valide"?GR:OR}>{c.statut==="valide"?"Validé":"Brouillon"}</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════
  // FORMULAIRE
  // ════════════════════════════════════════
  const renderForm = () => {
    const typeInfo=CTRL_TYPES.find(t=>t.id===ctrlType);
    const checklist=typeInfo?.checklist||[];
    const totalItems=checklist.reduce((a,s)=>a+s.items.length,0);
    const conformeCount=Object.values(ctrlItems).filter(v=>v.statut==="conforme").length;
    const ncCount=Object.values(ctrlItems).filter(v=>v.statut==="non_conforme").length;
    const doneCount=Object.values(ctrlItems).filter(v=>v.statut!=="non_verifie").length;
    const progress=totalItems>0?Math.round((doneCount/totalItems)*100):0;
    return (
      <div>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <button onClick={()=>setCtrlSub("accueil")}
            style={{background:C3,border:`1px solid ${C2}`,borderRadius:8,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3}}>
            {Ico.back}
          </button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:800,color:T1}}>{typeInfo?.label}</div>
            <div style={{fontSize:11,color:T4,marginTop:1}}>{progress}% · {conformeCount} ✓ · {ncCount} ✗ · {totalItems-doneCount} non vérifiés</div>
          </div>
          <div style={{width:72,flexShrink:0}}>
            <div style={{height:6,background:C2,borderRadius:4,overflow:"hidden"}}>
              <div style={{width:`${progress}%`,height:"100%",background:ncCount>0?RD:GR,borderRadius:4,transition:"width .3s"}}/>
            </div>
            <div style={{fontSize:9,color:T5,textAlign:"right",marginTop:2,fontFamily:FM}}>{progress}%</div>
          </div>
        </div>

        {/* Infos générales */}
        <Card style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Informations générales</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:4}}>Date</label>
              <input type="date" value={ctrlDate} onChange={e=>setCtrlDate(e.target.value)} style={sInp}
                onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:4}}>Contrôleur</label>
              <input value={ctrlControleur} onChange={e=>setCtrlControleur(e.target.value)} placeholder="Nom du contrôleur" style={sInp}
                onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
            </div>
            <div>
              <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:4}}>Technicien <span style={{color:RD}}>*</span></label>
              {techs.length>0
                ? <select value={ctrlTech} onChange={e=>setCtrlTech(e.target.value)} style={{...sInp,cursor:"pointer"}}
                    onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}>
                    <option value="">— Sélectionner —</option>
                    {techs.map(t=><option key={t.id} value={t.nom||t.name}>{t.nom||t.name}</option>)}
                  </select>
                : <input value={ctrlTech} onChange={e=>setCtrlTech(e.target.value)} placeholder="Nom du technicien" style={sInp}
                    onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
              }
            </div>
            {ctrlType==="vehicule"&&(
              <div>
                <label style={{fontSize:11,fontWeight:600,color:T3,display:"block",marginBottom:4}}>Véhicule</label>
                <input value={ctrlVehicule} onChange={e=>setCtrlVehicule(e.target.value)} placeholder="Immatriculation" style={sInp}
                  onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
              </div>
            )}
          </div>
        </Card>

        {/* Checklist */}
        {checklist.map(section=>(
          <Card key={section.section} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:10,borderBottom:`1px solid ${C2}`}}>
              <div style={{width:3,height:16,borderRadius:2,background:typeInfo?.color,flexShrink:0}}/>
              <div style={{fontSize:13,fontWeight:800,color:T1,flex:1}}>{section.section}</div>
              <span style={{fontSize:10,color:T5,fontFamily:FM}}>{section.items.length} pts</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {section.items.map(label=>{
                const item=ctrlItems[label]||{statut:"non_verifie",commentaire:""};
                const isOK=item.statut==="conforme";
                const isNC=item.statut==="non_conforme";
                const commentOpen=openComments[label];
                return (
                  <div key={label} style={{borderRadius:8,overflow:"hidden",border:`1px solid ${isNC?RD+"50":isOK?GR+"50":C2}`,transition:"border-color .15s"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:isNC?RDL:isOK?GRL:C3}}>
                      <div style={{flex:1,fontSize:13,fontWeight:500,color:T1,lineHeight:1.4}}>{label}</div>
                      <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                        <button onClick={()=>setItemStatut(label,isOK?"non_verifie":"conforme")}
                          style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FF,transition:"all .1s",
                            background:isOK?GR:"transparent",color:isOK?"#fff":GR,border:`1.5px solid ${GR}`}}>
                          ✓ Conf.
                        </button>
                        <button onClick={()=>setItemStatut(label,isNC?"non_verifie":"non_conforme")}
                          style={{padding:"5px 10px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:FF,transition:"all .1s",
                            background:isNC?RD:"transparent",color:isNC?"#fff":RD,border:`1.5px solid ${RD}`}}>
                          ✗ N.C.
                        </button>
                        <button onClick={()=>toggleComment(label)}
                          style={{width:28,height:28,borderRadius:6,border:`1px solid ${C2}`,background:(commentOpen||item.commentaire)?OL:C1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:(commentOpen||item.commentaire)?O:T5}}>
                          {Ico.comment}
                        </button>
                      </div>
                    </div>
                    {(commentOpen||item.commentaire)&&(
                      <div style={{padding:"8px 12px",borderTop:`1px solid ${C2}`,background:C1}}>
                        <textarea value={item.commentaire} onChange={e=>setItemComment(label,e.target.value)}
                          placeholder="Observation / commentaire…" rows={2}
                          style={{width:"100%",resize:"none",background:C3,border:`1px solid ${C2}`,borderRadius:6,padding:"8px",fontSize:12,color:T1,fontFamily:FF,outline:"none",boxSizing:"border-box"}}
                          onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        {/* Résumé & validation */}
        <Card style={{marginTop:8,border:`1.5px solid ${ncCount>0?RD+"40":GR+"40"}`,background:ncCount>0?RDL:GRL}}>
          <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
            <Badge bg={GRL} color={GR}>{conformeCount} conforme{conformeCount>1?"s":""}</Badge>
            {ncCount>0&&<Badge bg={RDL} color={RD}>{ncCount} non-conforme{ncCount>1?"s":""}</Badge>}
            <Badge bg={C3} color={T4}>{totalItems-doneCount} non vérifié{totalItems-doneCount>1?"s":""}</Badge>
          </div>
          {ncCount>0&&(
            <div style={{fontSize:12,color:RD,fontWeight:600,marginBottom:12,padding:"8px 12px",background:"#fff",borderRadius:8,border:`1px solid ${RD}30`,display:"flex",alignItems:"center",gap:8}}>
              <span>{Ico.alert}</span>
              {ncCount} non-conformité{ncCount>1?"s":""} sera{ncCount>1?"ont":""} automatiquement créée{ncCount>1?"s":""}.
            </div>
          )}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Btn outline color={T3} small onClick={()=>submitControle("brouillon")} disabled={saving}>
              Brouillon
            </Btn>
            <Btn color={GR} onClick={()=>submitControle("valide")} disabled={saving} style={{flex:1}}>
              {Ico.check} {saving?"Enregistrement…":"Valider le contrôle"}
            </Btn>
          </div>
        </Card>
      </div>
    );
  };

  // ════════════════════════════════════════
  // HISTORIQUE
  // ════════════════════════════════════════
  const renderHistorique = () => {
    if(viewCtrl){
      const typeInfo=CTRL_TYPES.find(t=>t.id===viewCtrl.type);
      const ncP=nonConformites.filter(n=>n.controleId===viewCtrl.id&&n.statut!=="resolu");
      return (
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <button onClick={()=>setViewCtrl(null)}
              style={{background:C3,border:`1px solid ${C2}`,borderRadius:8,width:36,height:36,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:T3}}>
              {Ico.back}
            </button>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:15,fontWeight:800,color:T1}}>{viewCtrl.typeLabel}</div>
              <div style={{fontSize:11,color:T4,marginTop:1}}>{fmtDate(viewCtrl.date)} · {viewCtrl.controleur} · {viewCtrl.techNom}{viewCtrl.vehicule?` · ${viewCtrl.vehicule}`:""}</div>
            </div>
            <Badge bg={viewCtrl.statut==="valide"?GRL:ORL} color={viewCtrl.statut==="valide"?GR:OR}>
              {viewCtrl.statut==="valide"?"Validé":"Brouillon"}
            </Badge>
            {isAdmin&&(
              <button onClick={()=>askConfirm("Supprimer ce contrôle ?","Les non-conformités associées seront également supprimées.",()=>deleteControle(viewCtrl.id))}
                style={{background:RDL,border:`1px solid ${RD}20`,borderRadius:6,cursor:"pointer",color:RD,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                {Ico.trash}
              </button>
            )}
          </div>

          {ncP.length>0&&(
            <div style={{background:RDL,border:`1.5px solid ${RD}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              {Ico.alert}
              <span style={{fontSize:12,fontWeight:700,color:RD}}>{ncP.length} non-conformité{ncP.length>1?"s":""} en attente</span>
            </div>
          )}

          {(typeInfo?.checklist||[]).map(section=>{
            const sectionItems=(viewCtrl.items||[]).filter(i=>section.items.includes(i.label));
            const ncS=sectionItems.filter(i=>i.statut==="non_conforme").length;
            return (
              <Card key={section.section} style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,paddingBottom:8,borderBottom:`1px solid ${C2}`}}>
                  <div style={{width:3,height:14,borderRadius:2,background:typeInfo?.color}}/>
                  <span style={{fontSize:12,fontWeight:800,color:T1,flex:1}}>{section.section}</span>
                  {ncS>0&&<Badge bg={RDL} color={RD}>{ncS} N.C.</Badge>}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {sectionItems.map(item=>(
                    <div key={item.label} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 10px",borderRadius:7,
                      background:item.statut==="non_conforme"?RDL:item.statut==="conforme"?GRL:C3}}>
                      <span style={{fontSize:15,flexShrink:0,lineHeight:"1.3"}}>
                        {item.statut==="conforme"?"✅":item.statut==="non_conforme"?"❌":"⬜"}
                      </span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,color:T1}}>{item.label}</div>
                        {item.commentaire&&<div style={{fontSize:11,color:T4,marginTop:2,fontStyle:"italic"}}>{item.commentaire}</div>}
                      </div>
                      <span style={{fontSize:10,fontWeight:700,flexShrink:0,color:item.statut==="conforme"?GR:item.statut==="non_conforme"?RD:T5}}>
                        {item.statut==="conforme"?"Conforme":item.statut==="non_conforme"?"Non conforme":"Non vérifié"}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      );
    }

    return (
      <div>
        {/* Filtres */}
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <div style={{position:"relative",flex:1,minWidth:160}}>
            <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T5}}>{Ico.search}</span>
            <input value={histSearch} onChange={e=>setHistSearch(e.target.value)} placeholder="Rechercher…"
              style={{...sInp,paddingLeft:34}}
              onFocus={e=>e.target.style.borderColor=O} onBlur={e=>e.target.style.borderColor=C2}/>
          </div>
          <select value={histType} onChange={e=>setHistType(e.target.value)}
            style={{...sInp,width:"auto",cursor:"pointer",color:histType?T1:T4}}>
            <option value="">Tous les types</option>
            {CTRL_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          {[...new Set(controles.map(c=>c.techNom).filter(Boolean))].length>0&&(
            <select value={histTech} onChange={e=>setHistTech(e.target.value)}
              style={{...sInp,width:"auto",cursor:"pointer",color:histTech?T1:T4}}>
              <option value="">Tous les techs</option>
              {[...new Set(controles.map(c=>c.techNom).filter(Boolean))].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        {filtHistorique.length===0
          ? <Card style={{textAlign:"center",padding:"40px 20px"}}>
              <div style={{width:48,height:48,borderRadius:14,background:C3,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:T5}}>{Ico.history}</div>
              <div style={{fontSize:13,color:T4}}>Aucun contrôle trouvé</div>
            </Card>
          : <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtHistorique.map(c=>{
                const typeInfo=CTRL_TYPES.find(t=>t.id===c.type);
                const ncP=nonConformites.filter(n=>n.controleId===c.id&&n.statut!=="resolu").length;
                return (
                  <div key={c.id} onClick={()=>setViewCtrl(c)}
                    style={{background:C1,border:`1.5px solid ${ncP>0?RD+"40":C2}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .12s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=C3}
                    onMouseLeave={e=>e.currentTarget.style.background=C1}>
                    <div style={{width:40,height:40,borderRadius:10,background:typeInfo?.bg,display:"flex",alignItems:"center",justifyContent:"center",color:typeInfo?.color,flexShrink:0}}>
                      <TypeIco id={c.type}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T1}}>{c.typeLabel}</div>
                      <div style={{fontSize:11,color:T4,marginTop:2}}>
                        {fmtDate(c.date)} · {c.techNom||"—"}{c.vehicule?` · ${c.vehicule}`:""} · {c.controleur}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {ncP>0&&<Badge bg={RDL} color={RD}>{ncP} NC</Badge>}
                      {c.ncCount>0&&ncP===0&&<Badge bg={GRL} color={GR}>NC ✓</Badge>}
                      <Badge bg={c.statut==="valide"?GRL:ORL} color={c.statut==="valide"?GR:OR}>
                        {c.statut==="valide"?"Validé":"Brouillon"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
        }
      </div>
    );
  };

  // ════════════════════════════════════════
  // NON-CONFORMITÉS
  // ════════════════════════════════════════
  const renderNC = () => (
    <div>
      <div style={{display:"flex",gap:6,marginBottom:14,overflowX:"auto",paddingBottom:4}}>
        {[{id:"",label:`Toutes (${nonConformites.length})`},...NC_STATUTS.map(s=>({id:s.id,label:`${s.label} (${nonConformites.filter(n=>n.statut===s.id).length})`}))].map(f=>(
          <button key={f.id} onClick={()=>setNcStatutFilter(f.id)}
            style={{padding:"6px 14px",borderRadius:20,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",whiteSpace:"nowrap",fontFamily:FF,transition:"all .12s",
              background:ncStatutFilter===f.id?O:C2,color:ncStatutFilter===f.id?"#fff":T3}}>
            {f.label}
          </button>
        ))}
      </div>

      {filtNC.length===0
        ? <Card style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{width:48,height:48,borderRadius:14,background:C3,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:T5}}>{Ico.nc}</div>
            <div style={{fontSize:13,color:T4}}>Aucune non-conformité</div>
          </Card>
        : <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {filtNC.map(nc=>{
              const st=NC_STATUTS.find(s=>s.id===nc.statut)||NC_STATUTS[0];
              return (
                <Card key={nc.id} style={{border:`1.5px solid ${st.color}25`}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:12}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap"}}>
                        <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
                        <span style={{fontSize:10,color:T5}}>{fmtDate(nc.date)}</span>
                        {nc.techNom&&<span style={{fontSize:10,fontWeight:700,color:T4}}>{nc.techNom}</span>}
                        {nc.vehicule&&<span style={{fontSize:10,color:T4}}>{nc.vehicule}</span>}
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:nc.description?4:0}}>{nc.label}</div>
                      {nc.description&&<div style={{fontSize:12,color:T3,fontStyle:"italic",lineHeight:1.5}}>{nc.description}</div>}
                      <div style={{fontSize:10,color:T5,marginTop:4}}>{nc.typeLabel}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                      {NC_STATUTS.filter(s=>s.id!==nc.statut).map(s=>(
                        <button key={s.id} onClick={()=>updateNCStatut(nc.id,s.id)}
                          style={{padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,border:`1px solid ${s.color}`,background:"transparent",color:s.color,cursor:"pointer",fontFamily:FF,whiteSpace:"nowrap"}}>
                          → {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
      }
    </div>
  );

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════
  const renderStats = () => {
    const byType=CTRL_TYPES.map(t=>({...t,count:controles.filter(c=>c.type===t.id).length,ncCount:nonConformites.filter(n=>n.type===t.id).length}));
    const byTech=[...new Set(controles.map(c=>c.techNom).filter(Boolean))].map(nom=>({
      nom,count:controles.filter(c=>c.techNom===nom).length,nc:nonConformites.filter(n=>n.techNom===nom&&n.statut!=="resolu").length,
    })).sort((a,b)=>b.count-a.count).slice(0,5);
    const totalNC=nonConformites.length;
    const ncOuv=nonConformites.filter(n=>n.statut!=="resolu").length;
    const ncRes=nonConformites.filter(n=>n.statut==="resolu").length;
    return (
      <div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10,marginBottom:20}}>
          {[
            {label:"Contrôles réalisés",val:controles.length,color:O,bg:OL},
            {label:"Non-conformités",val:totalNC,color:RD,bg:RDL},
            {label:"NC ouvertes",val:ncOuv,color:ncOuv>0?RD:GR,bg:ncOuv>0?RDL:GRL},
            {label:"NC résolues",val:ncRes,color:GR,bg:GRL},
          ].map(k=>(
            <Card key={k.label} style={{background:k.bg,border:`1px solid ${k.color}20`,padding:"14px 16px"}}>
              <div style={{fontSize:24,fontWeight:900,color:k.color,fontFamily:FM}}>{k.val}</div>
              <div style={{fontSize:11,color:T3,marginTop:4}}>{k.label}</div>
            </Card>
          ))}
        </div>

        <Card style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Par type de contrôle</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {byType.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:28,height:28,borderRadius:7,background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",color:t.color,flexShrink:0}}>
                  <TypeIco id={t.id}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,fontWeight:600,color:T1}}>{t.label}</span>
                    <span style={{fontSize:11,fontFamily:FM,fontWeight:700,color:t.color}}>{t.count}</span>
                  </div>
                  <div style={{height:4,background:C2,borderRadius:2,overflow:"hidden"}}>
                    <div style={{width:controles.length>0?`${(t.count/controles.length)*100}%`:"0%",height:"100%",background:t.color,borderRadius:2}}/>
                  </div>
                </div>
                {t.ncCount>0&&<Badge bg={RDL} color={RD}>{t.ncCount} NC</Badge>}
              </div>
            ))}
          </div>
        </Card>

        {byTech.length>0&&(
          <Card>
            <div style={{fontSize:11,fontWeight:700,color:T3,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Par technicien</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {byTech.map(t=>(
                <div key={t.nom} style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:28,height:28,borderRadius:14,background:OL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:O,flexShrink:0}}>
                    {(t.nom||"?").charAt(0).toUpperCase()}
                  </div>
                  <span style={{flex:1,fontSize:12,fontWeight:600,color:T1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.nom}</span>
                  <span style={{fontSize:11,fontFamily:FM,fontWeight:700,color:O}}>{t.count} ctr.</span>
                  {t.nc>0&&<Badge bg={RDL} color={RD}>{t.nc} NC</Badge>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ─── Confirmation modal ───
  const renderConfirm = () => !confirmDlg ? null : (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px"}}>
      <div style={{background:C1,borderRadius:16,width:"100%",maxWidth:340,padding:"24px 20px"}}>
        <div style={{fontSize:15,fontWeight:800,color:T1,marginBottom:8}}>{confirmDlg.title}</div>
        <div style={{fontSize:13,color:T3,marginBottom:22,lineHeight:1.6}}>{confirmDlg.body}</div>
        <div style={{display:"flex",gap:10}}>
          <Btn outline color={T3} small onClick={()=>setConfirmDlg(null)} style={{flex:1}}>Annuler</Btn>
          <Btn color={confirmDlg.confirmColor||RD} small onClick={()=>{confirmDlg.onConfirm();setConfirmDlg(null);}} style={{flex:1}}>
            {confirmDlg.confirmLabel||"Supprimer"}
          </Btn>
        </div>
      </div>
    </div>
  );

  // ─── SUB-NAV ───
  const subTabs=[
    {id:"accueil",    label:"Nouveau",         ico:Ico.plus},
    {id:"historique", label:"Historique",      ico:Ico.history},
    {id:"nc",         label:"Non-conformités", ico:Ico.nc},
    {id:"stats",      label:"Stats",           ico:Ico.stats},
  ];

  return (
    <div style={{fontFamily:FF}}>
      {renderConfirm()}

      {/* Sub-nav pills */}
      {ctrlSub!=="form"&&(
        <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:2}}>
          {subTabs.map(t=>(
            <button key={t.id} onClick={()=>{setCtrlSub(t.id);setViewCtrl(null);}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:20,fontSize:12,fontWeight:700,
                border:"none",cursor:"pointer",fontFamily:FF,whiteSpace:"nowrap",transition:"all .12s",
                background:ctrlSub===t.id?O:C2,color:ctrlSub===t.id?"#fff":T3}}>
              <span style={{color:ctrlSub===t.id?"#fff":T4}}>{t.ico}</span>
              {t.label}
              {t.id==="nc"&&ncOuvertes>0&&ctrlSub!=="nc"&&(
                <span style={{background:ctrlSub==="nc"?"#fff30":RD,color:"#fff",borderRadius:10,fontSize:9,fontWeight:800,padding:"0 5px",minWidth:14,textAlign:"center"}}>
                  {ncOuvertes}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {ctrlSub==="accueil"    &&renderAccueil()}
      {ctrlSub==="form"       &&renderForm()}
      {ctrlSub==="historique" &&renderHistorique()}
      {ctrlSub==="nc"         &&renderNC()}
      {ctrlSub==="stats"      &&renderStats()}
    </div>
  );
}
