import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase.js";
import { upsertAndClean, saveAppState, fetchAll } from "./db.js";
import StockSection from "./StockSection.jsx";

// ─── Design constants ───
const O  = "#FC7701";
const FF = "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";

// ─── Identifiants (à modifier ici si besoin) ───
const APP_USER = "ADMIN";
const APP_PASS = "Gtkreseaux13.";

// ─── Écran de connexion ───
function LoginScreen({ onLogin }) {
  const [user, setUser]     = useState("");
  const [pass, setPass]     = useState("");
  const [err,  setErr]      = useState("");
  const [show, setShow]     = useState(false);

  const handle = () => {
    if(user.trim() === APP_USER && pass === APP_PASS) {
      sessionStorage.setItem("gtk-auth","1");
      onLogin();
    } else {
      setErr("Identifiant ou mot de passe incorrect");
    }
  };

  const sInp = {
    width:"100%", padding:"12px 14px", fontSize:14,
    border:"1px solid #2a2a2a", borderRadius:8, outline:"none",
    boxSizing:"border-box", fontFamily:FF,
    background:"#111", color:"#fff",
  };

  return (
    <div style={{fontFamily:FF,display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0a0a0a"}}>
      <div style={{width:380,maxWidth:"90vw"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:72,height:72,borderRadius:20,background:O,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:`0 8px 24px ${O}50`}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div style={{color:"#fff",fontSize:22,fontWeight:900,letterSpacing:-.5}}>GTK STOCK</div>
          <div style={{color:"#555",fontSize:12,marginTop:4}}>Gestion de dépôt · GTK Réseaux</div>
        </div>
        {/* Formulaire */}
        <div style={{background:"#161616",borderRadius:16,padding:"36px 32px",border:"1px solid #222"}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Identifiant</label>
            <input value={user} onChange={e=>{setUser(e.target.value);setErr("");}}
              placeholder="ADMIN" style={sInp} autoComplete="username"
              onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={{fontSize:11,fontWeight:600,color:"#666",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>Mot de passe</label>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} value={pass} onChange={e=>{setPass(e.target.value);setErr("");}}
                placeholder="••••••••" style={{...sInp,paddingRight:44}} autoComplete="current-password"
                onKeyDown={e=>e.key==="Enter"&&handle()}/>
              <button onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#555",fontSize:12,padding:4}}>
                {show?"Cacher":"Voir"}
              </button>
            </div>
          </div>
          {err&&<div style={{background:"#2d1111",border:"1px solid #5c2020",borderRadius:6,padding:"8px 12px",marginBottom:16,fontSize:12,color:"#f87171"}}>{err}</div>}
          <button onClick={handle} disabled={!user||!pass}
            style={{width:"100%",padding:"13px",background:(!user||!pass)?"#333":O,color:"#fff",border:"none",
              borderRadius:8,fontSize:14,fontWeight:700,cursor:(!user||!pass)?"not-allowed":"pointer",fontFamily:FF}}>
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main app ───
export default function App() {
  const [loading,    setLoading]    = useState(true);
  const [loggedIn,   setLoggedIn]   = useState(()=>sessionStorage.getItem("gtk-auth")==="1");

  const [stk,         setStk]         = useState([]);
  const [stkOut,      setStkOut]      = useState([]);
  const [stkInLog,    setStkInLog]    = useState([]);
  const [bls,         setBls]         = useState([]);
  const [catalogue,   setCatalogue]   = useState([
    {id:"cat_def_1",nom:"Touret 500m 1FO",  cat:"Fibre D3",prix:130},
    {id:"cat_def_2",nom:"Kit 50m 1FO",      cat:"Fibre D3",prix:23.19},
    {id:"cat_def_3",nom:"Kit 30m 1FO",      cat:"Fibre D3",prix:10.48},
  ]);
  const [fournisseurs, setFournisseurs] = useState(["Circet","AzurConnect","Autre"]);
  const [techs,       setTechs]       = useState([]);
  const [dataLoaded,  setDataLoaded]  = useState(false);

  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type="ok") => {
    const id = Date.now();
    setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3500);
  }, []);

  // Pas d'auth requise — app locale uniquement
  useEffect(() => { setLoading(false); }, []);

  // Load data
  useEffect(() => {
    if (dataLoaded) return;
    (async () => {
      try {
        const { data: fullRow } = await supabase.from("app_state").select("data").eq("key","gtk-stock-full").single();
        if (fullRow?.data?.stk?.length) {
          setStk(fullRow.data.stk);
        } else {
          const stkRows = await fetchAll("stock");
          if (stkRows.length) setStk(stkRows.map(s=>({id:s.id,nom:s.nom,cat:s.cat||"",qty:Number(s.qty)||0,prix:Number(s.prix)||0,type:"",seuil:0})));
        }

        const { data: soRow } = await supabase.from("app_state").select("data").eq("key","gtk-stkout").single();
        if (soRow?.data?.stkOut) setStkOut(soRow.data.stkOut);

        const { data: metaRow } = await supabase.from("app_state").select("data").eq("key","gtk-data").single();
        if (metaRow?.data) {
          const d = metaRow.data;
          if (d.bls)          setBls(d.bls);
          if (d.stkInLog)     setStkInLog(d.stkInLog);
          if (d.fournisseurs?.length) setFournisseurs(d.fournisseurs);
          if (d.catalogue?.length) {
            const CAT_DEFAULT = [{id:"cat_def_1",nom:"Touret 500m 1FO",cat:"Fibre D3",prix:130},{id:"cat_def_2",nom:"Kit 50m 1FO",cat:"Fibre D3",prix:23.19},{id:"cat_def_3",nom:"Kit 30m 1FO",cat:"Fibre D3",prix:10.48}];
            const merged = [...CAT_DEFAULT.filter(def=>!d.catalogue.find(a=>a.nom.toLowerCase()===def.nom.toLowerCase())), ...d.catalogue];
            setCatalogue(merged);
          }
        }

        const { data: techsRow } = await supabase.from("app_state").select("data").eq("key","gtk-stock-techs").single();
        if (techsRow?.data?.techs?.length) setTechs(techsRow.data.techs);

        setDataLoaded(true);
      } catch(e) {
        console.error("Erreur chargement stock:", e);
        addToast("Erreur de chargement des données", "err");
        setDataLoaded(true);
      }
    })();
  }, [dataLoaded]);

  // Save functions
  const saveStock = async (data) => {
    if (!data?.length) return;
    try {
      await upsertAndClean("stock", data.map(s=>({id:s.id,nom:s.nom,cat:s.cat||"",qty:s.qty||0,prix:s.prix||0})), "id", "stock");
      await saveAppState("gtk-stock-full", { stk: data }, "stock-full");
    } catch(e) { addToast("Erreur sauvegarde stock","err"); console.error(e); }
  };

  const saveStockOut = async (data) => {
    try {
      await saveAppState("gtk-stkout", { stkOut: data || [] }, "stkout");
    } catch(e) { addToast("Erreur sauvegarde sorties","err"); console.error(e); }
  };

  const saveTechs = async (data) => {
    try {
      await saveAppState("gtk-stock-techs", { techs: data || [] }, "techs");
    } catch(e) { addToast("Erreur sauvegarde équipe","err"); console.error(e); }
  };

  const saveMeta = async () => {
    try {
      const { data: existing } = await supabase.from("app_state").select("data").eq("key","gtk-data").single();
      const merged = { ...(existing?.data||{}), bls, catalogue, stkInLog, fournisseurs };
      await saveAppState("gtk-data", merged, "meta");
    } catch(e) { addToast("Erreur sauvegarde méta","err"); console.error(e); }
  };

  if (!loggedIn) return <LoginScreen onLogin={()=>setLoggedIn(true)} />;

  if (loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#0a0a0a"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:56,height:56,borderRadius:14,background:O,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        </div>
        <div style={{color:"#fff",fontSize:16,fontWeight:700,marginBottom:4}}>GTK STOCK</div>
        <div style={{color:"#444",fontSize:12}}>Chargement...</div>
      </div>
    </div>
  );

  const T1="#0f172a",T2="#1e293b",T3="#475569",BG="#f0f4f8";

  return (
    <div style={{minHeight:"100vh",background:BG,fontFamily:FF}}>
      {/* Header */}
      <div style={{background:"#fff",borderBottom:"1px solid #e4eaf0",padding:"0 24px",height:56,
        display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:O,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div style={{fontSize:15,fontWeight:800,color:T1,letterSpacing:-.3}}>GTK STOCK</div>
          {!dataLoaded && (
            <div style={{fontSize:10,color:"#94a3b8",marginLeft:4}}>Chargement…</div>
          )}
        </div>
        <button onClick={()=>{sessionStorage.removeItem("gtk-auth");setLoggedIn(false);}}
          style={{background:"none",border:"1px solid #e4eaf0",borderRadius:6,padding:"5px 12px",fontSize:11,color:"#475569",cursor:"pointer",fontFamily:FF}}>
          Déconnexion
        </button>
      </div>

      {/* Content */}
      <div style={{maxWidth:1200,margin:"0 auto",padding:"20px 16px",height:"calc(100vh - 56px)",display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,borderRadius:12,overflow:"hidden",border:"1px solid #e4eaf0",boxShadow:"0 1px 3px rgba(0,0,0,.06)"}}>
          <StockSection
            stk={stk}              setStk={setStk}
            stkOut={stkOut}        setStkOut={setStkOut}
            stkInLog={stkInLog}    setStkInLog={setStkInLog}
            bls={bls}              setBls={setBls}
            catalogue={catalogue}  setCatalogue={setCatalogue}
            fournisseurs={fournisseurs} setFournisseurs={setFournisseurs}
            techs={techs}          setTechs={setTechs}
            onSaveMeta={saveMeta}
            onSaveStock={(ns)=>saveStock(ns||stk)}
            onSaveStkOut={(ns)=>saveStockOut(ns||stkOut)}
            onSaveTechs={saveTechs}
            onToast={addToast}
            isAdmin={true}
          />
        </div>
      </div>

      {/* Toasts */}
      <div style={{position:"fixed",bottom:20,right:20,display:"flex",flexDirection:"column",gap:8,zIndex:9999}}>
        {toasts.map(t=>(
          <div key={t.id} style={{
            background: t.type==="err"?"#dc2626": t.type==="warn"?"#d97706":"#16a34a",
            color:"#fff",padding:"10px 16px",borderRadius:8,fontSize:12,fontWeight:600,
            fontFamily:FF,boxShadow:"0 4px 16px rgba(0,0,0,.25)",
            animation:"slideIn .2s ease"
          }}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}
