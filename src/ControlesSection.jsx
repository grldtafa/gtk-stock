import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { saveAppState } from "./db.js";
import { supabase } from "./supabase.js";

// ─── Design ───
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

// ─── Checklist par défaut ───
const DEFAULT_CHECKLIST = [
  {
    section: "Équipements de sécurité (EPI)",
    color: "#2563eb",
    items: [
      "Casque avec jugulaire",
      "Lunettes de protection (fibre optique)",
      "Gants de protection",
      "Vêtements haute visibilité",
      "Chaussures de sécurité",
      "Harnais de sécurité",
      "Trousse de secours",
      "Kit d'absorption (bac plastique)",
      "VAT",
      "Détecteur de gaz",
    ],
  },
  {
    section: "Signalisation et sécurisation chantier",
    color: "#d97706",
    items: [
      "2 jeux de panneaux AK5 + panneaux rétrécissement de chaussée",
      "10 cônes de signalisation",
      "1 garde-fou",
      "Gyrophare",
      "Tri-flash",
      "Bandes réfléchissantes sur chaque côté du véhicule",
      "Flocage société",
    ],
  },
  {
    section: "Véhicule et matériel",
    color: "#7c3aed",
    items: [
      "Échelles avec patins et arceaux en bon état",
      "Marteau à plaques avec semelle en bon état",
      "2 crochets",
    ],
  },
  {
    section: "Outillage Fibre Optique",
    color: "#0891b2",
    items: [
      "Perforateur",
      "Stylo laser",
      "Cliveuse",
      "Pince à dénuder fibre",
      "Ciseaux Kevlar",
      "Soudeuse fibre optique",
      "Photomètre",
      "Réflectomètre",
      "Jeu de frappe",
      "Étiqueteuse",
      "Tournevis",
      "3 aiguilles : 30m / 60m / 100m",
      "Clé PMZ",
      "Foret de 100 cm",
      "Échelle télescopique ou escabeau",
    ],
  },
];

const NC_STATUTS = [
  { id: "a_traiter", label: "À traiter", color: RD, bg: RDL },
  { id: "en_cours",  label: "En cours",  color: OR, bg: ORL },
  { id: "resolu",    label: "Résolu",    color: GR, bg: GRL },
];

const fmtDate      = d => { if (!d) return ""; const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };
const todayStr     = () => new Date().toISOString().slice(0, 10);
const genId        = () => `ctr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const techFullName = t => {
  if (!t) return "";
  const full = [t.prenom, t.nom].filter(s => s && s.trim()).join(" ");
  return full || t.n || t.name || "";
};

// ─── Icônes ───
const IcoSvg = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Ico = {
  check:    IcoSvg(<><polyline points="20 6 9 17 4 12"/></>, 14),
  back:     IcoSvg(<><polyline points="15 18 9 12 15 6"/></>, 16),
  trash:    IcoSvg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></>, 14),
  alert:    IcoSvg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>, 14),
  plus:     IcoSvg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, 16),
  comment:  IcoSvg(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>, 14),
  history:  IcoSvg(<><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/></>),
  nc:       IcoSvg(<><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>),
  stats:    IcoSvg(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  search:   IcoSvg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>, 15),
  user:     IcoSvg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  settings: IcoSvg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>, 16),
  chevDown: IcoSvg(<><polyline points="6 9 12 15 18 9"/></>, 14),
  chevUp:   IcoSvg(<><polyline points="18 15 12 9 6 15"/></>, 14),
  x:        IcoSvg(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, 13),
  print:    IcoSvg(<><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>, 14),
  mail:     IcoSvg(<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>, 14),
};

// ─── Mini-composants ───
const Badge = ({ children, bg, color, style = {} }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3, ...style }}>{children}</span>
);
const Card = ({ children, style = {} }) => (
  <div style={{ background: C1, borderRadius: 12, border: `1px solid ${C2}`, boxShadow: SH, padding: "16px", ...style }}>{children}</div>
);
const Btn = ({ children, color = O, outline = false, small = false, disabled = false, onClick, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? "transparent" : disabled ? "#cbd5e1" : color,
    color: outline ? color : "#fff",
    border: outline ? `1.5px solid ${color}` : "none",
    borderRadius: 8, padding: small ? "6px 12px" : "10px 18px",
    fontSize: small ? 11 : 13, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    opacity: disabled ? .55 : 1, transition: "all .15s", ...style,
  }}>{children}</button>
);

export default function ControlesSection({ techs = [], currentUser = null, onToast, isAdmin = false }) {
  const [ctrlSub,        setCtrlSub]        = useState("accueil");
  const [controles,      setControles]      = useState([]);
  const [nonConformites, setNonConformites] = useState([]);
  const [checklistData,  setChecklistData]  = useState(DEFAULT_CHECKLIST);
  const [dataLoaded,     setDataLoaded]     = useState(false);

  // Form
  const [ctrlDate,       setCtrlDate]       = useState(todayStr());
  const [ctrlControleur, setCtrlControleur] = useState(currentUser?.name || "");
  const [ctrlTech,       setCtrlTech]       = useState("");
  const [ctrlVehicule,   setCtrlVehicule]   = useState("");
  const [ctrlItems,      setCtrlItems]      = useState({});
  const [openComments,   setOpenComments]   = useState({});
  const [saving,         setSaving]         = useState(false);

  // Historique
  const [histSearch, setHistSearch] = useState("");
  const [histTech,   setHistTech]   = useState("");
  const [viewCtrl,   setViewCtrl]   = useState(null);

  // NC
  const [ncStatutFilter,  setNcStatutFilter]  = useState("");
  const [ncExpandedTechs, setNcExpandedTechs] = useState(new Set());

  // Paramètres checklist
  const [paramNewItem, setParamNewItem] = useState({}); // { sectionIndex: "texte" }

  // Confirmation
  const [confirmDlg, setConfirmDlg] = useState(null);
  const askConfirm = (title, body, onConfirm, confirmLabel = "Supprimer", confirmColor = RD) =>
    setConfirmDlg({ title, body, onConfirm, confirmLabel, confirmColor });

  // ── Computed ──
  const totalItems = checklistData.reduce((a, s) => a + s.items.length, 0);

  // ── Load ──
  useEffect(() => {
    if (dataLoaded) return;
    (async () => {
      try {
        const { data } = await supabase.from("app_state").select("data").eq("key", "gtk-controles").single();
        if (data?.data?.controles)      setControles(data.data.controles);
        if (data?.data?.nonConformites) setNonConformites(data.data.nonConformites);
        if (data?.data?.checklistData)  setChecklistData(data.data.checklistData);
      } catch (e) { console.error("Erreur chargement contrôles:", e); }
      setDataLoaded(true);
    })();
  }, [dataLoaded]);

  const save = async (newC, newN, newCL) => {
    try {
      await saveAppState("gtk-controles", {
        controles:      newC  ?? controles,
        nonConformites: newN  ?? nonConformites,
        checklistData:  newCL ?? checklistData,
      });
    } catch (e) { onToast("Erreur sauvegarde", "err"); }
  };

  // ── Init form ──
  const initForm = () => {
    const items = {};
    checklistData.forEach(s => s.items.forEach(label => { items[label] = { statut: "non_verifie", commentaire: "" }; }));
    setCtrlItems(items);
    setCtrlDate(todayStr());
    setCtrlControleur(currentUser?.name || "");
    setCtrlTech(""); setCtrlVehicule("");
    setOpenComments({});
    setCtrlSub("form");
  };

  const setItemStatut  = (label, statut)      => setCtrlItems(p => ({ ...p, [label]: { ...p[label], statut } }));
  const setItemComment = (label, commentaire) => setCtrlItems(p => ({ ...p, [label]: { ...p[label], commentaire } }));
  const toggleComment  = (label)              => setOpenComments(p => ({ ...p, [label]: !p[label] }));

  // ── Submit ──
  const submitControle = async (statut = "valide") => {
    if (!ctrlTech) { onToast("Sélectionne un technicien", "warn"); return; }
    setSaving(true);
    const id = genId();
    const ncItems = Object.entries(ctrlItems).filter(([, v]) => v.statut === "non_conforme").map(([l]) => l);
    const reconvocDate = ncItems.length > 0
      ? new Date(new Date(ctrlDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      : null;
    const newCtrl = {
      id, date: ctrlDate, controleur: ctrlControleur,
      techNom: ctrlTech, vehicule: ctrlVehicule, statut,
      items: Object.entries(ctrlItems).map(([label, v]) => ({ label, ...v })),
      createdAt: new Date().toISOString(), ncCount: ncItems.length,
      reconvocDate,
    };
    const newNCs = ncItems.map(label => ({
      id: genId(), controleId: id,
      label, techNom: ctrlTech, vehicule: ctrlVehicule, date: ctrlDate,
      description: ctrlItems[label]?.commentaire || "",
      statut: "a_traiter", createdAt: new Date().toISOString(), resolvedAt: null,
    }));
    const updC = [newCtrl, ...controles];
    const updN = [...newNCs, ...nonConformites];
    setControles(updC); setNonConformites(updN);
    await save(updC, updN); setSaving(false);
    onToast(`Contrôle enregistré${newNCs.length > 0 ? ` · ${newNCs.length} NC créée${newNCs.length > 1 ? "s" : ""}` : ""}`);
    if (newNCs.length > 0) onToast(`${newNCs.length} non-conformité${newNCs.length > 1 ? "s" : ""} à traiter`, "warn");
    if (statut === "valide") sendControleEmail(newCtrl);
    setCtrlSub("historique");
  };

  const updateNCStatut = async (ncId, statut) => {
    const upd = nonConformites.map(n => n.id === ncId ? { ...n, statut, resolvedAt: statut === "resolu" ? new Date().toISOString() : null } : n);
    setNonConformites(upd); await save(null, upd); onToast("Statut mis à jour");
  };

  const deleteControle = async (id) => {
    const updC = controles.filter(c => c.id !== id);
    const updN = nonConformites.filter(n => n.controleId !== id);
    setControles(updC); setNonConformites(updN); await save(updC, updN);
    onToast("Contrôle supprimé"); if (viewCtrl?.id === id) setViewCtrl(null);
  };

  // ── Checklist édition ──
  const addChecklistItem = async (sectionIdx) => {
    const text = (paramNewItem[sectionIdx] || "").trim();
    if (!text) return;
    const newCL = checklistData.map((s, i) => i === sectionIdx ? { ...s, items: [...s.items, text] } : s);
    setChecklistData(newCL);
    setParamNewItem(p => ({ ...p, [sectionIdx]: "" }));
    await save(null, null, newCL);
    onToast("Élément ajouté");
  };

  const removeChecklistItem = async (sectionIdx, itemIdx) => {
    const newCL = checklistData.map((s, i) => i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s);
    setChecklistData(newCL);
    await save(null, null, newCL);
    onToast("Élément supprimé");
  };

  // ── Calculs ──
  const ncOuvertes = nonConformites.filter(n => n.statut !== "resolu").length;
  const filtHistorique = controles.filter(c => {
    const ms = !histSearch || c.techNom?.toLowerCase().includes(histSearch.toLowerCase()) || c.vehicule?.toLowerCase().includes(histSearch.toLowerCase()) || c.controleur?.toLowerCase().includes(histSearch.toLowerCase());
    return ms && (!histTech || c.techNom === histTech);
  });
  const filtNC = nonConformites.filter(n => !ncStatutFilter || n.statut === ncStatutFilter);

  const toggleNCTech = (tech) => setNcExpandedTechs(prev => {
    const next = new Set(prev);
    next.has(tech) ? next.delete(tech) : next.add(tech);
    return next;
  });

  // ════════════════════════════════════════
  // PDF
  // ════════════════════════════════════════
  const printControlePDF = (ctrl) => {
    const logoUrl = `${window.location.origin}/LOGO.png`;
    const items   = ctrl.items || [];
    const conformes = items.filter(i => i.statut === "conforme").length;
    const ncs       = items.filter(i => i.statut === "non_conforme").length;
    const total     = items.length;
    const pct       = total > 0 ? Math.round((conformes / total) * 100) : 0;

    const sectionsHTML = checklistData.map(section => {
      const sItems = items.filter(i => section.items.includes(i.label));
      if (!sItems.length) return "";
      const ncS = sItems.filter(i => i.statut === "non_conforme").length;
      const rows = sItems.map(item => {
        const ok = item.statut === "conforme";
        const nc = item.statut === "non_conforme";
        const ico    = ok ? "✅" : nc ? "❌" : "⬜";
        const cls    = ok ? "conforme" : nc ? "nc" : "unverif";
        const sColor = ok ? "#16a34a" : nc ? "#dc2626" : "#94a3b8";
        const sLabel = ok ? "Conforme" : nc ? "Non conforme" : "Non vérifié";
        const cmmt   = item.commentaire ? `<div class="item-comment">→ ${item.commentaire}</div>` : "";
        return `<div class="item ${cls}">
          <span class="item-ico">${ico}</span>
          <div style="flex:1"><div class="item-lbl">${item.label}</div>${cmmt}</div>
          <span class="item-st" style="color:${sColor}">${sLabel}</span>
        </div>`;
      }).join("");
      return `<div class="section">
        <div class="sec-head" style="background:${section.color}">
          <span>${section.section}</span>
          <span class="sec-pts">${sItems.length} pts${ncS > 0 ? ` · ${ncS} N.C.` : ""}</span>
        </div>${rows}
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Contrôle — ${ctrl.techNom} — ${fmtDate(ctrl.date)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;font-size:12px}
.header{display:flex;align-items:center;gap:18px;padding:16px 28px 12px;border-bottom:3px solid #FC7701;margin-bottom:16px}
.logo{height:42px;object-fit:contain}
.htitle{font-size:19px;font-weight:900;color:#0f172a}
.hsub{font-size:11px;color:#64748b;margin-top:2px}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;margin-left:8px}
.badge-ok{background:#f0fdf4;color:#16a34a}
.badge-nc{background:#fef2f2;color:#dc2626}
.meta{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;padding:0 28px 14px}
.mc{background:#f4f7fa;border-radius:7px;padding:9px 12px}
.ml{font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.7px}
.mv{font-size:13px;font-weight:700;color:#0f172a;margin-top:2px}
.sumbar{display:flex;gap:16px;padding:10px 28px;background:#f4f7fa;border-top:1px solid #e8edf3;border-bottom:1px solid #e8edf3;margin-bottom:16px;align-items:center}
.snum{font-size:20px;font-weight:900;font-family:monospace}
.slbl{font-size:9px;color:#64748b;margin-top:1px}
.section{margin:0 28px 10px;page-break-inside:avoid}
.sec-head{display:flex;align-items:center;justify-content:space-between;padding:6px 11px;border-radius:5px;font-size:11px;font-weight:800;color:#fff;margin-bottom:5px}
.sec-pts{font-size:9px;opacity:.85}
.item{display:flex;align-items:flex-start;gap:7px;padding:5px 9px;border-radius:4px;margin-bottom:3px;border:1px solid #e8edf3}
.item.conforme{background:#f0fdf4;border-color:#16a34a20}
.item.nc{background:#fef2f2;border-color:#dc262620}
.item.unverif{background:#f9fafb}
.item-ico{font-size:12px;flex-shrink:0;line-height:1.5}
.item-lbl{font-size:11px;color:#0f172a;line-height:1.4}
.item-comment{font-size:9px;color:#64748b;font-style:italic;margin-top:1px}
.item-st{font-size:9px;font-weight:700;flex-shrink:0;align-self:center;white-space:nowrap}
.footer{padding:12px 28px;border-top:1px solid #e8edf3;text-align:center;font-size:9px;color:#94a3b8;margin-top:14px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="header">
  <img src="${logoUrl}" class="logo" alt="GTK" onerror="this.style.display='none'"/>
  <div>
    <div class="htitle">Fiche de contrôle technicien
      <span class="badge ${ncs > 0 ? "badge-nc" : "badge-ok"}">${ncs > 0 ? `${ncs} non-conformité${ncs > 1 ? "s" : ""}` : "✓ Tout conforme"}</span>
    </div>
    <div class="hsub">GTK Réseaux · Contrôle sécurité &amp; équipements</div>
  </div>
</div>
<div class="meta">
  <div class="mc"><div class="ml">Date</div><div class="mv">${fmtDate(ctrl.date)}</div></div>
  <div class="mc"><div class="ml">Technicien</div><div class="mv">${ctrl.techNom || "—"}</div></div>
  <div class="mc"><div class="ml">Véhicule</div><div class="mv">${ctrl.vehicule || "—"}</div></div>
  <div class="mc"><div class="ml">Contrôleur</div><div class="mv">${ctrl.controleur || "—"}</div></div>
</div>
<div class="sumbar">
  <div><div class="snum" style="color:#16a34a">${conformes}</div><div class="slbl">Conforme${conformes > 1 ? "s" : ""}</div></div>
  <div style="color:#e8edf3;font-size:18px">·</div>
  <div><div class="snum" style="color:${ncs > 0 ? "#dc2626" : "#94a3b8"}">${ncs}</div><div class="slbl">Non conforme${ncs > 1 ? "s" : ""}</div></div>
  <div style="color:#e8edf3;font-size:18px">·</div>
  <div><div class="snum" style="color:#94a3b8">${total - conformes - ncs}</div><div class="slbl">Non vérifié${total - conformes - ncs > 1 ? "s" : ""}</div></div>
  <div style="margin-left:auto;font-size:22px;font-weight:900;color:#FC7701">${pct}%</div>
</div>
${sectionsHTML}
<div class="footer">Généré le ${new Date().toLocaleDateString("fr-FR",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · GTK Réseaux · GTK Stock</div>
</body></html>`;

    const win = window.open("", "_blank", "width=920,height=720");
    if (!win) { onToast("Autorisez les pop-ups pour générer le PDF", "warn"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  // ════════════════════════════════════════
  // PDF FICHE DE PRÉPARATION (liste vierge)
  // ════════════════════════════════════════
  const printListePreparation = () => {
    const logoUrl = `${window.location.origin}/LOGO.png`;

    // 2 colonnes : sections gauche / sections droite
    const mid = Math.ceil(checklistData.length / 2);
    const colHTML = (sections) => sections.map(section => {
      const rows = section.items.map(item =>
        `<div class="item"><div class="dot"></div><span>${item}</span></div>`
      ).join("");
      return `<div class="section">
        <div class="sec-head">
          ${section.section}<span class="pts">${section.items.length} pts</span>
        </div>${rows}
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Fiche de préparation — GTK Réseaux</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;background:#fff;
  display:flex;flex-direction:column;padding:14px 20px}
.header{display:flex;align-items:center;gap:14px;padding-bottom:10px;
  border-bottom:3px solid #FC7701;margin-bottom:10px;flex-shrink:0}
.logo{height:36px;object-fit:contain}
.htitle{font-size:16px;font-weight:900;color:#0f172a}
.hsub{font-size:10px;color:#64748b;margin-top:2px}
.notice{background:#FFF4EA;border:1.5px solid #FC770150;border-radius:6px;
  padding:7px 12px;font-size:10px;color:#92400e;margin-bottom:10px;flex-shrink:0;line-height:1.5}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;flex:1}
.section{margin-bottom:8px}
.sec-head{display:flex;align-items:center;justify-content:space-between;
  padding:5px 9px;border-radius:4px;font-size:10px;font-weight:800;color:#fff;margin-bottom:4px;
  background:#FC7701}
.pts{font-size:8px;opacity:.85}
.item{display:flex;align-items:baseline;gap:7px;padding:3px 8px;font-size:10px;
  color:#0f172a;border-bottom:1px solid #f1f5f9;line-height:1.4}
.dot{width:5px;height:5px;border-radius:50%;flex-shrink:0;margin-top:3px;background:#FC7701}
.footer{text-align:center;font-size:8px;color:#94a3b8;padding-top:8px;
  border-top:1px solid #e8edf3;margin-top:8px;flex-shrink:0}
@media print{
  html,body{height:auto}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  @page{margin:1cm;size:A4}
}
</style></head><body>
<div class="header">
  <img src="${logoUrl}" class="logo" alt="GTK" onerror="this.style.display='none'"/>
  <div>
    <div class="htitle">Liste de préparation au contrôle technicien</div>
    <div class="hsub">GTK Réseaux · ${checklistData.reduce((a,s)=>a+s.items.length,0)} points de contrôle obligatoires</div>
  </div>
</div>
<div class="notice">⚠️ <strong>Tous ces équipements doivent être présents, fonctionnels et en bon état dans le véhicule le jour du contrôle.</strong> Tout élément manquant ou non conforme entraînera une reconvocation sous 7 jours ainsi qu'une pénalité de <strong>200 € par élément manquant</strong>.</div>
<div class="cols">
  <div>${colHTML(checklistData.slice(0, mid))}</div>
  <div>${colHTML(checklistData.slice(mid))}</div>
</div>
<div class="footer">GTK Réseaux · Document de préparation au contrôle technicien · gtk-stock.vercel.app</div>
</body></html>`;

    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) { onToast("Autorisez les pop-ups pour générer le PDF", "warn"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 600);
  };

  // ════════════════════════════════════════
  // EMAIL AUTO
  // ════════════════════════════════════════
  const sendControleEmail = async (ctrl) => {
    const EJS_SVC = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const EJS_TPL = import.meta.env.VITE_EMAILJS_CONTROLE_TPL;
    const EJS_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!EJS_SVC || !EJS_TPL || !EJS_KEY) {
      onToast(`Email non configuré (SVC:${!!EJS_SVC} TPL:${!!EJS_TPL} KEY:${!!EJS_KEY})`, "warn");
      return;
    }
    try {
      const items     = ctrl.items || [];
      const conformes = items.filter(i => i.statut === "conforme").length;
      const total     = items.length;
      const ncLines   = items
        .filter(i => i.statut === "non_conforme")
        .map(i => `• ${i.label}${i.commentaire ? " : " + i.commentaire : ""}`)
        .join("\n");
      await emailjs.send(EJS_SVC, EJS_TPL, {
        tech_nom:   ctrl.techNom  || "—",
        vehicule:   ctrl.vehicule || "—",
        date:       fmtDate(ctrl.date),
        controleur: ctrl.controleur || "—",
        score:      `${conformes}/${total} · ${total > 0 ? Math.round((conformes/total)*100) : 0}%`,
        nc_count:   String(ctrl.ncCount || 0),
        nc_items:   ncLines || "Aucune non-conformité ✓",
      }, EJS_KEY);
      onToast("📧 Email envoyé à contact@gtkreseaux.fr");
    } catch (e) {
      console.error("Erreur envoi email contrôle:", e);
      onToast(`Erreur email : ${e?.text || e?.message || JSON.stringify(e)}`, "err");
    }
  };

  // ── Input style ──
  const sInp = { background: C1, border: `1.5px solid ${C2}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: T1, fontFamily: FF, outline: "none", width: "100%", boxSizing: "border-box" };

  // ════════════════════════════════════════
  // ACCUEIL
  // ════════════════════════════════════════
  const renderAccueil = () => {
    // Reconvocations en attente (contrôles avec NC non tous résolus)
    const today = todayStr();
    const reconvocs = controles
      .filter(c => c.reconvocDate)
      .filter(c => nonConformites.some(n => n.controleId === c.id && n.statut !== "resolu"))
      .sort((a, b) => a.reconvocDate.localeCompare(b.reconvocDate));

    return (
    <div>
      <div onClick={initForm}
        style={{ background: `linear-gradient(135deg, ${O}, #ff9a3c)`, borderRadius: 16, padding: "24px 20px", cursor: "pointer", marginBottom: 20, color: "#fff", display: "flex", alignItems: "center", gap: 16, boxShadow: `0 4px 20px ${O}40`, transition: "transform .15s, box-shadow .15s" }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${O}50`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = `0 4px 20px ${O}40`; }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Ico.user}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: -.3, marginBottom: 4 }}>Nouveau contrôle technicien</div>
          <div style={{ fontSize: 12, opacity: .85 }}>{totalItems} points · EPI, signalisation, véhicule, outillage fibre</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {Ico.plus}
        </div>
      </div>

      {controles.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
          {[
            { label: "Contrôles", val: controles.length, color: O, bg: OL },
            { label: "NC ouvertes", val: ncOuvertes, color: ncOuvertes > 0 ? RD : GR, bg: ncOuvertes > 0 ? RDL : GRL },
            { label: "NC résolues", val: nonConformites.filter(n => n.statut === "resolu").length, color: GR, bg: GRL },
          ].map(k => (
            <Card key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}20`, padding: "12px 14px" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.color, fontFamily: FM }}>{k.val}</div>
              <div style={{ fontSize: 10, color: T4, marginTop: 3 }}>{k.label}</div>
            </Card>
          ))}
        </div>
      )}

      {controles.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T5, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Derniers contrôles</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {controles.slice(0, 4).map(c => {
              const ncP = nonConformites.filter(n => n.controleId === c.id && n.statut !== "resolu").length;
              return (
                <div key={c.id} onClick={() => { setViewCtrl(c); setCtrlSub("historique"); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: C1, border: `1px solid ${C2}`, borderRadius: 10, cursor: "pointer", transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = C3}
                  onMouseLeave={e => e.currentTarget.style.background = C1}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: OL, display: "flex", alignItems: "center", justifyContent: "center", color: O, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {(c.techNom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.techNom || "—"}{c.vehicule ? ` · ${c.vehicule}` : ""}</div>
                    <div style={{ fontSize: 10, color: T5 }}>{fmtDate(c.date)} · {c.controleur}</div>
                  </div>
                  {ncP > 0 && <Badge bg={RDL} color={RD}>{ncP} NC</Badge>}
                  <Badge bg={c.statut === "valide" ? GRL : ORL} color={c.statut === "valide" ? GR : OR}>
                    {c.statut === "valide" ? "Validé" : "Brouillon"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </>
      )}

      {controles.length === 0 && (
        <Card style={{ textAlign: "center", padding: "32px 20px", color: T4, fontSize: 13 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: OL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: O }}>{Ico.user}</div>
          Aucun contrôle effectué pour l'instant
        </Card>
      )}

      {/* ── Reconvocations en attente ── */}
      {reconvocs.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: T5, textTransform: "uppercase", letterSpacing: 1, margin: "20px 0 10px" }}>Reconvocations à prévoir</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {reconvocs.map(c => {
              const daysLeft = Math.ceil((new Date(c.reconvocDate) - new Date(today)) / (1000 * 60 * 60 * 24));
              const late  = daysLeft < 0;
              const soon  = daysLeft >= 0 && daysLeft <= 2;
              const color = late ? RD : soon ? OR : T3;
              const bg    = late ? RDL : soon ? ORL : C3;
              return (
                <div key={c.id} onClick={() => { setViewCtrl(c); setCtrlSub("historique"); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: bg, border: `1.5px solid ${color}30`, borderRadius: 10, cursor: "pointer" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {(c.techNom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T1 }}>{c.techNom}{c.vehicule ? ` · ${c.vehicule}` : ""}</div>
                    <div style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>
                      {late ? `⚠️ En retard de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}` : `Reconvoquer le ${fmtDate(c.reconvocDate)}${daysLeft === 0 ? " — Aujourd'hui !" : ` — dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}`}
                    </div>
                  </div>
                  <Badge bg={`${color}20`} color={color}>{c.ncCount} NC</Badge>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Fiche de préparation ── */}
      <div
        onClick={printListePreparation}
        style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: C3, border: `1.5px dashed ${C2}`, borderRadius: 12, cursor: "pointer", transition: "background .1s" }}
        onMouseEnter={e => e.currentTarget.style.background = C2}
        onMouseLeave={e => e.currentTarget.style.background = C3}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: OL, display: "flex", alignItems: "center", justifyContent: "center", color: O, flexShrink: 0 }}>
          {Ico.print}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Fiche de préparation</div>
          <div style={{ fontSize: 11, color: T4, marginTop: 2 }}>PDF avec la liste complète à envoyer aux techniciens avant leur contrôle</div>
        </div>
        <span style={{ fontSize: 11, color: O, fontWeight: 700 }}>PDF →</span>
      </div>
    </div>
    );
  };

  // ════════════════════════════════════════
  // FORMULAIRE
  // ════════════════════════════════════════
  const renderForm = () => {
    const conformeCount = Object.values(ctrlItems).filter(v => v.statut === "conforme").length;
    const ncCount       = Object.values(ctrlItems).filter(v => v.statut === "non_conforme").length;
    const doneCount     = Object.values(ctrlItems).filter(v => v.statut !== "non_verifie").length;
    const progress      = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <button onClick={() => setCtrlSub("accueil")}
            style={{ background: C3, border: `1px solid ${C2}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T3 }}>
            {Ico.back}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>Contrôle technicien</div>
            <div style={{ fontSize: 11, color: T4, marginTop: 1 }}>{progress}% · {conformeCount} ✓ · {ncCount} ✗ · {totalItems - doneCount} non vérifiés</div>
          </div>
          <div style={{ width: 72, flexShrink: 0 }}>
            <div style={{ height: 6, background: C2, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: ncCount > 0 ? RD : GR, borderRadius: 4, transition: "width .3s" }} />
            </div>
            <div style={{ fontSize: 9, color: T5, textAlign: "right", marginTop: 2, fontFamily: FM }}>{progress}%</div>
          </div>
        </div>

        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Informations générales</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T3, display: "block", marginBottom: 4 }}>Date</label>
              <input type="date" value={ctrlDate} onChange={e => setCtrlDate(e.target.value)} style={sInp}
                onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T3, display: "block", marginBottom: 4 }}>Contrôleur</label>
              <input value={ctrlControleur} onChange={e => setCtrlControleur(e.target.value)} placeholder="Nom du contrôleur" style={sInp}
                onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T3, display: "block", marginBottom: 4 }}>Technicien <span style={{ color: RD }}>*</span></label>
              {techs.length > 0
                ? <select value={ctrlTech} onChange={e => setCtrlTech(e.target.value)} style={{ ...sInp, cursor: "pointer" }}
                    onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2}>
                    <option value="">— Sélectionner —</option>
                    {techs.map(t => <option key={t.id} value={techFullName(t)}>{techFullName(t)}</option>)}
                  </select>
                : <input value={ctrlTech} onChange={e => setCtrlTech(e.target.value)} placeholder="Nom du technicien" style={sInp}
                    onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
              }
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: T3, display: "block", marginBottom: 4 }}>Véhicule</label>
              <input value={ctrlVehicule} onChange={e => setCtrlVehicule(e.target.value)} placeholder="Immatriculation" style={sInp}
                onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
            </div>
          </div>
        </Card>

        {checklistData.map(section => (
          <Card key={section.section} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C2}` }}>
              <div style={{ width: 3, height: 16, borderRadius: 2, background: section.color, flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 800, color: T1, flex: 1 }}>{section.section}</div>
              <span style={{ fontSize: 10, color: T5, fontFamily: FM }}>{section.items.length} pts</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {section.items.map(label => {
                const item = ctrlItems[label] || { statut: "non_verifie", commentaire: "" };
                const isOK = item.statut === "conforme";
                const isNC = item.statut === "non_conforme";
                const commentOpen = openComments[label];
                return (
                  <div key={label} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${isNC ? RD + "50" : isOK ? GR + "50" : C2}`, transition: "border-color .15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", background: isNC ? RDL : isOK ? GRL : C3 }}>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T1, lineHeight: 1.4 }}>{label}</div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => setItemStatut(label, isOK ? "non_verifie" : "conforme")}
                          style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF, transition: "all .1s", background: isOK ? GR : "transparent", color: isOK ? "#fff" : GR, border: `1.5px solid ${GR}` }}>
                          ✓ Conf.
                        </button>
                        <button onClick={() => setItemStatut(label, isNC ? "non_verifie" : "non_conforme")}
                          style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF, transition: "all .1s", background: isNC ? RD : "transparent", color: isNC ? "#fff" : RD, border: `1.5px solid ${RD}` }}>
                          ✗ N.C.
                        </button>
                        <button onClick={() => toggleComment(label)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${C2}`, background: (commentOpen || item.commentaire) ? OL : C1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: (commentOpen || item.commentaire) ? O : T5 }}>
                          {Ico.comment}
                        </button>
                      </div>
                    </div>
                    {(commentOpen || item.commentaire) && (
                      <div style={{ padding: "8px 12px", borderTop: `1px solid ${C2}`, background: C1 }}>
                        <textarea value={item.commentaire} onChange={e => setItemComment(label, e.target.value)}
                          placeholder="Observation…" rows={2}
                          style={{ width: "100%", resize: "none", background: C3, border: `1px solid ${C2}`, borderRadius: 6, padding: "8px", fontSize: 12, color: T1, fontFamily: FF, outline: "none", boxSizing: "border-box" }}
                          onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        <Card style={{ marginTop: 8, border: `1.5px solid ${Object.values(ctrlItems).filter(v => v.statut === "non_conforme").length > 0 ? RD + "40" : GR + "40"}`, background: Object.values(ctrlItems).filter(v => v.statut === "non_conforme").length > 0 ? RDL : GRL }}>
          {(() => {
            const conformeC = Object.values(ctrlItems).filter(v => v.statut === "conforme").length;
            const ncC       = Object.values(ctrlItems).filter(v => v.statut === "non_conforme").length;
            const doneC     = Object.values(ctrlItems).filter(v => v.statut !== "non_verifie").length;
            return (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                  <Badge bg={GRL} color={GR}>{conformeC} conforme{conformeC > 1 ? "s" : ""}</Badge>
                  {ncC > 0 && <Badge bg={RDL} color={RD}>{ncC} non-conforme{ncC > 1 ? "s" : ""}</Badge>}
                  <Badge bg={C3} color={T4}>{totalItems - doneC} non vérifié{totalItems - doneC > 1 ? "s" : ""}</Badge>
                </div>
                {ncC > 0 && (
                  <div style={{ fontSize: 12, color: RD, fontWeight: 600, marginBottom: 12, padding: "8px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${RD}30`, display: "flex", alignItems: "center", gap: 8 }}>
                    {Ico.alert} {ncC} non-conformité{ncC > 1 ? "s" : ""} sera{ncC > 1 ? "ont" : ""} créée{ncC > 1 ? "s" : ""} automatiquement.
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn outline color={T3} small onClick={() => submitControle("brouillon")} disabled={saving}>Brouillon</Btn>
                  <Btn color={GR} onClick={() => submitControle("valide")} disabled={saving} style={{ flex: 1 }}>
                    {Ico.check} {saving ? "Enregistrement…" : "Valider le contrôle"}
                  </Btn>
                </div>
              </>
            );
          })()}
        </Card>
      </div>
    );
  };

  // ════════════════════════════════════════
  // HISTORIQUE
  // ════════════════════════════════════════
  const renderHistorique = () => {
    if (viewCtrl) {
      const ncP = nonConformites.filter(n => n.controleId === viewCtrl.id && n.statut !== "resolu");
      return (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <button onClick={() => setViewCtrl(null)}
              style={{ background: C3, border: `1px solid ${C2}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T3 }}>
              {Ico.back}
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: T1 }}>{viewCtrl.techNom || "—"}{viewCtrl.vehicule ? ` · ${viewCtrl.vehicule}` : ""}</div>
              <div style={{ fontSize: 11, color: T4, marginTop: 1 }}>{fmtDate(viewCtrl.date)} · Contrôleur : {viewCtrl.controleur}</div>
            </div>
            <Badge bg={viewCtrl.statut === "valide" ? GRL : ORL} color={viewCtrl.statut === "valide" ? GR : OR}>
              {viewCtrl.statut === "valide" ? "Validé" : "Brouillon"}
            </Badge>
            <button onClick={() => printControlePDF(viewCtrl)}
              title="Générer PDF"
              style={{ background: OL, border: `1px solid ${O}30`, borderRadius: 6, cursor: "pointer", color: O, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              {Ico.print}
            </button>
            {isAdmin && (
              <button onClick={() => askConfirm("Supprimer ce contrôle ?", "Les non-conformités associées seront également supprimées.", () => deleteControle(viewCtrl.id))}
                style={{ background: RDL, border: `1px solid ${RD}20`, borderRadius: 6, cursor: "pointer", color: RD, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                {Ico.trash}
              </button>
            )}
          </div>

          {ncP.length > 0 && (
            <div style={{ background: RDL, border: `1.5px solid ${RD}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              {Ico.alert}
              <span style={{ fontSize: 12, fontWeight: 700, color: RD }}>{ncP.length} non-conformité{ncP.length > 1 ? "s" : ""} en attente</span>
            </div>
          )}
          {viewCtrl.reconvocDate && ncP.length > 0 && (() => {
            const daysLeft = Math.ceil((new Date(viewCtrl.reconvocDate) - new Date(todayStr())) / (1000 * 60 * 60 * 24));
            const late  = daysLeft < 0;
            const color = late ? RD : daysLeft <= 2 ? OR : GR;
            const bg    = late ? RDL : daysLeft <= 2 ? ORL : GRL;
            return (
              <div style={{ background: bg, border: `1.5px solid ${color}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color }}>
                    Reconvocation : {fmtDate(viewCtrl.reconvocDate)}
                  </div>
                  <div style={{ fontSize: 11, color, opacity: .8, marginTop: 1 }}>
                    {late ? `En retard de ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? "s" : ""}` : daysLeft === 0 ? "Aujourd'hui !" : `Dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>
            );
          })()}

          {checklistData.map(section => {
            const sItems = (viewCtrl.items || []).filter(i => section.items.includes(i.label));
            const ncS = sItems.filter(i => i.statut === "non_conforme").length;
            return (
              <Card key={section.section} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${C2}` }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: section.color }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: T1, flex: 1 }}>{section.section}</span>
                  {ncS > 0 && <Badge bg={RDL} color={RD}>{ncS} N.C.</Badge>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sItems.map(item => (
                    <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 10px", borderRadius: 7, background: item.statut === "non_conforme" ? RDL : item.statut === "conforme" ? GRL : C3 }}>
                      <span style={{ fontSize: 15, flexShrink: 0, lineHeight: "1.3" }}>
                        {item.statut === "conforme" ? "✅" : item.statut === "non_conforme" ? "❌" : "⬜"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: T1 }}>{item.label}</div>
                        {item.commentaire && <div style={{ fontSize: 11, color: T4, marginTop: 2, fontStyle: "italic" }}>{item.commentaire}</div>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, flexShrink: 0, color: item.statut === "conforme" ? GR : item.statut === "non_conforme" ? RD : T5 }}>
                        {item.statut === "conforme" ? "Conforme" : item.statut === "non_conforme" ? "Non conforme" : "Non vérifié"}
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
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T5 }}>{Ico.search}</span>
            <input value={histSearch} onChange={e => setHistSearch(e.target.value)} placeholder="Rechercher…"
              style={{ ...sInp, paddingLeft: 34 }}
              onFocus={e => e.target.style.borderColor = O} onBlur={e => e.target.style.borderColor = C2} />
          </div>
          {[...new Set(controles.map(c => c.techNom).filter(Boolean))].length > 1 && (
            <select value={histTech} onChange={e => setHistTech(e.target.value)}
              style={{ ...sInp, width: "auto", cursor: "pointer", color: histTech ? T1 : T4 }}>
              <option value="">Tous les techs</option>
              {[...new Set(controles.map(c => c.techNom).filter(Boolean))].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
        </div>

        {filtHistorique.length === 0
          ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: C3, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: T5 }}>{Ico.history}</div>
              <div style={{ fontSize: 13, color: T4 }}>Aucun contrôle trouvé</div>
            </Card>
          : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtHistorique.map(c => {
                const ncP = nonConformites.filter(n => n.controleId === c.id && n.statut !== "resolu").length;
                return (
                  <div key={c.id}
                    style={{ background: C1, border: `1.5px solid ${ncP > 0 ? RD + "40" : C2}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, transition: "all .12s" }}>
                    <div onClick={() => setViewCtrl(c)} style={{ width: 40, height: 40, borderRadius: 12, background: OL, display: "flex", alignItems: "center", justifyContent: "center", color: O, fontWeight: 800, fontSize: 14, flexShrink: 0, cursor: "pointer" }}>
                      {(c.techNom || "?").charAt(0).toUpperCase()}
                    </div>
                    <div onClick={() => setViewCtrl(c)} style={{ flex: 1, minWidth: 0, cursor: "pointer" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.techNom || "—"}{c.vehicule ? ` · ${c.vehicule}` : ""}</div>
                      <div style={{ fontSize: 11, color: T4, marginTop: 2 }}>{fmtDate(c.date)} · {c.controleur}</div>
                      {c.reconvocDate && nonConformites.some(n => n.controleId === c.id && n.statut !== "resolu") && (() => {
                        const d = Math.ceil((new Date(c.reconvocDate) - new Date(todayStr())) / (1000*60*60*24));
                        const col = d < 0 ? RD : d <= 2 ? OR : T4;
                        return <div style={{ fontSize: 10, color: col, fontWeight: 600, marginTop: 1 }}>📅 Reconvoquer le {fmtDate(c.reconvocDate)}{d < 0 ? ` (retard ${Math.abs(d)}j)` : d === 0 ? " — Aujourd'hui" : ""}</div>;
                      })()}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, alignItems: "center" }}>
                      {ncP > 0 && <Badge bg={RDL} color={RD}>{ncP} NC</Badge>}
                      {c.ncCount > 0 && ncP === 0 && <Badge bg={GRL} color={GR}>NC ✓</Badge>}
                      <Badge bg={c.statut === "valide" ? GRL : ORL} color={c.statut === "valide" ? GR : OR}>
                        {c.statut === "valide" ? "Validé" : "Brouillon"}
                      </Badge>
                      <button onClick={e => { e.stopPropagation(); printControlePDF(c); }}
                        title="PDF"
                        style={{ width: 28, height: 28, borderRadius: 6, background: OL, border: `1px solid ${O}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: O, padding: 0, flexShrink: 0 }}>
                        {Ico.print}
                      </button>
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
  // NON-CONFORMITÉS — groupées par technicien
  // ════════════════════════════════════════
  const renderNC = () => {
    // Techs ayant des NCs dans le filtre courant
    const techsWithNC = [...new Set(filtNC.map(n => n.techNom).filter(Boolean))];

    return (
      <div>
        {/* Filtres statuts */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {[{ id: "", label: `Toutes (${nonConformites.length})` }, ...NC_STATUTS.map(s => ({ id: s.id, label: `${s.label} (${nonConformites.filter(n => n.statut === s.id).length})` }))].map(f => (
            <button key={f.id} onClick={() => setNcStatutFilter(f.id)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: FF, transition: "all .12s", background: ncStatutFilter === f.id ? O : C2, color: ncStatutFilter === f.id ? "#fff" : T3 }}>
              {f.label}
            </button>
          ))}
        </div>

        {filtNC.length === 0 ? (
          <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C3, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: T5 }}>{Ico.nc}</div>
            <div style={{ fontSize: 13, color: T4 }}>Aucune non-conformité</div>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {techsWithNC.map(tech => {
              const techNCs  = filtNC.filter(n => n.techNom === tech);
              const expanded = ncExpandedTechs.has(tech);
              const cA = techNCs.filter(n => n.statut === "a_traiter").length;
              const cE = techNCs.filter(n => n.statut === "en_cours").length;
              const cR = techNCs.filter(n => n.statut === "resolu").length;
              const hasOpen = cA + cE > 0;

              return (
                <Card key={tech} style={{ border: `1.5px solid ${hasOpen ? RD + "30" : C2}`, padding: 0, overflow: "hidden" }}>
                  {/* En-tête technicien — cliquable pour déplier */}
                  <div onClick={() => toggleNCTech(tech)}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", transition: "background .1s", background: expanded ? C3 : C1 }}
                    onMouseEnter={e => e.currentTarget.style.background = C3}
                    onMouseLeave={e => e.currentTarget.style.background = expanded ? C3 : C1}>
                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: hasOpen ? RDL : GRL, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: hasOpen ? RD : GR, flexShrink: 0 }}>
                      {(tech || "?").charAt(0).toUpperCase()}
                    </div>
                    {/* Nom + compteurs */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T1, marginBottom: 5 }}>{tech}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {cA > 0 && <Badge bg={RDL} color={RD}>{cA} à traiter</Badge>}
                        {cE > 0 && <Badge bg={ORL} color={OR}>{cE} en cours</Badge>}
                        {cR > 0 && <Badge bg={GRL} color={GR}>{cR} résolu{cR > 1 ? "s" : ""}</Badge>}
                      </div>
                    </div>
                    {/* Total + chevron */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T4, fontFamily: FM }}>{techNCs.length}</span>
                      <span style={{ color: T5 }}>{expanded ? Ico.chevUp : Ico.chevDown}</span>
                    </div>
                  </div>

                  {/* Liste des NCs dépliée */}
                  {expanded && (
                    <div style={{ borderTop: `1px solid ${C2}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {techNCs.map(nc => {
                        const st = NC_STATUTS.find(s => s.id === nc.statut) || NC_STATUTS[0];
                        return (
                          <div key={nc.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 12px", borderRadius: 10, background: st.bg, border: `1px solid ${st.color}25` }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                                <Badge bg={st.bg} color={st.color}>{st.label}</Badge>
                                <span style={{ fontSize: 10, color: T5 }}>{fmtDate(nc.date)}</span>
                                {nc.vehicule && <span style={{ fontSize: 10, color: T4 }}>{nc.vehicule}</span>}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T1 }}>{nc.label}</div>
                              {nc.description && <div style={{ fontSize: 11, color: T3, fontStyle: "italic", marginTop: 3, lineHeight: 1.5 }}>{nc.description}</div>}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                              {NC_STATUTS.filter(s => s.id !== nc.statut).map(s => (
                                <button key={s.id} onClick={e => { e.stopPropagation(); updateNCStatut(nc.id, s.id); }}
                                  style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: `1px solid ${s.color}`, background: "transparent", color: s.color, cursor: "pointer", fontFamily: FF, whiteSpace: "nowrap" }}>
                                  → {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════
  // STATS
  // ════════════════════════════════════════
  const renderStats = () => {
    const byTech = [...new Set(controles.map(c => c.techNom).filter(Boolean))].map(nom => ({
      nom,
      count: controles.filter(c => c.techNom === nom).length,
      nc: nonConformites.filter(n => n.techNom === nom && n.statut !== "resolu").length,
    })).sort((a, b) => b.count - a.count);

    const ncOuv = nonConformites.filter(n => n.statut !== "resolu").length;
    const ncRes = nonConformites.filter(n => n.statut === "resolu").length;

    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Contrôles réalisés", val: controles.length, color: O, bg: OL },
            { label: "Non-conformités", val: nonConformites.length, color: RD, bg: RDL },
            { label: "NC ouvertes", val: ncOuv, color: ncOuv > 0 ? RD : GR, bg: ncOuv > 0 ? RDL : GRL },
            { label: "NC résolues", val: ncRes, color: GR, bg: GRL },
          ].map(k => (
            <Card key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}20`, padding: "14px 16px" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: k.color, fontFamily: FM }}>{k.val}</div>
              <div style={{ fontSize: 11, color: T3, marginTop: 4 }}>{k.label}</div>
            </Card>
          ))}
        </div>

        {byTech.length > 0 && (
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Par technicien</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byTech.map(t => (
                <div key={t.nom} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: OL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: O, flexShrink: 0 }}>
                    {(t.nom || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: T1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.nom}</span>
                      <span style={{ fontSize: 11, fontFamily: FM, fontWeight: 700, color: O, flexShrink: 0, marginLeft: 8 }}>{t.count}</span>
                    </div>
                    <div style={{ height: 4, background: C2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: controles.length > 0 ? `${(t.count / controles.length) * 100}%` : "0%", height: "100%", background: O, borderRadius: 2 }} />
                    </div>
                  </div>
                  {t.nc > 0 && <Badge bg={RDL} color={RD}>{t.nc} NC</Badge>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  };

  // ════════════════════════════════════════
  // PARAMÈTRES — édition de la checklist
  // ════════════════════════════════════════
  const renderParams = () => (
    <div>
      <div style={{ fontSize: 13, color: T3, marginBottom: 16, lineHeight: 1.6, padding: "10px 14px", background: OL, borderRadius: 10, border: `1px solid ${O}30` }}>
        Ajoute ou supprime des éléments dans chaque section de la checklist. Les modifications s'appliquent aux prochains contrôles.
      </div>

      {checklistData.map((section, sIdx) => (
        <Card key={section.section} style={{ marginBottom: 12 }}>
          {/* En-tête section */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: `1px solid ${C2}` }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: section.color, flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: T1, flex: 1 }}>{section.section}</div>
            <span style={{ fontSize: 10, color: T5, fontFamily: FM }}>{section.items.length} pts</span>
          </div>

          {/* Liste des éléments */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            {section.items.map((item, iIdx) => (
              <div key={item + iIdx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: C3, border: `1px solid ${C2}` }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: section.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: T1 }}>{item}</span>
                <button
                  onClick={() => askConfirm(
                    "Supprimer cet élément ?",
                    `"${item}" sera retiré de la checklist.`,
                    () => removeChecklistItem(sIdx, iIdx),
                    "Supprimer", RD
                  )}
                  style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${RD}30`, background: RDL, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: RD, flexShrink: 0, padding: 0 }}>
                  {Ico.x}
                </button>
              </div>
            ))}
          </div>

          {/* Ajouter un élément */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={paramNewItem[sIdx] || ""}
              onChange={e => setParamNewItem(p => ({ ...p, [sIdx]: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addChecklistItem(sIdx)}
              placeholder={`Ajouter un élément dans "${section.section}"…`}
              style={{ ...sInp, flex: 1, fontSize: 12 }}
              onFocus={e => e.target.style.borderColor = section.color}
              onBlur={e => e.target.style.borderColor = C2}
            />
            <button
              onClick={() => addChecklistItem(sIdx)}
              disabled={!(paramNewItem[sIdx] || "").trim()}
              style={{ width: 38, height: 38, borderRadius: 8, background: (paramNewItem[sIdx] || "").trim() ? section.color : C2, border: "none", cursor: (paramNewItem[sIdx] || "").trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, transition: "background .15s" }}>
              {Ico.plus}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );

  // ─── Confirmation modal ───
  const renderConfirm = () => !confirmDlg ? null : (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 20px" }}>
      <div style={{ background: C1, borderRadius: 16, width: "100%", maxWidth: 340, padding: "24px 20px" }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: T1, marginBottom: 8 }}>{confirmDlg.title}</div>
        <div style={{ fontSize: 13, color: T3, marginBottom: 22, lineHeight: 1.6 }}>{confirmDlg.body}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn outline color={T3} small onClick={() => setConfirmDlg(null)} style={{ flex: 1 }}>Annuler</Btn>
          <Btn color={confirmDlg.confirmColor || RD} small onClick={() => { confirmDlg.onConfirm(); setConfirmDlg(null); }} style={{ flex: 1 }}>
            {confirmDlg.confirmLabel || "Supprimer"}
          </Btn>
        </div>
      </div>
    </div>
  );

  // ─── Sub-nav ───
  const subTabs = [
    { id: "accueil",    label: "Accueil",          ico: Ico.plus    },
    { id: "historique", label: "Historique",       ico: Ico.history },
    { id: "nc",         label: "Non-conformités",  ico: Ico.nc      },
    { id: "stats",      label: "Stats",            ico: Ico.stats   },
    ...(isAdmin ? [{ id: "params", label: "Paramètres", ico: Ico.settings }] : []),
  ];

  return (
    <div style={{ fontFamily: FF }}>
      {renderConfirm()}

      {ctrlSub !== "form" && (
        <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {subTabs.map(t => (
            <button key={t.id} onClick={() => { setCtrlSub(t.id); setViewCtrl(null); }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: FF, whiteSpace: "nowrap", transition: "all .12s", background: ctrlSub === t.id ? O : C2, color: ctrlSub === t.id ? "#fff" : T3 }}>
              <span style={{ color: ctrlSub === t.id ? "#fff" : T4 }}>{t.ico}</span>
              {t.label}
              {t.id === "nc" && ncOuvertes > 0 && ctrlSub !== "nc" && (
                <span style={{ background: RD, color: "#fff", borderRadius: 10, fontSize: 9, fontWeight: 800, padding: "0 5px", minWidth: 14, textAlign: "center" }}>
                  {ncOuvertes}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {ctrlSub === "accueil"    && renderAccueil()}
      {ctrlSub === "form"       && renderForm()}
      {ctrlSub === "historique" && renderHistorique()}
      {ctrlSub === "nc"         && renderNC()}
      {ctrlSub === "stats"      && renderStats()}
      {ctrlSub === "params"     && renderParams()}
    </div>
  );
}
